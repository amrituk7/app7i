const stats = [
  { label: "Next lesson", value: "9:00 AM", subtext: "James Wilson", color: "terracotta", icon: (<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><rect x="3" y="4" width="18" height="18" rx="2" strokeWidth={2} /><path strokeWidth={2} d="M16 2v4M8 2v4M3 10h18" /></svg>) },
  { label: "This month", value: "GBP 1,240", subtext: "+12% from last month", color: "moss", icon: (<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeWidth={2} d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></svg>) },
  { label: "Student progress", value: "87%", subtext: "Average test readiness", color: "mustard", icon: (<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" strokeWidth={2} /><polyline points="16 7 22 7 22 13" strokeWidth={2} /></svg>) },
  { label: "Hours taught", value: "42", subtext: "This week", color: "slate", icon: (<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="10" strokeWidth={2} /><polyline points="12 6 12 12 16 14" strokeWidth={2} /></svg>) },
];

const colorClasses = {
  terracotta: "bg-[#C4A77D]/20 text-[#8B6F47]",
  moss: "bg-[#7A9B7A]/20 text-[#5C7A5C]",
  mustard: "bg-[#C9B96D]/20 text-[#9A8A3D]",
  slate: "bg-[#7A8AA0]/20 text-[#5C6B80]",
};

export default function Stats() {
  return (
    <section className="border-y border-[#E8E4DD] bg-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="group flex items-center gap-4 rounded-2xl border border-[#E8E4DD] bg-[#FAF8F5] p-5 transition-all hover:-translate-y-0.5 hover:shadow-md">
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-110 ${colorClasses[stat.color]}`}>{stat.icon}</div>
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#5C5347]">{stat.label}</p>
                <p className="mt-1 text-2xl font-semibold text-[#2D3B2D]">{stat.value}</p>
                <p className="text-sm text-[#5C5347]">{stat.subtext}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
