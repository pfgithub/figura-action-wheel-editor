export const Select = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <select {...props} className={`bg-slate-700/50 border border-slate-600 rounded-md px-3 py-2 w-full text-slate-100 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors duration-200 ${props.className ?? ''}`} />
);