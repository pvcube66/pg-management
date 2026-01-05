'use client';
import { AuthGuard } from "@/components/AuthGuard";
import DashboardNav from "@/components/DashboardNav";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Building2, Users, TrendingUp, AlertCircle, DollarSign, Wrench } from "lucide-react";
import Link from "next/link";

export default function SuperAdminDashboard() {
  const { data: users, isLoading } = useQuery({ queryKey: ['users'], queryFn: () => axios.get('/api/users').then(res => res.data) });
  const { data: pgs } = useQuery({ queryKey: ['pgs'], queryFn: () => axios.get('/api/pgs').then(res => res.data) });
  const { data: analytics } = useQuery({ queryKey: ['analytics'], queryFn: () => axios.get('/api/analytics').then(res => res.data) });
  const { data: tenants } = useQuery({ queryKey: ['tenants'], queryFn: () => axios.get('/api/tenants').then(res => res.data) });
  const [editingUser, setEditingUser] = useState<any>(null);
  const { data: maintenance } = useQuery({ queryKey: ['maintenance'], queryFn: () => axios.get('/api/maintenance').then(res => res.data) });
  
  const queryClient = useQueryClient();
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserRole, setNewUserRole] = useState("pgowner");
  const [selectedPg, setSelectedPg] = useState<any>(null);
  const [newPGName, setNewPGName] = useState("");
  const [newPGOwner, setNewPGOwner] = useState("");

  const createUser = useMutation({
      mutationFn: (data: any) => axios.post('/api/users', data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['users'] });
        setNewUserEmail("");
      }
  });

  const createPG = useMutation({
      mutationFn: (data: any) => axios.post('/api/pgs', data),
      onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['pgs'] });
          setNewPGName("");
          setNewPGOwner("");
      }
  });

  const handleCreateUser = () => {
     createUser.mutate({ email: newUserEmail, password: "password123", role: newUserRole });
  };

  if (isLoading) return <div className="p-8 text-slate-600">Loading...</div>;

  const totalUsers = users?.length || 0;
  const pgCount = pgs?.length || 0;
  const ownerCount = users?.filter((u: any) => u.role === 'pgowner').length || 0;
  const inchargeCount = users?.filter((u: any) => u.role === 'incharge').length || 0;

  return (
    <AuthGuard allowedRoles={['superadmin']}>
      <DashboardNav />
      <div className="space-y-8 bg-gradient-to-b from-white/60 via-white to-white px-4 py-8 md:px-10">
        <div className="flex flex-col gap-3">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">Superadmin</p>
          <h2 className="text-3xl font-bold text-slate-900">System Overview</h2>
          <p className="text-slate-600">Monitor all properties, users, and system-wide metrics.</p>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Total Properties', value: pgCount, icon: Building2, trend: null, tone: 'from-sky-400 to-blue-500' },
            { label: 'Active Tenants', value: analytics?.tenants?.active || 0, icon: Users, trend: null, tone: 'from-emerald-400 to-teal-500' },
            { label: 'Monthly Revenue', value: `₹${((analytics?.revenue?.collected || 0) / 1000).toFixed(0)}k`, icon: TrendingUp, trend: '+12%', tone: 'from-orange-400 to-pink-500' },
            { label: 'Occupancy Rate', value: `${analytics?.occupancy?.rate || 0}%`, icon: DollarSign, trend: null, tone: 'from-indigo-400 to-purple-500' }
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className="border-0 shadow-sm ring-1 ring-slate-200">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-2">
                    <Icon className="h-5 w-5 text-slate-600" />
                    {stat.trend && <span className="text-xs font-semibold text-emerald-600">{stat.trend}</span>}
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
          <Card className="border-orange-200 bg-orange-50/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                <div className="flex-1">
                  <p className="font-semibold text-orange-900">Urgent Maintenance Requests</p>
                  <p className="text-sm text-orange-700">{maintenance.filter((m: any) => m.priority === 'urgent' && m.status !== 'closed').length} urgent issues require immediate attention</p>
                </div>
                <Button variant="outline" size="sm" className="border-orange-600 text-orange-600">View All</Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* User Management */}
            <Card className="lg:col-span-2 shadow-sm ring-1 ring-slate-200">
                <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-primary">User Management</p>
                        <CardTitle className="text-xl">System Users</CardTitle>
                      </div>
                      <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{totalUsers} total</span>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-sm font-semibold text-slate-700 mb-3">Create New User</p>
                      <div className="grid gap-3 md:grid-cols-3">
                        <Input placeholder="Email address" value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} />
                        <Select value={newUserRole} onValueChange={setNewUserRole}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pgowner">PG Owner</SelectItem>
                            <SelectItem value="incharge">Incharge</SelectItem>
                            <SelectItem value="superadmin">Superadmin</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button onClick={handleCreateUser} disabled={!newUserEmail}>Create User</Button>
                      </div>
                    </div>
                    
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Email</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Properties</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users?.map((u: any) => (
                                <TableRow key={u._id} className="hover:bg-slate-50/60">
                                    <TableCell className="font-medium">{u.email}</TableCell>
                                    <TableCell>
                                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize text-slate-700 ring-1 ring-slate-200">{u.role}</span>
                                    </TableCell>
                                    <TableCell>{u.ownedPgs?.length || (u.pgId ? 1 : 0)}</TableCell>
                                    <TableCell>
                                      <Button variant="ghost" size="sm" onClick={() => setEditingUser(u)}>Edit</Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="space-y-6">
                <Card className="shadow-sm ring-1 ring-slate-200">
                    <CardHeader>
                        <CardTitle className="text-lg">System Health</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-slate-600">Occupancy</span>
                          <span className="font-semibold">{analytics?.occupancy?.rate || 0}%</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-sky-400 to-blue-500" style={{ width: `${analytics?.occupancy?.rate || 0}%` }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-slate-600">Payment Collection</span>
                          <span className="font-semibold">{analytics?.revenue?.collected > 0 ? Math.round((analytics.revenue.collected / analytics.revenue.total) * 100) : 0}%</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-emerald-400 to-teal-500" style={{ width: `${analytics?.revenue?.collected > 0 ? Math.round((analytics.revenue.collected / analytics.revenue.total) * 100) : 0}%` }} />
                        </div>
                      </div>
                    </CardContent>
                </Card>

                <Card className="shadow-sm ring-1 ring-slate-200">
                    <CardHeader>
                        <CardTitle className="text-lg">Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3 text-sm">
                        {tenants?.slice(0, 5).map((t: any) => (
                          <div key={t._id} className="flex items-center gap-3 pb-3 border-b border-slate-100 last:border-0">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs">
                              {t.name?.charAt(0) || 'T'}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-slate-900">{t.name}</p>
                              <p className="text-xs text-slate-500">{t.pgId?.name}</p>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded-full ${t.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                              {t.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                </Card>
            </div>
        </div>

        {/* Properties Grid */}
        <Card className="shadow-sm ring-1 ring-slate-200">
            <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-primary">Properties</p>
                    <CardTitle className="text-xl">All PG Properties</CardTitle>
                  </div>
                  <div className="flex gap-2">
                    <Input placeholder="PG Name" value={newPGName} onChange={e => setNewPGName(e.target.value)} className="w-48" />
                    <Select value={newPGOwner} onValueChange={setNewPGOwner}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Select Owner" />
                      </SelectTrigger>
                      <SelectContent>
                        {users?.filter((u: any) => u.role === 'pgowner').map((u: any) => (
                          <SelectItem key={u._id} value={u._id}>{u.email}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button onClick={() => createPG.mutate({ name: newPGName, owner: newPGOwner, amenities: [] })} disabled={!newPGName || !newPGOwner}>
                      Create PG
                    </Button>
                  </div>
                </div>
            </CardHeader>
            <CardContent>
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead>Owner</TableHead>
                            <TableHead>Capacity</TableHead>
                            <TableHead>Occupancy</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
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
                            <TableRow key={pg._id} className="hover:bg-slate-50/60">
                                <TableCell className="font-semibold">{pg.name}</TableCell>
                                <TableCell>{pg.location?.address || 'N/A'}</TableCell>
                                <TableCell>{pg.owner?.email}</TableCell>
                                <TableCell>{totalBeds} beds</TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden max-w-[80px]">
                                      <div className="h-full bg-primary" style={{ width: `${occupancyPct}%` }} />
                                    </div>
                                    <span className="text-xs font-semibold">{occupancyPct}%</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Link href={`/pgs/${pg._id}`}>
                                    <Button variant="ghost" size="sm">Manage</Button>
                                  </Link>
                                </TableCell>
                            </TableRow>
                          );
                        })}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
      </div>

      {/* User Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setEditingUser(null)}>
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <CardTitle>User Details</CardTitle>
              <CardDescription>View and manage user information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Email</Label>
                <p className="text-sm font-medium text-slate-900">{editingUser.email}</p>
              </div>
              <div>
                <Label>Role</Label>
                <p className="text-sm capitalize font-medium text-slate-900">{editingUser.role}</p>
              </div>
              <div>
                <Label>User ID</Label>
                <p className="text-xs text-slate-600 font-mono">{editingUser._id}</p>
              </div>
              
              {editingUser.role === 'pgowner' && (
                <div>
                  <Label>Owned Properties</Label>
                  <div className="mt-2 space-y-2">
                    {pgs?.filter((pg: any) => pg.owner?._id === editingUser._id || pg.owner === editingUser._id).map((pg: any) => (
                      <div key={pg._id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
                        <div>
                          <p className="font-medium text-sm">{pg.name}</p>
                          <p className="text-xs text-slate-500">{pg.location?.city || 'No location'}</p>
                        </div>
                        <Link href={`/pgs/${pg._id}`}>
                          <Button size="sm" variant="outline">View</Button>
                        </Link>
                      </div>
                    ))}
                    {pgs?.filter((pg: any) => pg.owner?._id === editingUser._id || pg.owner === editingUser._id).length === 0 && (
                      <p className="text-sm text-slate-500">No properties assigned</p>
                    )}
                  </div>
                </div>
              )}

              {editingUser.role === 'incharge' && (
                <div>
                  <Label>Assigned Property</Label>
                  <div className="mt-2">
                    {editingUser.pgId ? (
                      <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
                        <div>
                          <p className="font-medium text-sm">{pgs?.find((pg: any) => pg._id === editingUser.pgId)?.name || 'PG not found'}</p>
                          <p className="text-xs text-slate-500">PG ID: {editingUser.pgId}</p>
                        </div>
                        <Link href={`/pgs/${editingUser.pgId}`}>
                          <Button size="sm" variant="outline">View</Button>
                        </Link>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500">No property assigned</p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setEditingUser(null)} className="flex-1">Close</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </AuthGuard>
  );
}
