import React from 'react'

export default function Optimizer() {
  const params = new URLSearchParams(window.location.search)
  const grade = params.get('grade') || 'CA1180P'
  const process = params.get('process') || 'extrusion'
  const src = `/optimizer/index.html?grade=${encodeURIComponent(grade)}&process=${encodeURIComponent(process)}`
  return <iframe title="Optimizer" src={src} className="w-full h-[calc(100vh-140px)] border-0" />
}
