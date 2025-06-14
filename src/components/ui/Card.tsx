import React from "react";

export const Card = ({ children, title, controls }: { children: React.ReactNode; title: React.ReactNode; controls?: React.ReactNode }) => (
  <div className="bg-gray-800 p-4 rounded-lg mb-4 border border-gray-700">
    <div className="flex justify-between items-center mb-3">
      <h3 className="text-lg font-semibold">{title}</h3>
      {controls && <div className="flex gap-2">{controls}</div>}
    </div>
    <div className="space-y-3">{children}</div>
  </div>
);