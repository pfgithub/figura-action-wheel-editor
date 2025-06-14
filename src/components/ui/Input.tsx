import React from "react";

export const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input {...props} className={`bg-slate-700/50 border border-slate-600 rounded-md px-3 py-2 w-full text-slate-100 placeholder:text-slate-400 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors duration-200 ${props.className ?? ''}`} />
);