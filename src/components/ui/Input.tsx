import React from "react";

export const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input {...props} className={`bg-gray-700 border border-gray-600 rounded px-2 py-1 w-full text-white ${props.className ?? ''}`} />
);