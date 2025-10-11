import React from 'react';

const ExcelToolkit = () => {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Excel Toolkit</h1>
      <p className="max-w-2xl text-sm sm:text-base text-gray-700">
        Download the workbook that bundles blend χ–δ estimators, IGC→χ conversions, and a quick crystallization planner. Upload
        the template to your preferred cloud storage or keep it locally for offline use.
      </p>
      <a
        className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-900 shadow-sm transition hover:bg-gray-100"
        href="/PHA_Blend_Chi_Delta_IGC_DSC_Toolkit.xlsx"
        download
      >
        Download Excel
      </a>
      <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-xs text-gray-600">
        <p className="mb-2 font-medium text-gray-700">Deployment tip</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Add <code>public/PHA_Blend_Chi_Delta_IGC_DSC_Toolkit.xlsx</code> to the repository so static hosts can serve it.</li>
          <li>
            For single-page deployments (Netlify, Cloudflare Pages), ensure <code>public/_redirects</code> contains
            <code>/* /index.html 200</code> so deep links to the tool routes resolve.
          </li>
        </ul>
      </div>
    </div>
  );
};

export default ExcelToolkit;
