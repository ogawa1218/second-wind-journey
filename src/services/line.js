/**
 * LINE Messaging API + Flex Message 生成
 * 署名検証・メッセージ送受信・LIFF Quick Reply
 */

// ─── 署名検証 ─────────────────────────────────────────────────────────────────

export async function verifyLineSignature(body, signature, channelSecret) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(channelSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const mac = await crypto.subtle.sign('HMAC', key, enc.encode(body));
  const expected = btoa(String.fromCharCode(...new Uint8Array(mac)));
  return expected === signature;
}

// ─── API ラッパー ─────────────────────────────────────────────────────────────

async function lineApi(method, path, body, config) {
  const res = await fetch(`${config.line.apiBase}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${config.line.channelAccessToken}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`LINE API ${path} failed ${res.status}: ${text}`);
  }
  return res.status === 200 ? res.json() : null;
}

export async function replyMessage(replyToken, messages, config) {
  return lineApi('POST', '/message/reply', { replyToken, messages }, config);
}

export async function pushMessage(to, messages, config) {
  return lineApi('POST', '/message/push', { to, messages }, config);
}

export async function multicastMessage(to, messages, config) {
  return lineApi('POST', '/message/multicast', { to, messages }, config);
}

export async function getLineProfile(userId, config) {
  return lineApi('GET', `/profile/${userId}`, null, config);
}

export async function getImageContent(messageId, config) {
  const res = await fetch(`${config.line.apiBase}/message/${messageId}/content`, {
    headers: { Authorization: `Bearer ${config.line.channelAccessToken}` },
  });
  if (!res.ok) throw new Error(`image fetch failed: ${res.status}`);
  const buffer = await res.arrayBuffer();
  return new Uint8Array(buffer);
}

// ─── Flex Message テンプレート ────────────────────────────────────────────────

export function buildTextMessage(text) {
  return { type: 'text', text };
}

export function buildQuickReply(text, items) {
  return {
    type: 'text',
    text,
    quickReply: {
      items: items.map(({ label, data, imageUrl }) => ({
        type: 'action',
        imageUrl,
        action: { type: 'postback', label, data, displayText: label },
      })),
    },
  };
}

export function buildSleepQuickReply() {
  return buildQuickReply('昨夜の睡眠時間を選んでくれ', [
    { label: '5時間未満', data: 'sleep:4.5' },
    { label: '6時間', data: 'sleep:6' },
    { label: '7時間', data: 'sleep:7' },
    { label: '8時間', data: 'sleep:8' },
    { label: '9時間以上', data: 'sleep:9' },
  ]);
}

export function buildWeightQuickReply() {
  return buildQuickReply('今朝の体重を教えてくれ（起床直後・空腹時）', [
    { label: '入力する', data: 'weight:input' },
    { label: 'スキップ', data: 'weight:skip' },
  ]);
}

export function buildMealTypeQuickReply() {
  return buildQuickReply('どの食事の写真だ？', [
    { label: '朝食', data: 'meal:breakfast' },
    { label: '昼食', data: 'meal:lunch' },
    { label: '夕食', data: 'meal:dinner' },
    { label: '間食', data: 'meal:snack' },
  ]);
}

export function buildFoodLogFlex(foodData, liffId) {
  const pfcScore = foodData.pfcScore ?? 0;
  const scoreColor = pfcScore >= 80 ? '#00B900' : pfcScore >= 50 ? '#FF8C00' : '#FF0000';

  return {
    type: 'flex',
    altText: `${foodData.foodName ?? '食事'} の解析結果`,
    contents: {
      type: 'bubble',
      size: 'mega',
      header: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '🍱 食事解析完了',
            weight: 'bold',
            size: 'lg',
            color: '#ffffff',
          },
        ],
        backgroundColor: '#1E1E1E',
        paddingAll: '16px',
      },
      body: {
        type: 'box',
        layout: 'vertical',
        spacing: 'md',
        contents: [
          {
            type: 'text',
            text: foodData.foodName ?? '（食品名不明）',
            weight: 'bold',
            size: 'xl',
          },
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              macroItem('カロリー', `${Math.round(foodData.calories ?? 0)} kcal`, '#333333'),
              macroItem('タンパク質', `${(foodData.protein ?? 0).toFixed(1)} g`, '#0066CC'),
              macroItem('脂質', `${(foodData.fat ?? 0).toFixed(1)} g`, '#CC6600'),
              macroItem('炭水化物', `${(foodData.carb ?? 0).toFixed(1)} g`, '#006600'),
            ],
          },
          {
            type: 'separator',
          },
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              { type: 'text', text: 'PFC 適正スコア', size: 'sm', color: '#666666', flex: 3 },
              {
                type: 'text',
                text: `${pfcScore}/100`,
                size: 'xl',
                weight: 'bold',
                color: scoreColor,
                flex: 2,
                align: 'end',
              },
            ],
          },
          {
            type: 'text',
            text: foodData.coachComment ?? '',
            wrap: true,
            size: 'sm',
            color: '#444444',
          },
        ],
        paddingAll: '16px',
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'button',
            style: 'primary',
            color: '#1E1E1E',
            action: {
              type: 'uri',
              label: '📊 今週の記録を見る',
              uri: `https://liff.line.me/${liffId}?path=/charts?type=ranking`,
            },
          },
        ],
        paddingAll: '12px',
      },
    },
  };
}

function macroItem(label, value, color) {
  return {
    type: 'box',
    layout: 'vertical',
    flex: 1,
    contents: [
      { type: 'text', text: label, size: 'xxs', color: '#888888', align: 'center' },
      { type: 'text', text: value, size: 'sm', weight: 'bold', color, align: 'center' },
    ],
  };
}

export function buildWeeklyReportFlex(stats, markdownContent, liffId) {
  return {
    type: 'flex',
    altText: `今週の規律スコア: ${stats.disciplineScore}/100`,
    contents: {
      type: 'bubble',
      size: 'mega',
      header: {
        type: 'box',
        layout: 'vertical',
        contents: [
          { type: 'text', text: '週次レポート', weight: 'bold', color: '#ffffff', size: 'lg' },
          {
            type: 'text',
            text: `規律スコア ${stats.disciplineScore}/100`,
            color: '#aaaaaa',
            size: 'sm',
          },
        ],
        backgroundColor: '#1E1E1E',
        paddingAll: '16px',
      },
      body: {
        type: 'box',
        layout: 'vertical',
        spacing: 'md',
        contents: [
          statRow('🏃 ランニング', `${stats.runCount}回 / ${stats.totalKm}km`),
          statRow('🍱 食事ログ', `${stats.foodLogCount}件`),
          statRow('😴 平均睡眠', `${stats.avgSleepHours}時間`),
          { type: 'separator' },
          {
            type: 'text',
            text: markdownContent.slice(0, 200),
            wrap: true,
            size: 'sm',
            color: '#444444',
          },
        ],
        paddingAll: '16px',
      },
      footer: {
        type: 'box',
        layout: 'horizontal',
        spacing: 'sm',
        contents: [
          {
            type: 'button',
            style: 'primary',
            color: '#1E1E1E',
            flex: 1,
            action: {
              type: 'uri',
              label: '体重グラフ',
              uri: `https://liff.line.me/${liffId}?path=/charts?type=weight`,
            },
          },
          {
            type: 'button',
            style: 'secondary',
            flex: 1,
            action: {
              type: 'uri',
              label: 'ランキング',
              uri: `https://liff.line.me/${liffId}?path=/charts?type=ranking`,
            },
          },
        ],
        paddingAll: '12px',
      },
    },
  };
}

function statRow(label, value) {
  return {
    type: 'box',
    layout: 'horizontal',
    contents: [
      { type: 'text', text: label, size: 'sm', color: '#555555', flex: 3 },
      { type: 'text', text: value, size: 'sm', weight: 'bold', flex: 2, align: 'end' },
    ],
  };
}

export function buildPenaltyWarningFlex(penalty, contract) {
  return {
    type: 'flex',
    altText: `ペナルティ警告: ¥${penalty.amount_charged_jpy.toLocaleString()}`,
    contents: {
      type: 'bubble',
      size: 'kilo',
      body: {
        type: 'box',
        layout: 'vertical',
        spacing: 'md',
        backgroundColor: '#1a0000',
        paddingAll: '20px',
        contents: [
          { type: 'text', text: '⚠️ ペナルティ発動', weight: 'bold', color: '#FF4444', size: 'xl' },
          {
            type: 'text',
            text: `今週のラン: ${contract.weekly_target_runs - penalty.missed_runs}/${contract.weekly_target_runs}回`,
            color: '#ffffff',
            size: 'md',
          },
          {
            type: 'text',
            text: `未達: ${penalty.missed_runs}回 → ¥${penalty.amount_charged_jpy.toLocaleString()} 徴収`,
            color: '#FF8888',
            size: 'sm',
          },
          {
            type: 'text',
            text: '約束したのはお前自身だろ。',
            color: '#aaaaaa',
            size: 'sm',
            wrap: true,
          },
        ],
      },
    },
  };
}

export function buildWelcomeFlex(displayName, liffId) {
  return {
    type: 'flex',
    altText: `${displayName}、始めようか。`,
    contents: {
      type: 'bubble',
      size: 'mega',
      hero: {
        type: 'box',
        layout: 'vertical',
        backgroundColor: '#1E1E1E',
        paddingAll: '24px',
        contents: [
          { type: 'text', text: 'Second Wind Journey', color: '#ffffff', weight: 'bold', size: 'xl' },
          { type: 'text', text: 'さあ、今まで感じたことのない人生第二の風を味わおう', color: '#aaaaaa', size: 'xs', wrap: true },
        ],
      },
      body: {
        type: 'box',
        layout: 'vertical',
        spacing: 'md',
        paddingAll: '16px',
        contents: [
          {
            type: 'text',
            text: `${displayName}、俺はMASH。元100kgのデブが72kgに生還した。お前の話は全部わかる。だから退路を断てる。`,
            wrap: true,
            size: 'sm',
          },
          { type: 'separator' },
          { type: 'text', text: '鉄の序列: 睡眠 → 食事 → 運動', weight: 'bold', size: 'md' },
          { type: 'text', text: 'まず今夜の睡眠から変える。話はそれからだ。', wrap: true, size: 'sm', color: '#555555' },
        ],
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        paddingAll: '12px',
        contents: [
          {
            type: 'button',
            style: 'primary',
            color: '#1E1E1E',
            action: {
              type: 'uri',
              label: '今すぐ始める',
              uri: `https://liff.line.me/${liffId}?path=/onboarding`,
            },
          },
        ],
      },
    },
  };
}
