import Link from "next/link";

function FooterColumn({
  title,
  links,
  accent,
}: {
  title: string;
  links: { label: string; href: string }[];
  accent: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <span className={`h-2 w-2 rounded-full ${accent}`} />
        <h4 className="text-sm font-bold text-white">{title}</h4>
      </div>
      <ul className="space-y-2.5">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-sm text-brand-cyan-light/75 hover:text-brand-cyan transition"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Footer() {
  return (
    <footer className="bg-brand-navy text-brand-cyan-light/75 relative overflow-hidden">
      {/* Subtle accent glow */}
      <div className="absolute inset-0 bg-gradient-to-tr from-brand-accent/10 via-transparent to-brand-cyan/10 pointer-events-none"></div>
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-accent/60 to-transparent"></div>

      <div className="relative max-w-7xl mx-auto px-6 py-14">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <div className="h-9 w-9 rounded-lg bg-brand-accent text-white flex items-center justify-center font-bold text-lg shadow-md shadow-brand-accent/40">
                M
              </div>
              <span className="text-lg font-bold text-white tracking-tight">
                MediCore
              </span>
            </Link>
            <p className="text-sm text-brand-cyan-light/70 leading-relaxed">
              The operating system for modern hospitals.
            </p>

            <div className="mt-5 flex items-center gap-2 text-xs text-brand-cyan-light/60">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-success"></span>
              All systems operational
            </div>
          </div>

          <FooterColumn
            title="Product"
            accent="bg-brand-accent"
            links={[
              { label: "Features", href: "/features" },
              { label: "Solutions", href: "/solutions" },
              { label: "Pricing", href: "/pricing" },
              { label: "Security", href: "/security" },
            ]}
          />

          <FooterColumn
            title="Company"
            accent="bg-brand-success"
            links={[
              { label: "About", href: "/about" },
              { label: "Contact", href: "/contact" },
              { label: "Careers", href: "/careers" },
              { label: "Blog", href: "/blog" },
            ]}
          />

          <FooterColumn
            title="Resources"
            accent="bg-amber-400"
            links={[
              { label: "Documentation", href: "/docs" },
              { label: "Help Center", href: "/help" },
              { label: "Status", href: "/status" },
              { label: "API", href: "/api-docs" },
            ]}
          />

          <FooterColumn
            title="Legal"
            accent="bg-purple-500"
            links={[
              { label: "Privacy Policy", href: "/privacy" },
              { label: "Terms of Service", href: "/terms" },
              { label: "HIPAA", href: "/hipaa" },
              { label: "NDPR", href: "/ndpr" },
            ]}
          />
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <p className="text-brand-cyan-light/60">
            © 2026 MediCore. All rights reserved.
          </p>
          <p className="text-brand-cyan-light/60">
            Built with care, for those who care.
          </p>
        </div>
      </div>
    </footer>
  );
}