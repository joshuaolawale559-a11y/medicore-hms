
import Link from "next/link";

const stats = [
  { value: "500+", label: "Hospitals onboarded" },
  { value: "2M+", label: "Patient records managed" },
  { value: "99.9%", label: "Platform uptime" },
  { value: "24/7", label: "Support availability" },
];

const principles = [
  {
    accent: "bg-brand-accent",
    title: "Security is not optional",
    description:
      "Every architectural decision we make starts with one question: does this protect patient data? Encryption, auditability, and access control are foundational — not afterthoughts.",
  },
  {
    accent: "bg-brand-success",
    title: "Built with hospital staff",
    description:
      "We don't design in isolation. Every module is shaped by feedback from real doctors, nurses, pharmacists and administrators who use MediCore every day.",
  },
  {
    accent: "bg-amber-400",
    title: "Relentlessly simple",
    description:
      "Hospital software is notorious for being confusing. We aim for the opposite — an interface that feels obvious from the first click.",
  },
  {
    accent: "bg-purple-500",
    title: "Made for African hospitals",
    description:
      "MediCore is designed with the realities of African healthcare in mind — variable connectivity, growing facilities, and teams doing more with less.",
  },
];

export default function AboutPage() {
  return (
    <>
      {/* PAGE HERO */}
      <section className="bg-brand-cyan">
        <div className="max-w-7xl mx-auto px-6 py-20 md:py-28">
          <div className="max-w-3xl">
            <p className="text-sm font-bold text-brand-navy uppercase tracking-widest mb-3">
              About us
            </p>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-brand-navy leading-tight">
              We're building the platform hospitals deserve.
            </h1>
            <p className="mt-6 text-lg text-brand-navy/80 leading-relaxed">
              MediCore exists to replace the paperwork, spreadsheets, and
              disconnected tools that slow hospitals down — with one secure
              platform built for how care teams actually work.
            </p>
          </div>
        </div>
      </section>

      {/* MISSION */}
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-6 py-20 md:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            <div>
              <p className="text-sm font-bold text-brand-accent uppercase tracking-widest mb-3">
                Our mission
              </p>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-brand-navy leading-tight">
                Every hospital deserves great software.
              </h2>
              <div className="mt-6 space-y-4 text-brand-navy/75 leading-relaxed">
                <p>
                  For decades, hospital management has meant paper files,
                  spreadsheets, and software built for the 1990s. Staff spend
                  hours on administration that should take minutes. Patients
                  suffer because records get lost, appointments get missed, and
                  revenue gets untracked.
                </p>
                <p>
                  We started MediCore because we believe modern healthcare
                  deserves modern tools. Not tools that add complexity — tools
                  that remove it. Tools that make a nurse's shift easier, a
                  doctor's diagnosis faster, and an administrator's day calmer.
                </p>
                <p>
                  Every feature we ship is designed with one goal: help
                  hospitals deliver better care.
                </p>
              </div>
            </div>

            <div className="bg-brand-cyan-light border border-brand-sky/50 rounded-2xl p-8 lg:sticky lg:top-24 shadow-md">
              <p className="text-xs font-bold text-brand-navy/70 uppercase tracking-widest mb-6">
                At a glance
              </p>
              <div className="space-y-6">
                {stats.map((stat) => (
                  <div key={stat.label} className="flex items-baseline gap-4">
                    <span className="text-4xl font-bold tracking-tight text-brand-accent min-w-[110px]">
                      {stat.value}
                    </span>
                    <span className="text-sm font-medium text-brand-navy/80">
                      {stat.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRINCIPLES */}
      <section className="bg-brand-cyan-bright">
        <div className="max-w-7xl mx-auto px-6 py-20 md:py-28">
          <div className="max-w-2xl mb-14">
            <p className="text-sm font-bold text-brand-navy uppercase tracking-widest mb-3">
              What we believe
            </p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-brand-navy">
              Principles that shape every decision.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {principles.map((principle) => (
              <div
                key={principle.title}
                className="bg-white border border-brand-sky/50 rounded-2xl p-7 hover:shadow-2xl hover:border-brand-accent hover:-translate-y-1 transition-all duration-200"
              >
                <div
                  className={`h-11 w-11 rounded-xl ${principle.accent} mb-5 shadow-md`}
                />
                <h3 className="text-xl font-bold text-brand-navy mb-3">
                  {principle.title}
                </h3>
                <p className="text-brand-navy/75 leading-relaxed text-sm">
                  {principle.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHO WE ARE */}
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-6 py-20 md:py-28">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-sm font-bold text-brand-accent uppercase tracking-widest mb-3">
              Who we are
            </p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-brand-navy mb-6">
              A small team with a clear focus.
            </h2>
            <p className="text-lg text-brand-navy/75 leading-relaxed mb-4">
              MediCore is built by a focused team of engineers, designers, and
              healthcare specialists who have spent years working with hospitals
              — both inside them and alongside them.
            </p>
            <p className="text-lg text-brand-navy/75 leading-relaxed">
              We're not trying to be everything to everyone. We're building one
              thing: the best hospital management platform for the markets we
              serve.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-brand-cyan-light">
        <div className="max-w-7xl mx-auto px-6 py-20 md:py-24">
          <div className="relative bg-gradient-to-br from-brand-navy to-brand-navy/90 rounded-3xl px-8 md:px-16 py-14 md:py-16 text-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-brand-accent/10 via-transparent to-brand-cyan/10"></div>
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
                Ready to join us?
              </h2>
              <p className="mt-4 text-brand-cyan-light/95 text-lg max-w-2xl mx-auto leading-relaxed">
                Thousands of hospitals across Africa trust MediCore with their
                most sensitive data. Yours could be next.
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
                  Contact Us →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}