import React from "react";

export const Section = ({ children, title }: { children: React.ReactNode; title: string }) => (
  <section className="bg-gray-800/50 p-6 rounded-xl mb-8">
    <h2 className="text-2xl font-bold mb-4 border-b border-gray-700 pb-2">{title}</h2>
    {children}
  </section>
);