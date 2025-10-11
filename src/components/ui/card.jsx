import React from 'react';

const baseCardClass = 'rounded-2xl border border-gray-200 bg-white shadow-sm';

export const Card = ({ children, className = '', ...props }) => (
  <div className={`${baseCardClass} ${className}`} {...props}>
    {children}
  </div>
);

export const CardHeader = ({ children, className = '', ...props }) => (
  <div className={`border-b border-gray-100 p-4 sm:p-6 ${className}`} {...props}>
    {children}
  </div>
);

export const CardTitle = ({ children, className = '', ...props }) => (
  <h3 className={`text-lg font-semibold tracking-tight ${className}`} {...props}>
    {children}
  </h3>
);

export const CardDescription = ({ children, className = '', ...props }) => (
  <p className={`text-sm text-gray-500 ${className}`} {...props}>
    {children}
  </p>
);

export const CardContent = ({ children, className = '', ...props }) => (
  <div className={`p-4 sm:p-6 ${className}`} {...props}>
    {children}
  </div>
);

export const CardFooter = ({ children, className = '', ...props }) => (
  <div className={`border-t border-gray-100 p-4 sm:p-6 ${className}`} {...props}>
    {children}
  </div>
);

export default Card;
