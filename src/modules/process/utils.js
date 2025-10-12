export const PARAM_KEYS = ['zone1', 'zone2', 'zone3', 'zone4', 'die', 'screw', 'meltP', 'tankT', 'lineV'];

export function inRange(value, [min, max]) {
  if (value === null || value === undefined || value === '' || Number.isNaN(Number(value))) {
    return null;
  }
  const n = Number(value);
  return n >= min && n <= max;
}

export function statusOf(value, range) {
  const ok = inRange(value, range);
  if (ok === null) return '미입력';
  return ok ? '양호' : '주의';
}

export function monotonicTempTrend(values) {
  const numeric = values.map((v) => {
    if (v === '' || v === null || v === undefined) {
      return null;
    }
    const parsed = Number(v);
    return Number.isNaN(parsed) ? null : parsed;
  });

  for (let i = 1; i < numeric.length; i += 1) {
    if (numeric[i] !== null && numeric[i - 1] !== null && numeric[i] < numeric[i - 1]) {
      return false;
    }
  }
  return true;
}

export function toCSV(rows) {
  const header = 'parameter,current,range_min,range_max,status,timestamp';
  const body = rows
    .map((row) =>
      [row.parameter, row.current ?? '', row.rangeMin, row.rangeMax, row.status, row.timestamp]
        .map((cell) => {
          if (cell === null || cell === undefined) return '';
          const str = String(cell);
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        })
        .join(',')
    )
    .join('\n');
  return `${header}\n${body}`;
}
