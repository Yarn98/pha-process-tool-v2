# -*- coding: utf-8 -*-
"""
IGC → Hansen δ → χ 계산 스크립트
사용법:
  python igc_chi.py --csv igc_inputs.csv --temp_c 120 --vbar_cm3mol 100 --out result.csv
CSV 컬럼(예시):
  sample, gammaD_mJm2, gammaSP_mJm2, deltaP_est, deltaH_est, counterpart_deltaD, counterpart_deltaP, counterpart_deltaH
"""
import argparse
import csv
import math

R = 8.314  # J/mol/K

def chi_from_hansen(vbar_cm3mol, T_K, deltaD, deltaP, deltaH,
                    c_deltaD, c_deltaP, c_deltaH):
    """Calculate Hansen distance (Ra) and Flory–Huggins χ."""
    # Hansen Ra^2 = 4(ΔδD)^2 + (ΔδP)^2 + (ΔδH)^2
    ra_squared = 4 * (deltaD - c_deltaD) ** 2 + (deltaP - c_deltaP) ** 2 + (deltaH - c_deltaH) ** 2
    ra = math.sqrt(ra_squared)
    # χ ≈ (V̄/RT) * Ra^2; unit consistency: δ (MPa^0.5), V̄(cm³/mol) ⇒ 1 cm³·MPa = 1 J
    chi = (vbar_cm3mol / (R * T_K)) * ra_squared
    return ra, chi

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--csv", required=True, help="Input CSV with IGC-derived surface energy values")
    parser.add_argument("--temp_c", type=float, required=True, help="Processing temperature in °C")
    parser.add_argument("--vbar_cm3mol", type=float, required=True, help="Molar volume (cm³/mol)")
    parser.add_argument("--out", default="igc_chi_result.csv", help="Output CSV path")
    args = parser.parse_args()

    temperature_kelvin = args.temp_c + 273.15
    output_rows = []

    with open(args.csv, "r", encoding="utf-8-sig") as handle:
        reader = csv.DictReader(handle)
        for row in reader:
            # δD 추정: δD ≈ sqrt(γD) (단위 혼재 단순화 근사; 실측 보정 권장)
            delta_d = math.sqrt(float(row["gammaD_mJm2"]))
            delta_p = float(row["deltaP_est"])
            delta_h = float(row["deltaH_est"])
            counterpart_d = float(row["counterpart_deltaD"])
            counterpart_p = float(row["counterpart_deltaP"])
            counterpart_h = float(row["counterpart_deltaH"])

            ra, chi = chi_from_hansen(
                args.vbar_cm3mol,
                temperature_kelvin,
                delta_d,
                delta_p,
                delta_h,
                counterpart_d,
                counterpart_p,
                counterpart_h,
            )

            if chi < 0.02:
                verdict = "Likely miscible"
            elif chi < 0.05:
                verdict = "Limited miscibility"
            else:
                verdict = "Immiscible"

            output_rows.append(
                {
                  "sample": row.get("sample", ""),
                  "Ra": f"{ra:.3f}",
                  "chi": f"{chi:.4f}",
                  "verdict": verdict,
                }
            )

    with open(args.out, "w", newline="", encoding="utf-8-sig") as handle:
        writer = csv.DictWriter(handle, fieldnames=["sample", "Ra", "chi", "verdict"])
        writer.writeheader()
        writer.writerows(output_rows)

    print(f"Saved: {args.out}")

if __name__ == "__main__":
    main()
