# -*- coding: utf-8 -*-
"""Generate 20 stylish HTML slides for the SUB-2:50 strategy deck."""
import os, math, random

OUT = "/tmp/claude-0/-home-user-second-wind-journey/f75abdb1-2970-5fd9-aabb-21320e255a2d/scratchpad/slides"
os.makedirs(OUT, exist_ok=True)
random.seed(7)

# ---------------------------------------------------------------- palette
CYAN   = "#38bdf8"; CYAN_L = "#7dd3fc"; CYAN_BR = "#22d3ee"
ORANGE = "#f97316"; ORANGE_L = "#fb923c"
INK    = "#eef4fb"; MUTE = "#9fb1c6"; FAINT = "#5c6f87"
TOTAL_DAYS = 164; START_DAY = 17; DAYS_LEFT = 147

# ---------------------------------------------------------------- wind bg
def wind_svg():
    streaks = []
    for i in range(34):
        y0 = random.uniform(40, 1400)
        amp = random.uniform(20, 120) * (1 if random.random() > .5 else -1)
        y1 = y0 + random.uniform(-50, 50)
        w  = random.choice([1, 1, 1.4, 2, 2.6])
        op = random.uniform(0.04, 0.16)
        col = ORANGE_L if i % 7 == 0 else CYAN_L
        if col == ORANGE_L: op *= 0.8
        x0 = random.uniform(-200, 300)
        length = random.uniform(1600, 2900)
        c1x, c2x = x0 + length*0.3, x0 + length*0.62
        streaks.append(
            f'<path d="M {x0:.0f} {y0:.0f} C {c1x:.0f} {y0-amp:.0f}, {c2x:.0f} {y1+amp:.0f}, {x0+length:.0f} {y1:.0f}" '
            f'stroke="{col}" stroke-width="{w}" fill="none" opacity="{op:.3f}" stroke-linecap="round"/>'
        )
    # a few fine particle dashes for "blown" feel
    for i in range(26):
        x = random.uniform(0, 2560); y = random.uniform(0, 1440)
        l = random.uniform(8, 34); op = random.uniform(0.05, 0.2)
        streaks.append(f'<line x1="{x:.0f}" y1="{y:.0f}" x2="{x+l:.0f}" y2="{y-l*0.18:.0f}" stroke="{CYAN_L}" stroke-width="1.4" opacity="{op:.2f}" stroke-linecap="round"/>')
    return (
      '<svg class="wind" viewBox="0 0 2560 1440" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">'
      '<defs><filter id="soft"><feGaussianBlur stdDeviation="1.1"/></filter></defs>'
      f'<g filter="url(#soft)">{"".join(streaks)}</g></svg>'
    )

WIND = wind_svg()

# ---------------------------------------------------------------- base css
CSS = f"""
*{{margin:0;padding:0;box-sizing:border-box}}
html,body{{width:1280px;height:720px;overflow:hidden}}
:root{{
  --cyan:{CYAN};--cyanl:{CYAN_L};--cyanbr:{CYAN_BR};
  --orange:{ORANGE};--orangel:{ORANGE_L};
  --ink:{INK};--mute:{MUTE};--faint:{FAINT};
  --jp:'Noto Sans CJK JP','IPAGothic',sans-serif;
  --disp:'Anton',sans-serif;--cond:'Oswald',sans-serif;--lat:'Montserrat',sans-serif;
}}
body{{
  font-family:var(--jp);color:var(--ink);position:relative;
  background:
    radial-gradient(1200px 700px at 8% -8%, rgba(56,189,248,0.16), transparent 60%),
    radial-gradient(1100px 800px at 108% 116%, rgba(249,115,22,0.14), transparent 58%),
    linear-gradient(160deg,#0a1322 0%,#070c16 52%,#05080f 100%);
}}
.wind{{position:absolute;inset:0;width:1280px;height:720px;z-index:0;pointer-events:none}}
.slide{{position:absolute;inset:0;z-index:2;padding:54px 64px;display:flex;flex-direction:column}}
.vignette{{position:absolute;inset:0;z-index:1;pointer-events:none;
  box-shadow:inset 0 0 220px rgba(0,0,0,0.55);
  background:radial-gradient(140% 120% at 50% 50%, transparent 62%, rgba(0,0,0,0.42))}}
/* header */
.hdr{{display:flex;justify-content:space-between;align-items:center;z-index:3}}
.brand{{font-family:var(--lat);font-weight:800;font-size:17px;letter-spacing:3px;color:var(--ink)}}
.brand b{{color:var(--orange)}}
.hdr .meta{{font-family:var(--cond);font-weight:500;font-size:13px;letter-spacing:3px;color:var(--mute)}}
.hr{{height:1px;background:linear-gradient(90deg,rgba(125,211,252,.55),rgba(125,211,252,.05));margin-top:14px}}
/* kicker + title */
.kicker{{font-family:var(--cond);font-weight:600;font-size:15px;letter-spacing:6px;color:var(--orangel);text-transform:uppercase;display:flex;align-items:center;gap:12px}}
.kicker::before{{content:"";width:34px;height:2px;background:var(--orange);display:inline-block}}
.title{{font-weight:900;font-size:46px;line-height:1.08;letter-spacing:-0.5px;margin-top:14px}}
.title .c{{color:var(--cyanbr)}} .title .o{{color:var(--orangel)}}
.sub{{color:var(--mute);font-size:16px;line-height:1.7;margin-top:14px;max-width:880px}}
/* footer */
.ftr{{position:absolute;left:64px;right:64px;bottom:30px;display:flex;align-items:center;gap:18px;z-index:3}}
.ftr .lab{{font-family:var(--cond);font-size:12px;letter-spacing:3px;color:var(--faint);white-space:nowrap}}
.ftr .lab b{{color:var(--cyanl)}}
.track{{flex:1;height:3px;border-radius:3px;background:rgba(255,255,255,.08);position:relative;overflow:hidden}}
.track i{{position:absolute;left:0;top:0;bottom:0;border-radius:3px;background:linear-gradient(90deg,var(--cyan),var(--orange))}}
.pg{{font-family:var(--cond);font-size:12px;letter-spacing:3px;color:var(--faint)}}
.pg b{{color:var(--ink)}}
.body{{flex:1;display:flex;flex-direction:column;justify-content:center;z-index:3}}
/* cards */
.card{{background:linear-gradient(160deg,rgba(125,211,252,.07),rgba(255,255,255,.02));
  border:1px solid rgba(125,211,252,.16);border-radius:16px;padding:22px 24px;position:relative;overflow:hidden}}
.card.o{{border-color:rgba(249,115,22,.28)}}
.num{{font-family:var(--disp);letter-spacing:.5px;line-height:.9}}
.mono{{font-family:var(--cond)}}
.tag{{font-family:var(--cond);font-size:12px;letter-spacing:3px;color:var(--mute);text-transform:uppercase}}
.glowdot{{position:absolute;width:240px;height:240px;border-radius:50%;filter:blur(60px);opacity:.5}}
"""

def frame(num, kicker, title_html, body_html, sub_html="", accent="cyan"):
    sub = f'<div class="sub">{sub_html}</div>' if sub_html else ""
    pct = (START_DAY)/TOTAL_DAYS*100
    return f"""<!doctype html><html><head><meta charset="utf-8"><style>{CSS}</style></head>
<body>{WIND}<div class="vignette"></div>
<div class="slide">
  <div class="hdr"><div class="brand">MASH<b>.</b>&nbsp; SUB-2:50 PROJECT</div>
    <div class="meta">つくば 2026.11.22 ・ 残り {DAYS_LEFT} 日</div></div>
  <div class="hr"></div>
  <div style="margin-top:30px"><div class="kicker">{kicker}</div>
    <div class="title">{title_html}</div>{sub}</div>
  <div class="body">{body_html}</div>
  <div class="ftr">
    <div class="lab">DAY <b>{START_DAY}</b> / {TOTAL_DAYS}</div>
    <div class="track"><i style="width:{pct:.0f}%"></i></div>
    <div class="lab"><b>{DAYS_LEFT}</b> DAYS TO RACE</div>
    <div class="pg"><b>{num:02d}</b> / 20</div>
  </div>
</div></body></html>"""

def chart(points, ymin, ymax, xlabels, target, target_label, unit, good_down=False):
    # points: list of y-values aligned to xlabels
    W,H = 980, 300; PADL, PADB, PADT = 60, 34, 18
    n=len(points); innerW=W-PADL-20; innerH=H-PADB-PADT
    def X(i): return PADL + innerW*(i/(n-1))
    def Y(v): return PADT + innerH*(1-(v-ymin)/(ymax-ymin))
    grid=""
    for g in range(5):
        yy=PADT+innerH*g/4; val=ymax-(ymax-ymin)*g/4
        grid+=f'<line x1="{PADL}" y1="{yy:.0f}" x2="{W-20}" y2="{yy:.0f}" stroke="rgba(255,255,255,.06)" stroke-width="1"/>'
        grid+=f'<text x="{PADL-12}" y="{yy+4:.0f}" fill="{FAINT}" font-size="13" text-anchor="end" font-family="Oswald">{val:.0f}</text>'
    ty=Y(target)
    tgt=(f'<line x1="{PADL}" y1="{ty:.0f}" x2="{W-20}" y2="{ty:.0f}" stroke="{ORANGE}" stroke-width="2" stroke-dasharray="7 6" opacity=".9"/>'
         f'<text x="{PADL+8}" y="{ty-12:.0f}" fill="{ORANGE_L}" font-size="15" text-anchor="start" font-family="Oswald" font-weight="600">{target_label}</text>')
    pts=" ".join(f"{X(i):.0f},{Y(v):.0f}" for i,v in enumerate(points))
    area=f"{PADL},{PADT+innerH} "+pts+f" {X(n-1):.0f},{PADT+innerH}"
    dots="".join(f'<circle cx="{X(i):.0f}" cy="{Y(v):.0f}" r="5" fill="#06101e" stroke="{CYAN_BR}" stroke-width="3"/>' for i,v in enumerate(points))
    vlabels="".join(f'<text x="{X(i):.0f}" y="{Y(v)-16:.0f}" fill="{INK}" font-size="15" text-anchor="middle" font-family="Oswald" font-weight="600">{v:g}</text>' for i,v in enumerate(points))
    xlab="".join(f'<text x="{X(i):.0f}" y="{H-8:.0f}" fill="{MUTE}" font-size="13" text-anchor="middle" font-family="Oswald">{l}</text>' for i,l in enumerate(xlabels))
    return f"""<svg viewBox="0 0 {W} {H}" style="width:100%;height:auto">
      <defs><linearGradient id="ar" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="{CYAN}" stop-opacity="0.34"/><stop offset="1" stop-color="{CYAN}" stop-opacity="0"/></linearGradient></defs>
      {grid}{tgt}
      <polygon points="{area}" fill="url(#ar)"/>
      <polyline points="{pts}" fill="none" stroke="{CYAN_BR}" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"/>
      {dots}{vlabels}{xlab}</svg>"""

slides=[]

# 01 TITLE -------------------------------------------------------
slides.append(frame.__wrapped__ if False else None)
slides[0] = f"""<!doctype html><html><head><meta charset="utf-8"><style>{CSS}
.big{{font-family:var(--disp);font-size:200px;line-height:.84;letter-spacing:2px;
  background:linear-gradient(180deg,#fff 0%,#bfe6ff 48%,var(--cyan) 100%);-webkit-background-clip:text;background-clip:text;color:transparent;
  text-shadow:0 0 60px rgba(56,189,248,.25)}}
.colon{{color:var(--orange);-webkit-text-fill-color:var(--orange)}}
</style></head><body>{WIND}<div class="vignette"></div>
<div class="slide" style="justify-content:center">
 <div class="hdr" style="position:absolute;top:54px;left:64px;right:64px"><div class="brand">MASH<b>.</b>&nbsp; SUB-2:50 PROJECT</div>
   <div class="meta">つくばマラソン 2026.11.22</div></div>
 <div style="z-index:3">
   <div class="kicker">147 days · 6.28 → 11.22</div>
   <div class="big" style="margin-top:8px">2<span class="colon">:</span>50<span class="colon">:</span>00</div>
   <div class="title" style="font-size:40px;margin-top:18px">サブエガ<span class="c">達成戦略</span></div>
   <div class="sub" style="font-size:18px">元100kgのランナーが、つくばマラソンで2時間50分の壁を破る。<br>
     残り<b style="color:var(--orangel)">147日</b>・<b style="color:var(--cyanl)">21週間</b>の全行程をここに描く。</div>
 </div>
 <div class="ftr"><div class="lab">DAY <b>{START_DAY}</b> / {TOTAL_DAYS}</div>
   <div class="track"><i style="width:{START_DAY/TOTAL_DAYS*100:.0f}%"></i></div>
   <div class="lab"><b>{DAYS_LEFT}</b> DAYS TO RACE</div><div class="pg"><b>01</b> / 20</div></div>
</div></body></html>"""

# 02 MISSION -----------------------------------------------------
slides.append(frame(2,"Why — 退路を断つ",
  'なぜ、<span class="o">サブエガ</span>なのか。',
  f"""
  <div style="display:flex;gap:26px;align-items:stretch">
    <div class="card" style="flex:1.4">
      <div class="tag">The Story</div>
      <p style="font-size:18px;line-height:1.9;margin-top:14px;color:#dbe6f3">
      2015年、体重<b style="color:var(--orangel)">100kg</b>。睡眠負債、乱れた食、運動ゼロ。<br>
      「このままでは死ぬ」——そこから<b style="color:var(--cyanl)">行動序列ドミノ</b>で人生を再設計した。</p>
      <p style="font-size:18px;line-height:1.9;margin-top:16px;color:#dbe6f3">
      28kgを削り、サブスリーへ。次は<b style="color:var(--cyanbr)">2時間50分の壁</b>。<br>
      これは減量の物語ではない。<b>自分を証明する164日</b>だ。</p>
    </div>
    <div class="card o" style="flex:1;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center">
      <div class="glowdot" style="background:var(--orange);top:-60px;right:-60px"></div>
      <div class="tag">退路を断った日</div>
      <div class="num" style="font-size:120px;color:#fff;margin-top:6px">17</div>
      <div class="mono" style="color:var(--orangel);letter-spacing:3px;font-size:18px">DAY / 164</div>
      <div style="color:var(--mute);font-size:15px;margin-top:16px;line-height:1.7">もう引き返せない。<br>前に進むしかない。</div>
    </div>
  </div>""",
  ""));

# 03 THE TARGET --------------------------------------------------
slides.append(frame(3,"The Target — 数字の分解",
  '<span class="c">4′00″</span>/km を、42.195km。',
  f"""
  <div style="display:flex;gap:22px">
    {''.join(f'''<div class="card" style="flex:1;text-align:center">
      <div class="tag">{t}</div>
      <div class="num" style="font-size:{s}px;color:{c};margin-top:10px">{v}</div>
      <div style="color:var(--mute);font-size:14px;margin-top:8px">{d}</div></div>'''
      for t,v,s,c,d in [
        ("GOAL TIME","2:50:00",58,"#fff","破壊すべき壁"),
        ("RACE PACE","4′00″",58,CYAN_BR,"全42kmの設計ペース"),
        ("PROJECTED","2:48:47",58,ORANGE_L,"4′00″換算 = 1分13秒の貯金"),
        ("DISTANCE","42.195",58,"#fff","km・一歩の妥協もなく"),
      ])}
  </div>
  <div class="card" style="margin-top:22px;display:flex;align-items:center;gap:22px">
    <div class="tag" style="color:var(--cyanl)">EQUATION</div>
    <div class="mono" style="font-size:24px;color:#dbe6f3;letter-spacing:1px">
      4′00″/km <span style="color:var(--faint)">×</span> 42.195km <span style="color:var(--faint)">=</span>
      <b style="color:var(--orangel)">2:48:47</b> <span style="color:var(--faint)">→ サブエガまで</span> <b style="color:var(--cyanbr)">73秒の安全マージン</b></div>
  </div>""",
  "目標タイムを「平均ペース」に翻訳する。曖昧な根性論ではなく、毎キロ4分00秒という<b>反復可能な単位</b>に落とし込む。"));

# 04 STARTING LINE ----------------------------------------------
def stat_card(tag, val, unit, sub, color="#fff", o=False):
    return f"""<div class="card {'o' if o else ''}" style="flex:1;text-align:center">
      <div class="tag">{tag}</div>
      <div style="display:flex;align-items:baseline;justify-content:center;gap:6px;margin-top:8px">
        <div class="num" style="font-size:74px;color:{color}">{val}</div>
        <div class="mono" style="font-size:20px;color:var(--mute)">{unit}</div></div>
      <div style="color:var(--mute);font-size:14px;margin-top:6px">{sub}</div></div>"""
slides.append(frame(4,"Starting Line — 6月28日",
  '現在地を、正確に。',
  f"""<div style="display:flex;gap:22px">
    {stat_card("CHALLENGE","17","/164","フィリピン出張から帰還",CYAN_BR)}
    {stat_card("BODY WEIGHT","68.2","kg","スタート100kg → −31.8kg","#fff")}
    {stat_card("VO₂MAX","59","ml/kg","既にサブエガ射程の現在値",CYAN_L)}
    {stat_card("COUNTDOWN","147","days","21週間 / 4フェーズ",ORANGE_L,o=True)}
  </div>
  <div class="sub" style="margin-top:24px;max-width:none">出張明けのコンディションは良好。脚は軽い。ここから<b style="color:var(--cyanl)">基礎期</b>に入り、有酸素ベースを再構築する。</div>""",
  ""));

# 05 THE GAP -----------------------------------------------------
rows=[("レース体重","68.2 kg","64.0 kg","−4.2 kg","21週で週−0.2kg"),
      ("VO₂max","59","65 ゴール","+6","減量で分母も縮む"),
      ("設計ペース","5′30″/km(易)","4′00″/km","−90秒/km","閾値・MP走で接続"),
      ("月間走行距離","約 240 km","420–480 km","+1.8倍","段階的に積み上げ"),
      ("30kmの壁","未検証","完全攻略","—","特異期で予行")]
trh="".join(f"""<tr>
  <td style="padding:14px 18px;color:#dbe6f3;font-size:17px;font-weight:600">{a}</td>
  <td style="padding:14px 18px;color:var(--mute);font-size:16px" class="mono">{b}</td>
  <td style="padding:14px 18px;color:var(--cyanbr);font-size:16px;font-weight:700" class="mono">{c}</td>
  <td style="padding:14px 18px;color:var(--orangel);font-size:16px;font-weight:700" class="mono">{d}</td>
  <td style="padding:14px 18px;color:var(--faint);font-size:14px">{e}</td></tr>""" for a,b,c,d,e in rows)
slides.append(frame(5,"The Gap — 埋めるべき差",
  '現在地 <span class="o">→</span> 目標。',
  f"""<div class="card" style="padding:6px 8px">
    <table style="width:100%;border-collapse:collapse">
      <tr style="border-bottom:1px solid rgba(125,211,252,.18)">
        {''.join(f'<th style="text-align:left;padding:12px 18px;color:var(--mute);font-size:12px;letter-spacing:3px" class="mono">{h}</th>' for h in ["指標","現在","目標","差分","接続戦略"])}</tr>
      {trh}</table></div>""",
  "5つの差を、21週間で連続的に埋める。各フェーズが次の土台になるよう設計する。"));

# 06 PHILOSOPHY --------------------------------------------------
def domino(n,label,desc,color):
    return f"""<div style="flex:1;text-align:center;position:relative">
      <div class="card" style="padding:30px 18px">
        <div class="num" style="font-size:62px;color:{color}">{n}</div>
        <div style="font-size:24px;font-weight:800;margin-top:8px;color:#fff">{label}</div>
        <div style="color:var(--mute);font-size:14px;margin-top:10px;line-height:1.7">{desc}</div></div></div>"""
slides.append(frame(6,"Philosophy — 行動序列ドミノ",
  'すべては <span class="c">睡眠</span> から始まる。',
  f"""<div style="display:flex;align-items:center;gap:8px">
    {domino("1","睡眠","7時間を死守。<br>翌日の練習強度はここで決まる。",CYAN_BR)}
    <div class="num" style="font-size:46px;color:var(--orange);opacity:.8">→</div>
    {domino("2","食事","睡眠が整えば食が整う。<br>減量と回復を両立させる。",CYAN_L)}
    <div class="num" style="font-size:46px;color:var(--orange);opacity:.8">→</div>
    {domino("3","運動","土台が揃えば走りは伸びる。<br>練習は結果であって原因ではない。",ORANGE_L)}
  </div>""",
  "順番を守る。睡眠が崩れた日は食事を優先し、無理に走らない。この規律こそが164日間の継続を支える。"));

# 07 VO2MAX ROADMAP ---------------------------------------------
slides.append(frame(7,"Roadmap ① — 有酸素エンジン",
  '現在 <span class="c">59</span> を、<span class="o">65</span> へ。',
  f"""<div class="card">{chart([59,60.5,62,63,64,65],57,67,
      ["6/28","7月","8月","9月","10月","11/22"],65,"65 ゴール","",)}</div>
  <div style="display:flex;gap:18px;margin-top:18px">
    {''.join(f'<div class="card" style="flex:1"><div class="tag">{t}</div><div style="color:#dbe6f3;font-size:15px;margin-top:8px;line-height:1.6">{d}</div></div>'
      for t,d in [("59 — 現在地","既にサブエガ射程内。土台は出来ている"),
                  ("62 — 中間チェック","中盤の失速耐性と余裕が増す通過点"),
                  ("65 — ゴール","サブエガを盤石に超える有酸素出力")])}
  </div>""",
  "体重が64kgに落ちれば分母が縮み、VO₂max/kgは自動的に上がる。<b>減量とエンジン強化は一つの戦略</b>。"));

# 08 WEIGHT ROADMAP ---------------------------------------------
slides.append(frame(8,"Roadmap ② — レース体重",
  '<span class="c">64kg</span> が、翼になる。',
  f"""<div class="card">{chart([68.2,66.8,65.8,65.0,64.4,64.0],63,69,
      ["6/28","7月","8月","9月","10月","11/22"],64,"64.0 kg 目標","")}</div>
  <div style="display:flex;gap:18px;margin-top:18px">
    {''.join(f'<div class="card" style="flex:1;text-align:center"><div class="tag">{t}</div><div class="num" style="font-size:40px;color:{c};margin-top:8px">{v}</div><div style="color:var(--mute);font-size:13px;margin-top:6px">{d}</div></div>'
      for t,v,c,d in [("WEEKLY","−0.2kg",CYAN_BR,"筋量を守る緩やかな減速"),
                      ("TIME GAIN","≈ 12分",ORANGE_L,"体重−1kg ≒ フル3分の試算"),
                      ("METHOD","PFC設計","#fff","高タンパク・カーボ周期化")])}
  </div>""",
  "急がない。週−0.2kgで筋肉を残しながら絞る。マラソンは<b>パワーウェイトレシオ</b>の競技だ。"));

# 09 FOUR PHASES -------------------------------------------------
phases=[("PHASE 1","基礎期","6/28–7/31","有酸素ベース再構築",CYAN_L,"5週"),
        ("PHASE 2","養成期","8/1–9/15","閾値・VO₂max向上",CYAN_BR,"6.5週"),
        ("PHASE 3","特異期","9/16–11/1","MP走・30kmの壁攻略",ORANGE_L,"6.5週"),
        ("PHASE 4","調整期","11/2–11/22","テーパー・ピーキング","#fff","3週")]
cards="".join(f"""<div class="card {'o' if c==ORANGE_L else ''}" style="flex:1;position:relative">
   <div class="mono" style="color:{c};font-size:13px;letter-spacing:3px">{p}</div>
   <div style="font-size:28px;font-weight:900;margin-top:6px;color:#fff">{n}</div>
   <div class="mono" style="color:var(--mute);font-size:14px;margin-top:4px">{d}</div>
   <div style="height:1px;background:rgba(255,255,255,.1);margin:14px 0"></div>
   <div style="color:#dbe6f3;font-size:15px;line-height:1.5">{g}</div>
   <div class="mono" style="position:absolute;right:18px;top:16px;color:var(--faint);font-size:13px">{w}</div></div>""" for p,n,d,g,c,w in phases)
slides.append(frame(9,"The Plan — 21週間の設計図",
  '<span class="c">4つの局面</span>で、壁を崩す。',
  f"""<div style="display:flex;gap:18px;align-items:stretch">{cards}</div>
  <div class="track" style="margin-top:26px;height:6px;flex:0 0 auto;width:100%">
    <i style="width:100%;background:linear-gradient(90deg,{CYAN_L},{CYAN_BR} 45%,{ORANGE} 78%,#fff)"></i></div>
  <div style="display:flex;justify-content:space-between;margin-top:8px" class="mono">
    {''.join(f'<span style="color:var(--faint);font-size:12px;letter-spacing:2px">{d.split("–")[0]}</span>' for *_,d,_g,_c,_w in [(*p,) for p in phases]) if False else ''.join(f'<span style="color:var(--faint);font-size:12px;letter-spacing:2px">{p[2].split("–")[0]}</span>' for p in phases)}
    <span style="color:var(--orangel);font-size:12px;letter-spacing:2px">11/22 RACE</span></div>""",
  "各フェーズは独立した訓練ではなく、次の段階の<b>土台</b>になる。積み上げの順序を絶対に飛ばさない。"));

# generic phase detail
def phase_detail(num,kick,tno,name,period,color,focus,sessions,metric_t,metric_v,metric_u,note):
    sess="".join(f"""<div style="display:flex;gap:14px;align-items:flex-start;margin-top:14px">
      <div style="width:8px;height:8px;border-radius:50%;background:{color};margin-top:8px;flex-shrink:0"></div>
      <div><b style="color:#fff;font-size:17px">{a}</b><span style="color:var(--mute);font-size:15px"> — {b}</span></div></div>""" for a,b in sessions)
    return frame(num,kick,
      f'{name}<span style="color:var(--faint);font-size:30px;font-weight:400">　{period}</span>',
      f"""<div style="display:flex;gap:26px">
        <div class="card" style="flex:1.5">
          <div class="tag" style="color:{color}">FOCUS — {focus}</div>{sess}</div>
        <div class="card {'o' if color==ORANGE_L else ''}" style="flex:1;display:flex;flex-direction:column;justify-content:center;text-align:center">
          <div class="glowdot" style="background:{color};bottom:-70px;left:-50px;opacity:.35"></div>
          <div class="tag">{metric_t}</div>
          <div class="num" style="font-size:84px;color:{color};margin-top:8px">{metric_v}</div>
          <div class="mono" style="color:var(--mute);font-size:16px">{metric_u}</div>
          <div style="color:var(--mute);font-size:14px;margin-top:16px;line-height:1.6;padding:0 10px">{note}</div></div>
      </div>""",
      "")

# 10 PHASE1
slides.append(phase_detail(10,"Phase 1 — 基礎期","1","基礎期","6/28 – 7/31",CYAN_L,"有酸素ベース再構築",
  [("週5–6日のイージー走","心拍ゾーン2(140-150bpm)。会話できる強度で毛細血管を増やす"),
   ("週1テンポ走","4′50″/km前後を20分。閾値の入口を作る"),
   ("週末ロング走","90→120分へ漸増。脂肪燃焼回路を起動"),
   ("月間距離 240→320km","出張明けから故障なく積み増す")],
  "MONTHLY","320","km / 月","まず走れる身体に戻す。スピードはまだ追わない。"));

# 11 PHASE2
slides.append(phase_detail(11,"Phase 2 — 養成期","2","養成期","8/1 – 9/15",CYAN_BR,"閾値・VO₂max向上",
  [("週1 閾値走(T)","4′30″/km × 20–30分。乳酸の天井を押し上げる"),
   ("週1 VO₂maxインターバル","1km×5–6本 @3′50″ / つなぎ90秒"),
   ("週末ロング 130→150分","後半ペースアップで持久力に刺激"),
   ("月間距離 380→440km","強度と量を同時に引き上げる山場")],
  "VO₂MAX","62","→ 65へ","ここでエンジンの最大出力を引き上げる。"));

# 12 PHASE3
slides.append(phase_detail(12,"Phase 3 — 特異期","3","特異期","9/16 – 11/1",ORANGE_L,"マラソン特異的・30kmの壁",
  [("マラソンペース走(MP)","4′00″/km × 16→25km。レースを身体に刻む"),
   ("30km走 ×2–3回","本番の予行。給水・補給・失速点を検証"),
   ("週1 閾値走を維持","VO₂maxを落とさず保持"),
   ("月間距離 ピーク 480km","最も苦しく、最も伸びる局面")],
  "KEY RUN","30","km 走","「壁」を練習で先に壊しておく。本番で初めて出会わない。"));

# 13 PHASE4
slides.append(phase_detail(13,"Phase 4 — 調整期","4","調整期","11/2 – 11/22","#fff","テーパー・ピーキング",
  [("走行距離を40%削減","疲労を抜く。距離は減らすが強度は保つ"),
   ("短いMP刺激を維持","4′00″/km×6–8kmで感覚を研ぐ"),
   ("カーボローディング","レース3日前から糖質を満たす"),
   ("睡眠を最優先","Garmin睡眠スコア80+で当日を迎える")],
  "TAPER","3","weeks","ここで頑張らない勇気。積み上げた力を解放する準備。"));

# 14 WEEKLY ENGINE ----------------------------------------------
week=[("MON","休 / 回復","30分ジョグ or 完全休養","#64748b"),
      ("TUE","ポイント①","閾値走 / インターバル",CYAN_BR),
      ("WED","イージー","ゾーン2・60分",CYAN_L),
      ("THU","ポイント②","テンポ / MP走",ORANGE_L),
      ("FRI","イージー / 休","回復走40分",CYAN_L),
      ("SAT","ロング走","本命・100–150分","#fff"),
      ("SUN","イージー","ゆるく繋ぐ",CYAN_L)]
wk="".join(f"""<div class="card" style="flex:1;text-align:center;padding:18px 8px">
   <div class="mono" style="color:{c};font-size:13px;letter-spacing:2px">{d}</div>
   <div style="font-size:17px;font-weight:800;margin-top:10px;color:#fff">{t}</div>
   <div style="color:var(--mute);font-size:12px;margin-top:8px;line-height:1.5">{s}</div></div>""" for d,t,s,c in week)
slides.append(frame(14,"Weekly Engine — 1週間の型",
  '<span class="c">2つのポイント練</span>と、土台の積層。',
  f"""<div style="display:flex;gap:10px;align-items:stretch">{wk}</div>
  <div style="display:flex;gap:18px;margin-top:22px">
    <div class="card" style="flex:1"><div class="tag" style="color:var(--cyanl)">8:2 の法則</div>
      <div style="color:#dbe6f3;font-size:15px;margin-top:8px;line-height:1.6">全体の8割はイージー。ポイント練は週2回まで。<b>遅く走る日が、速さを作る。</b></div></div>
    <div class="card o" style="flex:1"><div class="tag" style="color:var(--orangel)">自動格下げルール</div>
      <div style="color:#dbe6f3;font-size:15px;margin-top:8px;line-height:1.6">睡眠5h未満・スコア低下の朝は、ポイント練をイージーへ即格下げ。<b>故障ゼロが最優先。</b></div></div>
  </div>""",
  ""));

# 15 SLEEP -------------------------------------------------------
slides.append(frame(15,"Domino ① — 睡眠設計",
  '<span class="c">22:00 → 5:00</span>。7時間の聖域。',
  f"""<div style="display:flex;gap:24px;align-items:stretch">
    <div class="card" style="flex:1.3;display:flex;flex-direction:column;justify-content:center">
      <div style="display:flex;align-items:center;gap:18px">
        <div style="text-align:center"><div class="num" style="font-size:64px;color:var(--cyanl)">22<span style="font-size:30px">:00</span></div><div class="tag">就寝</div></div>
        <div style="flex:1;height:4px;border-radius:4px;background:linear-gradient(90deg,var(--cyan),var(--orange))"></div>
        <div style="text-align:center"><div class="num" style="font-size:64px;color:var(--orangel)">5<span style="font-size:30px">:00</span></div><div class="tag">起床</div></div>
      </div>
      <div style="color:var(--mute);font-size:15px;margin-top:24px;line-height:1.8;text-align:center">
        平日は固定。<b style="color:var(--cyanl)">Garmin睡眠スコア</b>で質を可視化し、<br>翌朝のポイント練可否を判断する。</div>
    </div>
    <div class="card o" style="flex:1;display:flex;flex-direction:column;justify-content:center;text-align:center">
      <div class="tag">TARGET SCORE</div>
      <div class="num" style="font-size:96px;color:#fff;margin-top:6px">80<span style="font-size:34px;color:var(--mute)">+</span></div>
      <div style="color:var(--mute);font-size:14px;margin-top:14px;line-height:1.7">スコア80以上で<br>質練にGOサインを出す</div>
    </div>
  </div>""",
  "睡眠はドミノの起点。ここが倒れれば食事も運動も連鎖して崩れる。<b>練習より先に、眠りを設計する。</b>"));

# 16 FUEL --------------------------------------------------------
slides.append(frame(16,"Domino ② — 栄養・補給",
  '減量と回復を、<span class="o">両立</span>させる。',
  f"""<div style="display:flex;gap:18px">
    {''.join(f'''<div class="card" style="flex:1"><div class="tag" style="color:{c}">{t}</div>
       <div style="font-size:20px;font-weight:800;color:#fff;margin-top:10px">{h}</div>
       <div style="color:var(--mute);font-size:14px;margin-top:10px;line-height:1.7">{d}</div></div>'''
      for t,h,d,c in [
        ("PROTEIN","高タンパク維持","体重×1.6g/日。減量期も筋量を守る最優先栄養素。",CYAN_L),
        ("CARB CYCLING","糖質の周期化","ポイント練前夜に充填、回復日は抑える。",CYAN_BR),
        ("IN-RACE","レース補給","ジェル30–40g/h・5kmごと給水。30kmの壁を栄養で防ぐ。",ORANGE_L)])}
  </div>
  <div class="card" style="margin-top:20px;display:flex;align-items:center;gap:24px">
     <div class="tag" style="color:var(--cyanl)">PFC 設計</div>
     <div class="mono" style="font-size:19px;color:#dbe6f3;letter-spacing:1px">P <b style="color:var(--cyanbr)">30%</b> <span style="color:var(--faint)">/</span> F <b style="color:var(--cyanbr)">20%</b> <span style="color:var(--faint)">/</span> C <b style="color:var(--cyanbr)">50%</b>
       <span style="color:var(--faint)">　—　練習量に応じて総量を調整</span></div>
  </div>""",
  "空腹で削るのではなく、<b>狙って削る</b>。栄養は最大の回復ツールであり、最強の武器でもある。"));

# 17 WEAPONS (shoes) --------------------------------------------
shoes=[("DAILY / 練習","ノヴァブラスト5","高反発で脚を守る土台。日々のイージーを支える",CYAN_L),
       ("TEMPO / 速い日","スーパーブラスト系","軽量プレートでポイント練の質を引き上げる",CYAN_BR),
       ("RACE / 本番","メタスピードスカイ東京","11/22、すべてを解き放つ決戦の一足",ORANGE_L)]
sc="".join(f"""<div class="card {'o' if c==ORANGE_L else ''}" style="flex:1;position:relative">
   <div class="tag" style="color:{c}">{t}</div>
   <div style="font-size:24px;font-weight:900;color:#fff;margin-top:12px">{h}</div>
   <div style="color:var(--mute);font-size:14px;margin-top:12px;line-height:1.7">{d}</div>
   <div class="num" style="position:absolute;right:18px;bottom:10px;font-size:46px;color:rgba(255,255,255,.06)">0{i+1}</div></div>"""
   for i,(t,h,d,c) in enumerate(shoes))
slides.append(frame(17,"Weapons — シューズ戦略",
  '目的別に、<span class="c">3足</span>を使い分ける。',
  f"""<div style="display:flex;gap:18px;align-items:stretch">{sc}</div>""",
  "練習はクッションで脚を守り、本番はカーボンで解き放つ。<b>道具を目的に従わせる。</b>"));

# 18 KEY SESSIONS table -----------------------------------------
ks=[("イージー (E)","5′20″–5′40″","138–150","ゾーン2","土台・回復"),
    ("マラソンP (MP)","4′00″","158–165","ゾーン3–4","本番ペース定着"),
    ("閾値走 (T)","4′25″–4′35″","165–172","ゾーン4","乳酸閾値の引上げ"),
    ("VO₂max (I)","3′45″–3′55″","175–183","ゾーン5","最大酸素摂取量")]
trh="".join(f"""<tr>
  <td style="padding:13px 18px;color:#fff;font-size:16px;font-weight:700">{a}</td>
  <td style="padding:13px 18px;color:var(--cyanbr);font-size:16px" class="mono">{b}</td>
  <td style="padding:13px 18px;color:var(--orangel);font-size:16px" class="mono">{c}</td>
  <td style="padding:13px 18px;color:var(--mute);font-size:15px" class="mono">{d}</td>
  <td style="padding:13px 18px;color:var(--mute);font-size:14px">{e}</td></tr>""" for a,b,c,d,e in ks)
slides.append(frame(18,"Calibration — 練習強度の物差し",
  '<span class="o">心拍とペース</span>で、強度を管理する。',
  f"""<div class="card" style="padding:6px 8px">
    <table style="width:100%;border-collapse:collapse">
      <tr style="border-bottom:1px solid rgba(125,211,252,.18)">
        {''.join(f'<th style="text-align:left;padding:12px 18px;color:var(--mute);font-size:12px;letter-spacing:2px" class="mono">{h}</th>' for h in ["セッション","ペース/km","心拍 bpm","ゾーン","目的"])}</tr>
      {trh}</table></div>""",
  "感覚に頼らない。Garminの数値で<b>毎回同じ強度を再現</b>し、積み重ねを正確に管理する。"));

# 19 RACE DAY ---------------------------------------------------
slides.append(frame(19,"Race Day — 11.22 つくば",
  '<span class="c">イーブン</span>で刻み、<span class="o">30kmから</span>勝負。',
  f"""<div class="card" style="padding:22px 24px">
    <div class="tag" style="color:var(--cyanl)">PACE STRATEGY — 4′00″/km even</div>
    <div style="display:flex;gap:10px;margin-top:16px;align-items:stretch">
      {''.join(f'''<div style="flex:{f};text-align:center;padding:14px 6px;border-radius:12px;background:{bg}">
        <div class="mono" style="color:{c};font-size:13px;letter-spacing:1px">{seg}</div>
        <div style="font-size:17px;font-weight:800;color:#fff;margin-top:6px">{p}</div>
        <div style="color:var(--mute);font-size:12px;margin-top:6px">{d}</div></div>'''
        for seg,p,d,c,bg,f in [
          ("0–10km","4′00″","抑える・貯金しない",CYAN_L,"rgba(56,189,248,.10)",1),
          ("10–25km","4′00″","省エネで淡々と",CYAN_BR,"rgba(34,211,238,.10)",1.5),
          ("25–35km","4′00″","壁の入口・補給徹底",ORANGE_L,"rgba(249,115,22,.12)",1),
          ("35–42km","≤4′00″","全部出し切る","#fff","rgba(255,255,255,.06)",0.7)])}
    </div></div>
  <div style="display:flex;gap:18px;margin-top:18px">
    {''.join(f'<div class="card" style="flex:1"><div class="tag" style="color:{c}">{t}</div><div style="color:#dbe6f3;font-size:14px;margin-top:8px;line-height:1.6">{d}</div></div>'
      for t,d,c in [("貯金は作らない","前半の突っ込みは30kmで返済を迫られる。設計ペースを守る規律。",CYAN_L),
                    ("補給は計画通り","喉が渇く前に飲む。ジェルは時計のアラームで強制。",CYAN_BR),
                    ("壁は予習済み","特異期の30km走で何度も通った道。動揺しない。",ORANGE_L)])}
  </div>""",
  ""));

# 20 CLOSING -----------------------------------------------------
slides.append(f"""<!doctype html><html><head><meta charset="utf-8"><style>{CSS}
.quote{{font-size:54px;font-weight:900;line-height:1.3;letter-spacing:-.5px}}
.quote .c{{color:var(--cyanbr)}} .quote .o{{color:var(--orangel)}}
</style></head><body>{WIND}<div class="vignette"></div>
<div class="slide" style="justify-content:center">
 <div class="hdr" style="position:absolute;top:54px;left:64px;right:64px"><div class="brand">MASH<b>.</b>&nbsp; SUB-2:50 PROJECT</div>
   <div class="meta">つくばマラソン 2026.11.22</div></div>
 <div style="z-index:3;max-width:1000px">
   <div class="kicker">The Commitment</div>
   <div class="quote" style="margin-top:22px">退路を断てば、<br><span class="c">前に進む</span>しかない。</div>
   <div class="sub" style="font-size:19px;margin-top:26px">147日後、つくばのフィニッシュゲートに<b style="color:var(--orangel)">2:4X:XX</b>を刻む。<br>
     睡眠を整え、食を設計し、走りを積む。ドミノは、もう倒れ始めている。</div>
   <div style="display:flex;gap:14px;margin-top:34px">
     {''.join(f'<div class="card" style="padding:14px 22px"><span class="mono" style="color:{c};font-size:13px;letter-spacing:2px">{t}</span> <b style="color:#fff;font-size:18px;margin-left:8px">{v}</b></div>'
        for t,v,c in [("TIME","2:50:00",ORANGE_L),("PACE","4′00″/km",CYAN_BR),("WEIGHT","64kg",CYAN_L),("VO₂MAX","65",CYAN_L)])}
   </div>
 </div>
 <div class="ftr"><div class="lab">DAY <b>{START_DAY}</b> / {TOTAL_DAYS}</div>
   <div class="track"><i style="width:{START_DAY/TOTAL_DAYS*100:.0f}%"></i></div>
   <div class="lab"><b>{DAYS_LEFT}</b> DAYS TO RACE</div><div class="pg"><b>20</b> / 20</div></div>
</div></body></html>""")

for i,html in enumerate(slides,1):
    with open(f"{OUT}/slide{i:02d}.html","w") as f:
        f.write(html)
print("wrote", len(slides), "slides to", OUT)
