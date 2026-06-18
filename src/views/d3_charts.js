/**
 * LIFF 用 D3.js チャート生成スクリプト
 * Worker が HTML を返し、ブラウザ（LIFF）で D3.js がレンダリングする
 * 「未来の残酷な可視化」: 今のペースを続けるとどうなるかを見せる
 */

import { getRecentDailyRecords, getWeeklyRanking, getWeeklyRunStats } from '../db/supabase.js';
import { projectWeightTrajectory } from '../logics/math_engine.js';

// ─── Worker エントリ: /liff/charts ───────────────────────────────────────────

export async function renderChartsPage(request, env, config) {
  const url = new URL(request.url);
  const type = url.searchParams.get('type') ?? 'weight';
  const lineUserId = url.searchParams.get('uid');

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'no-store',
  };

  // チャートデータを DB から取得（uid がある場合のみ）
  let chartData = {};
  if (lineUserId && config._db) {
    chartData = await fetchChartData(type, lineUserId, config);
  }

  const html = buildLiffHtml(type, chartData, config.app.liffId);
  return new Response(html, { headers: corsHeaders });
}

async function fetchChartData(type, lineUserId, config) {
  const db = config._db;
  try {
    if (type === 'weight') {
      const records = await getRecentDailyRecords(db, lineUserId, 90);
      const user = config._user;
      if (!user) return { records };
      const projection = projectWeightTrajectory({
        weightKg: records[0]?.weight_kg ?? 70,
        weeklyRunKm: (await getWeeklyRunStats(db, lineUserId))?.total_distance_km ?? 0,
        dailyCalories: 2000,
        age: user.age ?? 40,
        heightCm: user.height_cm ?? 170,
        gender: user.gender ?? 'male',
      }, 365);
      return { records, projection };
    }
    if (type === 'ranking') {
      return { ranking: await getWeeklyRanking(db, 20) };
    }
    if (type === 'pace') {
      const stats = await getWeeklyRunStats(db, lineUserId);
      return { stats };
    }
  } catch (e) {
    console.error('fetchChartData error:', e);
  }
  return {};
}

// ─── HTML 生成 ────────────────────────────────────────────────────────────────

function buildLiffHtml(type, data, liffId) {
  const chartScript = getChartScript(type, data);

  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Second Wind Journey</title>
  <script src="https://cdn.jsdelivr.net/npm/liff@2.22.3/dist/liff.min.js"></script>
  <script src="https://d3js.org/d3.v7.min.js"></script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, 'Hiragino Sans', sans-serif;
      background: #0f0f0f;
      color: #ffffff;
      min-height: 100vh;
      padding: 16px;
    }
    h1 { font-size: 18px; margin-bottom: 4px; }
    .subtitle { font-size: 12px; color: #888; margin-bottom: 20px; }
    #chart { width: 100%; }
    svg { width: 100%; height: auto; }
    .axis text { fill: #888; font-size: 11px; }
    .axis path, .axis line { stroke: #333; }
    .grid line { stroke: #222; stroke-dasharray: 2,2; }
    .line-actual { fill: none; stroke: #00B900; stroke-width: 2.5; }
    .line-projected { fill: none; stroke: #FF4444; stroke-width: 2; stroke-dasharray: 6,3; }
    .dot { fill: #00B900; }
    .ranking-row { display: flex; align-items: center; padding: 10px 0; border-bottom: 1px solid #222; }
    .rank-num { font-size: 20px; font-weight: bold; width: 40px; color: #888; }
    .rank-num.top1 { color: #FFD700; }
    .rank-num.top2 { color: #C0C0C0; }
    .rank-num.top3 { color: #CD7F32; }
    .rank-name { flex: 1; font-size: 14px; }
    .rank-score { font-size: 20px; font-weight: bold; color: #00B900; }
    .legend { display: flex; gap: 16px; margin-bottom: 12px; font-size: 12px; }
    .legend-item { display: flex; align-items: center; gap: 6px; }
    .legend-line { width: 24px; height: 3px; }
    .warning-box { background: #1a0000; border: 1px solid #FF4444; border-radius: 8px; padding: 12px; margin-top: 16px; font-size: 12px; color: #FF8888; line-height: 1.6; }
  </style>
</head>
<body>
  <div id="app">
    <div id="chart"></div>
  </div>
  <script>
    const CHART_DATA = ${JSON.stringify(data)};
    const CHART_TYPE = ${JSON.stringify(type)};
    const LIFF_ID = ${JSON.stringify(liffId)};

    ${chartScript}

    // LIFF 初期化
    (async () => {
      try {
        if (LIFF_ID) {
          await liff.init({ liffId: LIFF_ID });
        }
        renderChart();
      } catch (e) {
        console.error('LIFF init error:', e);
        renderChart(); // フォールバック
      }
    })();
  </script>
</body>
</html>`;
}

// ─── チャートスクリプト（クライアントサイド D3.js） ──────────────────────────

function getChartScript(type, data) {
  switch (type) {
    case 'weight':
      return WEIGHT_CHART_SCRIPT;
    case 'ranking':
      return RANKING_CHART_SCRIPT;
    case 'pace':
      return PACE_CHART_SCRIPT;
    default:
      return WEIGHT_CHART_SCRIPT;
  }
}

const WEIGHT_CHART_SCRIPT = `
function renderChart() {
  const container = document.getElementById('chart');
  const records = CHART_DATA.records ?? [];
  const projection = CHART_DATA.projection;

  // ヘッダー
  container.innerHTML = \`
    <h1>体重トラッキング</h1>
    <p class="subtitle">今のペースを続けると…（残酷な未来）</p>
    <div class="legend">
      <div class="legend-item">
        <div class="legend-line" style="background:#00B900;"></div>
        <span>実績</span>
      </div>
      <div class="legend-item">
        <div class="legend-line" style="background:#FF4444;border-top:2px dashed #FF4444;height:0;"></div>
        <span>予測（現ペース継続）</span>
      </div>
    </div>
    <svg id="weight-svg"></svg>
  \`;

  if (!records.length) {
    container.innerHTML += '<p style="color:#666;text-align:center;padding:40px 0;">データがありません</p>';
    return;
  }

  const margin = { top: 20, right: 20, bottom: 30, left: 45 };
  const W = container.offsetWidth || 320;
  const H = 240;
  const w = W - margin.left - margin.right;
  const h = H - margin.top - margin.bottom;

  const actualData = records
    .filter(r => r.weight_kg)
    .map(r => ({ date: new Date(r.record_date), kg: +r.weight_kg }))
    .sort((a, b) => a.date - b.date);

  const projPoints = projection?.points ?? [];
  const baseDate = actualData.length ? actualData[actualData.length - 1].date : new Date();
  const projData = projPoints.map(p => ({
    date: new Date(baseDate.getTime() + p.day * 86400000),
    kg: p.weightKg,
  }));

  const allDates = [...actualData.map(d => d.date), ...projData.map(d => d.date)];
  const allKg = [...actualData.map(d => d.kg), ...projData.map(d => d.kg)];

  const x = d3.scaleTime().domain(d3.extent(allDates)).range([0, w]);
  const y = d3.scaleLinear()
    .domain([d3.min(allKg) - 2, d3.max(allKg) + 2])
    .range([h, 0]);

  const svg = d3.select('#weight-svg')
    .attr('viewBox', \`0 0 \${W} \${H}\`);

  const g = svg.append('g').attr('transform', \`translate(\${margin.left},\${margin.top})\`);

  // グリッド
  g.append('g').attr('class', 'grid')
    .call(d3.axisLeft(y).tickSize(-w).tickFormat(''));

  // 軸
  g.append('g').attr('class', 'axis')
    .attr('transform', \`translate(0,\${h})\`)
    .call(d3.axisBottom(x).ticks(4).tickFormat(d3.timeFormat('%m/%d')));
  g.append('g').attr('class', 'axis')
    .call(d3.axisLeft(y).ticks(5).tickFormat(d => d + 'kg'));

  const lineGen = d3.line().x(d => x(d.date)).y(d => y(d.kg)).curve(d3.curveMonotoneX);

  // 予測ライン
  if (projData.length > 1) {
    g.append('path').datum(projData).attr('class', 'line-projected').attr('d', lineGen);
  }

  // 実績ライン
  g.append('path').datum(actualData).attr('class', 'line-actual').attr('d', lineGen);

  // 実績ドット
  g.selectAll('.dot').data(actualData).enter().append('circle')
    .attr('class', 'dot').attr('cx', d => x(d.date)).attr('cy', d => y(d.kg)).attr('r', 3);

  // 残酷な予測の警告ボックス
  if (projection?.summary && projection.summary.deltaKg > 0) {
    const s = projection.summary;
    document.getElementById('chart').innerHTML += \`
      <div class="warning-box">
        このペースを1年続けると…<br>
        現在 <strong>\${s.currentWeightKg}kg</strong> →
        予測 <strong style="color:#FF4444">\${s.projectedWeightKg}kg</strong>
        (+\${s.deltaKg}kg)<br>
        消費 \${s.tdee.toLocaleString()}kcal/日 に対して
        \${Math.abs(s.dailyBalance)}kcal/日の\${s.dailyBalance > 0 ? '余剰' : '不足'}<br>
        退路は自分で断て。
      </div>
    \`;
  }
}
`;

const RANKING_CHART_SCRIPT = `
function renderChart() {
  const container = document.getElementById('chart');
  const ranking = CHART_DATA.ranking ?? [];

  container.innerHTML = '<h1>今週の規律ランキング</h1><p class="subtitle">睡眠・食事・運動の複合スコア</p>';

  if (!ranking.length) {
    container.innerHTML += '<p style="color:#666;text-align:center;padding:40px 0;">データがありません</p>';
    return;
  }

  const list = document.createElement('div');
  ranking.forEach((entry, i) => {
    const rank = i + 1;
    const cls = rank === 1 ? 'top1' : rank === 2 ? 'top2' : rank === 3 ? 'top3' : '';
    const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank;
    list.innerHTML += \`
      <div class="ranking-row">
        <div class="rank-num \${cls}">\${medal}</div>
        <div class="rank-name">
          <div>\${entry.display_name ?? '---'}</div>
          <div style="font-size:11px;color:#666">
            走\${entry.run_count}回 / 睡\${entry.avg_sleep_hours}h / 食\${entry.food_log_count}件
          </div>
        </div>
        <div class="rank-score">\${entry.discipline_score}</div>
      </div>
    \`;
  });
  container.appendChild(list);

  // D3 横棒グラフ
  const top10 = ranking.slice(0, 10);
  const margin = { top: 10, right: 50, bottom: 20, left: 100 };
  const W = container.offsetWidth || 320;
  const H = top10.length * 28 + margin.top + margin.bottom;
  const w = W - margin.left - margin.right;
  const h = H - margin.top - margin.bottom;

  const svgEl = d3.select(container).append('svg').attr('viewBox', \`0 0 \${W} \${H}\`);
  const g = svgEl.append('g').attr('transform', \`translate(\${margin.left},\${margin.top})\`);

  const y = d3.scaleBand().domain(top10.map(d => d.display_name ?? '---')).range([0, h]).padding(0.2);
  const x = d3.scaleLinear().domain([0, 100]).range([0, w]);

  g.append('g').attr('class', 'axis').call(d3.axisLeft(y).tickSize(0)).select('.domain').remove();
  g.append('g').attr('class', 'axis').attr('transform', \`translate(0,\${h})\`).call(d3.axisBottom(x).ticks(5));

  g.selectAll('rect').data(top10).enter().append('rect')
    .attr('y', d => y(d.display_name ?? '---'))
    .attr('height', y.bandwidth())
    .attr('x', 0)
    .attr('width', d => x(d.discipline_score))
    .attr('fill', (_, i) => i === 0 ? '#FFD700' : i < 3 ? '#00B900' : '#444');

  g.selectAll('.bar-label').data(top10).enter().append('text')
    .attr('class', 'bar-label')
    .attr('x', d => x(d.discipline_score) + 4)
    .attr('y', d => (y(d.display_name ?? '---') ?? 0) + y.bandwidth() / 2)
    .attr('dy', '0.35em')
    .attr('fill', '#ccc')
    .attr('font-size', 11)
    .text(d => d.discipline_score);
}
`;

const PACE_CHART_SCRIPT = `
function renderChart() {
  const container = document.getElementById('chart');
  const stats = CHART_DATA.stats;

  container.innerHTML = '<h1>今週のランニング</h1><p class="subtitle">距離・ペース・心拍数</p>';

  if (!stats) {
    container.innerHTML += '<p style="color:#666;text-align:center;padding:40px 0;">今週のランデータがありません</p>';
    return;
  }

  const avgPaceMin = Math.floor((stats.avg_pace_seconds_per_km ?? 0) / 60);
  const avgPaceSec = (stats.avg_pace_seconds_per_km ?? 0) % 60;
  const bestPaceMin = Math.floor((stats.best_pace_seconds_per_km ?? 0) / 60);
  const bestPaceSec = (stats.best_pace_seconds_per_km ?? 0) % 60;

  container.innerHTML += \`
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:16px;">
      <div style="background:#1a1a1a;border-radius:8px;padding:16px;text-align:center;">
        <div style="color:#888;font-size:11px;">合計距離</div>
        <div style="font-size:28px;font-weight:bold;color:#00B900">\${stats.total_distance_km ?? 0}km</div>
      </div>
      <div style="background:#1a1a1a;border-radius:8px;padding:16px;text-align:center;">
        <div style="color:#888;font-size:11px;">ラン日数</div>
        <div style="font-size:28px;font-weight:bold;color:#00B900">\${stats.run_days ?? 0}日</div>
      </div>
      <div style="background:#1a1a1a;border-radius:8px;padding:16px;text-align:center;">
        <div style="color:#888;font-size:11px;">平均ペース</div>
        <div style="font-size:24px;font-weight:bold;">\${avgPaceMin}'\${String(avgPaceSec).padStart(2,'0')}"</div>
      </div>
      <div style="background:#1a1a1a;border-radius:8px;padding:16px;text-align:center;">
        <div style="color:#888;font-size:11px;">最速ペース</div>
        <div style="font-size:24px;font-weight:bold;color:#FFD700">\${bestPaceMin}'\${String(bestPaceSec).padStart(2,'0')}"</div>
      </div>
    </div>
    <div style="background:#1a1a1a;border-radius:8px;padding:16px;margin-top:12px;">
      <div style="color:#888;font-size:11px;margin-bottom:4px;">週間 MET 分</div>
      <div style="font-size:20px;font-weight:bold;">\${(stats.weekly_met_minutes ?? 0).toLocaleString()} MET-min</div>
      <div style="color:#666;font-size:11px;">WHO 推奨: 600 MET-min/週</div>
      <div style="background:#222;border-radius:4px;height:8px;margin-top:8px;">
        <div style="background:\${(stats.weekly_met_minutes ?? 0) >= 600 ? '#00B900' : '#FF8C00'};height:8px;border-radius:4px;width:\${Math.min(100, ((stats.weekly_met_minutes ?? 0) / 600) * 100)}%;"></div>
      </div>
    </div>
  \`;
}
`;
