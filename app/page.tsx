import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  QrCode,
  Smartphone,
  Sparkles,
  Zap,
  UtensilsCrossed,
} from "lucide-react";
import { ROUTES } from "@/constants/routes";

export default function HomePage() {
  return (
    <div className="relative min-h-screen bg-zinc-950 text-zinc-100 selection:bg-amber-500/20 selection:text-amber-300">
      {/* Background Subtle Gradient Mesh */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[900px] rounded-full bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-transparent blur-3xl" />
        <div className="absolute top-1/3 -left-40 h-[400px] w-[500px] rounded-full bg-slate-800/20 blur-3xl" />
      </div>

      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-zinc-800/80 bg-zinc-950/75 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href={ROUTES.HOME} className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-900 border border-zinc-800 text-amber-400 transition group-hover:border-amber-500/40">
              <UtensilsCrossed className="h-4 w-4" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white">
              DZ<span className="text-amber-400">Menu</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
            <a href="#features" className="transition hover:text-white">
              Features
            </a>
            <a href="#how-it-works" className="transition hover:text-white">
              How It Works
            </a>
            <a href="#pricing" className="transition hover:text-white">
              Pricing
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href={ROUTES.LOGIN}
              className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:bg-zinc-800 hover:text-white hover:border-zinc-700"
            >
              Sign In
            </Link>
            <Link
              href={ROUTES.REGISTER}
              className="hidden sm:inline-flex rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-zinc-950 transition hover:bg-amber-400"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-6 pt-20 pb-24 md:pt-28 md:pb-32">
        <div className="mx-auto max-w-4xl text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3.5 py-1 text-xs font-medium text-amber-300 backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            Next-Generation Digital Restaurant Menus
          </div>

          {/* Main Headline */}
          <h1 className="mt-8 text-4xl font-extrabold tracking-tight text-white sm:text-6xl sm:leading-[1.15]">
            Elevate Your Restaurant&apos;s{" "}
            <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-amber-500 bg-clip-text text-transparent">
              Dining Experience
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-lg leading-relaxed text-zinc-400 sm:text-xl max-w-2xl mx-auto font-normal">
            Replace static paper menus with fast, beautifully curated digital menus
            accessible instantly via dynamic QR codes. Update prices, items, and availability
            in real time.
          </p>

          {/* Action CTAs */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href={ROUTES.REGISTER}
              className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-lg bg-amber-500 px-6 py-3.5 text-base font-semibold text-zinc-950 transition hover:bg-amber-400 shadow-lg shadow-amber-500/10"
            >
              Get Started
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#features"
              className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/60 px-6 py-3.5 text-base font-medium text-zinc-300 transition hover:bg-zinc-800 hover:text-white hover:border-zinc-700"
            >
              Explore Features
            </a>
          </div>

          {/* Micro Trust Indicators */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-zinc-500">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-amber-400" />
              <span>No App Download Required</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-amber-400" />
              <span>Instant Real-Time Sync</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-amber-400" />
              <span>Print Once, Update Forever</span>
            </div>
          </div>
        </div>

        {/* Hero Interactive Visual Mockup */}
        <div className="mx-auto mt-16 max-w-4xl">
          <div className="relative rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 shadow-2xl backdrop-blur-sm sm:p-8">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-red-500/60" />
                <div className="h-3 w-3 rounded-full bg-amber-500/60" />
                <div className="h-3 w-3 rounded-full bg-emerald-500/60" />
                <span className="text-xs text-zinc-500 font-mono ml-2">dzmenu.com/menu/le-bistro</span>
              </div>
              <div className="inline-flex items-center gap-1 rounded-md bg-zinc-800/70 px-2.5 py-1 text-xs text-zinc-400">
                <QrCode className="h-3 w-3 text-amber-400" />
                Live Demo Preview
              </div>
            </div>

            {/* Mock Restaurant Menu Card Display */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Left Column: Restaurant Info */}
              <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-5 flex flex-col justify-between">
                <div>
                  <div className="inline-block rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-400 uppercase tracking-wider">
                    Alger, Hydra
                  </div>
                  <h3 className="mt-3 text-lg font-bold text-white">Le Bistro Gourmet</h3>
                  <p className="mt-1 text-xs text-zinc-400 leading-relaxed">
                    Artisanal Mediterranean cuisine, wood-fired specialties, and handcrafted beverages.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-zinc-800/60 flex items-center justify-between text-xs text-zinc-400">
                  <span>Open: 11:30 - 23:00</span>
                  <span className="text-emerald-400 font-medium flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Open Now
                  </span>
                </div>
              </div>

              {/* Center & Right Column: Sample Menu Items */}
              <div className="md:col-span-2 space-y-3">
                {/* Category Pills */}
                <div className="flex gap-2 overflow-x-auto pb-1 text-xs font-medium">
                  <span className="rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1">
                    Chef Specials (4)
                  </span>
                  <span className="rounded-lg bg-zinc-900 text-zinc-400 border border-zinc-800 px-3 py-1">
                    Main Courses (8)
                  </span>
                  <span className="rounded-lg bg-zinc-900 text-zinc-400 border border-zinc-800 px-3 py-1">
                    Desserts & Drinks (6)
                  </span>
                </div>

                {/* Sample Item 1 */}
                <div className="group flex items-center justify-between rounded-xl border border-zinc-800/60 bg-zinc-950/40 p-4 transition hover:border-zinc-700">
                  <div className="space-y-1 pr-4">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-white">Entrecôte Grいがée au Feu de Bois</h4>
                      <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-400">
                        Popular
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 line-clamp-1">
                      Prime cut 300g, rosemary infused butter, crispy roasted seasonal vegetables.
                    </p>
                  </div>
                  <div className="text-right whitespace-nowrap">
                    <span className="text-sm font-bold text-amber-400">2,400 DZD</span>
                  </div>
                </div>

                {/* Sample Item 2 */}
                <div className="group flex items-center justify-between rounded-xl border border-zinc-800/60 bg-zinc-950/40 p-4 transition hover:border-zinc-700">
                  <div className="space-y-1 pr-4">
                    <h4 className="text-sm font-semibold text-white">Burger Gourmet Truffe & Cèpes</h4>
                    <p className="text-xs text-zinc-400 line-clamp-1">
                      Black Angus patty, truffle cream, aged cheddar, brioche bun, homemade fries.
                    </p>
                  </div>
                  <div className="text-right whitespace-nowrap">
                    <span className="text-sm font-bold text-amber-400">1,650 DZD</span>
                  </div>
                </div>

                {/* Sample Item 3 */}
                <div className="group flex items-center justify-between rounded-xl border border-zinc-800/60 bg-zinc-950/40 p-4 transition hover:border-zinc-700">
                  <div className="space-y-1 pr-4">
                    <h4 className="text-sm font-semibold text-white">Fondant au Chocolat Noir 70%</h4>
                    <p className="text-xs text-zinc-400 line-clamp-1">
                      Warm molten chocolate cake served with Madagascar vanilla ice cream.
                    </p>
                  </div>
                  <div className="text-right whitespace-nowrap">
                    <span className="text-sm font-bold text-amber-400">750 DZD</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="border-t border-zinc-900 bg-zinc-950 px-6 py-24 md:py-32">
        <div className="mx-auto max-w-6xl">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
              Why DZMenu
            </span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Engineered for Modern Hospitality
            </h2>
            <p className="mt-4 text-base text-zinc-400">
              Everything you need to showcase your cuisine with speed, elegance, and zero hassle.
            </p>
          </div>

          {/* 3 Core Feature Cards */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="relative rounded-2xl border border-zinc-800/80 bg-zinc-900/30 p-8 transition hover:border-zinc-700 hover:bg-zinc-900/50">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <Zap className="h-6 w-6" />
              </div>
              <h3 className="mt-6 text-xl font-semibold text-white">
                Instant Real-Time Updates
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-zinc-400">
                Adjust prices, add daily specials, or hide out-of-stock items in seconds from your dashboard.
                Changes appear immediately on your customers&apos; devices without reprinting.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="relative rounded-2xl border border-zinc-800/80 bg-zinc-900/30 p-8 transition hover:border-zinc-700 hover:bg-zinc-900/50">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <Sparkles className="h-6 w-6" />
              </div>
              <h3 className="mt-6 text-xl font-semibold text-white">
                Premium Curated Design
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-zinc-400">
                Give your restaurant a high-end digital presence. Beautiful typography, fluid category navigation,
                and mobile-optimized layouts designed to highlight your dishes.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="relative rounded-2xl border border-zinc-800/80 bg-zinc-900/30 p-8 transition hover:border-zinc-700 hover:bg-zinc-900/50">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <Smartphone className="h-6 w-6" />
              </div>
              <h3 className="mt-6 text-xl font-semibold text-white">
                Zero App Required
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-zinc-400">
                Frictionless customer experience. Diners scan the QR code using their standard mobile camera
                and browse the menu instantly with blazing-fast load times.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="border-t border-zinc-900 bg-zinc-900/20 px-6 py-20 md:py-28">
        <div className="mx-auto max-w-5xl">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
              Simple 3-Step Process
            </span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              How DZMenu Works
            </h2>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="relative text-center md:text-left space-y-3">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900 border border-zinc-700 text-sm font-bold text-amber-400">
                1
              </div>
              <h4 className="text-lg font-semibold text-white">Create Your Menu</h4>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Add categories, dishes, ingredients, and prices through your intuitive restaurant dashboard.
              </p>
            </div>

            <div className="relative text-center md:text-left space-y-3">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900 border border-zinc-700 text-sm font-bold text-amber-400">
                2
              </div>
              <h4 className="text-lg font-semibold text-white">Place Your QR Codes</h4>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Download high-resolution dynamic QR codes ready to print on table tents, stands, or stickers.
              </p>
            </div>

            <div className="relative text-center md:text-left space-y-3">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900 border border-zinc-700 text-sm font-bold text-amber-400">
                3
              </div>
              <h4 className="text-lg font-semibold text-white">Update Anytime</h4>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Change your menu whenever you want. Your printed QR codes remain valid forever.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="border-t border-zinc-900 bg-zinc-950 px-6 py-24 md:py-32">
        <div className="mx-auto max-w-4xl">
          <div className="text-center max-w-xl mx-auto">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
              Transparent Pricing
            </span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              One Simple Annual Plan
            </h2>
            <p className="mt-4 text-base text-zinc-400">
              Complete access to DZMenu with no hidden fees, commissions, or surprise surcharges.
            </p>
          </div>

          {/* Pricing Card */}
          <div className="mt-14 mx-auto max-w-lg rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8 sm:p-10 shadow-2xl backdrop-blur relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-16 -mt-16 h-36 w-36 rounded-full bg-amber-500/10 blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">DZMenu Standard</h3>
                <p className="text-xs text-zinc-400 mt-1">Full-featured digital menu platform</p>
              </div>
              <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-400">
                Annual Subscription
              </span>
            </div>

            <div className="mt-8 flex items-baseline gap-2">
              <span className="text-5xl font-extrabold tracking-tight text-white">
                10,000
              </span>
              <span className="text-lg font-semibold text-amber-400">DZD</span>
              <span className="text-sm text-zinc-400 font-normal">/ year</span>
            </div>
            <p className="mt-1 text-xs text-zinc-500">Billed annually (~830 DZD per month)</p>

            <div className="mt-8 space-y-3.5 border-t border-zinc-800/80 pt-8 text-sm text-zinc-300">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0" />
                <span>Unlimited menu items & categories</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0" />
                <span>Unlimited customer QR scans & traffic</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0" />
                <span>Real-time dish availability & price updates</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0" />
                <span>Print-ready dynamic QR code generation</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0" />
                <span>Curated responsive mobile menu templates</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0" />
                <span>Custom restaurant branding (logo, cover, colors)</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0" />
                <span>Dedicated onboarding & customer support</span>
              </div>
            </div>

            <div className="mt-10">
              <Link
                href={ROUTES.REGISTER}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-amber-500 py-3.5 text-center text-sm font-semibold text-zinc-950 transition hover:bg-amber-400 shadow-lg shadow-amber-500/10"
              >
                Get Started with DZMenu
                <ArrowRight className="h-4 w-4" />
              </Link>
              <p className="mt-3 text-center text-xs text-zinc-500">
                Create your account and start your digital menu in minutes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-zinc-950 px-6 py-12">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded bg-zinc-900 border border-zinc-800 text-amber-400">
              <UtensilsCrossed className="h-3.5 w-3.5" />
            </div>
            <span className="text-sm font-bold text-white">
              DZ<span className="text-amber-400">Menu</span>
            </span>
            <span className="text-xs text-zinc-500 ml-2">
              — Modern Digital Menu Platform
            </span>
          </div>

          <div className="flex items-center gap-6 text-xs text-zinc-400">
            <a href="#features" className="hover:text-white transition">
              Features
            </a>
            <a href="#pricing" className="hover:text-white transition">
              Pricing
            </a>
            <Link href={ROUTES.LOGIN} className="hover:text-white transition">
              Sign In
            </Link>
          </div>

          <p className="text-xs text-zinc-600">
            &copy; {new Date().getFullYear()} DZMenu. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
