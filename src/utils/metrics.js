// PHA 폴리머 지표 계산 유틸리티
// 원본 데이터로부터 파생 KPI 계산

import { thermalData, mechanicalComparison, processingData, polymerSpecs, crystallinityEffects } from '../data/polymerData'
import { DEGRADATION_THRESHOLD } from '../data/extendedData'

export const getThermalValue = (polymer, temp) => {
  const row = thermalData[polymer].find((entry) => entry.temp === temp)
  return row ? row.modulus : null
}

export const computeDerivedMetrics = (polymer) => {
  const spec = polymerSpecs[polymer]
  const modulus25 = getThermalValue(polymer, 25)
  const modulus100 = getThermalValue(polymer, 100)
  const tanDeltaPeak = Math.max(...thermalData[polymer].map((entry) => entry.tanDelta))
  const meltOpt = processingData.find((row) => row.parameter === 'Melt Temperature')?.[`${polymer}_opt`]
  const tensile = mechanicalComparison.find((row) => row.property === 'Tensile Strength')?.[polymer]
  const density = spec.density ?? crystallinityEffects.find((row) => row.property === 'Density')?.[polymer]

  const modulusRetention = modulus25 ? (modulus100 / modulus25) * 100 : null
  const modulusDrop = modulus25 ? ((modulus25 - (modulus100 ?? 0)) / modulus25) * 100 : null
  const crystallizationWindow = spec.tm != null && spec.tg != null ? spec.tm - spec.tg : null
  const safetyMargin = meltOpt != null ? DEGRADATION_THRESHOLD - meltOpt : null
  const normalizedStrength = tensile != null && density ? tensile / density : null
  const shrinkageEstimate = spec.crystallinity != null ? 0.2 + 0.016 * spec.crystallinity : null

  return {
    crystallizationWindow,
    modulusRetention,
    modulusDrop,
    tanDeltaPeak,
    safetyMargin,
    normalizedStrength,
    shrinkageEstimate
  }
}

export const formatMetricValue = (value, unit) => {
  if (value == null || Number.isNaN(value)) return '—'
  const digits = Math.abs(value) >= 100 ? 0 : 2
  const formatted = value.toFixed(digits)
  return unit ? `${formatted} ${unit}` : formatted
}

export const downloadThermalData = (selectedPolymer) => {
  const headers = ['temp', 'modulus', 'tanDelta']
  const rows = thermalData[selectedPolymer]
    .map(({ temp, modulus, tanDelta }) => `${temp},${modulus},${tanDelta}`)
    .join('\n')
  const csv = `${headers.join(',')}\n${rows}`
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${selectedPolymer}_thermal_data.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
