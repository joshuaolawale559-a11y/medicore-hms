import Link from "next/link";

const solutionsByType = [
  {
    accent: "bg-brand-accent",
    eyebrow: "For",
    title: "Private Clinics",
    description:
      "Small teams with big ambitions. MediCore gives you the tools big hospitals have — without the complexity or cost.",
    highlights: [
      "Quick setup for a single location",
      "Affordable per-staff pricing",
      "Patient records and appointments in one place",
      "Digital billing that reduces revenue leakage",
    ],
  },
  {
    accent: "bg-brand-success",
    eyebrow: "For",
    title: "General Hospitals",
    description:
      "From 20 beds to 500, run every department from one platform. Admissions, transfers, and discharges without the paperwork.",
    highlights: [
      "Ward and bed management across departments",
      "Staff duty rosters and shift scheduling",
      "Real-time visibility for administrators",
      "Multi-department billing and reporting",
    ],
  },
  {
    accent: "bg-amber-400",
    eyebrow: "For",
    title: "Specialist Centers",
    description:
      "Cardiology, oncology, pediatrics — no matter your specialty, MediCore adapts to your specific workflows.",
    highlights: [
      "Custom modules for your specialty",
      "Specialized patient records and diagnostics",
      "Cross-referral between specialists",
      "Detailed clinical reporting",
    ],
  },
  {
    accent: "bg-purple-500",
    eyebrow: "For",
    title: "Diagnostic Labs",
    description:
      "Sample tracking, result management, and patient communication — all from one system.",
    highlights: [
      "Sample tracking from collection to result",
      "Digital delivery of results to patients and doctors",
      "Integration with hospital EMRs",
      "Analytics on turnaround times",
    ],
  },
];

const solutionsByRole = [
  {
    accent: "bg-brand-accent",
    role: "Administrators",
    description:
      "Live dashboards, revenue reports, staff activity, and full system control.",
  },
  {
    accent: "bg-brand-success",
    role: "Doctors",
    description:
      "Full patient histories, quick prescriptions, and a clear view of your daily schedule.",
  },
  {
    accent: "bg-rose-500",
    role: "Nurses",
    description:
      "Vitals, ward updates, and care notes — recorded in seconds and visible to the whole care team.",
  },
  {
    accent: "bg-amber-400",
    role: "Front Desk",
    description:
      "Fast patient registration, appointment booking, and simple billing at the point of contact.",
  },
  {
    accent: "bg-purple-500",
    role: "Pharmacists",
    description:
      "Electronic prescriptions, real-time inventory, and alerts before stock runs low.",
  },
];

export default function SolutionsPage() {
  return (
    <>
      {/* PAGE HERO */}
      <section className="bg-brand-cyan">
        <div className="max-w-7xl mx-auto px-6 py-20 md:py-24">
          <div className="max-w-3xl">
            <p className="text-sm font-bold text-brand-navy uppercase tracking-widest mb-3">
              Solutions
            </p>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-brand-navy leading-tight">
              Built for every kind of hospital.
            </h1>
            <p className="mt-6 text-lg text-brand-navy/80 leading-relaxed">
              Whether you run a small clinic or a multi-branch teaching
              hospital, MediCore adapts to how you work — not the other way
              around.
            </p>
          </div>
        </div>
      </section>

      {/* BY TYPE */}
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-6 py-20 md:py-28">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {solutionsByType.map((solution) => (
              <div
                key={solution.title}
                className="bg-white border border-brand-sky/50 rounded-2xl p-8 hover:shadow-2xl hover:border-brand-accent hover:-translate-y-1 transition-all duration-200"
              >
                <div className="flex items-center gap-3 mb-5">
                  <div
                    className={`h-11 w-11 rounded-xl ${solution.accent} flex items-center justify-center shadow-md`}
                  >
                    <span className="h-3.5 w-3.5 rounded-sm bg-white/95"></span>
                  </div>
                  <p className="text-xs font-bold text-brand-navy/70 uppercase tracking-widest">
                    {solution.eyebrow}
                  </p>
                </div>

                <h3 className="text-2xl font-bold tracking-tight text-brand-navy mb-3">
                  {solution.title}
                </h3>
                <p className="text-brand-navy/75 leading-relaxed mb-6">
                  {solution.description}
                </p>

                <ul className="space-y-2.5">
                  {solution.highlights.map((highlight) => (
                    <li key={highlight} className="flex items-start gap-3">
                      <span
                        className={`mt-1.5 h-2 w-2 rounded-full ${solution.accent} flex-shrink-0 shadow-sm`}
                      />
                      <span className="text-sm text-brand-navy/80 leading-relaxed font-medium">
                        {highlight}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BY ROLE */}
      <section className="bg-brand-cyan-bright">
        <div className="max-w-7xl mx-auto px-6 py-20 md:py-28">
          <div className="max-w-2xl mb-14">
            <p className="text-sm font-bold text-brand-navy uppercase tracking-widest mb-3">
              Built for every role
            </p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-brand-navy">
              Everyone on your team gets the tools they need.
            </h2>
            <p className="mt-4 text-brand-navy/80 text-lg leading-relaxed">
              MediCore is designed around how hospital staff actually work —
              each role sees exactly what they need and nothing they don't.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {solutionsByRole.map((solution) => (
              <div
                key={solution.role}
                className="bg-white border border-brand-sky/50 rounded-xl p-6 hover:shadow-xl hover:border-brand-accent hover:-translate-y-0.5 transition-all"
              >
                <div
                  className={`h-11 w-11 rounded-xl ${solution.accent} mb-4 shadow-md`}
                />
                <h3 className="text-lg font-bold text-brand-navy mb-2">
                  {solution.role}
                </h3>
                <p className="text-sm text-brand-navy/75 leading-relaxed">
                  {solution.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-6 py-20 md:py-24">
          <div className="relative bg-gradient-to-br from-brand-navy to-brand-navy/90 rounded-3xl px-8 md:px-16 py-14 md:py-16 text-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-brand-accent/10 via-transparent to-brand-cyan/10"></div>
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
                See how MediCore fits your hospital.
              </h2>
              <p className="mt-4 text-brand-cyan-light/95 text-lg max-w-2xl mx-auto leading-relaxed">
                Start free, or talk to us about your specific setup. We'll help
                you get the most out of the platform.
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