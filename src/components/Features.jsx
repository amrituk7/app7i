const features = [
  { title: "Lesson scheduling", description: "Book, manage and track every lesson. Recurring lessons, block bookings, and clash detection built in.", color: "terracotta", icon: (<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><rect x="3" y="4" width="18" height="18" rx="2" strokeWidth={2} /><path strokeWidth={2} d="M16 2v4M8 2v4M3 10h18" /></svg>) },
  { title: "Student management", description: "Full profiles with progress tracking, skill ratings, theory and test dates - all in one place.", color: "moss", icon: (<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeWidth={2} d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" strokeWidth={2} /><path strokeWidth={2} d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></svg>) },
  { title: "Earnings tracker", description: "See exactly what you have earned by week and month. Export CSV for your accountant with one tap.", color: "mustard", icon: (<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeWidth={2} d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></svg>) },
  { title: "Student messaging", description: "Message students directly through the app. They reply from their student portal.", color: "slate", icon: (<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeWidth={2} d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>) },
  { title: "Professional invoices", description: "Generate branded invoices per lesson with payment status, ADI number and your logo.", color: "terracotta", icon: (<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeWidth={2} d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" strokeWidth={2} /><line x1="16" y1="13" x2="8" y2="13" strokeWidth={2} /><line x1="16" y1="17" x2="8" y2="17" strokeWidth={2} /></svg>) },
  { title: "Student portal", description: "Your students get their own login to see upcoming lessons, messages, and progress.", color: "moss", icon: (<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeWidth={2} d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" strokeWidth={2} /></svg>) },
];

const colorClasses = {
  terracotta: "bg-[#C4A77D]/20 text-[#8B6F47]",
  moss: "bg-[#7A9B7A]/20 text-[#5C7A5C]",
  mustard: "bg-[#C9B96D]/20 text-[#9A8A3D]",
  slate: "bg-[#7A8AA0]/20 text-[#5C6B80]",
};

export default function Features() {
  return (
    <section id="features" className="bg-[#FAF8F5] py-20 md:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center mb-16">
          <p className="text-sm font-semibold uppercase tracking-wider text-[#5C7A5C]">Everything you need</p>
          <h2 className="mt-3 text-3xl sm:text-4xl md:text-5xl font-bold text-[#2D3B2D] tracking-tight">One app. No spreadsheets.</h2>
          <p className="mt-4 text-lg text-[#5C5347] leading-relaxed">Everything you used to track on paper, WhatsApp, and spreadsheets - now in a single professional tool.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div key={feature.title} className="group p-6 bg-white border border-[#E8E4DD] rounded-2xl shadow-sm hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 ${colorClasses[feature.color]}`}>{feature.icon}</div>
              <h3 className="mt-5 text-lg font-semibold text-[#2D3B2D]">{feature.title}</h3>
              <p className="mt-2 text-[#5C5347] leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
