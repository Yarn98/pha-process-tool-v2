import React, { useMemo, useState } from 'react';

const R = 8.314; // J/mol/K

const ChiDeltaDashboard = () => {
  const [inputs, setInputs] = useState({
    tempC: 170,
    vbar: 100,
    d1: 18,
    p1: 6,
    h1: 7,
    d2: 17.2,
    p2: 5,
    h2: 8,
    useHansen: true,
    Tc0: 95,
    wt: 0.15,
    kN: 12,
    kChi: 60,
    tHalf0: 4,
    accel: 0.85,
  });

  const temperatureKelvin = useMemo(() => inputs.tempC + 273.15, [inputs.tempC]);

  const deltaT1 = Math.sqrt(inputs.d1 ** 2 + inputs.p1 ** 2 + inputs.h1 ** 2);
  const deltaT2 = Math.sqrt(inputs.d2 ** 2 + inputs.p2 ** 2 + inputs.h2 ** 2);
  const deltaDeltaT = Math.abs(deltaT2 - deltaT1);
  const ra = Math.sqrt(
    4 * (inputs.d1 - inputs.d2) ** 2 +
      (inputs.p1 - inputs.p2) ** 2 +
      (inputs.h1 - inputs.h2) ** 2
  );

  const chiHildebrand = (inputs.vbar / (R * temperatureKelvin)) * deltaDeltaT ** 2;
  const chiHansen = (inputs.vbar / (R * temperatureKelvin)) * ra ** 2;
  const selectedChi = inputs.useHansen ? chiHansen : chiHildebrand;

  const miscibilityVerdict =
    selectedChi < 0.02
      ? 'Likely miscible (single-phase)'
      : selectedChi < 0.05
      ? 'Limited miscibility / compatibilizer helpful'
      : 'Immiscible (phase-separated)';

  const tcPredicted = inputs.Tc0 + inputs.kN * inputs.wt - inputs.kChi * inputs.wt;
  const tHalfPredicted = inputs.tHalf0 * inputs.accel ** inputs.wt;

  const handleNumberChange = (key) => (event) => {
    const value = parseFloat(event.target.value);
    setInputs((previous) => ({
      ...previous,
      [key]: Number.isNaN(value) ? 0 : value,
    }));
  };

  const handleBooleanChange = (key) => (event) => {
    setInputs((previous) => ({
      ...previous,
      [key]: event.target.checked,
    }));
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">χ–δ Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-3">
          <h2 className="text-lg font-medium">Inputs</h2>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium">Temperature (°C)</span>
              <input
                type="number"
                className="input"
                value={inputs.tempC}
                onChange={handleNumberChange('tempC')}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium">V̄ (cm³/mol)</span>
              <input
                type="number"
                className="input"
                value={inputs.vbar}
                onChange={handleNumberChange('vbar')}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium">Polymer 1 δD</span>
              <input
                type="number"
                className="input"
                value={inputs.d1}
                onChange={handleNumberChange('d1')}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium">Polymer 1 δP</span>
              <input
                type="number"
                className="input"
                value={inputs.p1}
                onChange={handleNumberChange('p1')}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium">Polymer 1 δH</span>
              <input
                type="number"
                className="input"
                value={inputs.h1}
                onChange={handleNumberChange('h1')}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium">Polymer 2 δD</span>
              <input
                type="number"
                className="input"
                value={inputs.d2}
                onChange={handleNumberChange('d2')}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium">Polymer 2 δP</span>
              <input
                type="number"
                className="input"
                value={inputs.p2}
                onChange={handleNumberChange('p2')}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium">Polymer 2 δH</span>
              <input
                type="number"
                className="input"
                value={inputs.h2}
                onChange={handleNumberChange('h2')}
              />
            </label>
            <label className="col-span-2 flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={inputs.useHansen}
                onChange={handleBooleanChange('useHansen')}
              />
              Use Hansen 3D (Ra)
            </label>
          </div>
        </div>
        <div className="space-y-4">
          <h2 className="text-lg font-medium">Results</h2>
          <div className="rounded-lg border border-gray-200 p-4 space-y-1 text-sm sm:text-base">
            <p>
              T (K): <strong>{temperatureKelvin.toFixed(2)}</strong>
            </p>
            <p>
              ΔδT (Hildebrand): <strong>{deltaDeltaT.toFixed(3)}</strong>
            </p>
            <p>
              Ra (Hansen): <strong>{ra.toFixed(3)}</strong>
            </p>
            <hr className="my-2" />
            <p>
              χ (Hildebrand): <strong>{chiHildebrand.toFixed(4)}</strong>
            </p>
            <p>
              χ (Hansen): <strong>{chiHansen.toFixed(4)}</strong>
            </p>
            <p>
              Selected χ: <strong>{selectedChi.toFixed(4)}</strong>
            </p>
            <p>
              Miscibility: <strong>{miscibilityVerdict}</strong>
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 p-4">
            <h3 className="mb-2 text-base font-medium">Crystallization quick planner (optional)</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <label className="flex flex-col gap-1">
                <span>Tc0 (°C)</span>
                <input
                  type="number"
                  className="input"
                  value={inputs.Tc0}
                  onChange={handleNumberChange('Tc0')}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span>wt%</span>
                <input
                  type="number"
                  className="input"
                  value={inputs.wt}
                  onChange={handleNumberChange('wt')}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span>kₙ</span>
                <input
                  type="number"
                  className="input"
                  value={inputs.kN}
                  onChange={handleNumberChange('kN')}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span>kχ</span>
                <input
                  type="number"
                  className="input"
                  value={inputs.kChi}
                  onChange={handleNumberChange('kChi')}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span>t½ neat (min)</span>
                <input
                  type="number"
                  className="input"
                  value={inputs.tHalf0}
                  onChange={handleNumberChange('tHalf0')}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span>accel factor</span>
                <input
                  type="number"
                  step="0.01"
                  className="input"
                  value={inputs.accel}
                  onChange={handleNumberChange('accel')}
                />
              </label>
            </div>
            <p className="mt-3 text-sm">
              Tc(pred): <strong>{tcPredicted.toFixed(2)} °C</strong>
            </p>
            <p className="text-sm">
              t½(pred): <strong>{tHalfPredicted.toFixed(2)} min</strong>
            </p>
          </div>
        </div>
      </div>
      <p className="text-xs text-gray-500">
        χ thresholds are empirical heuristics. Actual miscibility and crystallization behavior depend on molecular weight,
        cooling profile, interfacial nucleation, and additives.
      </p>
      <style>{`.input{width:100%;border:1px solid #d1d5db;border-radius:0.75rem;padding:0.6rem;min-height:44px}`}</style>
    </div>
  );
};

export default ChiDeltaDashboard;
