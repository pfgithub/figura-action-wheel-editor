import React from "react";

export const Button = ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button {...props} className={`font-bold py-1 px-3 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed ${props.className ?? ''}`}>
    {children}
  </button>
);