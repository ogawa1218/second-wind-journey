/**
 * 鉄壁の監査システム
 * 食事画像の重複送信・EXIF メタデータ偽装を多層検知する
 */

import { getFoodLogHash, saveAuditLog } from '../db/supabase.js';

// ─── 画像ハッシュ ─────────────────────────────────────────────────────────────

/**
 * SHA-256 で画像の指紋を生成する（完全一致検知用）
 */
export async function hashImage(imageBytes) {
  const hashBuffer = await crypto.subtle.digest('SHA-256', imageBytes);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * 差分ハッシュ（dHash 8x8 近似）でほぼ同一画像を検知する
 * Workers 環境では Image API が使えないため、画素サンプリングで代用
 */
export function computeDHash(imageBytes) {
  // JPEG/PNG の先頭バイトから 64 バイトをサンプリングして差分を取る（簡易版）
  // 本番実装では WebAssembly の画像デコーダが望ましい
  const SAMPLE_SIZE = 64;
  const stride = Math.max(1, Math.floor(imageBytes.length / SAMPLE_SIZE));
  const samples = [];
  for (let i = 0; i < SAMPLE_SIZE; i++) {
    samples.push(imageBytes[i * stride] ?? 0);
  }

  let bits = 0n;
  for (let i = 0; i < samples.length - 1; i++) {
    if (samples[i] > samples[i + 1]) bits |= (1n << BigInt(i));
  }
  return bits.toString(16).padStart(16, '0');
}

/**
 * dHash 間のハミング距離を計算する（距離≤10 で「ほぼ同一」と判定）
 */
export function hammingDistance(hashA, hashB) {
  const a = BigInt(`0x${hashA}`);
  const b = BigInt(`0x${hashB}`);
  let diff = a ^ b;
  let count = 0;
  while (diff > 0n) {
    count += Number(diff & 1n);
    diff >>= 1n;
  }
  return count;
}

// ─── EXIF 解析（簡易 JPEG マーカースキャン） ──────────────────────────────────

/**
 * JPEG バイナリから撮影日時（DateTimeOriginal）を取り出す
 * APP1 マーカー (0xFFE1) → Exif ヘッダ → IFD0 → SubIFD → Tag 0x9003
 */
export function extractExifTimestamp(imageBytes) {
  try {
    const view = new DataView(imageBytes.buffer ?? imageBytes);

    // JPEG 開始マーカー確認
    if (view.getUint16(0) !== 0xffd8) return null;

    let offset = 2;
    while (offset < view.byteLength - 2) {
      const marker = view.getUint16(offset);
      offset += 2;
      if (marker === 0xffe1) {
        // APP1 (Exif)
        const segLen = view.getUint16(offset);
        const exifStart = offset + 2;
        const exifHeader = String.fromCharCode(
          ...imageBytes.slice(exifStart, exifStart + 4),
        );
        if (exifHeader !== 'Exif') break;

        const tiffStart = exifStart + 6;
        const littleEndian = view.getUint16(tiffStart) === 0x4949;
        const readUint16 = (o) =>
          littleEndian ? view.getUint16(tiffStart + o, true) : view.getUint16(tiffStart + o);
        const readUint32 = (o) =>
          littleEndian ? view.getUint32(tiffStart + o, true) : view.getUint32(tiffStart + o);

        const ifd0Offset = readUint32(4);
        const ifd0Count = readUint16(ifd0Offset);

        // SubIFD オフセットを探す (Tag 0x8769)
        let subIfdOffset = null;
        for (let i = 0; i < ifd0Count; i++) {
          const tagOffset = ifd0Offset + 2 + i * 12;
          if (tagOffset + 12 > view.byteLength - tiffStart) break;
          const tag = readUint16(tagOffset);
          if (tag === 0x8769) {
            subIfdOffset = readUint32(tagOffset + 8);
            break;
          }
        }

        if (!subIfdOffset) break;

        const subCount = readUint16(subIfdOffset);
        for (let i = 0; i < subCount; i++) {
          const tagOffset = subIfdOffset + 2 + i * 12;
          if (tagOffset + 12 > view.byteLength - tiffStart) break;
          const tag = readUint16(tagOffset);
          if (tag === 0x9003) {
            // DateTimeOriginal
            const valOffset = readUint32(tagOffset + 8);
            const dateStr = String.fromCharCode(
              ...imageBytes.slice(tiffStart + valOffset, tiffStart + valOffset + 19),
            );
            // Format: "YYYY:MM:DD HH:MM:SS"
            const [datePart, timePart] = dateStr.split(' ');
            const iso = datePart.replace(/:/g, '-') + 'T' + timePart;
            const parsed = new Date(iso);
            return isNaN(parsed.getTime()) ? null : parsed;
          }
        }
        offset += segLen;
        break;
      } else if (marker === 0xffda) {
        break; // SOS: 画像データ開始、Exif なし
      } else {
        offset += view.getUint16(offset);
      }
    }
  } catch {
    // パース失敗は無視（非 JPEG）
  }
  return null;
}

// ─── 総合監査 ─────────────────────────────────────────────────────────────────

/**
 * 食事画像の不正を多層検知する
 * @param {Uint8Array} imageBytes
 * @param {string} userId
 * @param {object} db - Supabase クライアント
 * @param {Date} claimedAt - ユーザーが主張する記録日時（サーバー受信時刻）
 * @returns {Promise<AuditResult>}
 */
export async function auditFoodImage(imageBytes, userId, db, claimedAt = new Date()) {
  const fraudFlags = [];
  let fraudScore = 0;
  let duplicateOf = null;

  // Layer 1: 完全一致ハッシュ
  const sha256 = await hashImage(imageBytes);
  const existing = await getFoodLogHash(db, sha256);
  if (existing) {
    fraudFlags.push('duplicate_hash');
    fraudScore += 60;
    duplicateOf = existing.id;
  }

  // Layer 2: EXIF タイムスタンプ偽装検知
  const exifTimestamp = extractExifTimestamp(imageBytes);
  let deltaMinutes = null;

  if (exifTimestamp) {
    deltaMinutes = Math.abs(
      (claimedAt.getTime() - exifTimestamp.getTime()) / 60_000,
    );

    // 撮影から 3 時間以上経過した画像の再利用を疑う
    if (deltaMinutes > 180) {
      fraudFlags.push('exif_timestamp_mismatch');
      const addScore = Math.min(30, Math.floor(deltaMinutes / 60) * 5);
      fraudScore = Math.min(100, fraudScore + addScore);
    }

    // 撮影日時が未来（偽装の可能性）
    if (exifTimestamp > claimedAt) {
      fraudFlags.push('exif_timestamp_mismatch');
      fraudScore = Math.min(100, fraudScore + 40);
    }
  }

  // Layer 3: 急速な再提出（同一ユーザーが 5 分以内に複数画像）
  const recentDHash = computeDHash(imageBytes);
  // NOTE: dHash の過去データとの比較はここでは KV/DB に委ねる（省略）

  // AI 信頼度が低い場合のペナルティ（呼び出し元が渡す）
  // fraudFlags.push('ai_confidence_low') は ai.js 側でセットして渡す

  const isPassed = fraudScore < 50 && !duplicateOf;

  await saveAuditLog(db, {
    userId,
    foodLogId: null, // food_logs 保存後に更新
    imageHash: sha256,
    fraudFlags,
    fraudScore,
    exifTimestamp: exifTimestamp?.toISOString() ?? null,
    claimedAt: claimedAt.toISOString(),
    deltaMinutes: deltaMinutes ? Math.round(deltaMinutes) : null,
    duplicateOf,
  });

  return {
    passed: isPassed,
    sha256,
    dHash: recentDHash,
    fraudScore,
    fraudFlags,
    duplicateOf,
    exifTimestamp,
    deltaMinutes,
    rejectionReason: buildRejectionReason(fraudFlags, fraudScore),
  };
}

function buildRejectionReason(flags, score) {
  if (score < 50) return null;
  if (flags.includes('duplicate_hash')) {
    return 'その写真、さっきも見たぞ。同じ画像を使い回すな。';
  }
  if (flags.includes('exif_timestamp_mismatch')) {
    return `撮影日時がおかしい。古い写真を今日の記録として出すな。`;
  }
  return '画像の信頼性が低い。新しい写真を送れ。';
}
