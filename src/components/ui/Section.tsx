import React from "react";

export const Section = ({ children, title, headerControls }: { children: React.ReactNode; title: string; headerControls?: React.ReactNode }) => (
  <section className="bg-gray-800/50 p-6 rounded-xl mb-8">
    <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-2">
      <h2 className="text-2xl font-bold">{title}</h2>
      {headerControls && <div>{headerControls}</div>}
    </div>
    {children}
  </section>
);