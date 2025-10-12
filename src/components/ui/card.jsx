import React from 'react'

export function Card({ className = '', children, ...rest }) {
  return <div className={`rounded-lg border bg-white dark:bg-zinc-900 ${className}`} {...rest}>{children}</div>
}
export function CardHeader({ className = '', children }) {
  return <div className={`border-b px-4 py-3 ${className}`}>{children}</div>
}
export function CardTitle({ className = '', children }) {
  return <h3 className={`text-lg font-semibold ${className}`}>{children}</h3>
}
export function CardDescription({ className = '', children }) {
  return <p className={`text-sm text-gray-500 dark:text-gray-400 ${className}`}>{children}</p>
}
export function CardContent({ className = '', children }) {
  return <div className={`p-4 ${className}`}>{children}</div>
}
