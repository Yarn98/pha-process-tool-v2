import React from 'react';
import { createBrowserRouter } from 'react-router-dom';
import App from './App';
import PHAPropertiesDashboard from './components/PHAPropertiesDashboard';
import ChiDeltaDashboard from './tools/ChiDeltaDashboard';
import ExcelToolkit from './tools/ExcelToolkit';
import IGCChiTool from './tools/IGCChiTool';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />, 
    children: [
      {
        index: true,
        element: <PHAPropertiesDashboard />,
      },
      {
        path: 'tools/chi-delta',
        element: <ChiDeltaDashboard />,
      },
      {
        path: 'tools/excel-toolkit',
        element: <ExcelToolkit />,
      },
      {
        path: 'tools/igc-chi',
        element: <IGCChiTool />,
      },
    ],
  },
]);

export default router;
