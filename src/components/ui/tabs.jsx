import React, { createContext, useContext, useMemo, useState } from 'react';

const TabsContext = createContext(null);

export const Tabs = ({ defaultValue, value: controlledValue, onValueChange, className = '', children }) => {
  const [internalValue, setInternalValue] = useState(defaultValue);

  const value = controlledValue !== undefined ? controlledValue : internalValue;

  const setValue = (next) => {
    if (controlledValue === undefined) {
      setInternalValue(next);
    }
    onValueChange?.(next);
  };

  const contextValue = useMemo(() => ({ value, setValue }), [value]);

  return (
    <TabsContext.Provider value={contextValue}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
};

export const TabsList = ({ children, className = '', ...props }) => (
  <div className={`flex flex-wrap gap-2 rounded-xl bg-gray-100 p-2 ${className}`} {...props}>
    {children}
  </div>
);

export const TabsTrigger = ({ value, children, className = '', ...props }) => {
  const context = useContext(TabsContext);

  if (!context) {
    throw new Error('TabsTrigger must be used within a Tabs component');
  }

  const isActive = context.value === value;

  const baseStyles =
    'flex-1 min-w-[120px] rounded-lg px-3 py-2 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500';

  const activeStyles = 'bg-white text-gray-900 shadow-sm';
  const inactiveStyles = 'text-gray-600 hover:text-gray-900 hover:bg-gray-200';

  return (
    <button
      type="button"
      className={`${baseStyles} ${isActive ? activeStyles : inactiveStyles} ${className}`}
      onClick={() => context.setValue(value)}
      aria-pressed={isActive}
      {...props}
    >
      {children}
    </button>
  );
};

export const TabsContent = ({ value, children, className = '', ...props }) => {
  const context = useContext(TabsContext);

  if (!context) {
    throw new Error('TabsContent must be used within a Tabs component');
  }

  if (context.value !== value) {
    return null;
  }

  return (
    <div className={className} {...props}>
      {children}
    </div>
  );
};

export default Tabs;
