'use client';
import { AuthGuard } from "@/components/AuthGuard";
import DashboardNav from "@/components/DashboardNav";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Users, DollarSign, Wrench, Building2, AlertCircle } from "lucide-react";

export default function InchargeDashboard() {
  const { data: session } = useSession();
  const pgId = session?.user?.pgId;
  
  const { data: analytics } = useQuery({ 
    queryKey: ['analytics', pgId], 
    queryFn: () => axios.get(`/api/analytics?pgId=${pgId}`).then(res => res.data),
    enabled: !!pgId
  });
  const { data: tenants } = useQuery({ 
    queryKey: ['tenants', pgId], 
    queryFn: () => axios.get(`/api/tenants?pgId=${pgId}&status=active`).then(res => res.data),
    enabled: !!pgId
  });
  const { data: maintenance } = useQuery({ 
    queryKey: ['maintenance', pgId], 
    queryFn: () => axios.get(`/api/maintenance?pgId=${pgId}`).then(res => res.data),
    enabled: !!pgId
  });
  const { data: payments } = useQuery({
    queryKey: ['payments', pgId],
    queryFn: () => axios.get(`/api/payments?pgId=${pgId}&status=pending`).then(res => res.data),
    enabled: !!pgId
  });

  return (
    <AuthGuard allowedRoles={['incharge']}>
      <DashboardNav />
      <div className="space-y-6 bg-gradient-to-b from-white/60 via-white to-white px-4 py-8 md:px-10">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">Incharge</p>
          <h2 className="text-3xl font-bold text-slate-900">Daily Operations</h2>
          <p className="text-slate-600">Manage tenants, maintenance, and day-to-day activities.</p>
        </div>

        {pgId ? (
          <>
            {/* Key Metrics */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[
                { label: 'Active Tenants', value: analytics?.tenants?.active || 0, icon: Users, tone: 'from-emerald-400 to-teal-500' },
                { label: 'Pending Payments', value: payments?.length || 0, icon: DollarSign, tone: 'from-orange-400 to-pink-500' },
                { label: 'Open Maintenance', value: maintenance?.filter((m: any) => m.status === 'open').length || 0, icon: Wrench, tone: 'from-red-400 to-rose-500' },
                { label: 'Occupancy', value: `${analytics?.occupancy?.rate || 0}%`, icon: Building2, tone: 'from-indigo-400 to-purple-500' }
              ].map((stat) => {
                const Icon = stat.icon;
                return (
                  <Card key={stat.label} className="border-0 shadow-sm ring-1 ring-slate-200">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between mb-2">
                        <Icon className="h-5 w-5 text-slate-600" />
                      </div>
                      <p className="text-sm text-slate-500">{stat.label}</p>
                      <p className="mt-2 text-3xl font-semibold text-slate-900">{stat.value}</p>
                      <div className={`mt-3 h-1.5 rounded-full bg-gradient-to-r ${stat.tone}`} />
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Alerts */}
            {maintenance?.filter((m: any) => m.priority === 'urgent' && m.status !== 'closed').length > 0 && (
              <Card className="border-red-200 bg-red-50/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <div className="flex-1">
                      <p className="font-semibold text-red-900">Urgent Maintenance</p>
                      <p className="text-sm text-red-700">{maintenance.filter((m: any) => m.priority === 'urgent' && m.status !== 'closed').length} urgent request{maintenance.filter((m: any) => m.priority === 'urgent' && m.status !== 'closed').length !== 1 && 's'} need attention</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="shadow-sm ring-1 ring-slate-200">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Active Tenants</CardTitle>
                    <Link href={`/pgs/${pgId}`}>
                      <Button size="sm" variant="outline">View All</Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {tenants?.slice(0, 8).map((t: any) => (
                      <div key={t._id} className="flex items-center gap-3 pb-3 border-b border-slate-100 last:border-0">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                          {t.name?.charAt(0) || 'T'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-slate-900">{t.name}</p>
                          <p className="text-xs text-slate-500">Room {t.roomNumber} · ₹{t.monthlyRent}/mo</p>
                        </div>
                      </div>
                    ))}
                    {(!tenants || tenants.length === 0) && (
                      <p className="text-sm text-slate-500 text-center py-4">No active tenants</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm ring-1 ring-slate-200">
                <CardHeader>
                  <CardTitle>Maintenance Requests</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {maintenance?.slice(0, 8).map((m: any) => (
                      <div key={m._id} className="flex items-start gap-3 pb-3 border-b border-slate-100 last:border-0">
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${m.priority === 'urgent' ? 'bg-red-100 text-red-600' : m.priority === 'high' ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-600'}`}>
                          <Wrench className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-slate-900">{m.title}</p>
                          <p className="text-xs text-slate-500">{m.category} · {m.status}</p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${m.priority === 'urgent' ? 'bg-red-100 text-red-700' : m.priority === 'high' ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-700'}`}>
                          {m.priority}
                        </span>
                      </div>
                    ))}
                    {(!maintenance || maintenance.length === 0) && (
                      <p className="text-sm text-slate-500 text-center py-4">No maintenance requests</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="shadow-sm ring-1 ring-slate-200">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                  <Link href={`/pgs/${pgId}`}>
                    <Button className="w-full" variant="outline">Manage PG</Button>
                  </Link>
                  <Button className="w-full" variant="outline">Add Tenant</Button>
                  <Button className="w-full" variant="outline">Record Payment</Button>
                  <Button className="w-full" variant="outline">New Maintenance</Button>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card className="shadow-sm ring-1 ring-slate-200">
            <CardContent className="p-8 text-center text-slate-600">
              <p>No PG assigned. Contact your administrator.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </AuthGuard>
  );
}
