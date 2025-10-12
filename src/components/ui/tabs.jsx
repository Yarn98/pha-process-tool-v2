import React from 'react'

const TabsCtx = React.createContext(null)

export function Tabs({ defaultValue, value, onValueChange, children }) {
  const [val, setVal] = React.useState(value ?? defaultValue)
  const set = (v) => {
    setVal(v)
    onValueChange && onValueChange(v)
  }
  return <TabsCtx.Provider value={{ val, set }}>{children}</TabsCtx.Provider>
}
export function TabsList({ className = '', children }) {
  return <div className={`inline-flex gap-2 rounded-md border p-1 ${className}`}>{children}</div>
}
export function TabsTrigger({ value, className = '', children }) {
  const ctx = React.useContext(TabsCtx)
  const active = ctx?.val === value
  return (
    <button
      onClick={() => ctx?.set(value)}
      className={`px-3 py-1 rounded-md text-sm ${active ? 'bg-blue-600 text-white' : 'bg-transparent' } ${className}`}
    >
      {children}
    </button>
  )
}
export function TabsContent({ value, className = '', children }) {
  const ctx = React.useContext(TabsCtx)
  if (ctx?.val !== value) return null
  return <div className={className}>{children}</div>
}
