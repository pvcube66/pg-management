'use client';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { Button } from './ui/button';
import { LogOut, Home, Building, Users } from 'lucide-react';

export default function DashboardNav() {
  const { data: session } = useSession();
  const role = session?.user?.role;

  return (
    <nav className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white/80 px-4 py-3 backdrop-blur md:px-8">
      <div className="flex items-center space-x-4">
        <div className="flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary ring-1 ring-primary/20">
          PG Manager
        </div>
        {role === 'superadmin' && (
          <Link href="/dashboard/superadmin" className="flex items-center gap-2 rounded-full px-3 py-1 text-slate-700 transition hover:bg-primary/10 hover:text-primary">
            <Users size={18} /> Admin
          </Link>
        )}
        {role === 'pgowner' && (
          <Link href="/dashboard/pgowner" className="flex items-center gap-2 rounded-full px-3 py-1 text-slate-700 transition hover:bg-primary/10 hover:text-primary">
            <Building size={18} /> My PGs
          </Link>
        )}
        {role === 'incharge' && (
          <Link href="/dashboard/incharge" className="flex items-center gap-2 rounded-full px-3 py-1 text-slate-700 transition hover:bg-primary/10 hover:text-primary">
            <Home size={18} /> Manage PG
          </Link>
        )}
      </div>
      <div className="flex items-center space-x-4 text-sm text-slate-600">
        <span className="hidden md:inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 font-medium">
          {session?.user?.email}
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">{role}</span>
        </span>
        <Button variant="ghost" size="sm" onClick={() => signOut({ callbackUrl: '/login' })}>
          <LogOut size={18} className="mr-2" /> Logout
        </Button>
      </div>
    </nav>
  );
}
