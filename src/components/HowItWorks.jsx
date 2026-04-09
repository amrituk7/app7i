const steps = [
  {
    number: "01",
    title: "Set up your instructor profile",
    description: "Create your App7i account, add your details, and start from a clean base instead of another messy admin stack.",
  },
  {
    number: "02",
    title: "Invite students with your link",
    description: "Students join through your invite flow and get access to their own portal without extra setup or app confusion.",
  },
  {
    number: "03",
    title: "Run the week from one dashboard",
    description: "Track lessons, payments, messages, progress, and renewals from a single instructor workflow that actually feels manageable.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="app7i-section">
      <div className="app7i-shell">
        <div className="app7i-section-header centered">
          <div className="app7i-kicker-light app7i-kicker">How it works</div>
          <h2 className="app7i-title">Simple enough to start fast. Strong enough to replace the mess.</h2>
          <p className="app7i-copy">
            The point of App7i is not adding another tool. It is replacing the scattered way instructors currently manage students, lessons, payments, and follow-up.
          </p>
        </div>

        <div className="app7i-steps">
          {steps.map((step) => (
            <article key={step.number} className="app7i-step">
              <div className="app7i-step-number">{step.number}</div>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
