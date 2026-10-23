"use client";

import { useState } from "react";

const channels = [
  {
    accent: "bg-brand-accent",
    title: "Sales",
    email: "sales@medicore.app",
    description: "For pricing, demos, and partnerships.",
  },
  {
    accent: "bg-brand-success",
    title: "Support",
    email: "support@medicore.app",
    description: "For existing customers needing help.",
  },
  {
    accent: "bg-amber-400",
    title: "Press & Partnerships",
    email: "hello@medicore.app",
    description: "For media enquiries and collaborations.",
  },
];

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [hospital, setHospital] = useState("");
  const [message, setMessage] = useState("");

  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim() || !email.trim() || !message.trim()) {
      setError("Please fill in your name, email, and message.");
      return;
    }

    setSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 700));
    setSubmitting(false);
    setSubmitted(true);
  }

  function handleReset() {
    setName("");
    setEmail("");
    setHospital("");
    setMessage("");
    setError("");
    setSubmitted(false);
  }

  return (
    <>
      {/* PAGE HERO */}
      <section className="bg-brand-cyan">
        <div className="max-w-7xl mx-auto px-6 py-20 md:py-24">
          <div className="max-w-3xl">
            <p className="text-sm font-bold text-brand-navy uppercase tracking-widest mb-3">
              Contact
            </p>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-brand-navy leading-tight">
              Let's talk about your hospital.
            </h1>
            <p className="mt-6 text-lg text-brand-navy/80 leading-relaxed">
              Whether you're exploring MediCore for the first time or already
              using it, we're here to help.
            </p>
          </div>
        </div>
      </section>

      {/* FORM + INFO */}
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-6 py-20 md:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
            {/* Form */}
            <div className="lg:col-span-3">
              <div className="bg-brand-cyan-light border border-brand-sky/50 rounded-2xl p-8 md:p-10 shadow-md">
                {submitted ? (
                  <div className="text-center py-12">
                    <div className="h-14 w-14 rounded-full bg-brand-success/15 text-brand-success flex items-center justify-center mx-auto mb-5 text-2xl font-bold">
                      ✓
                    </div>
                    <h2 className="text-2xl font-bold text-brand-navy mb-2">
                      Message sent
                    </h2>
                    <p className="text-brand-navy/75 mb-8 max-w-md mx-auto">
                      Thanks for reaching out. Someone from our team will get
                      back to you within one business day.
                    </p>
                    <button
                      onClick={handleReset}
                      className="text-sm font-semibold text-brand-accent hover:text-brand-navy underline underline-offset-4 transition"
                    >
                      Send another message
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <h2 className="text-2xl font-bold tracking-tight text-brand-navy mb-2">
                      Send us a message
                    </h2>
                    <p className="text-brand-navy/70 text-sm mb-6">
                      We typically reply within one business day.
                    </p>

                    {error && (
                      <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg border border-red-200">
                        {error}
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <Field label="Your name" required>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="input"
                          placeholder="e.g. Dr. Amara Okafor"
                        />
                      </Field>

                      <Field label="Email address" required>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="input"
                          placeholder="you@hospital.com"
                        />
                      </Field>
                    </div>

                    <Field label="Hospital name">
                      <input
                        type="text"
                        value={hospital}
                        onChange={(e) => setHospital(e.target.value)}
                        className="input"
                        placeholder="e.g. St. Mary's General Hospital"
                      />
                    </Field>

                    <Field label="Message" required>
                      <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        rows={6}
                        className="input resize-none"
                        placeholder="Tell us a bit about your hospital and what you're looking for…"
                      />
                    </Field>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full bg-brand-accent hover:bg-brand-navy text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 shadow-lg shadow-brand-accent/30"
                    >
                      {submitting ? "Sending…" : "Send Message"}
                    </button>
                  </form>
                )}
              </div>
            </div>

            {/* Contact info */}
            <div className="lg:col-span-2 space-y-5">
              {channels.map((channel) => (
                <div
                  key={channel.title}
                  className="bg-white border border-brand-sky/50 rounded-2xl p-6 hover:shadow-lg hover:border-brand-accent transition"
                >
                  <div
                    className={`h-11 w-11 rounded-xl ${channel.accent} mb-4 shadow-md`}
                  />
                  <h3 className="text-lg font-bold text-brand-navy mb-1">
                    {channel.title}
                  </h3>
                  <p className="text-sm text-brand-navy/75 mb-3">
                    {channel.description}
                  </p>
                  <a
                    href={`mailto:${channel.email}`}
                    className="text-sm font-semibold text-brand-accent hover:underline break-all"
                  >
                    {channel.email}
                  </a>
                </div>
              ))}

              <div className="bg-brand-navy text-white rounded-2xl p-6 shadow-lg relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-brand-accent/10 via-transparent to-brand-cyan/10"></div>
                <div className="relative">
                  <p className="text-xs font-bold text-brand-sky uppercase tracking-widest mb-3">
                    Head office
                  </p>
                  <p className="text-sm text-brand-cyan-light/90 leading-relaxed">
                    MediCore Technologies
                    <br />
                    14 Innovation Way
                    <br />
                    Victoria Island
                    <br />
                    Lagos, Nigeria
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Reusable input styling */}
      <style jsx global>{`
        .input {
          width: 100%;
          border: 1px solid #9dd1ff;
          border-radius: 0.5rem;
          padding: 0.625rem 0.875rem;
          font-size: 0.875rem;
          background: white;
          color: #01233f;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .input:focus {
          border-color: #4aa9e8;
          box-shadow: 0 0 0 3px rgba(74, 169, 232, 0.2);
        }
        .input::placeholder {
          color: rgba(1, 35, 63, 0.4);
        }
      `}</style>
    </>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-brand-navy mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}