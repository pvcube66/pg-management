'use client';
import { AuthGuard } from "@/components/AuthGuard";
import DashboardNav from "@/components/DashboardNav";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { TrendingUp, Users, DollarSign, Building2, AlertCircle } from "lucide-react";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";

export default function PGOwnerDashboard() {
  const { data: pgs, isLoading } = useQuery({ queryKey: ['pgs'], queryFn: () => axios.get('/api/pgs').then(res => res.data) });
  const { data: analytics } = useQuery({ queryKey: ['analytics'], queryFn: () => axios.get('/api/analytics').then(res => res.data) });
  const { data: tenants } = useQuery({ queryKey: ['tenants'], queryFn: () => axios.get('/api/tenants?status=active').then(res => res.data) });
  const { data: payments } = useQuery({ queryKey: ['payments'], queryFn: () => axios.get(`/api/payments?month=${new Date().toISOString().slice(0, 7)}`).then(res => res.data) });
  const { data: maintenance } = useQuery({ queryKey: ['maintenance'], queryFn: () => axios.get('/api/maintenance?status=open').then(res => res.data) });

  if (isLoading) return <div className="p-8 text-slate-600">Loading...</div>;

  const totalPgs = pgs?.length || 0;
  const pendingPayments = payments?.filter((p: any) => p.status === 'pending').length || 0;
  const overduePayments = payments?.filter((p: any) => p.status === 'overdue').length || 0;

  return (
    <AuthGuard allowedRoles={['pgowner']}>
      <DashboardNav />
      <div className="space-y-8 bg-gradient-to-b from-white/60 via-white to-white px-4 py-8 md:px-10">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
                <p className="text-sm font-semibold uppercase tracking-wide text-primary">Owner</p>
                <h2 className="text-3xl font-bold text-slate-900">Your PG Portfolio</h2>
                <p className="text-slate-600">Manage properties, tenants, payments, and operations.</p>
            </div>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Total Properties', value: totalPgs, icon: Building2, tone: 'from-sky-400 to-blue-500' },
            { label: 'Active Tenants', value: analytics?.tenants?.active || 0, icon: Users, tone: 'from-emerald-400 to-teal-500' },
            { label: 'Monthly Revenue', value: `₹${((analytics?.revenue?.collected || 0) / 1000).toFixed(0)}k`, icon: DollarSign, tone: 'from-orange-400 to-pink-500' },
            { label: 'Occupancy', value: `${analytics?.occupancy?.rate || 0}%`, icon: TrendingUp, tone: 'from-indigo-400 to-purple-500' }
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
        {(overduePayments > 0 || maintenance?.length > 0) && (
          <div className="grid gap-4 md:grid-cols-2">
            {overduePayments > 0 && (
              <Card className="border-red-200 bg-red-50/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <div className="flex-1">
                      <p className="font-semibold text-red-900">Overdue Payments</p>
                      <p className="text-sm text-red-700">{overduePayments} payment{overduePayments !== 1 && 's'} overdue</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            {maintenance?.length > 0 && (
              <Card className="border-orange-200 bg-orange-50/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-orange-600" />
                    <div className="flex-1">
                      <p className="font-semibold text-orange-900">Open Maintenance</p>
                      <p className="text-sm text-orange-700">{maintenance.length} request{maintenance.length !== 1 && 's'} pending</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Properties */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-sm ring-1 ring-slate-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-primary">Properties</p>
                    <CardTitle>Your PG Properties</CardTitle>
                  </div>
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{totalPgs} active</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                    {pgs?.map((pg: any) => {
                      let totalBeds = 0;
                      let occupiedBeds = 0;
                      pg.floors?.forEach((floor: any) => {
                        floor.rooms?.forEach((room: any) => {
                          totalBeds += room.bedCount || 0;
                          occupiedBeds += room.occupiedBeds || 0;
                        });
                      });
                      const occupancyPct = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;
                      
                      return (
                        <Card key={pg._id} className="hover:-translate-y-1 hover:shadow-md transition">
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <CardTitle className="text-base">{pg.name}</CardTitle>
                                    <CardDescription className="text-xs">{pg.location?.address || "Address not set"}</CardDescription>
                                  </div>
                                  <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">{occupancyPct}%</span>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3 pt-0">
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                  <div>
                                    <p className="text-slate-500 text-xs">Capacity</p>
                                    <p className="font-semibold">{totalBeds} beds</p>
                                  </div>
                                  <div>
                                    <p className="text-slate-500 text-xs">Occupied</p>
                                    <p className="font-semibold">{occupiedBeds} beds</p>
                                  </div>
                                </div>
                                <Link href={`/pgs/${pg._id}`} className="block">
                                    <Button className="w-full" size="sm">Manage Property</Button>
                                </Link>
                            </CardContent>
                        </Card>
                      );
                    })}

                    {totalPgs === 0 && (
                      <Card className="border-dashed text-center md:col-span-2">
                        <CardContent className="p-8">
                          <Building2 className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                          <CardTitle className="text-lg mb-2">No Properties Yet</CardTitle>
                          <CardDescription>Add your first PG property to get started.</CardDescription>
                        </CardContent>
                      </Card>
                    )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity & Quick Stats */}
          <div className="space-y-6">
            <Card className="shadow-sm ring-1 ring-slate-200">
              <CardHeader>
                <CardTitle className="text-lg">Recent Tenants</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {tenants?.slice(0, 5).map((t: any) => (
                    <div key={t._id} className="flex items-center gap-3 pb-3 border-b border-slate-100 last:border-0">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                        {t.name?.charAt(0) || 'T'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-slate-900 truncate">{t.name}</p>
                        <p className="text-xs text-slate-500 truncate">{t.pgId?.name}</p>
                      </div>
                      <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
                        Active
                      </span>
                    </div>
                  ))}
                  {(!tenants || tenants.length === 0) && (
                    <p className="text-sm text-slate-500 text-center py-4">No active tenants yet</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm ring-1 ring-slate-200">
              <CardHeader>
                <CardTitle className="text-lg">Payment Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Collected</span>
                  <span className="font-semibold text-emerald-600">₹{(analytics?.revenue?.collected || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Pending</span>
                  <span className="font-semibold text-orange-600">₹{(analytics?.revenue?.pending || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Overdue</span>
                  <span className="font-semibold text-red-600">₹{(analytics?.revenue?.overdue || 0).toLocaleString()}</span>
                </div>
                <div className="pt-3 border-t">
                  <Button variant="outline" className="w-full" size="sm">View All Payments</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
