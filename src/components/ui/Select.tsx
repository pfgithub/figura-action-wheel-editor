import React from "react";

export const Select = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <select {...props} className={`bg-gray-700 border border-gray-600 rounded px-2 py-1 w-full text-white ${props.className ?? ''}`} />
);