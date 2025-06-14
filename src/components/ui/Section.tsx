import React from "react";

export const Section = ({ children, title, headerControls }: { children: React.ReactNode; title: string; headerControls?: React.ReactNode }) => (
  <section className="bg-slate-800/40 p-6 rounded-xl mb-8 ring-1 ring-slate-700/50">
    <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-3">
      <h2 className="text-2xl font-bold text-slate-100">{title}</h2>
      {headerControls && <div>{headerControls}</div>}
    </div>
    {children}
  </section>
);