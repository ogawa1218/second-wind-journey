# garmin-api スキル

Garmin Connect API から指定日のランニングデータを取得し、
Threads 投稿文と Substack 週次ログ行を自動生成する。

**使用例**: 「7月4日のランニングについて投稿文を作成して」

---

## 実行手順

### Step 1 — 日付を YYYY-MM-DD に変換する

ユーザーの発言から対象日付を特定し、必ず以下のコマンドで現在日付を取得してから変換する。

```bash
date +%Y-%m-%d
```

変換ルール:
| ユーザー入力 | 変換例（2026年基準） |
|---|---|
| 7月4日 / 7/4 | 2026-07-04 |
| 6月28日 / 6/28 | 2026-06-28 |
| 昨日 | `date -d "yesterday" +%Y-%m-%d` で取得 |
| 今日 | `date +%Y-%m-%d` で取得 |
| 明日 | `date -d "tomorrow" +%Y-%m-%d` で取得 |

年が明示されていない場合は **2026年** を使用する（サブエガ計画期間: 2026-06-12〜2026-11-22）。

### Step 2 — 依存パッケージを確認する

```bash
python3 -c "import garminconnect, garth; print('OK')" 2>&1
```

エラーが出た場合は自動インストールする：

```bash
pip install garminconnect garth
```

インストール後に Step 3 へ進む。

### Step 3 — .env.local の認証情報を確認する

```bash
grep -E "GARMIN_(EMAIL|PASSWORD)" .env.local 2>/dev/null | sed 's/=.*/=***/'
```

`GARMIN_EMAIL` または `GARMIN_PASSWORD` が未設定（空）の場合は処理を止め、以下を案内する：

```
.env.local に以下を設定してください:

GARMIN_EMAIL=your@email.com
GARMIN_PASSWORD=yourpassword

設定後、もう一度お試しください。
```

### Step 4 — Garmin Connect からデータ取得

```bash
python3 scripts/garmin_fetch.py {YYYY-MM-DD}
```

**初回実行時のみ**: Garmin アカウントで 2 要素認証（MFA）が有効な場合、
ターミナルに `Garmin MFA コードを入力してください:` と表示される。
Authenticator アプリの 6 桁コードを入力すること。
2 回目以降は `~/.garth/` にキャッシュされたトークンで自動ログインする。

#### 出力 JSON の構造

```json
{
  "date": "2026-07-04",
  "count": 1,
  "runs": [
    {
      "activityId": 12345678,
      "activityName": "Morning Run",
      "startTimeLocal": "2026-07-04 04:20:00",
      "distanceKm": 18.01,
      "durationStr": "1:39:04",
      "durationSec": 5944,
      "avgPaceStr": "5'30\"",
      "avgPaceSecPerKm": 330,
      "avgHR": 148,
      "maxHR": 168,
      "calories": 1124,
      "elevationGain": 45.0,
      "activityTypeKey": "running",
      "activityTypeJp": "ランニング"
    }
  ]
}
```

#### エラー時の対応

| error 値 | 対応 |
|---|---|
| `missing_packages` | Step 2 のインストールを実行 |
| `credentials_not_set` | Step 3 の認証情報設定を案内 |
| `invalid_date` | 日付フォーマットを修正して再実行 |
| その他 | エラー全文をユーザーに表示して原因を伝える |

#### 複数アクティビティが返ってきた場合

`count >= 2` のとき（朝ランと夜ランなど）:
- 距離・時間が最も大きいアクティビティを主アクティビティとして採用
- 「この日のアクティビティが2件ありました。合計 X km で投稿文を作成しますか？それとも最長の Y km を使いますか？」と確認する

#### アクティビティ 0 件の場合

`count === 0` のとき:
```
{YYYY-MM-DD} のランニング記録が Garmin Connect に見つかりませんでした。

考えられる原因:
1. その日は休養日だった
2. 同期がまだ完了していない（Garmin デバイスをスマホに近づけてください）
3. 別の種目（ウォーキング等）として記録されている可能性

/garmin-post（スクリーンショット版）に切り替えますか？
```

### Step 5 — Day 番号を計算する

```bash
echo $(( ( $(date -d "{YYYY-MM-DD}" +%s) - $(date -d "2026-06-12" +%s) ) / 86400 + 1 ))
```

- `DAY1 = 2026-06-12`（固定）
- 結果が 0 以下 → 「計画開始日（2026-06-12）より前の日付です」と伝える
- 結果が 165 以上 → 「レース日（2026-11-22、Day 164）を超えています」と伝える

### Step 6 — 種別を判定する

取得データの `avgPaceSecPerKm` と `distanceKm` から自動判定する：

| 条件 | 種別 |
|---|---|
| distanceKm >= 25 | ロング走 |
| distanceKm >= 18 かつ pace <= 360 | ロング走 |
| pace <= 255 (4'15"/km 以下) | インターバル / MP走 |
| pace <= 279 (4'39"/km 以下) | MP走 |
| pace <= 299 (4'59"/km 以下) | テンポ走 / 閾値走 |
| activityTypeKey == "treadmill_running" | トレッドミル＋上記ペース帯を付記 |
| それ以外 | イージー |

距離・ペースから判定が曖昧な場合（例: 12km・5'00"/km）はユーザーに確認する。

### Step 7 — 追加情報を確認する（必要なもののみ）

API データで取得できないのは以下のみ。既知ならスキップ。

```
体重（任意）: ___kg（前日比 ±___kg、スタート100kgからの累計 -___kg）
睡眠（任意）: ___h・睡眠スコア___pt（Garmin「睡眠」タブのスコア、またはBody Battery起床時値）
メモ（任意）: ___（省略可）
```

### Step 8 — Threads 投稿文を生成する

#### テンプレート

```
Day{DAY}/164 🏃{distanceKm}km＋{種別}
{体重行}
{睡眠行}
{distanceKm}km・{avgPaceStr}/km・心拍{avgHR}bpm・{durationStr}
→{仕組みがどう機能したか1行}
```

**体重行**:
- 体重あり: `体重{X}kg（前日比{±X}kg／スタートから累計{-X}kg）`
- 体重なし: 行ごと省略

**睡眠行**:
- 睡眠あり: `睡眠{X}h・スコア{N}pt`
- 睡眠スコアのみ: `睡眠スコア{N}pt`
- 睡眠情報なし: 行ごと省略

**「仕組みがどう機能したか」の選択ルール**:

API から取得できる情報（time, pace, HR, distance）から推察し、
以下の if-then ルールのうち最も当てはまるものを1文で書く:

```
参照候補:
- 04:00 起床ルーティンが機能した（startTimeLocal が 03:30-04:30）
- 睡眠優先ルール → ポイント練をイージーに格下げした（pace がイージー帯）
- no_debt_rule: 前日ゼロでも上乗せせず計画通りの距離にした
- 帰国後プロトコル通り・前回最長(15km)以下に抑えた（7/4 以前の帰国後ラン）
- カーボ準備ルール（前夜バナナ＋プロテイン）で心拍が安定した
- 出張中ブランク後の初回再開ルール通りイージーから始めた
- 該当なし → 「if-thenルール通りの朝ルーティンが機能した」
```

ユーザーのメモがあればそれを優先する。

**文字数チェック**: 500 字を超えたら `状況1行` を短縮する。

#### 完成例（7/4・18km ブランク確認テスト）

```
Day 23/164 🏃18.0km＋ロング走
体重68.5kg（前日比-0.3kg／スタートから累計-31.5kg）
睡眠7.0h・スコア82pt
18.0km・5'31"/km・心拍152bpm・1:39:22
→帰国7日後の18kmブランク確認テスト。6/28-7/3のプロトコル完走。7/5のつくばエントリーに向け退路を断った。
```

### Step 9 — Substack 週次ログ行を生成する

```
| {YYYY-MM-DD} | {distanceKm}km | {avgPaceStr}/km | {avgHR}bpm | {種別} | {体重}kg | 睡眠{X}h/{N}pt | {メモ or activityName} |
```

例:
```
| 2026-07-04 | 18.0km | 5'31"/km | 152bpm | ロング走 | 68.5kg | 睡眠7.0h/82pt | ブランク確認テスト・違和感なし |
```

### Step 10 — 出力フォーマット

````
---
### 📱 Threads 投稿文（{文字数}文字）

```
[投稿文]
```

---
### 📓 Substack 週次ログ行

```
[ログ行]
```

---
### 📊 Garmin データ確認

| 項目 | 取得値 |
|---|---|
| 日付 | {date} |
| アクティビティ名 | {activityName} |
| 距離 | {distanceKm}km |
| 平均ペース | {avgPaceStr}/km |
| 平均心拍 | {avgHR}bpm |
| 最大心拍 | {maxHR}bpm |
| 所要時間 | {durationStr} |
| 消費カロリー | {calories}kcal |
| 高度上昇 | {elevationGain}m |
| 種別（判定） | {種別} |
| Day番号 | Day{DAY}/164 |
````

---

## 初回セットアップ手順（README）

```bash
# 1. Python パッケージをインストール
pip install garminconnect garth

# 2. .env.local に認証情報を追加
echo "GARMIN_EMAIL=your@email.com"    >> .env.local
echo "GARMIN_PASSWORD=yourpassword"   >> .env.local

# 3. 動作確認（今日の日付でテスト）
python3 scripts/garmin_fetch.py $(date +%Y-%m-%d)
# → 初回のみ MFA コード入力が求められる場合あり
# → 成功すると JSON が出力される
# → 2回目以降は ~/.garth/ のトークンで自動ログイン
```

---

## 注意事項

- **パスワードはコードに直書きしない**。必ず `.env.local` または環境変数経由で渡す
- `.env.local` は `.gitignore` に含まれているため Git にコミットされない
- `~/.garth/` のトークンは1年間有効。期限切れ後は再ログインが必要
- Garmin Connect のサーバー仕様変更により API が一時的に使えなくなることがある。その場合は `/garmin-post`（スクリーンショット版）で代替する
- 勝田の教訓：計画された距離・強度を超えた文章は書かない
