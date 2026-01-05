'use client';

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === 'loading') return;

    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (allowedRoles && session?.user?.role && !allowedRoles.includes(session.user.role)) {
       // Redirect to their allowed dashboard if they try to access unauthorized area
       if (session.user.role === 'superadmin') router.push('/dashboard/superadmin');
       else if (session.user.role === 'pgowner') router.push('/dashboard/pgowner');
       else if (session.user.role === 'incharge') router.push('/dashboard/incharge');
       else router.push('/login'); // Fallback
    }
  }, [status, session, allowedRoles, router, pathname]);

  if (status === 'loading' || status === 'unauthenticated') {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (allowedRoles && session?.user?.role && !allowedRoles.includes(session.user.role)) {
      return null; // or a forbidden page
  }

  return <>{children}</>;
}
