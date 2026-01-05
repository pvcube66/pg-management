import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Building2, Users, BarChart3, CreditCard, Settings, Shield } from "lucide-react";

const features = [
  { icon: Building2, title: "Property Management", detail: "Manage multiple PG properties with detailed room and floor configurations." },
  { icon: Users, title: "Tenant Management", detail: "Complete tenant lifecycle from onboarding to checkout with profile management." },
  { icon: BarChart3, title: "Analytics & Reports", detail: "Real-time occupancy tracking, revenue insights, and downloadable reports." },
  { icon: CreditCard, title: "Payment Tracking", detail: "Monitor rent collection, track dues, and maintain payment history." },
  { icon: Settings, title: "Operations Management", detail: "Handle maintenance requests, room assignments, and day-to-day operations." },
  { icon: Shield, title: "Role-based Access", detail: "Secure access control for admins, owners, incharges, and tenants." },
];

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (session) {
    if (session.user.role === 'superadmin') redirect('/dashboard/superadmin');
    if (session.user.role === 'pgowner') redirect('/dashboard/pgowner');
    if (session.user.role === 'incharge') redirect('/dashboard/incharge');
  }

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -left-24 top-16 h-72 w-72 rounded-full bg-gradient-to-br from-sky-300/40 via-teal-200/40 to-transparent blur-3xl" />
        <div className="absolute right-0 top-24 h-64 w-64 rounded-full bg-gradient-to-br from-pink-300/40 via-orange-200/40 to-transparent blur-3xl" />
      </div>

      <div className="relative mx-auto flex max-w-7xl flex-col gap-16 px-6 pb-24 pt-24 md:px-10 lg:px-16 lg:pt-32">
        <header className="text-center space-y-6">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary ring-1 ring-primary/20">
            Complete PG Management Solution
          </span>
          <h1 className="text-5xl font-bold leading-tight text-slate-900 md:text-6xl lg:text-7xl">
            Streamline Your PG
            <br />
            <span className="text-primary">Operations</span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-slate-600 md:text-xl">
            Comprehensive management system for paying guest accommodations. Handle bookings, payments, tenants, and analytics—all in one place.
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <Link href="/login" className="rounded-xl bg-primary px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-primary/30 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/40">
              Get Started
            </Link>
          </div>
        </header>

        <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div key={feature.title} className="group rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur transition hover:-translate-y-1 hover:shadow-lg">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-600">{feature.detail}</p>
              </div>
            );
          })}
        </section>

        <section className="rounded-3xl bg-gradient-to-br from-primary/10 to-secondary/10 p-8 md:p-12 text-center backdrop-blur ring-1 ring-primary/20">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Ready to Transform Your PG Management?</h2>
          <p className="text-slate-600 mb-6 max-w-2xl mx-auto">Join property owners and managers who trust our platform for seamless operations.</p>
          <Link href="/login" className="inline-flex rounded-xl bg-slate-900 px-8 py-4 text-lg font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl">
            Sign In Now
          </Link>
        </section>
      </div>
    </main>
  );
}
