const stats = [
  { value: "10,000+", label: "Lessons tracked" },
  { value: "4.9/5", label: "Satisfaction" },
  { value: "2,000+", label: "Students" },
  { value: "98%", label: "Payment success" },
];

export default function Stats() {
  return (
    <section className="bg-white py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <article
              key={stat.label}
              className="lp-surface-soft rounded-[2rem] px-6 py-6 transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <p className="text-3xl font-semibold tracking-tight text-[#2d3b2d]">{stat.value}</p>
              <p className="mt-2 text-sm text-[#5c5347]">{stat.label}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

