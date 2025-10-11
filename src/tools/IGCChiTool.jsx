import React from 'react';

const csvExample = `sample,gammaD_mJm2,gammaSP_mJm2,deltaP_est,deltaH_est,counterpart_deltaD,counterpart_deltaP,counterpart_deltaH
PHA_S1000P,28,10,5,8,17.2,5,8
PHA_A1000P,26,12,6,8,17.2,5,8
`;

const downloadTextFile = (filename, content, type = 'text/csv') => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
};

const IGCChiTool = () => {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">IGC → χ (Python)</h1>
      <p className="max-w-3xl text-sm sm:text-base text-gray-700">
        Batch-convert inverse gas chromatography (IGC) measurements into Hansen solubility distances and Flory–Huggins χ values.
        Use the template below, feed it to the included Python utility, and archive the result for lab notebooks or reporting.
      </p>

      <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-2">
        <h2 className="text-base font-medium">1) CSV template</h2>
        <p className="text-sm text-gray-600">
          Prefill with your IGC outputs. Hansen counterparts (δD/δP/δH) correspond to the blend partner or reference polymer.
        </p>
        <button
          type="button"
          className="inline-flex w-full max-w-xs items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-900 shadow-sm transition hover:bg-gray-100"
          onClick={() => downloadTextFile('igc_inputs_example.csv', csvExample)}
        >
          Download igc_inputs_example.csv
        </button>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-2 text-sm text-gray-700">
        <h2 className="text-base font-medium">2) Python usage</h2>
        <pre className="whitespace-pre-wrap rounded-md bg-gray-50 p-3 text-xs text-gray-800">
{`# Local run
python igc_chi.py --csv igc_inputs.csv --temp_c 120 --vbar_cm3mol 100 --out result.csv

# Result columns
# sample, Ra, chi, verdict

# Notes
# δD ≈ sqrt(γD) is a simplification. Calibrate with experimental references when possible.
`}
        </pre>
        <p>
          The helper script classifies miscibility windows with χ thresholds of 0.02 (likely miscible) and 0.05 (immiscible risk).
        </p>
      </div>

      <p className="text-xs text-gray-500">
        Adjust δP/δH estimates from literature or regressions if lab-grade calibration data are available.
      </p>
    </div>
  );
};

export default IGCChiTool;
