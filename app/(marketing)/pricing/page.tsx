import Link from "next/link";

const plans = [
  {
    name: "Starter",
    price: "₦50,000",
    period: "/month",
    tagline: "For small clinics getting started.",
    cta: "Start Free Trial",
    ctaHref: "/register",
    highlighted: false,
    features: [
      "Up to 10 staff accounts",
      "Single location",
      "Patient records (EMR)",
      "Appointments & scheduling",
      "Basic billing & invoicing",
      "Email support",
    ],
  },
  {
    name: "Professional",
    price: "₦180,000",
    period: "/month",
    tagline: "For growing hospitals with multiple departments.",
    cta: "Start Free Trial",
    ctaHref: "/register",
    highlighted: true,
    features: [
      "Up to 100 staff accounts",
      "Up to 2 locations",
      "Everything in Starter",
      "Pharmacy & inventory",
      "Ward & bed management",
      "Admin dashboard & reports",
      "Priority email & chat support",
    ],
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    tagline: "For large hospitals and multi-branch networks.",
    cta: "Talk to Sales",
    ctaHref: "/contact",
    highlighted: false,
    features: [
      "Unlimited staff accounts",
      "Unlimited locations",
      "Everything in Professional",
      "Custom modules & integrations",
      "Dedicated account manager",
      "On-site training & onboarding",
      "SLA-backed 24/7 support",
    ],
  },
];

const comparisonRows = [
  { feature: "Staff accounts", values: ["Up to 10", "Up to 100", "Unlimited"] },
  { feature: "Hospital locations", values: ["1", "2", "Unlimited"] },
  { feature: "Patient Records (EMR)", values: ["✓", "✓", "✓"] },
  { feature: "Appointments & Scheduling", values: ["✓", "✓", "✓"] },
  { feature: "Billing & Invoicing", values: ["Basic", "Full", "Full"] },
  { feature: "Pharmacy & Inventory", values: ["—", "✓", "✓"] },
  { feature: "Ward & Bed Management", values: ["—", "✓", "✓"] },
  { feature: "Admin Dashboard & Reports", values: ["Basic", "Full", "Full"] },
  { feature: "Audit logs", values: ["—", "✓", "✓"] },
  { feature: "Custom modules", values: ["—", "—", "✓"] },
  { feature: "API access", values: ["—", "—", "✓"] },
  { feature: "Support", values: ["Email", "Priority", "24/7 SLA"] },
];

const faqs = [
  {
    q: "Can I switch plans later?",
    a: "Yes — you can upgrade or downgrade at any time. Changes take effect at the start of your next billing cycle.",
  },
  {
    q: "Is there a free trial?",
    a: "Yes. Every plan comes with a 14-day free trial. No credit card required to start.",
  },
  {
    q: "What happens after 14 days?",
    a: "You choose a plan to continue. Your data stays safe and intact whether you upgrade or not.",
  },
  {
    q: "Do you offer discounts for hospitals in developing regions?",
    a: "Yes. Contact our sales team for regional pricing, non-profit rates, and multi-year discounts.",
  },
  {
    q: "Can I pay annually?",
    a: "Yes. Annual payment saves you two months' fees compared to monthly billing.",
  },
];

export default function PricingPage() {
  return (
    <>
      {/* PAGE HERO */}
      <section className="bg-brand-cyan">
        <div className="max-w-7xl mx-auto px-6 py-20 md:py-24 text-center">
          <p className="text-sm font-bold text-brand-navy uppercase tracking-widest mb-3">
            Pricing
          </p>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-brand-navy leading-tight max-w-3xl mx-auto">
            Simple, transparent pricing for every hospital.
          </h1>
          <p className="mt-6 text-lg text-brand-navy/80 leading-relaxed max-w-2xl mx-auto">
            Start free. Upgrade when you're ready. No hidden fees, no long-term
            contracts.
          </p>
        </div>
      </section>

      {/* PRICING CARDS */}
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-6 py-16 md:py-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl p-8 flex flex-col ${
                  plan.highlighted
                    ? "bg-brand-navy text-white border-2 border-brand-accent shadow-2xl md:scale-[1.03]"
                    : "bg-white border border-brand-sky/60 text-brand-navy shadow-md hover:shadow-xl hover:border-brand-accent transition-all"
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-accent text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                    MOST POPULAR
                  </div>
                )}

                <h3
                  className={`text-xl font-bold tracking-tight ${
                    plan.highlighted ? "text-white" : "text-brand-navy"
                  }`}
                >
                  {plan.name}
                </h3>
                <p
                  className={`mt-2 text-sm ${
                    plan.highlighted ? "text-brand-cyan-light/80" : "text-brand-navy/70"
                  }`}
                >
                  {plan.tagline}
                </p>

                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-bold tracking-tight">
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span
                      className={`text-sm ${
                        plan.highlighted ? "text-brand-cyan-light/70" : "text-brand-navy/60"
                      }`}
                    >
                      {plan.period}
                    </span>
                  )}
                </div>

                <Link
                  href={plan.ctaHref}
                  className={`mt-6 inline-flex items-center justify-center font-semibold px-5 py-3 rounded-lg transition ${
                    plan.highlighted
                      ? "bg-brand-accent hover:bg-brand-sky text-white shadow-lg shadow-brand-accent/40"
                      : "bg-brand-navy text-white hover:bg-brand-accent"
                  }`}
                >
                  {plan.cta}
                </Link>

                <div
                  className={`mt-8 pt-6 border-t ${
                    plan.highlighted ? "border-white/10" : "border-brand-cyan"
                  }`}
                >
                  <p
                    className={`text-xs font-bold uppercase tracking-widest mb-4 ${
                      plan.highlighted ? "text-brand-sky" : "text-brand-navy/70"
                    }`}
                  >
                    What's included
                  </p>
                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-3 text-sm"
                      >
                        <span
                          className={`mt-1 h-4 w-4 rounded-full flex items-center justify-center flex-shrink-0 ${
                            plan.highlighted
                              ? "bg-brand-success/30 text-brand-success"
                              : "bg-brand-success/15 text-brand-success"
                          }`}
                        >
                          <span className="text-[10px] font-bold">✓</span>
                        </span>
                        <span
                          className={
                            plan.highlighted
                              ? "text-brand-cyan-light/90"
                              : "text-brand-navy/80"
                          }
                        >
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMPARISON TABLE */}
      <section className="bg-brand-cyan-light">
        <div className="max-w-7xl mx-auto px-6 py-20 md:py-28">
          <div className="max-w-2xl mb-12">
            <p className="text-sm font-bold text-brand-navy uppercase tracking-widest mb-3">
              Compare plans
            </p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-brand-navy">
              Everything side by side.
            </h2>
          </div>

          <div className="overflow-x-auto border border-brand-sky/60 rounded-2xl bg-white shadow-md">
            <table className="w-full text-sm">
              <thead className="bg-brand-cyan">
                <tr>
                  <th className="text-left px-6 py-4 font-bold text-brand-navy">
                    Feature
                  </th>
                  <th className="text-center px-6 py-4 font-bold text-brand-navy">
                    Starter
                  </th>
                  <th className="text-center px-6 py-4 font-bold text-white bg-brand-accent">
                    Professional
                  </th>
                  <th className="text-center px-6 py-4 font-bold text-brand-navy">
                    Enterprise
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row, index) => (
                  <tr
                    key={row.feature}
                    className={index % 2 === 1 ? "bg-brand-cyan-light/50" : ""}
                  >
                    <td className="px-6 py-4 font-semibold text-brand-navy">
                      {row.feature}
                    </td>
                    <td className="px-6 py-4 text-center text-brand-navy/75">
                      {row.values[0]}
                    </td>
                    <td className="px-6 py-4 text-center text-brand-navy font-semibold bg-brand-cyan/40">
                      {row.values[1]}
                    </td>
                    <td className="px-6 py-4 text-center text-brand-navy/75">
                      {row.values[2]}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-white">
        <div className="max-w-3xl mx-auto px-6 py-20 md:py-28">
          <div className="mb-12 text-center">
            <p className="text-sm font-bold text-brand-navy uppercase tracking-widest mb-3">
              FAQ
            </p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-brand-navy">
              Questions about pricing.
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq) => (
              <div
                key={faq.q}
                className="bg-brand-cyan-light/60 border border-brand-sky/40 rounded-xl p-6 hover:border-brand-accent hover:shadow-md transition"
              >
                <h3 className="text-base font-bold text-brand-navy mb-2">
                  {faq.q}
                </h3>
                <p className="text-sm text-brand-navy/75 leading-relaxed">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-brand-cyan-bright">
        <div className="max-w-7xl mx-auto px-6 py-20 md:py-24">
          <div className="relative bg-gradient-to-br from-brand-navy to-brand-navy/90 rounded-3xl px-8 md:px-16 py-14 md:py-16 text-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-brand-accent/10 via-transparent to-brand-cyan/10"></div>
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
                Start your 14-day free trial.
              </h2>
              <p className="mt-4 text-brand-cyan-light/95 text-lg max-w-2xl mx-auto leading-relaxed">
                No credit card required. Full access to every module. Cancel any
                time.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center bg-brand-accent hover:bg-brand-sky text-white font-semibold px-7 py-3.5 rounded-lg transition shadow-lg shadow-brand-accent/40"
                >
                  Get Started Free
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center border border-brand-sky/50 hover:bg-white/10 text-white font-medium px-7 py-3.5 rounded-lg transition"
                >
                  Talk to Sales →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}