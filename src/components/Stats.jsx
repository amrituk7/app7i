const stats = [
  { value: "3 days", label: "Free trial before the first charge" },
  { value: "GBP 119.99", label: "Early-access yearly rate for referred instructors" },
  { value: "GBP 99.99", label: "Referral-powered yearly renewal or upgrade target" },
  { value: "1 place", label: "To run lessons, messages, payments, and student progress" },
];

export default function Stats() {
  return (
    <section className="app7i-section" style={{ paddingTop: 0 }}>
      <div className="app7i-shell">
        <div className="app7i-stat-strip">
          {stats.map((stat) => (
            <div key={stat.label} className="app7i-stat-card">
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
