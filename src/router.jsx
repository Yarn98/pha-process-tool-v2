import React from 'react';
import { Navigate, createBrowserRouter } from 'react-router-dom';
import App from './App';
import PHAPropertiesDashboard from './components/PHAPropertiesDashboard';
import ChiDeltaDashboard from './tools/ChiDeltaDashboard';
import ExcelToolkit from './tools/ExcelToolkit';
import IGCChiTool from './tools/IGCChiTool';
import ProcessConditions from './pages/ProcessConditions';
import Troubleshooting from './pages/Troubleshooting';
import History from './pages/History';
import Analysis from './pages/Analysis';
import Settings from './pages/Settings';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        index: true,
        element: <Navigate to="/process" replace />,
      },
      {
        path: 'process',
        element: <ProcessConditions />,
      },
      {
        path: 'troubleshooting',
        element: <Troubleshooting />,
      },
      {
        path: 'history',
        element: <History />,
      },
      {
        path: 'analysis',
        element: <Analysis />,
      },
      {
        path: 'settings',
        element: <Settings />,
      },
      {
        path: 'pha',
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
      {
        path: '*',
        element: <Navigate to="/process" replace />,
      },
    ],
  },
]);

export default router;
