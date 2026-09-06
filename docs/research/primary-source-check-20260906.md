# PHA all-processing: independent source check

Checked on 2026-09-06, initially while the new GPT-6 Pro review was running and extended after its completed answer was retrieved. This is the local source check, separate from the provider's answer. Source PDFs and page renders are preserved locally beside the review pack in `verified-sources/`; Git retains their source URLs and SHA-256 manifest rather than republishing the downloaded documents.

## Manufacturer documents

| Grade / document revision | Source-backed processing facts | Scope and application limits |
|---|---|---|
| [S1000P / 3/2024](https://cjbiomaterials.com/wp-content/uploads/2024/03/CJBMS-TDS-S1000P.pdf) | Drying 80 °C × 5 h; processing table distinguishes feed, compression, melt and nozzle temperatures. MFR <4 g/10 min at 180 °C / 2.16 kg. | General processing document. A named material zone is not automatically a numbered barrel zone. Packed moisture <500 ppm is not a separately validated limit for every compound made from this resin. |
| [A1000P / 02/2024](https://cjbiomaterials.com/wp-content/uploads/2024/03/CJBMS-TDS-A1000P.pdf) | Text specifies <50 °C for 4–6 h; table says 50 °C × 5 h. MFR <5 g/10 min at 165 °C / 5 kg. | Retain the strict bound and disclose the table/text difference. Do not silently raise a dryer to 50 °C. |
| [CA1180P / 03/2023](https://cjbiomaterials.com/wp-content/uploads/2024/03/CJBMS-TDS-CA1180P.pdf) | Text specifies <60 °C and >5 h; table says 60 °C × 5 h. Feed throat 20–40 °C differs from feed zone 155–175 °C. Mold: 40 °C general, 110–120 °C high-performance mode. Injection speed 10–25% is machine-relative. | Injection compound; two reported Tg values (-15 and 60 °C). Izod 63 kJ/m² is unnotched. Purging after PET/PA/HDPE is a staged transition procedure, including high-temperature removal of the previous material before PHA is introduced. Do not replace it with a one-step PETG/HDPE/PLA purge instruction. |
| [CB0104A / June 2026](https://cjbiomaterials.com/wp-content/uploads/2025/03/TDS-CB0104A.pdf) | Drying 75 °C × 4 h; process moisture <400 ppm; mold 60–70 °C; compression/melt/nozzle table 165–175 °C. | scPHA + aPHA + CaCO₃ injection compound, not a pure amorphous-PHA surrogate. Above 190 °C warning belongs to this grade document; a lower temperature alone does not establish acceptable residence time. |
| [CB0400A / June 2026](https://cjbiomaterials.com/wp-content/uploads/2024/11/PHACT%E2%84%A2-CB0400A.pdf) | Drying 75 °C × 4 h; process moisture <400 ppm; solid-conveying and compression/melting stages 165–175 °C, metering 165 °C, all die zones 160–165 °C. Crystallization water bath 70–75 °C. | Extrusion compound with straw and sheet/thermoforming applications. Bath values are not sheet-roll temperatures. Prefer a suitable purge compound for the current resin; the document gives LDPE as its fallback. Empty the barrel before introducing CB0400A. Above 190 °C warning is grade-specific. |

CB0400A and CA1180P page 2 were also rendered and visually checked to confirm the table labels, inequalities and purging sequence.

## Additional documents checked after the Pro answer

| Grade / revision | Source-backed facts and local handling |
|---|---|
| [CA1165A / 3/2025](https://cjbiomaterials.com/wp-content/uploads/2024/04/PHACT%E2%84%A2-CA1165A-TDS.pdf) | Injection compound. Drying 60 °C × 5 h, moisture <400 ppm. Feed throat 25–40 °C; compression/melt 175–185 °C; nozzle 180–185 °C; mold 110–120 °C. Lower mold temperature requires shrinkage verification. MFR 15–20 at 190 °C / 2.16 kg; Tg −15 and 60 °C. Added a distinct record; function zones are not numbered machine zones. |
| [CA1670P / 03/2023](https://cjbiomaterials.com/wp-content/uploads/2024/03/CJBMS-TDS-CA1670P.pdf) | Sheet table p.1: feed 20–40 °C, melt 165–175 °C, mixing/conveying 175–185 °C, nozzle 165–190 °C, roll 25–55 °C. Drying p.3: <60 °C for >5 h. Separate p.2 process is ISBM, not EBM. Keep the mild-temperature yellowing note and sheet storage <40 °C within their source scope. |
| [CA1680P / 03/2023](https://cjbiomaterials.com/wp-content/uploads/2024/03/CJBMS-TDS-CA1680P.pdf) | Sheet stages match the listed CA1670P table, but drying p.3 is **<40 °C for >12 h**. This distinction is implemented. The p.2 ISBM table does not establish EBM settings. The prior app name CA1680 remains a separate, unverified identity. |
| [CA1270P / June 2026](https://cjbiomaterials.com/wp-content/uploads/2024/03/CJBMS-TDS-CA1270P.pdf) | Film compound. Drying 75 °C × 4 h; process moisture <400 ppm; drying-air dew point −35 °C. Feed throat 20–40 °C, solids conveying/melting 165 °C, metering/adapters 170 °C, die 160–165 °C. Blown-film guidance: low-stalk, dual-lip air ring, die gap **1.0–1.5 mm**, BUR **2–3**. Tension-unit conflict remains unresolved; no tension recommendation is implemented. |

The new documents were downloaded directly and text was extracted from those local files. CA1165A pp.1–2, CA1670P/CA1680P pp.1–3 and CA1270P p.2 were rendered and visually inspected. PDF URL upload-folder dates are not treated as document revision dates.

### Resolution of the provider's PDF parsing concern

Pro reported conflicting extracted/rendered temperatures for CB0400A and CA1270P and recommended withholding their replacement temperatures until the discrepancy was checked. Local extraction and rendering from each exact downloaded PDF agreed on the June 2026 temperature tables. Those grade/process-scoped values were therefore accepted. The separate CA1270P tension discrepancy was not resolved by this check.

- CB0400A PDF SHA-256: `3d0c2c99963ee7fb94c68a5c0107d6a5b0c9dc5b1269fc6cbaffefc51857c778`.
- CA1270P PDF SHA-256: `d2a75afb761cc3e50d89830118ccd87cb72bb75efa514c283da4050241ee9ca9`.
- [All nine source hashes](../../output/gpt-pro-review-packs/pha-all-processing-gpt6-pro-20260906/verified-sources/manifest.json).

CA1270P's 28–40 N/mm tension entry does not reconcile with the prior 0.25–0.35 pli entry. Neither reinterpretation nor unit conversion was silently substituted as the intended manufacturer recommendation.

## Measurement and mechanism

- [Metrohm AN-K-049](https://www.metrohm.com/content/dam/metrohm/shared/documents/application-notes/an-k/AN-K-049.pdf) describes water-specific oven Karl Fischer measurement for plastic pellets. Its example method is not a PHA-specific oven-temperature prescription. Validate extraction conditions and interference for the actual grade.
- A drying-air dew point assesses drying-air condition; it does not measure residual pellet water. Loss-on-drying can include non-water volatiles and requires validation against a selective method before applying a ppm-water limit.
- [Polymer Korea research](https://journal.polymer-korea.or.kr/journal/archive/view/4300) separates composition, temperature, time, viscosity and crystallization effects in P(3HB-co-4HB). Its laboratory histories are evidence about mechanisms, not transferable production setpoints. Torque decrease or visible specks alone does not prove molecular-weight loss or crosslinking.
- [SPE film and sheet pinning paper, 1989](https://extrusion.4spe.org/wp-content/uploads/2019/01/Vol16-01-03-Film-and-Sheet-Pinning-Techniques-to-Promote-Heat-Transfer-to-Cooling-Rolls-SPE-Extrusion-Division.pdf): air-knife pinning promotes contact with cooling rolls. The KB was corrected accordingly; it no longer describes delayed roll contact as the air knife's general function.
- [RJG fill-only procedure](https://rjginc.com/establishing-a-fill-only-part-sometimes-easier-said-than-done/): evaluate the fill pattern and mass with compressibility/gate-seal context. A blanket 95% part-mass rule is not used as a sufficient V/P criterion.
- [Coperion feeding/venting discussion](https://www.coperion.com/media/3969/2017_twinscrewextrusion_platsticstechnology_04-2017_en.pdf): mechanisms support conditional fill/feeding/air-escape checks. They do not establish a universal RPM adjustment or a PHA barrel temperature.

## Local findings to compare against the completed Pro answer

1. The same 50:50 interpolation is used for different named blend ratios; process windows cannot be established by this calculation.
2. CB0400A's documented die setting differs from the generic extrusion range; water-bath and cooling-roll values must remain separate.
3. Straw speed-to-temperature regression has no calibration dataset in the repo; the “measured” temperature windows lack trial provenance.
4. Straw capacity geometry needs explicit lane count and an externally validated residence-time input. A geometric limit does not establish crystallization or product acceptance.
5. Compounding feed/side-feed/vent entries at 25 °C are displayed as barrel settings. Composition thresholds select a screw type without equipment or rheology evidence.
6. Troubleshooting mixes diagnosis with unconditional temperature/pressure/RPM increments and universal purge resins. The JSON and embedded offline fallbacks have diverged.

All six local findings were consistent with the completed Pro answer and have been addressed. Additional Pro findings and the final tests are recorded in the [completed all-processing review](../ALL_PROCESSING_REVIEW_20260906.md).
