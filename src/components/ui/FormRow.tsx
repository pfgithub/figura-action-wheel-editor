export const FormRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="grid grid-cols-3 gap-4 items-center">
    <label className="text-slate-400 text-sm font-medium col-span-1">{label}</label>
    <div className="col-span-2">{children}</div>
  </div>
);