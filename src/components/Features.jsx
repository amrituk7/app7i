const painPoints = [
  "Lessons spread across notes, WhatsApp, and memory",
  "Students constantly asking what is booked next",
  "Payments and invoices tracked in separate places",
  "No clear way to reward referrals without admin friction",
];

const solutions = [
  {
    title: "Lesson control",
    description: "See the week clearly, manage bookings, and reduce diary friction before it turns into admin drag.",
  },
  {
    title: "Student progress",
    description: "Keep practical progress, upcoming lessons, and learner status visible for both you and the student.",
  },
  {
    title: "Payments and invoicing",
    description: "Handle subscription value, invoices, and cleaner payment visibility without another spreadsheet layer.",
  },
  {
    title: "Messaging flow",
    description: "Keep instructor-to-student communication in the product instead of burying it inside personal chat apps.",
  },
  {
    title: "Referral rewards",
    description: "Encourage instructors to refer peers with a pricing reward that feels worth sharing and easy to explain.",
  },
  {
    title: "Professional feel",
    description: "Present a more modern, organised business experience than a loose stack of links, notes, and reminders.",
  },
];

export default function Features() {
  return (
    <section id="why-app7i" className="app7i-section">
      <div className="app7i-shell">
        <div className="app7i-problem-grid">
          <article className="app7i-contrast-card dark">
            <div className="app7i-kicker">What instructors are stuck with now</div>
            <h3>Too much business admin still lives in workarounds.</h3>
            <p>
              Most instructors are doing parts of the job in different places, then trying to remember what changed. That is where time, money, and trust start leaking.
            </p>
            <div className="app7i-list">
              {painPoints.map((item) => (
                <div key={item} className="app7i-list-item">
                  <span className="app7i-list-bullet is-warn">!</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </article>

          <article id="features" className="app7i-contrast-card light">
            <div className="app7i-section-header">
              <div className="app7i-kicker-light app7i-kicker">What App7i replaces it with</div>
              <h2 className="app7i-title">One instructor workflow that feels sharper and easier to trust.</h2>
              <p className="app7i-copy">
                The product should make the business look more professional while reducing the mental load on the instructor.
              </p>
            </div>

            <div className="app7i-feature-grid">
              {solutions.map((item, index) => (
                <article key={item.title} className="app7i-feature-card">
                  <div
                    className="app7i-feature-icon"
                    style={{
                      background:
                        index % 3 === 0
                          ? "rgba(184, 144, 69, 0.12)"
                          : index % 3 === 1
                            ? "rgba(110, 138, 105, 0.14)"
                            : "rgba(75, 59, 49, 0.12)",
                      color:
                        index % 3 === 0
                          ? "#8f6b29"
                          : index % 3 === 1
                            ? "#5c7a5c"
                            : "#6d5649",
                    }}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </article>
              ))}
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
