import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  DEFAULT_GUIDE,
  LABELS,
  PROCESS_PRESETS,
  PROCESS_TYPES,
} from '../modules/process/schema';
import { PARAM_KEYS, statusOf, toCSV, monotonicTempTrend } from '../modules/process/utils';

const STORAGE_KEY = 'pha:v2:process';
const HISTORY_KEY = 'pha:v2:process-history';

const cloneGuide = () => JSON.parse(JSON.stringify(DEFAULT_GUIDE));
const initialCurrent = () => PARAM_KEYS.reduce((acc, key) => ({ ...acc, [key]: '' }), {});

const badgeClass = (status) => {
  if (status === '양호') return 'badge ok';
  if (status === '주의') return 'badge warn';
  return 'badge';
};

const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
};

const ProcessConditions = () => {
  const [lang, setLang] = useState('ko');
  const [uiMode, setUiMode] = useState('pc');
  const [editGuide, setEditGuide] = useState(false);
  const [guide, setGuide] = useState(() => cloneGuide());
  const [form, setForm] = useState(() => ({
    sampleSeries: PROCESS_PRESETS[0]?.id ?? '',
    processType: PROCESS_TYPES[0]?.id ?? '',
    current: initialCurrent(),
    note: '',
  }));
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const savedRaw = window.localStorage.getItem(STORAGE_KEY);
      if (!savedRaw) return;
      const saved = JSON.parse(savedRaw);
      if (saved.form) {
        setForm((prev) => ({
          sampleSeries: saved.form.sampleSeries ?? prev.sampleSeries,
          processType: saved.form.processType ?? prev.processType,
          current: {
            ...initialCurrent(),
            ...(saved.form.current ?? {}),
          },
          note: saved.form.note ?? '',
        }));
      }
      if (saved.guide) {
        setGuide({ ...cloneGuide(), ...saved.guide });
      }
    } catch (error) {
      console.error('Failed to parse saved process conditions', error);
    }
  }, []);

  const analysisMessages = useMemo(() => {
    const messages = [];

    PARAM_KEYS.forEach((key) => {
      if (statusOf(form.current[key], guide[key]) === '주의') {
        messages.push(`${LABELS[key]}: 권장 범위를 벗어났습니다.`);
      }
    });

    const trendOK = monotonicTempTrend([
      form.current.zone1,
      form.current.zone2,
      form.current.zone3,
      form.current.zone4,
    ]);
    if (!trendOK) {
      messages.push('Zone 온도가 후단으로 갈수록 낮아지는 구간이 있습니다. 가열 프로파일을 재점검하세요.');
    }

    if (
      form.processType === 'injection' &&
      form.current.meltP !== '' &&
      Number(form.current.meltP) > guide.meltP[1]
    ) {
      messages.push('용융 압력이 권장 상한을 초과했습니다. 금형 온도/게이트/보압/속도를 함께 최적화하세요.');
    }

    return messages;
  }, [form, guide]);

  const persistState = useCallback(
    (nextForm, nextGuide) => {
      if (typeof window === 'undefined') return;
      const payload = {
        form: {
          ...nextForm,
          current: { ...nextForm.current },
        },
        guide: nextGuide,
        ts: Date.now(),
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    },
    []
  );

  const appendHistory = useCallback(
    (snapshot) => {
      if (typeof window === 'undefined') return;
      try {
        const raw = window.localStorage.getItem(HISTORY_KEY);
        const list = raw ? JSON.parse(raw) : [];
        const nextList = Array.isArray(list) ? [...list, snapshot] : [snapshot];
        window.localStorage.setItem(HISTORY_KEY, JSON.stringify(nextList.slice(-20)));
      } catch (error) {
        console.error('Failed to append history snapshot', error);
      }
    },
    []
  );

  const handleCurrentChange = (key, value) => {
    setForm((prev) => {
      const next = {
        ...prev,
        current: {
          ...prev.current,
          [key]: value,
        },
      };
      persistState(next, guide);
      return next;
    });
  };

  const handleGuideChange = (key, index, value) => {
    const numericValue = value === '' ? '' : Number(value);
    setGuide((prev) => {
      const nextRange = [...(prev[key] ?? [])];
      nextRange[index] = Number.isNaN(numericValue) ? '' : numericValue;
      const defaults = cloneGuide();
      const next = {
        ...prev,
        [key]: nextRange.map((entry, idx) => {
          if (entry === '' || entry === null || Number.isNaN(Number(entry))) {
            return defaults[key][idx];
          }
          return entry;
        }),
      };
      persistState(form, next);
      return next;
    });
  };

  const handleSelectChange = (field, value) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      persistState(next, guide);
      return next;
    });
  };

  const handleNoteChange = (value) => {
    setForm((prev) => {
      const next = { ...prev, note: value };
      persistState(next, guide);
      return next;
    });
  };

  const saveAndAnalyze = () => {
    persistState(form, guide);
    const snapshot = {
      id:
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `snapshot-${Date.now()}`,
      timestamp: Date.now(),
      label: `${form.sampleSeries} • ${form.processType}`,
      sampleSeries: form.sampleSeries,
      processType: form.processType,
      note: form.note,
      parameters: PARAM_KEYS.map((key) => ({
        parameter: LABELS[key],
        current: form.current[key] ?? '',
        rangeMin: guide[key][0],
        rangeMax: guide[key][1],
        status: statusOf(form.current[key], guide[key]),
      })),
    };
    appendHistory(snapshot);
  };

  const exportJSON = () => {
    const blob = new Blob(
      [
        JSON.stringify(
          {
            form,
            guide,
          },
          null,
          2
        ),
      ],
      { type: 'application/json' }
    );
    downloadBlob(blob, 'pha-process.json');
  };

  const exportCSV = () => {
    const rows = PARAM_KEYS.map((key) => ({
      parameter: LABELS[key],
      current: form.current[key] ?? '',
      rangeMin: guide[key][0],
      rangeMax: guide[key][1],
      status: statusOf(form.current[key], guide[key]),
      timestamp: new Date().toISOString(),
    }));
    const blob = new Blob([toCSV(rows)], { type: 'text/csv;charset=utf-8' });
    downloadBlob(blob, 'pha-process.csv');
  };

  const handleImportJSON = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const onFileSelected = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (parsed.form) {
          setForm({
            sampleSeries: parsed.form.sampleSeries ?? form.sampleSeries,
            processType: parsed.form.processType ?? form.processType,
            current: {
              ...initialCurrent(),
              ...(parsed.form.current ?? {}),
            },
            note: parsed.form.note ?? '',
          });
        }
        if (parsed.guide) {
          setGuide({ ...cloneGuide(), ...parsed.guide });
        }
        persistState(
          {
            sampleSeries: parsed.form?.sampleSeries ?? form.sampleSeries,
            processType: parsed.form?.processType ?? form.processType,
            current: {
              ...initialCurrent(),
              ...(parsed.form?.current ?? {}),
            },
            note: parsed.form?.note ?? '',
          },
          { ...cloneGuide(), ...(parsed.guide ?? guide) }
        );
      } catch (error) {
        console.error('JSON import failed', error);
        window.alert('JSON 파일을 읽는 중 오류가 발생했습니다.');
      }
    };
    reader.readAsText(file);
  };

  const resetAll = () => {
    const nextForm = {
      sampleSeries: PROCESS_PRESETS[0]?.id ?? '',
      processType: PROCESS_TYPES[0]?.id ?? '',
      current: initialCurrent(),
      note: '',
    };
    const nextGuide = cloneGuide();
    setForm(nextForm);
    setGuide(nextGuide);
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(STORAGE_KEY);
      window.localStorage.removeItem(HISTORY_KEY);
    }
  };

  const displayValue = (value) => {
    if (value === '' || value === null || value === undefined) return '-';
    return value;
  };

  const renderRange = (key) => (
    <>
      <span className="text-xs text-gray-500">권장: {guide[key][0]}–{guide[key][1]}</span>
    </>
  );

  return (
    <section className="page p-4 max-w-5xl mx-auto">
      <header className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="text-lg font-semibold">PHA 공정 최적화 도구</div>
        <div className="flex items-center gap-2">
          <select
            value={lang}
            onChange={(event) => setLang(event.target.value)}
            className="select"
          >
            <option value="ko">한국어</option>
            <option value="en">EN</option>
          </select>
          <select
            value={uiMode}
            onChange={(event) => setUiMode(event.target.value)}
            className="select"
          >
            <option value="pc">PC</option>
            <option value="mobile">모바일</option>
          </select>
        </div>
      </header>

      <nav className="tabs mb-6 flex flex-wrap gap-2 border-b border-gray-200 pb-2">
        <NavLink
          to="/process"
          className={({ isActive }) =>
            `tab ${isActive ? 'tab-active' : ''}`
          }
        >
          공정 조건
        </NavLink>
        <NavLink to="/troubleshooting" className={({ isActive }) => `tab ${isActive ? 'tab-active' : ''}`}>
          트러블슈팅
        </NavLink>
        <NavLink to="/history" className={({ isActive }) => `tab ${isActive ? 'tab-active' : ''}`}>
          이력 관리
        </NavLink>
        <NavLink to="/analysis" className={({ isActive }) => `tab ${isActive ? 'tab-active' : ''}`}>
          데이터 분석
        </NavLink>
        <NavLink to="/settings" className={({ isActive }) => `tab ${isActive ? 'tab-active' : ''}`}>
          설정
        </NavLink>
      </nav>

      <div className="grid gap-4">
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="label">샘플 시리즈</label>
            <select
              className="input"
              value={form.sampleSeries}
              onChange={(event) => handleSelectChange('sampleSeries', event.target.value)}
            >
              {PROCESS_PRESETS.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">가공 유형</label>
            <select
              className="input"
              value={form.processType}
              onChange={(event) => handleSelectChange('processType', event.target.value)}
            >
              {PROCESS_TYPES.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setEditGuide((prev) => !prev)}
          >
            권장 가이드 {editGuide ? '잠금' : '수정'}
          </button>
          <span className="text-sm text-gray-500">
            현재 선택된 프로파일/공정창의 권장 min/max를 편집합니다. (초기값으로 되돌리기 가능)
          </span>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {PARAM_KEYS.map((key) => (
            <div key={key} className="card border rounded p-3">
              <label className="label">{LABELS[key]}</label>
              <div className="flex items-center gap-2">
                <input
                  className="input flex-1"
                  type="text"
                  placeholder={`${guide[key][0]}-${guide[key][1]}`}
                  value={form.current[key] ?? ''}
                  onChange={(event) => handleCurrentChange(key, event.target.value)}
                />
              </div>
              <div className="mt-2 flex items-center gap-2 text-sm">
                <span className={badgeClass(statusOf(form.current[key], guide[key]))}>
                  {statusOf(form.current[key], guide[key])}
                </span>
                {editGuide ? (
                  <>
                    <span className="text-xs text-gray-500">권장 범위</span>
                    <input
                      className="input w-20"
                      type="number"
                      value={guide[key][0]}
                      onChange={(event) => handleGuideChange(key, 0, event.target.value)}
                    />
                    <span>~</span>
                    <input
                      className="input w-20"
                      type="number"
                      value={guide[key][1]}
                      onChange={(event) => handleGuideChange(key, 1, event.target.value)}
                    />
                  </>
                ) : (
                  renderRange(key)
                )}
              </div>
            </div>
          ))}
        </div>

        <textarea
          className="input w-full"
          rows={3}
          placeholder="📝 특이사항/개선 아이디어 기록"
          value={form.note}
          onChange={(event) => handleNoteChange(event.target.value)}
        />

        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn btn-primary" onClick={saveAndAnalyze}>
            저장 및 분석
          </button>
          <button type="button" className="btn" onClick={exportJSON}>
            데이터 내보내기
          </button>
          <button type="button" className="btn" onClick={handleImportJSON}>
            JSON 가져오기
          </button>
          <button type="button" className="btn" onClick={exportCSV}>
            CSV 가져오기
          </button>
          <button type="button" className="btn btn-ghost" onClick={resetAll}>
            초기화
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="table w-full min-w-[600px]">
            <thead>
              <tr>
                <th className="text-left">파라미터</th>
                <th className="text-left">현재값</th>
                <th className="text-left">권장 범위</th>
                <th className="text-left">상태</th>
              </tr>
            </thead>
            <tbody>
              {PARAM_KEYS.map((key) => (
                <tr key={key}>
                  <td>{LABELS[key]}</td>
                  <td>{displayValue(form.current[key])}</td>
                  <td>
                    {guide[key][0]}–{guide[key][1]}
                  </td>
                  <td>
                    <span className={badgeClass(statusOf(form.current[key], guide[key]))}>
                      {statusOf(form.current[key], guide[key])}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {analysisMessages.length > 0 && (
          <div className="card border rounded p-3">
            <div className="mb-1 font-semibold">빠른 점검</div>
            <ul className="list-disc space-y-1 pl-5 text-sm">
              {analysisMessages.map((message, index) => (
                <li key={index}>{message}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <button type="button" className="fab" onClick={saveAndAnalyze}>
        💾
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={onFileSelected}
      />
    </section>
  );
};

export default ProcessConditions;
