const stats = [
  { value: "10,000+", label: "Lessons tracked" },
  { value: "4.9/5", label: "Satisfaction" },
  { value: "2,000+", label: "Students" },
  { value: "98%", label: "Payment success" },
];

export default function Stats() {
  return (
    <section className="bg-paper py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-semibold text-forest">
            Built for busy instructors
          </h2>
          <p className="mt-2 text-sm text-body">
            App7i keeps your lessons, students, and payments in sync — without extra admin.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
          {stats.map((stat) => (
            <article
              key={stat.label}
              className="rounded-2xl border border-line bg-cream px-4 py-5 text-center transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <p className="text-lg font-semibold text-forest">{stat.value}</p>
              <p className="mt-1 text-xs text-body">{stat.label}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

