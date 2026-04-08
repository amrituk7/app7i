function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M8 2.5v3M16 2.5v3M4 8.5h16M5.5 4.5h13A1.5 1.5 0 0 1 20 6v12.5A1.5 1.5 0 0 1 18.5 20h-13A1.5 1.5 0 0 1 4 18.5V6A1.5 1.5 0 0 1 5.5 4.5Z" />
    </svg>
  );
}

function PoundIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M13 3.5c-2.8 0-4.75 1.83-4.75 4.55 0 1.3.46 2.45 1.25 3.45H7v1.8h3.95c-.32 2.13-1.63 3.54-4.1 4.7h10.65" />
    </svg>
  );
}

function TrendIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4.5 16.5 9 12l3 3 7.5-8.5" />
      <path d="M14.5 6.5H19v4.5" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5v5l3 1.75" />
    </svg>
  );
}

const stats = [
  {
    icon: <CalendarIcon />,
    label: "Next lesson",
    value: "9:00 AM",
    subtext: "James Wilson",
    colorClass: "bg-[#8B6F47]/12 text-[#8B6F47]",
  },
  {
    icon: <PoundIcon />,
    label: "This month",
    value: "\u00A31,240",
    subtext: "+12% from last month",
    colorClass: "bg-[#9A8A3D]/12 text-[#9A8A3D]",
  },
  {
    icon: <TrendIcon />,
    label: "Student progress",
    value: "87%",
    subtext: "Average test readiness",
    colorClass: "bg-[#5C7A5C]/12 text-[#5C7A5C]",
  },
  {
    icon: <ClockIcon />,
    label: "Hours taught",
    value: "42",
    subtext: "This week",
    colorClass: "bg-[#5C6B80]/12 text-[#5C6B80]",
  },
];

export default function StatsStrip() {
  return (
    <section className="border-y border-[#E8E4DD] bg-[#FAF8F5] py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-8">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="group flex items-center gap-4 rounded-xl border border-[#E3DBD0] bg-[#FFFDF9] p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md hover:shadow-[#2D3B2D]/5"
            >
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${stat.colorClass} transition-transform duration-300 group-hover:scale-110`}
              >
                {stat.icon}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-[#5C5347]">{stat.label}</p>
                <p className="text-xl font-bold text-[#2D3B2D]">{stat.value}</p>
                <p className="truncate text-xs text-[#5C5347]">{stat.subtext}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
