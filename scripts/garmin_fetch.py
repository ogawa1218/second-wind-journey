#!/usr/bin/env python3
"""
Garmin Connect から指定日のランニングデータを取得して JSON で出力する。

使い方:
  python scripts/garmin_fetch.py YYYY-MM-DD

環境変数（.env.local または export で設定）:
  GARMIN_EMAIL     - Garmin Connect のログインメール
  GARMIN_PASSWORD  - Garmin Connect のパスワード

初回実行時のみ MFA コードの入力が必要な場合あり。
認証トークンは ~/.garth/ にキャッシュされ、以降は自動ログイン。
"""

import json
import os
import sys
from pathlib import Path

# ─── 依存チェック ──────────────────────────────────────────────────────────────

def check_deps():
    missing = []
    try:
        import garminconnect  # noqa
    except ImportError:
        missing.append("garminconnect")
    try:
        import garth  # noqa
    except ImportError:
        missing.append("garth")

    if missing:
        print(json.dumps({
            "error": "missing_packages",
            "packages": missing,
            "fix": f"pip install {' '.join(missing)}",
        }, ensure_ascii=False))
        sys.exit(1)

check_deps()

from garminconnect import Garmin, GarminConnectAuthenticationError  # noqa

# ─── 設定 ─────────────────────────────────────────────────────────────────────

PROJECT_ROOT = Path(__file__).parent.parent
TOKENSTORE   = Path.home() / ".garth"
ENV_FILE     = PROJECT_ROOT / ".env.local"


def load_env():
    """環境変数を .env.local から補完する（export 済みなら上書きしない）"""
    if not ENV_FILE.exists():
        return
    for line in ENV_FILE.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, val = line.partition("=")
        key = key.strip()
        val = val.strip().strip('"').strip("'")
        if key and key not in os.environ:
            os.environ[key] = val


def get_credentials():
    load_env()
    email    = os.environ.get("GARMIN_EMAIL", "").strip()
    password = os.environ.get("GARMIN_PASSWORD", "").strip()
    if not email or not password:
        print(json.dumps({
            "error": "credentials_not_set",
            "message": ".env.local に GARMIN_EMAIL と GARMIN_PASSWORD を設定してください",
        }, ensure_ascii=False))
        sys.exit(1)
    return email, password


# ─── Garmin Connect 認証 ──────────────────────────────────────────────────────

def get_api(email, password):
    """トークンキャッシュを優先し、期限切れなら再ログインする"""
    api = Garmin(
        email=email,
        password=password,
        is_cn=False,
        prompt_mfa=_mfa_prompt,
    )

    if TOKENSTORE.exists():
        try:
            api.login(tokenstore=str(TOKENSTORE))
            return api
        except GarminConnectAuthenticationError:
            pass  # トークン期限切れ → 再ログイン
        except Exception:
            pass

    # 初回ログイン（MFA が必要な場合は _mfa_prompt が呼ばれる）
    api.login()
    api.garth.dump(str(TOKENSTORE))
    return api


def _mfa_prompt():
    """初回 MFA（TOTP）入力プロンプト"""
    sys.stderr.write("Garmin MFA コードを入力してください: ")
    sys.stderr.flush()
    return input()


# ─── データ取得・変換 ──────────────────────────────────────────────────────────

def fetch_runs(api, date_str: str) -> list[dict]:
    """
    指定日（YYYY-MM-DD）のランニングアクティビティを取得する。
    複数アクティビティ（朝夜ラン等）がある場合は全件返す。
    """
    try:
        activities = api.get_activities_by_date(date_str, date_str, "running")
    except Exception as e:
        raise RuntimeError(f"アクティビティ取得エラー: {e}") from e

    results = []
    for act in (activities or []):
        results.append(_parse_activity(act))

    return results


def _parse_activity(act: dict) -> dict:
    # 距離 (m → km)
    distance_km = round((act.get("distance") or 0) / 1000, 2)

    # 所要時間 (秒 → h:mm:ss / mm:ss)
    duration_sec = int(act.get("duration") or 0)
    h  = duration_sec // 3600
    m  = (duration_sec % 3600) // 60
    s  = duration_sec % 60
    duration_str = f"{h}:{m:02d}:{s:02d}" if h > 0 else f"{m}:{s:02d}"

    # 平均ペース (m/s → 分'秒"/km)
    avg_speed_ms = act.get("averageSpeed") or 0
    if avg_speed_ms > 0:
        pace_sec_per_km = round(1000 / avg_speed_ms)
        pace_min = pace_sec_per_km // 60
        pace_sec = pace_sec_per_km % 60
        avg_pace_str = f"{pace_min}'{pace_sec:02d}\""
    else:
        pace_sec_per_km = 0
        avg_pace_str = "—"

    # アクティビティ種別（Garmin のタイプキーを日本語ラベルに変換）
    type_key = act.get("activityType", {}).get("typeKey", "running")
    activity_type_jp = _type_key_to_jp(type_key)

    return {
        "activityId":      act.get("activityId"),
        "activityName":    act.get("activityName", ""),
        "startTimeLocal":  act.get("startTimeLocal", ""),
        "distanceKm":      distance_km,
        "durationStr":     duration_str,
        "durationSec":     duration_sec,
        "avgPaceStr":      avg_pace_str,
        "avgPaceSecPerKm": pace_sec_per_km,
        "avgHR":           act.get("averageHR"),
        "maxHR":           act.get("maxHR"),
        "calories":        int(act.get("calories") or 0),
        "elevationGain":   round(act.get("elevationGain") or 0, 1),
        "activityTypeKey": type_key,
        "activityTypeJp":  activity_type_jp,
    }


def fetch_daily_metrics(api, date_str: str) -> dict:
    """
    その日の体重・睡眠スコア・VO2max を取得する。
    各指標は独立した API エンドポイントから取得し、失敗しても全体は止めない
    （取得できなかった項目は None のまま返す）。
    """
    metrics = {
        "weightKg":   None,
        "sleepScore": None,
        "sleepH":     None,
        "vo2max":     None,
    }

    # ── 体重（体組成 API・グラム単位で返るため kg へ変換） ──
    try:
        body = api.get_body_composition(date_str) or {}
        avg = (body.get("totalAverage") or {})
        w_g = avg.get("weight")
        if w_g:
            metrics["weightKg"] = round(w_g / 1000, 1)
    except Exception:
        pass

    # ── 睡眠スコア・睡眠時間 ──
    try:
        sleep = api.get_sleep_data(date_str) or {}
        dto = (sleep.get("dailySleepDTO") or {})
        scores = (dto.get("sleepScores") or {})
        overall = (scores.get("overall") or {})
        if overall.get("value") is not None:
            metrics["sleepScore"] = int(overall["value"])
        sleep_sec = dto.get("sleepTimeSeconds")
        if sleep_sec:
            metrics["sleepH"] = round(sleep_sec / 3600, 1)
    except Exception:
        pass

    # ── VO2max（最大酸素摂取量・ランニング用 generic 値） ──
    try:
        maxm = api.get_max_metrics(date_str)
        # リスト or dict のどちらでも返り得るので吸収する
        entry = maxm[0] if isinstance(maxm, list) and maxm else maxm
        generic = (entry or {}).get("generic") or {}
        vo2 = (
            generic.get("vo2MaxPreciseValue")
            or generic.get("vo2MaxValue")
        )
        if vo2:
            metrics["vo2max"] = round(float(vo2), 1)
    except Exception:
        pass

    return metrics


def _type_key_to_jp(key: str) -> str:
    mapping = {
        "running":          "ランニング",
        "treadmill_running":"トレッドミル",
        "trail_running":    "トレイルラン",
        "track_running":    "トラック",
        "virtual_run":      "バーチャルラン",
        "indoor_running":   "室内ランニング",
    }
    return mapping.get(key, key)


# ─── エントリポイント ──────────────────────────────────────────────────────────

def main():
    if len(sys.argv) < 2:
        print(json.dumps({
            "error": "usage",
            "message": "使い方: python scripts/garmin_fetch.py YYYY-MM-DD",
        }, ensure_ascii=False))
        sys.exit(1)

    date_str = sys.argv[1].strip()

    # 簡易フォーマット検証
    import re
    if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", date_str):
        print(json.dumps({
            "error": "invalid_date",
            "message": f"日付は YYYY-MM-DD 形式で指定してください（例: 2026-07-04）。入力値: {date_str}",
        }, ensure_ascii=False))
        sys.exit(1)

    email, password = get_credentials()

    try:
        api  = get_api(email, password)
        runs = fetch_runs(api, date_str)
        metrics = fetch_daily_metrics(api, date_str)
    except Exception as e:
        print(json.dumps({"error": str(e)}, ensure_ascii=False))
        sys.exit(1)

    output = {
        "date": date_str,
        "count": len(runs),
        "runs": runs,
        "metrics": metrics,
    }
    print(json.dumps(output, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
