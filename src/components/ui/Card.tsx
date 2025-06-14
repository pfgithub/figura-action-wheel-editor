import React from "react";

export const Card = ({ children, title, controls }: { children: React.ReactNode; title: React.ReactNode; controls?: React.ReactNode }) => (
  <div className="bg-slate-800 p-5 rounded-lg mb-4 ring-1 ring-slate-700">
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-xl font-semibold text-slate-100 truncate">{title}</h3>
      {controls && <div className="flex gap-2 flex-shrink-0">{controls}</div>}
    </div>
    <div className="space-y-4">{children}</div>
  </div>
);