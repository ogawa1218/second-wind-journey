/**
 * Fitbit / Garmin — ログのサイレント自動回収
 * ユーザーに1文字も入力させない。30 分ごとに cron で叩く。
 */

import {
  getWearableToken,
  upsertWearableToken,
  upsertRun,
  upsertDailyRecord,
  getAllActiveWearableTokens,
} from '../db/supabase.js';

// ─── Fitbit ───────────────────────────────────────────────────────────────────

async function refreshFitbitToken(token, config) {
  const credentials = btoa(`${config.fitbit.clientId}:${config.fitbit.clientSecret}`);
  const res = await fetch(config.fitbit.tokenEndpoint, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: token.refresh_token,
    }),
  });
  if (!res.ok) throw new Error(`Fitbit token refresh failed: ${res.status}`);
  return res.json();
}

async function fitbitGet(path, token, config) {
  let accessToken = token.access_token;

  if (token.expires_at && new Date(token.expires_at) <= new Date()) {
    const refreshed = await refreshFitbitToken(token, config);
    accessToken = refreshed.access_token;
    await upsertWearableToken(config._db, token.user_id, 'fitbit', {
      accessToken: refreshed.access_token,
      refreshToken: refreshed.refresh_token,
      expiresAt: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
      scope: token.scope,
      externalUserId: token.external_user_id,
    });
  }

  const res = await fetch(`${config.fitbit.apiBase}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (res.status === 401) throw new Error('fitbit_unauthorized');
  if (!res.ok) throw new Error(`Fitbit API error ${res.status}: ${path}`);
  return res.json();
}

export async function syncFitbitUser(db, tokenRecord, config) {
  const cfg = { ...config, _db: db };
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Tokyo' });

  // 睡眠データ
  try {
    const sleepData = await fitbitGet(`/user/-/sleep/date/${today}.json`, tokenRecord, cfg);
    const summary = sleepData.summary;
    if (summary) {
      await upsertDailyRecord(db, tokenRecord.user_id, today, {
        sleep_hours: Number((summary.totalMinutesAsleep / 60).toFixed(2)),
        sleep_quality: fitbitSleepQuality(summary.efficiency),
        resting_heart_rate: sleepData.summary?.stages ? undefined : null,
      });
    }
  } catch (e) {
    if (e.message !== 'fitbit_unauthorized') console.warn('fitbit sleep sync:', e.message);
  }

  // 安静時心拍数
  try {
    const hrData = await fitbitGet(
      `/user/-/activities/heart/date/${today}/1d.json`,
      tokenRecord,
      cfg,
    );
    const rhr = hrData['activities-heart']?.[0]?.value?.restingHeartRate;
    if (rhr) {
      await upsertDailyRecord(db, tokenRecord.user_id, today, { resting_heart_rate: rhr });
    }
  } catch (e) {
    if (e.message !== 'fitbit_unauthorized') console.warn('fitbit hr sync:', e.message);
  }

  // ランニングアクティビティ（過去7日）
  try {
    const actData = await fitbitGet(
      `/user/-/activities/list.json?beforeDate=${today}&sort=desc&limit=20&offset=0`,
      tokenRecord,
      cfg,
    );
    for (const activity of actData.activities ?? []) {
      if (!['Run', 'Outdoor Run', 'Treadmill'].includes(activity.activityName)) continue;
      await upsertRun(db, tokenRecord.user_id, {
        ranAt: activity.startTime,
        distanceKm: Number((activity.distance ?? 0).toFixed(3)),
        durationSeconds: Math.round(activity.activeDuration / 1000),
        avgHeartRate: activity.averageHeartRate,
        elevationGainM: activity.elevationGain,
        source: 'garmin', // Fitbit も garmin enum で代用（スキーマ拡張前の暫定）
        externalId: String(activity.logId),
        rawData: activity,
      });
    }
  } catch (e) {
    if (e.message !== 'fitbit_unauthorized') console.warn('fitbit run sync:', e.message);
  }
}

// Fitbit sleep efficiency (0-100) → 1-5
function fitbitSleepQuality(efficiency) {
  if (!efficiency) return null;
  if (efficiency >= 90) return 5;
  if (efficiency >= 80) return 4;
  if (efficiency >= 70) return 3;
  if (efficiency >= 60) return 2;
  return 1;
}

// ─── Garmin ───────────────────────────────────────────────────────────────────

export async function syncGarminUser(db, tokenRecord, config) {
  // Garmin uses OAuth1 — token is pre-exchanged and stored
  // Activities endpoint: /wellness-api/rest/activities
  const since = new Date();
  since.setDate(since.getDate() - 1);
  const uploadStartTimeInSeconds = Math.floor(since.getTime() / 1000);

  const res = await fetch(
    `${config.garmin.apiBase}/activities?uploadStartTimeInSeconds=${uploadStartTimeInSeconds}`,
    {
      headers: {
        Authorization: buildGarminOAuth1Header(
          config.garmin.consumerKey,
          config.garmin.consumerSecret,
          tokenRecord.access_token,
          '',
        ),
      },
    },
  );

  if (!res.ok) {
    console.warn(`Garmin sync failed for user ${tokenRecord.user_id}: ${res.status}`);
    return;
  }

  const activities = await res.json();
  for (const act of activities ?? []) {
    if (!act.activityType?.includes('RUNNING')) continue;
    await upsertRun(db, tokenRecord.user_id, {
      ranAt: new Date(act.startTimeInSeconds * 1000).toISOString(),
      distanceKm: Number(((act.distanceInMeters ?? 0) / 1000).toFixed(3)),
      durationSeconds: Math.round(act.durationInSeconds ?? 0),
      avgHeartRate: act.averageHeartRateInBeatsPerMinute,
      elevationGainM: act.totalElevationGainInMeters,
      source: 'garmin',
      externalId: String(act.activityId),
      rawData: act,
    });
  }
}

// Minimal OAuth1 header — for production use a proper library
function buildGarminOAuth1Header(consumerKey, consumerSecret, token, tokenSecret) {
  const nonce = crypto.randomUUID().replace(/-/g, '');
  const ts = Math.floor(Date.now() / 1000);
  return (
    `OAuth oauth_consumer_key="${consumerKey}",` +
    `oauth_token="${token}",` +
    `oauth_signature_method="PLAINTEXT",` +
    `oauth_signature="${encodeURIComponent(consumerSecret)}&${encodeURIComponent(tokenSecret)}",` +
    `oauth_timestamp="${ts}",oauth_nonce="${nonce}"`
  );
}

// ─── 全ユーザー一括同期（cron エントリポイント） ─────────────────────────────

export async function syncAllWearables(db, config) {
  const tokens = await getAllActiveWearableTokens(db);
  const results = await Promise.allSettled(
    tokens.map((t) => {
      if (t.provider === 'fitbit') return syncFitbitUser(db, t, config);
      if (t.provider === 'garmin') return syncGarminUser(db, t, config);
      return Promise.resolve();
    }),
  );

  const failed = results.filter((r) => r.status === 'rejected');
  if (failed.length > 0) {
    console.error(`Wearable sync: ${failed.length}/${tokens.length} failed`);
  }
  return { total: tokens.length, failed: failed.length };
}
