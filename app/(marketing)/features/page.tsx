import Link from "next/link";

const modules = [
  {
    accent: "bg-brand-accent",
    badge: "01",
    title: "Patient Records (EMR)",
    tagline: "Every patient, one complete history.",
    description:
      "Give every doctor, nurse, and pharmacist instant access to a patient's full medical history — securely and with a complete audit trail.",
    bullets: [
      "Comprehensive patient profiles with demographics and contact info",
      "Full visit history — notes, diagnoses, and treatment plans",
      "Prescription history and drug interaction warnings",
      "Lab results and imaging references attached to records",
      "Search across millions of records in milliseconds",
    ],
  },
  {
    accent: "bg-brand-success",
    badge: "02",
    title: "Appointments & Scheduling",
    tagline: "No more double-bookings. No more no-shows.",
    description:
      "Manage every appointment across every department from one calendar. Patients get reminders. Staff see exactly who's coming in.",
    bullets: [
      "Book, reschedule and cancel appointments in seconds",
      "Cross-department scheduling with doctor availability",
      "Automated SMS and email reminders to patients",
      "Waitlist management to fill last-minute gaps",
      "Daily, weekly and monthly calendar views",
    ],
  },
  {
    accent: "bg-amber-400",
    badge: "03",
    title: "Billing & Invoicing",
    tagline: "Every charge accounted for. Every payment tracked.",
    description:
      "Generate accurate bills for consultations, tests, pharmacy and admissions. Track payments and outstanding balances in real time.",
    bullets: [
      "Auto-generated invoices from services rendered",
      "Support for consultations, tests, admissions and pharmacy",
      "Partial payments and installment tracking",
      "Detailed revenue reports by department",
      "Multiple payment methods: cash, card, transfer",
    ],
  },
  {
    accent: "bg-purple-500",
    badge: "04",
    title: "Pharmacy & Inventory",
    tagline: "Right drug. Right patient. Right time.",
    description:
      "Track every drug in your pharmacy, dispense prescriptions electronically, and get alerted before stock runs out or expires.",
    bullets: [
      "Real-time stock levels across all pharmacy locations",
      "Low-stock and expiry alerts before it's too late",
      "Electronic prescription dispensing with audit trail",
      "Batch and expiry date tracking per drug",
      "Supplier and purchase order management",
    ],
  },
  {
    accent: "bg-rose-500",
    badge: "05",
    title: "Ward & Bed Management",
    tagline: "Know exactly who's where, always.",
    description:
      "A live view of every bed, every ward, every admission. Admit, transfer, and discharge patients with a single click.",
    bullets: [
      "Live bed availability across every ward",
      "Admissions, transfers and discharges fully logged",
      "Occupancy reporting for administrators",
      "Nurse assignment per ward and shift",
      "Cleaning status per bed between patients",
    ],
  },
  {
    accent: "bg-brand-navy",
    badge: "06",
    title: "Admin Dashboard & Reports",
    tagline: "See your entire hospital at a glance.",
    description:
      "Real-time visibility into patients, revenue, occupancy and staff activity — all from one central dashboard.",
    bullets: [
      "Live KPIs for patients, revenue, and occupancy",
      "Custom reports per department or date range",
      "Revenue and expense breakdowns",
      "Staff activity and audit trail review",
      "Export to PDF or Excel for board meetings",
    ],
  },
];

const extras = [
  { title: "Audit logs", description: "Every action traceable to a specific user." },
  { title: "Two-factor authentication", description: "Add an extra layer of login security." },
  { title: "Data export", description: "Export any dataset to CSV or PDF." },
  { title: "Multi-branch support", description: "Run multiple hospital locations from one account." },
  { title: "Role-based access", description: "Staff see only what their role requires." },
  { title: "Automated backups", description: "Nightly encrypted backups of all data." },
];

export default function FeaturesPage() {
  return (
    <>
      {/* PAGE HERO */}
      <section className="bg-brand-cyan">
        <div className="max-w-7xl mx-auto px-6 py-20 md:py-24">
          <div className="max-w-3xl">
            <p className="text-sm font-bold text-brand-navy uppercase tracking-widest mb-3">
              Features
            </p>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-brand-navy leading-tight">
              Every module your hospital needs, in one platform.
            </h1>
            <p className="mt-6 text-lg text-brand-navy/80 leading-relaxed">
              MediCore replaces the entire stack of disconnected tools your
              hospital uses today — from patient records to pharmacy, from
              appointments to billing. Explore each module below.
            </p>
          </div>
        </div>
      </section>

      {/* MODULE SECTIONS */}
      {modules.map((mod, index) => {
        const isEven = index % 2 === 0;
        return (
          <section
            key={mod.badge}
            className={isEven ? "bg-white" : "bg-brand-cyan-light"}
          >
            <div className="max-w-7xl mx-auto px-6 py-16 md:py-20">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                <div
                  className={`lg:col-span-5 ${
                    isEven ? "lg:order-1" : "lg:order-2"
                  }`}
                >
                  <div
                    className={`inline-flex items-center gap-3 mb-5 ${mod.accent} text-white px-3 py-1.5 rounded-lg shadow-md`}
                  >
                    <span className="text-xs font-bold tracking-wider">
                      MODULE {mod.badge}
                    </span>
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-brand-navy">
                    {mod.title}
                  </h2>
                  <p className="mt-3 text-lg font-semibold text-brand-accent">
                    {mod.tagline}
                  </p>
                  <p className="mt-4 text-brand-navy/75 leading-relaxed">
                    {mod.description}
                  </p>
                </div>

                <div
                  className={`lg:col-span-7 ${
                    isEven ? "lg:order-2" : "lg:order-1"
                  }`}
                >
                  <div className="bg-white border border-brand-sky/50 rounded-2xl p-8 shadow-md">
                    <p className="text-xs font-bold text-brand-navy/70 uppercase tracking-widest mb-5">
                      What it does
                    </p>
                    <ul className="space-y-4">
                      {mod.bullets.map((bullet) => (
                        <li key={bullet} className="flex items-start gap-3">
                          <span
                            className={`mt-1.5 h-2 w-2 rounded-full ${mod.accent} flex-shrink-0 shadow-sm`}
                          />
                          <span className="text-sm text-brand-navy/80 leading-relaxed font-medium">
                            {bullet}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>
        );
      })}

      {/* BUILT-IN EXTRAS */}
      <section className="bg-brand-cyan-bright">
        <div className="max-w-7xl mx-auto px-6 py-20 md:py-28">
          <div className="max-w-2xl mb-14">
            <p className="text-sm font-bold text-brand-navy uppercase tracking-widest mb-3">
              Also included
            </p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-brand-navy">
              And every detail your team will ask about.
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {extras.map((extra) => (
              <div
                key={extra.title}
                className="bg-white border border-brand-sky/50 rounded-xl p-5 hover:shadow-xl hover:border-brand-accent hover:-translate-y-0.5 transition-all"
              >
                <h3 className="text-base font-bold text-brand-navy mb-1.5">
                  {extra.title}
                </h3>
                <p className="text-sm text-brand-navy/75 leading-relaxed">
                  {extra.description}
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
                See it in action.
              </h2>
              <p className="mt-4 text-brand-cyan-light/95 text-lg max-w-2xl mx-auto leading-relaxed">
                Start using MediCore today, or book a walkthrough with our team
                to see how it fits your hospital.
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
                  Book a Demo →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}