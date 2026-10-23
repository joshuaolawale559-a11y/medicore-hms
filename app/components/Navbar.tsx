import Link from "next/link";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-brand-cyan">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-lg bg-brand-accent text-white flex items-center justify-center font-bold text-lg shadow-sm">
            M
          </div>
          <span className="text-xl font-bold tracking-tight text-brand-navy">
            MediCore
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-brand-navy/80">
          <Link href="/" className="hover:text-brand-accent transition">
            Home
          </Link>
          <Link href="/features" className="hover:text-brand-accent transition">
            Features
          </Link>
          <Link href="/solutions" className="hover:text-brand-accent transition">
            Solutions
          </Link>
          <Link href="/pricing" className="hover:text-brand-accent transition">
            Pricing
          </Link>
          <Link href="/about" className="hover:text-brand-accent transition">
            About
          </Link>
        </nav>

        <div className="flex items-center gap-3">
                    <Link
            href="/login"
            className="text-sm font-medium text-brand-navy/80 hover:text-brand-accent transition"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="text-sm font-medium text-white bg-brand-accent hover:bg-brand-navy px-4 py-2 rounded-lg transition shadow-sm"
          >
            Get Started
          </Link>
        </div>
      </div>
    </header>
  );
}