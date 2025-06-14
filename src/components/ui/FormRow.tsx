import React from "react";

export const FormRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="grid grid-cols-3 gap-4 items-center">
    <label className="text-gray-400 text-sm font-bold col-span-1">{label}</label>
    <div className="col-span-2">{children}</div>
  </div>
);