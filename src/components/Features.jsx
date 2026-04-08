const features = [
  {
    title: "Lesson Scheduling",
    description:
      "Calendar-based booking with recurring lessons, clash detection, and block bookings. Students see their schedule in real time.",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M8 2.5v3M16 2.5v3M4 8.5h16M5.5 4.5h13A1.5 1.5 0 0 1 20 6v12.5A1.5 1.5 0 0 1 18.5 20h-13A1.5 1.5 0 0 1 4 18.5V6A1.5 1.5 0 0 1 5.5 4.5Z" />
      </svg>
    ),
    colorClass: "bg-[#8B6F47]/12 text-[#8B6F47]",
  },
  {
    title: "Student Management",
    description:
      "Full profiles with skill ratings, theory and test dates, progress tracking, and a waiting list for new enquiries.",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="8" cy="8" r="3" />
        <circle cx="16.5" cy="7" r="2.5" />
        <path d="M3.5 18.5a4.5 4.5 0 0 1 9 0M13.5 18.5a3.5 3.5 0 0 1 7 0" />
      </svg>
    ),
    colorClass: "bg-[#5C7A5C]/12 text-[#5C7A5C]",
  },
  {
    title: "Earnings Tracker",
    description:
      "See exactly what you've earned by week and month at a glance. Export CSV for your accountant with one tap.",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M13 3.5c-2.8 0-4.75 1.83-4.75 4.55 0 1.3.46 2.45 1.25 3.45H7v1.8h3.95c-.32 2.13-1.63 3.54-4.1 4.7h10.65" />
      </svg>
    ),
    colorClass: "bg-[#9A8A3D]/12 text-[#9A8A3D]",
  },
  {
    title: "In-App Messaging",
    description:
      "Message students directly through the app. They reply from their own portal, with no phone number sharing needed.",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M5.5 6.5h13A1.5 1.5 0 0 1 20 8v7.5A1.5 1.5 0 0 1 18.5 17H9l-4.5 3v-3H5.5A1.5 1.5 0 0 1 4 15.5V8A1.5 1.5 0 0 1 5.5 6.5Z" />
      </svg>
    ),
    colorClass: "bg-[#5C6B80]/12 text-[#5C6B80]",
  },
  {
    title: "Invoices",
    description:
      "Generate branded invoices per lesson with your ADI number, payment status, and logo. Send them out with one tap.",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M6 3.5h9l3 3v14l-3-1.75-3 1.75-3-1.75-3 1.75v-17Z" />
        <path d="M8.5 9.5h7M8.5 13h7M8.5 16.5H12" />
      </svg>
    ),
    colorClass: "bg-[#5C5347]/12 text-[#5C5347]",
  },
  {
    title: "Student Portal",
    description:
      "Your students get their own login to view upcoming lessons, messages, tips, and a full progress report.",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 3.5 4.5 7.5 12 11.5l7.5-4-7.5-4Z" />
        <path d="M7 10.2v4.3c0 1.9 2.3 3.5 5 3.5s5-1.6 5-3.5v-4.3" />
      </svg>
    ),
    colorClass: "bg-[#5C7A5C]/12 text-[#5C7A5C]",
  },
];

export default function Features() {
  return (
    <section id="features" className="bg-[#FAF8F5] py-20 md:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-[#5C7A5C]">Features</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#2D3B2D] sm:text-4xl md:text-5xl">
            Everything you need. One app.
          </h2>
          <p className="mt-4 text-lg text-[#5C5347]">
            Stop juggling spreadsheets, WhatsApp groups, and paper diaries. App7i replaces all of it.
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-2xl border border-[#E3DBD0] bg-[#FFFDF9] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[#2D3B2D]/20 hover:shadow-lg hover:shadow-[#2D3B2D]/5"
            >
              <div
                className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${feature.colorClass} transition-transform duration-300 group-hover:scale-110`}
              >
                {feature.icon}
              </div>
              <h3 className="mb-2 text-lg font-semibold text-[#2D3B2D]">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-[#5C5347]">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
