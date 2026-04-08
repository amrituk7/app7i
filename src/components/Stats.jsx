const STATS = [
  { value: "10,000+", label: "Lessons tracked" },
  { value: "4.9/5", label: "Satisfaction" },
  { value: "2,000+", label: "Students" },
  { value: "98%", label: "Payment success" },
];

export default function Stats() {
  return (
    <section className="border-y border-slate-200 bg-slate-50 py-12 dark:border-slate-800 dark:bg-slate-800/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-3xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
