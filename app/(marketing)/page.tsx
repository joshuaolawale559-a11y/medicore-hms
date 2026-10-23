import Link from "next/link";

export default function Home() {
  return (
    <>
      {/* HERO — brighter cyan */}
      <section className="bg-brand-cyan">
        <div className="max-w-7xl mx-auto px-6 py-20 md:py-28 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-white text-brand-navy text-xs font-semibold px-3 py-1.5 rounded-full mb-6 border border-brand-sky shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-accent animate-pulse"></span>
              Built for hospitals, clinics & diagnostic centers
            </div>

            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-brand-navy leading-[1.05]">
              The operating system for{" "}
              <span className="text-brand-accent">modern hospitals.</span>
            </h1>

            <p className="mt-6 text-lg text-brand-navy/80 leading-relaxed max-w-xl">
              MediCore brings patient records, appointments, billing, pharmacy
              and staff operations into one secure platform — so your team can
              focus on care, not paperwork.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link
                href="/register"
                className="inline-flex items-center justify-center bg-brand-accent hover:bg-brand-navy text-white font-semibold px-6 py-3 rounded-lg transition shadow-lg shadow-brand-accent/30"
              >
                Get Started 
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center bg-white hover:bg-brand-cyan-light text-brand-navy font-medium px-6 py-3 rounded-lg border border-brand-sky transition shadow-sm"
              >
                Request a Demo →
              </Link>
            </div>

            <div className="mt-10 flex items-center gap-6 text-xs font-medium text-brand-navy/75">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-brand-success"></span>
                HIPAA-aligned architecture
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-brand-success"></span>
                Role-based access control
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-6 bg-gradient-to-tr from-brand-sky via-brand-cyan to-transparent rounded-3xl blur-2xl opacity-80"></div>

            <div className="relative bg-white rounded-2xl shadow-2xl shadow-brand-navy/15 border border-brand-sky/60 overflow-hidden">
              <div className="flex items-center gap-1.5 px-4 py-3 border-b border-brand-cyan bg-brand-cyan-light">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400"></span>
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400"></span>
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400"></span>
                <span className="ml-3 text-xs text-brand-navy/60 font-medium">
                  medicore.app/dashboard
                </span>
              </div>

              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-xs text-brand-navy/55 uppercase tracking-wide">
                      Dashboard
                    </p>
                    <p className="text-lg font-semibold text-brand-navy">
                      Good morning, Dr. Okafor
                    </p>
                  </div>
                  <div className="h-9 w-9 rounded-full bg-brand-accent text-white flex items-center justify-center text-sm font-semibold shadow-md shadow-brand-accent/30">
                    AO
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-5">
                  <MockStat label="Patients" value="1,248" accent="bg-brand-accent" />
                  <MockStat label="Today" value="87" accent="bg-amber-400" />
                  <MockStat label="Beds" value="62%" accent="bg-brand-success" />
                </div>

                <div className="bg-brand-cyan-light rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-medium text-brand-navy/80">
                      Appointments this week
                    </p>
                    <p className="text-xs text-brand-success font-bold">+12%</p>
                  </div>
                  <div className="flex items-end gap-1.5 h-16">
                    {[40, 55, 35, 70, 60, 85, 50].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 bg-brand-accent rounded-t transition-all hover:bg-brand-navy"
                        style={{ height: `${h}%` }}
                      ></div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  {[
                    { name: "Adaeze Nwosu", time: "09:30", dept: "Cardiology" },
                    { name: "Ibrahim Musa", time: "10:15", dept: "General" },
                    { name: "Chinelo Eze", time: "11:00", dept: "Pediatrics" },
                  ].map((row) => (
                    <div
                      key={row.name}
                      className="flex items-center justify-between text-xs py-2 border-b border-brand-cyan/60 last:border-0"
                    >
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-brand-cyan-deep flex items-center justify-center text-[10px] font-bold text-brand-navy">
                          {row.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </div>
                        <span className="font-semibold text-brand-navy">
                          {row.name}
                        </span>
                      </div>
                      <span className="text-brand-navy/60">
                        {row.time} · {row.dept}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST BAR */}
      <section className="bg-white border-y border-brand-cyan">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <p className="text-center text-xs font-semibold text-brand-navy/60 uppercase tracking-widest mb-6">
            Trusted by hospitals, clinics & diagnostic centers across Africa
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4">
            {[
              "St. Mary's General",
              "Lagoon Specialist",
              "Meridian Health",
              "Cedar Medical Center",
              "Riverside Clinic",
            ].map((name) => (
              <span
                key={name}
                className="text-brand-navy/70 font-bold tracking-tight text-lg hover:text-brand-accent transition cursor-default"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES — richer cyan background */}
      <section className="bg-brand-cyan-bright">
        <div className="max-w-7xl mx-auto px-6 py-20 md:py-28">
          <div className="max-w-2xl mb-14">
            <p className="text-sm font-bold text-brand-navy uppercase tracking-widest mb-3">
              Everything in one place
            </p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-brand-navy">
              Every module your hospital relies on, built into one platform.
            </h2>
            <p className="mt-4 text-brand-navy/80 text-lg leading-relaxed">
              No more juggling spreadsheets, paper files and disconnected
              software. MediCore replaces the whole stack.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <FeatureCard
              accent="bg-brand-accent"
              icon="bg-brand-accent"
              title="Patient Records (EMR)"
              description="Digital patient profiles with medical history, visit notes, diagnoses, prescriptions and lab results — all in one place."
            />
            <FeatureCard
              accent="bg-brand-success"
              icon="bg-brand-success"
              title="Appointments & Scheduling"
              description="Book, reschedule and track appointments across departments and doctors. Automated reminders keep no-shows low."
            />
            <FeatureCard
              accent="bg-amber-400"
              icon="bg-amber-400"
              title="Billing & Invoicing"
              description="Generate bills for consultations, tests and admissions. Track payments and outstanding balances in real time."
            />
            <FeatureCard
              accent="bg-purple-500"
              icon="bg-purple-500"
              title="Pharmacy & Inventory"
              description="Track drug stock, dispense prescriptions, and flag low inventory or expiring items before they become a problem."
            />
            <FeatureCard
              accent="bg-rose-500"
              icon="bg-rose-500"
              title="Ward & Bed Management"
              description="Track bed availability, admissions, transfers and discharges across every ward in your facility."
            />
            <FeatureCard
              accent="bg-brand-navy"
              icon="bg-brand-navy"
              title="Admin Dashboard & Reports"
              description="Real-time visibility into patients, revenue, occupancy and staff activity — all from a central dashboard."
            />
          </div>
        </div>
      </section>

      {/* HOW IT WORKS — subtle cyan tint */}
      <section className="bg-brand-cyan-light">
        <div className="max-w-7xl mx-auto px-6 py-20 md:py-28">
          <div className="max-w-2xl mb-14">
            <p className="text-sm font-bold text-brand-accent uppercase tracking-widest mb-3">
              How it works
            </p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-brand-navy">
              From sign-up to live in under a week.
            </h2>
            <p className="mt-4 text-brand-navy/80 text-lg leading-relaxed">
              We've made onboarding simple so your team can focus on care, not
              configuration.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <StepCard
              number={1}
              title="Register your hospital"
              description="Fill in your hospital's details, set up your admin account, and get instant access to your workspace."
            />
            <StepCard
              number={2}
              title="Configure your modules"
              description="Add your departments, doctors, wards and services. Import existing patient records if you need to."
            />
            <StepCard
              number={3}
              title="Go live"
              description="Invite your staff, start scheduling appointments, and manage everything from one secure dashboard."
            />
          </div>
        </div>
      </section>

      {/* SECURITY */}
      <section className="bg-brand-navy text-white">
        <div className="max-w-7xl mx-auto px-6 py-20 md:py-28">
          <div className="max-w-2xl mb-14">
            <p className="text-sm font-bold text-brand-sky uppercase tracking-widest mb-3">
              Security & compliance
            </p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Built for the most sensitive data there is.
            </h2>
            <p className="mt-4 text-brand-cyan-light/90 text-lg leading-relaxed">
              Patient information demands the highest standard of care.
              MediCore is engineered from the ground up with security,
              privacy and auditability in mind.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <SecurityCard
              title="End-to-end encryption"
              description="All data is encrypted in transit (TLS 1.3) and at rest (AES-256). Passwords are hashed with industry-standard algorithms."
            />
            <SecurityCard
              title="Role-based access control"
              description="Every staff member sees only what their role requires — nothing more. Doctors, nurses, pharmacists and admins have distinct permissions."
            />
            <SecurityCard
              title="Full audit trail"
              description="Every action on a record is logged and traceable — who did what, when, and on which patient. Nothing happens off the record."
            />
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-6 py-20 md:py-28">
          <div className="relative bg-gradient-to-br from-brand-navy to-brand-navy/90 rounded-3xl px-8 md:px-16 py-16 md:py-20 text-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-brand-accent/10 via-transparent to-brand-cyan/10"></div>
            <div className="relative z-10">
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white">
                Ready to modernize your hospital?
              </h2>
              <p className="mt-5 text-brand-cyan-light/95 text-lg max-w-2xl mx-auto leading-relaxed">
                Join hospitals across Africa using MediCore to reduce paperwork,
                cut errors, and give their teams more time for care.
              </p>

              <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center bg-brand-accent hover:bg-brand-sky text-white font-semibold px-7 py-3.5 rounded-lg transition shadow-lg shadow-brand-accent/40"
                >
                  Get Started 
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center border border-brand-sky/50 hover:bg-white/10 text-white font-medium px-7 py-3.5 rounded-lg transition"
                >
                  Talk to Sales
                </Link>
              </div>

              <p className="mt-6 text-xs text-brand-cyan-light/80">
                No credit card required · Free setup assistance · Cancel anytime
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function MockStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="bg-white border border-brand-cyan rounded-lg p-3 shadow-sm">
      <div className={`h-1 w-6 rounded ${accent} mb-2`} />
      <p className="text-[10px] text-brand-navy/60 uppercase tracking-wide font-medium">
        {label}
      </p>
      <p className="text-lg font-bold text-brand-navy">{value}</p>
    </div>
  );
}

function FeatureCard({
  accent,
  title,
  description,
}: {
  accent: string;
  icon?: string;
  title: string;
  description: string;
}) {
  return (
    <div className="group bg-white border border-brand-sky/50 rounded-xl p-6 hover:shadow-2xl hover:border-brand-accent hover:-translate-y-1 transition-all duration-200">
      <div
        className={`h-12 w-12 rounded-xl ${accent} flex items-center justify-center mb-5 shadow-md`}
      >
        <span className="h-4 w-4 rounded-sm bg-white/95"></span>
      </div>
      <h3 className="text-lg font-bold text-brand-navy mb-2 group-hover:text-brand-accent transition">
        {title}
      </h3>
      <p className="text-sm text-brand-navy/75 leading-relaxed">
        {description}
      </p>
    </div>
  );
}

function StepCard({
  number,
  title,
  description,
}: {
  number: number;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-brand-sky/30 hover:shadow-lg transition">
      <div className="flex items-center gap-4 mb-4">
        <div className="h-12 w-12 rounded-full bg-brand-accent text-white flex items-center justify-center font-bold text-lg shadow-lg shadow-brand-accent/30">
          {number}
        </div>
        <div className="h-0.5 flex-1 bg-gradient-to-r from-brand-accent to-transparent rounded-full" />
      </div>
      <h3 className="text-lg font-bold text-brand-navy mb-2">{title}</h3>
      <p className="text-sm text-brand-navy/75 leading-relaxed">
        {description}
      </p>
    </div>
  );
}

function SecurityCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="border border-white/15 rounded-xl p-6 bg-white/5 hover:bg-white/10 hover:border-brand-sky/40 transition">
      <div className="h-12 w-12 rounded-xl bg-brand-accent flex items-center justify-center mb-4 shadow-lg shadow-brand-accent/30">
        <span className="h-4 w-4 rounded-sm bg-white/95"></span>
      </div>
      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
      <p className="text-sm text-brand-cyan-light/90 leading-relaxed">
        {description}
      </p>
    </div>
  );
}