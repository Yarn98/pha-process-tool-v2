# -*- coding: utf-8 -*-
"""
analyze_doe_flash.py
현장 DOE 결과를 바탕으로 플래시 최소화 + 용접선 강도 제약 최적화를 수행.
사용: python analyze_doe_flash.py doe_injection_flash_template.csv
출력: results/recommendations.txt, results/model_report.json, results/clean_data.csv
"""

import sys, json, os
import numpy as np
import pandas as pd
from pathlib import Path
from itertools import product
from sklearn.preprocessing import StandardScaler, OneHotEncoder, PolynomialFeatures
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LassoCV, LinearRegression
from sklearn.metrics import r2_score, mean_absolute_error
from scipy.optimize import brute

NUMERIC = [
    "gate_width_mm","gate_thickness_mm","T_mold_C","nozzle_C","zone1_C","zone2_C","zone3_C","zone4_C",
    "shot_size_cm3","injection_speed_mm3s","pack_time_s","pack_pressure_bar","cool_time_s","clamp_ton",
    "delta_Tmold_C","ambient_RH_pct"
]
CATEGORICAL = ["material","gate_type"]
RESP_FLASH = "flash_um"
RESP_WELD  = "weld_strength_MPa"
RESP_PINJ  = "max_inj_pressure_bar"

SAFE_BOUNDS = {
    "T_mold_C": (20, 60),
    "injection_speed_mm3s": (30, 100),
    "pack_time_s": (1.8, 4.0),
    "pack_pressure_bar": (350, 520),
    "cool_time_s": (5.5, 8.5)
}

WELD_MIN = None   # 필요 시 CLI로 변경 가능
PINJ_MAX = None   # 필요 시 CLI로 변경 가능

def load_clean(path):
    df = pd.read_csv(path)
    # 기본 전처리: 결측 응답 제거
    df = df.dropna(subset=[RESP_FLASH, RESP_WELD, RESP_PINJ], how="any")
    # 이상치 1차 필터(IQR)
    for y in [RESP_FLASH, RESP_WELD, RESP_PINJ]:
        q1, q3 = df[y].quantile([0.25, 0.75])
        iqr = q3 - q1
        lo, hi = q1 - 1.5*iqr, q3 + 1.5*iqr
        df = df[(df[y] >= lo) & (df[y] <= hi)]
    return df

def build_models(df):
    X = df[NUMERIC + CATEGORICAL]
    y_flash = df[RESP_FLASH].values
    y_weld  = df[RESP_WELD].values
    y_pinj  = df[RESP_PINJ].values

    # 컬럼 변환기 (카테고리 원-핫 + 수치 표준화 + 2차항)
    num_trans = Pipeline([
        ("poly", PolynomialFeatures(degree=2, include_bias=False)),
        ("scaler", StandardScaler())
    ])
    cat_trans = OneHotEncoder(handle_unknown="ignore", sparse_output=False)

    pre = ColumnTransformer([
        ("num", num_trans, NUMERIC),
        ("cat", cat_trans, CATEGORICAL)
    ])

    # LASSO로 변수선택, 이후 선형회귀로 계수 안정화
    model_lasso = Pipeline([
        ("pre", pre),
        ("lasso", LassoCV(cv=5, n_alphas=50, random_state=42, max_iter=10000))
    ])
    model_lr = Pipeline([
        ("pre", pre),
        ("lr", LinearRegression())
    ])

    model_lasso.fit(X, y_flash)
    model_lr.fit(X, y_flash)
    yhat = model_lr.predict(X)
    r2 = r2_score(y_flash, yhat)
    mae = mean_absolute_error(y_flash, yhat)

    # 보조 응답 모델(제약 확인용)
    m_weld = Pipeline([("pre", pre), ("lr", LinearRegression())])
    m_pinj = Pipeline([("pre", pre), ("lr", LinearRegression())])
    m_weld.fit(X, y_weld); m_pinj.fit(X, y_pinj)

    report = {
        "r2_flash": float(r2),
        "mae_flash": float(mae),
        "n_samples": int(len(df)),
        "alphas": list(model_lasso.named_steps["lasso"].alphas_.astype(float)),
        "alpha_best": float(model_lasso.named_steps["lasso"].alpha_)
    }
    return model_lr, m_weld, m_pinj, report

def grid_bounds_from_data(df):
    b = {}
    for k in SAFE_BOUNDS:
        lo = max(SAFE_BOUNDS[k][0], float(np.floor(df[k].min() if k in df else SAFE_BOUNDS[k][0])))
        hi = min(SAFE_BOUNDS[k][1], float(np.ceil(df[k].max() if k in df else SAFE_BOUNDS[k][1])))
        if lo >= hi: lo, hi = SAFE_BOUNDS[k]
        b[k] = (lo, hi)
    return b

def predict_triplet(models, row):
    m_flash, m_weld, m_pinj = models
    X = pd.DataFrame([row])
    return float(m_flash.predict(X)[0]), float(m_weld.predict(X)[0]), float(m_pinj.predict(X)[0])

def optimize(df, models, material="S1000P", gate_type="fan", weld_min=None, pinj_max=None):
    b = grid_bounds_from_data(df)
    weld_min = weld_min if weld_min is not None else df[RESP_WELD].quantile(0.5)   # 중앙값 이상
    pinj_max = pinj_max if pinj_max is not None else df[RESP_PINJ].quantile(0.9)   # 상위 10% 이하

    ranges = (
        slice(b["T_mold_C"][0], b["T_mold_C"][1], 1.0),
        slice(b["injection_speed_mm3s"][0], b["injection_speed_mm3s"][1], 2.0),
        slice(b["pack_time_s"][0], b["pack_time_s"][1], 0.1),
        slice(b["pack_pressure_bar"][0], b["pack_pressure_bar"][1], 5.0),
        slice(b["cool_time_s"][0], b["cool_time_s"][1], 0.1),
    )

    keys = ["T_mold_C","injection_speed_mm3s","pack_time_s","pack_pressure_bar","cool_time_s"]

    def objective(v):
        cand = {k: float(val) for k, val in zip(keys, v)}
        # 고정 파라미터(최근 실험값의 중앙값 사용)
        base = df.median(numeric_only=True).to_dict()
        fixed = {
            "material": material,
            "gate_type": gate_type,
            "gate_width_mm": float(df["gate_width_mm"].median()),
            "gate_thickness_mm": float(df["gate_thickness_mm"].median()),
            "nozzle_C": float(df["nozzle_C"].median()),
            "zone1_C": float(df["zone1_C"].median()),
            "zone2_C": float(df["zone2_C"].median()),
            "zone3_C": float(df["zone3_C"].median()),
            "zone4_C": float(df["zone4_C"].median()),
            "shot_size_cm3": float(df["shot_size_cm3"].median()),
            "clamp_ton": float(df["clamp_ton"].median()),
            "delta_Tmold_C": float(df["delta_Tmold_C"].median()),
            "ambient_RH_pct": float(df["ambient_RH_pct"].median())
        }
        row = {**fixed, **cand}
        y_flash, y_weld, y_pinj = predict_triplet(models, row)
        # 제약 위반엔 큰 패널티
        penalty = 0.0
        if y_weld < weld_min: penalty += (weld_min - y_weld)*100.0
        if y_pinj > pinj_max: penalty += (y_pinj - pinj_max)*0.5
        return y_flash + penalty

    best_v = brute(objective, ranges, finish=None)
    best = {k: float(val) for k, val in zip(keys, best_v)}
    fixed = {
        "material": material, "gate_type": gate_type,
        "gate_width_mm": float(df["gate_width_mm"].median()),
        "gate_thickness_mm": float(df["gate_thickness_mm"].median()),
        "nozzle_C": float(df["nozzle_C"].median()),
        "zone1_C": float(df["zone1_C"].median()),
        "zone2_C": float(df["zone2_C"].median()),
        "zone3_C": float(df["zone3_C"].median()),
        "zone4_C": float(df["zone4_C"].median()),
        "shot_size_cm3": float(df["shot_size_cm3"].median()),
        "clamp_ton": float(df["clamp_ton"].median()),
        "delta_Tmold_C": float(df["delta_Tmold_C"].median()),
        "ambient_RH_pct": float(df["ambient_RH_pct"].median())
    }
    row = {**fixed, **best}
    y_flash, y_weld, y_pinj = predict_triplet(models, row)
    return row, {"flash_um": y_flash, "weld_strength_MPa": y_weld, "max_inj_pressure_bar": y_pinj,
                 "weld_min": weld_min, "pinj_max": pinj_max}

def main():
    if len(sys.argv) < 2:
        print("Usage: python analyze_doe_flash.py <csv_path>")
        sys.exit(1)
    src = Path(sys.argv[1])
    outdir = Path("results"); outdir.mkdir(exist_ok=True)

    df = load_clean(src)
    df.to_csv(outdir/"clean_data.csv", index=False)

    m_flash, m_weld, m_pinj, report = build_models(df)
    rec_row, rec_pred = optimize(df, (m_flash, m_weld, m_pinj))

    with open(outdir/"model_report.json", "w", encoding="utf-8") as f:
        json.dump({"report": report, "recommendation_inputs": rec_row, "prediction": rec_pred}, f, ensure_ascii=False, indent=2)

    lines = []
    lines.append("# DOE Flash 최적화 권장 세팅")
    for k in ["T_mold_C","injection_speed_mm3s","pack_time_s","pack_pressure_bar","cool_time_s"]:
        lines.append(f"- {k}: {rec_row[k]:.3f}")
    lines.append("")
    lines.append(f"예상 플래시: {rec_pred['flash_um']:.2f} µm")
    lines.append(f"용접선 강도(예상): {rec_pred['weld_strength_MPa']:.2f} MPa (제약 하한 {rec_pred['weld_min']:.2f})")
    lines.append(f"최대 사출압(예상): {rec_pred['max_inj_pressure_bar']:.0f} bar (제약 상한 {rec_pred['pinj_max']:.0f})")
    lines.append("")
    lines.append("모델 적합도:")
    lines.append(f"- Flash R²: {report['r2_flash']:.3f}, MAE: {report['mae_flash']:.2f} µm, n={report['n_samples']}")

    with open(outdir/"recommendations.txt","w",encoding="utf-8") as f:
        f.write("\n".join(lines))

    print("\n".join(lines))
    print("\n결과 파일:", str(outdir/"recommendations.txt"), str(outdir/"model_report.json"), str(outdir/"clean_data.csv"))

if __name__ == "__main__":
    main()
