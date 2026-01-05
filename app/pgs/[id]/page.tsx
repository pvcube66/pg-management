'use client';
import { AuthGuard } from "@/components/AuthGuard";
import DashboardNav from "@/components/DashboardNav";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useState } from "react";
import { Plus, Users, Bed, IndianRupee } from "lucide-react";
import { Modal, ConfirmModal } from "@/components/Modal";

export default function PGDetailsPage() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { data: pg, isLoading } = useQuery({ 
    queryKey: ['pg', id], 
    queryFn: () => axios.get(`/api/pgs/${id}`).then(res => res.data) 
  });
  const { data: tenants } = useQuery({ 
    queryKey: ['tenants', id], 
    queryFn: () => axios.get(`/api/tenants?pgId=${id}`).then(res => res.data) 
  });

  const currentMonth = new Date().toISOString().slice(0, 7);
  const { data: payments } = useQuery({ 
    queryKey: ['payments', id, currentMonth], 
    queryFn: () => axios.get(`/api/payments?pgId=${id}&month=${currentMonth}`).then(res => res.data) 
  });

  const getTenantPaymentStatus = (tenantId: string) => {
    const payment = payments?.find((p: any) => p.tenantId?._id === tenantId || p.tenantId === tenantId);
    return payment?.status || 'pending';
  };

  const updatePG = useMutation({
    mutationFn: (data: any) => axios.put(`/api/pgs/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pg', id] })
  });

  const createTenant = useMutation({
    mutationFn: (data: any) => axios.post('/api/tenants', { ...data, status: 'pending', checkInDate: new Date() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants', id] });
      queryClient.invalidateQueries({ queryKey: ['pg', id] });
      setShowAddTenant(false);
      setNewTenant({ name: "", email: "", phone: "", monthlyRent: 0, pgId: id });
    }
  });

  const [newFloorNumber, setNewFloorNumber] = useState("");
  const [newRoomNumber, setNewRoomNumber] = useState("");
  const [selectedFloorIndex, setSelectedFloorIndex] = useState<number | null>(null);
  const [editingRoom, setEditingRoom] = useState<{ floorIndex: number; roomIndex: number; data: any } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ floorIndex: number; roomIndex: number } | null>(null);
  const [assignTenant, setAssignTenant] = useState<{ tenantId: string; roomId: string } | null>(null);
  const [showAddTenant, setShowAddTenant] = useState(false);
  const [newTenant, setNewTenant] = useState({
    name: "",
    email: "",
    phone: "",
    monthlyRent: 0,
    pgId: id
  });

  const handleAddFloor = () => {
      if (!pg) return;
      const floors = [...(pg.floors || [])];
      floors.push({ number: parseInt(newFloorNumber), rooms: [] });
      updatePG.mutate({ floors });
      setNewFloorNumber("");
  };

  const handleAddRoom = (floorIndex: number) => {
      if (!pg) return;
      const floors = [...pg.floors];
      floors[floorIndex].rooms.push({
          number: newRoomNumber,
          bedCount: 2, // Default
          bedType: 'double',
          monthlyCost: 5000,
          occupiedBeds: 0
      });
      updatePG.mutate({ floors });
      setNewRoomNumber("");
      setSelectedFloorIndex(null);
  };

  const handleEditRoom = (floorIndex: number, roomIndex: number) => {
      if (!pg) return;
      const room = pg.floors[floorIndex].rooms[roomIndex];
      setEditingRoom({ floorIndex, roomIndex, data: { ...room } });
  };

  const handleSaveRoom = () => {
      if (!pg || !editingRoom) return;
      const floors = [...pg.floors];
      floors[editingRoom.floorIndex].rooms[editingRoom.roomIndex] = editingRoom.data;
      updatePG.mutate({ floors });
      setEditingRoom(null);
  };

  const handleDeleteRoom = (floorIndex: number, roomIndex: number) => {
      setDeleteConfirm({ floorIndex, roomIndex });
  };

  const confirmDeleteRoom = () => {
      if (!pg || !deleteConfirm) return;
      const floors = [...pg.floors];
      floors[deleteConfirm.floorIndex].rooms.splice(deleteConfirm.roomIndex, 1);
      updatePG.mutate({ floors });
      setDeleteConfirm(null);
  };

  const handleAssignTenant = (tenantId: string, roomId: string) => {
      setAssignTenant({ tenantId, roomId });
  };

  const confirmAssignTenant = async () => {
      if (!assignTenant || !assignTenant.tenantId) return;
      
      try {
          await axios.put(`/api/tenants/${assignTenant.tenantId}`, {
              roomId: assignTenant.roomId,
              status: 'active'
          });
          queryClient.invalidateQueries({ queryKey: ['tenants', id] });
          queryClient.invalidateQueries({ queryKey: ['pg', id] });
          setAssignTenant(null);
      } catch (error) {
          console.error('Failed to assign tenant:', error);
      }
  };

  const handleCheckoutTenant = async (tenantId: string) => {
      try {
          await axios.put(`/api/tenants/${tenantId}`, {
              status: 'left'
          });
          queryClient.invalidateQueries({ queryKey: ['tenants', id] });
          queryClient.invalidateQueries({ queryKey: ['pg', id] });
      } catch (error) {
          console.error('Failed to checkout tenant:', error);
      }
  };

  const handleAddTenant = () => {
      createTenant.mutate(newTenant);
  };

  const handleMarkPaid = async (tenantId: string) => {
      try {
          const tenant = tenants?.find((t: any) => t._id === tenantId);
          if (!tenant) return;

          const existingPayment = payments?.find((p: any) => 
              (p.tenantId?._id === tenantId || p.tenantId === tenantId) && p.month === currentMonth
          );

          if (existingPayment) {
              await axios.put(`/api/payments/${existingPayment._id}`, {
                  status: 'paid',
                  paidDate: new Date(),
                  paymentMethod: 'cash'
              });
          } else {
              await axios.post('/api/payments', {
                  tenantId: tenantId,
                  pgId: id,
                  amount: tenant.monthlyRent,
                  type: 'rent',
                  month: currentMonth,
                  dueDate: new Date(new Date().getFullYear(), new Date().getMonth(), 5),
                  status: 'paid',
                  paidDate: new Date(),
                  paymentMethod: 'cash'
              });
          }
          
          queryClient.invalidateQueries({ queryKey: ['payments', id, currentMonth] });
      } catch (error) {
          console.error('Failed to mark payment as paid:', error);
      }
  };

  if (isLoading) return <div className="p-8">Loading...</div>;
  if (!pg) return <div className="p-8">PG not found</div>;

  // Stats for Charts
  let totalBeds = 0;
  let occupiedBeds = 0;
  pg.floors?.forEach((f: any) => f.rooms?.forEach((r: any) => {
      totalBeds += r.bedCount;
      occupiedBeds += r.occupiedBeds;
  }));
  const availableBeds = totalBeds - occupiedBeds;

  const chartData = [
      { name: 'Occupied', value: occupiedBeds },
      { name: 'Available', value: availableBeds },
  ];
  const COLORS = ['#0ea5e9', '#22c55e'];

  return (
    <AuthGuard allowedRoles={['pgowner', 'incharge', 'superadmin']}>
      <DashboardNav />
      <div className="space-y-6 bg-gradient-to-b from-white/60 via-white to-white px-4 py-6 md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
                <p className="text-sm font-semibold uppercase tracking-wide text-primary">PG details</p>
                <h1 className="text-3xl font-bold text-slate-900">{pg.name}</h1>
                <p className="text-slate-500">{pg.location?.address}</p>
            </div>
            <div className="flex gap-4">
                <Card className="flex items-center gap-3 border-0 bg-primary/10 px-4 py-3 ring-1 ring-primary/20">
                    <Bed className="text-primary" />
                    <div>
                        <p className="text-xs text-slate-600">Total beds</p>
                        <p className="text-xl font-semibold text-slate-900">{totalBeds}</p>
                    </div>
                </Card>
                <Card className="flex items-center gap-3 border-0 bg-emerald-50 px-4 py-3 ring-1 ring-emerald-200">
                    <Users className="text-emerald-600" />
                    <div>
                        <p className="text-xs text-slate-600">Occupied</p>
                        <p className="text-xl font-semibold text-slate-900">{occupiedBeds}</p>
                    </div>
                </Card>
            </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
                <Card className="shadow-sm ring-1 ring-slate-200">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Floors & Rooms</CardTitle>
                        <div className="flex gap-2">
                            <Input 
                                placeholder="Floor No" 
                                className="w-24" 
                                type="number" 
                                value={newFloorNumber} 
                                onChange={e => setNewFloorNumber(e.target.value)} 
                            />
                            <Button size="sm" onClick={handleAddFloor} disabled={!newFloorNumber}>Add Floor</Button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {pg.floors?.sort((a: any, b: any) => a.number - b.number).map((floor: any, fIndex: number) => (
                            <div key={fIndex} className="rounded-xl border border-slate-200 p-4 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div>
                                      <h3 className="text-lg font-semibold text-slate-900">Floor {floor.number}</h3>
                                      <p className="text-xs text-slate-500">Rooms: {floor.rooms?.length || 0}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        {selectedFloorIndex === fIndex ? (
                                            <>
                                                <Input 
                                                    placeholder="Room No" 
                                                    className="h-9 w-24" 
                                                    value={newRoomNumber} 
                                                    onChange={e => setNewRoomNumber(e.target.value)} 
                                                />
                                                <Button size="sm" className="h-9" onClick={() => handleAddRoom(fIndex)}>Save</Button>
                                                <Button size="sm" variant="ghost" className="h-9" onClick={() => setSelectedFloorIndex(null)}>Cancel</Button>
                                            </>
                                        ) : (
                                            <Button size="sm" variant="outline" onClick={() => setSelectedFloorIndex(fIndex)}>
                                                <Plus className="h-4 w-4 mr-1" /> Add Room
                                            </Button>
                                        )}
                                    </div>
                                </div>
                                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    {floor.rooms?.map((room: any, rIndex: number) => (
                                        <Card key={rIndex} className="bg-slate-50">
                                            <CardContent className="p-4">
                                                <div className="mb-3 flex items-start justify-between">
                                                    <span className="rounded-lg bg-white px-2 py-1 text-sm font-semibold ring-1 ring-slate-200">#{room.number}</span>
                                                    <span className={`text-xs px-2 py-1 rounded-full ${room.occupiedBeds >= room.bedCount ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                                        {room.occupiedBeds}/{room.bedCount} Beds
                                                    </span>
                                                </div>
                                                <div className="space-y-2 text-sm text-slate-600">
                                                    <div className="flex justify-between">
                                                        <span>Type</span>
                                                        <span className="capitalize">{room.bedType}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span>Cost</span>
                                                        <span className="flex items-center gap-1 font-semibold text-slate-900"><IndianRupee size={12} />{room.monthlyCost}</span>
                                                    </div>
                                                    {room.occupiedBeds > 0 && (
                                                        <div>
                                                            <span className="text-xs font-medium text-slate-700">Tenants:</span>
                                                            <div className="mt-1 space-y-1">
                                                                {tenants?.filter((t: any) => t.roomId === room._id && t.status === 'active').map((tenant: any) => (
                                                                    <div key={tenant._id} className="flex items-center justify-between bg-white/50 rounded px-2 py-1">
                                                                        <span className="text-xs text-slate-800">{tenant.name}</span>
                                                                        <Button 
                                                                            size="sm" 
                                                                            variant="ghost" 
                                                                            className="h-5 w-5 p-0 text-red-500 hover:text-red-700"
                                                                            onClick={() => handleCheckoutTenant(tenant._id)}
                                                                        >
                                                                            ×
                                                                        </Button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex gap-2 mt-4">
                                                    <Button size="sm" variant="outline" className="flex-1 h-8 text-xs" onClick={() => handleEditRoom(fIndex, rIndex)}>Edit</Button>
                                                    {room.occupiedBeds < room.bedCount && (
                                                        <Button size="sm" variant="default" className="h-8 text-xs bg-green-600 hover:bg-green-700" onClick={() => setAssignTenant({ tenantId: '', roomId: room._id })}>
                                                            + Tenant
                                                        </Button>
                                                    )}
                                                    <Button size="sm" variant="ghost" className="h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDeleteRoom(fIndex, rIndex)}>Delete</Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                    {floor.rooms?.length === 0 && <p className="text-sm text-slate-400 italic">No rooms yet.</p>}
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* Tenant Management */}
                <Card className="shadow-sm ring-1 ring-slate-200">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Tenant Management</CardTitle>
                            <CardDescription>Manage tenant assignments and occupancy</CardDescription>
                        </div>
                        <Button size="sm" className="bg-primary hover:bg-primary/90" onClick={() => setShowAddTenant(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Tenant
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Active Tenants */}
                        <div>
                            <h4 className="font-semibold text-slate-900 mb-3">Active Tenants ({tenants?.filter((t: any) => t.status === 'active').length || 0})</h4>
                            <div className="space-y-3">
                                {tenants?.filter((t: any) => t.status === 'active').map((tenant: any) => (
                                    <div key={tenant._id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                                                {tenant.name?.charAt(0) || 'T'}
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-medium text-sm text-slate-900">{tenant.name}</p>
                                                <p className="text-xs text-slate-500">
                                                    {tenant.roomNumber && tenant.floorNumber 
                                                        ? `Room ${tenant.roomNumber} • Floor ${tenant.floorNumber} • ₹${tenant.monthlyRent}/mo`
                                                        : `₹${tenant.monthlyRent}/mo • Not assigned to room`
                                                    }
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {(() => {
                                                const status = getTenantPaymentStatus(tenant._id);
                                                return (
                                                    <>
                                                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                                            status === 'paid' ? 'bg-green-100 text-green-700' :
                                                            status === 'overdue' ? 'bg-red-100 text-red-700' :
                                                            'bg-yellow-100 text-yellow-700'
                                                        }`}>
                                                            {status === 'paid' ? '✓ Paid' : status === 'overdue' ? 'Overdue' : 'Pending'}
                                                        </span>
                                                        {status !== 'paid' && (
                                                            <Button 
                                                                size="sm" 
                                                                variant="default" 
                                                                className="text-xs bg-green-600 hover:bg-green-700"
                                                                onClick={() => handleMarkPaid(tenant._id)}
                                                            >
                                                                Mark Paid
                                                            </Button>
                                                        )}
                                                    </>
                                                );
                                            })()}
                                            <Button 
                                                size="sm" 
                                                variant="outline" 
                                                className="text-xs"
                                                onClick={() => handleCheckoutTenant(tenant._id)}
                                            >
                                                Check Out
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                                {(!tenants || tenants.filter((t: any) => t.status === 'active').length === 0) && (
                                    <p className="text-sm text-slate-500 text-center py-4">No active tenants</p>
                                )}
                            </div>
                        </div>

                        {/* Unassigned Tenants */}
                        <div>
                            <h4 className="font-semibold text-slate-900 mb-3">Unassigned Tenants ({tenants?.filter((t: any) => !t.roomId && t.status !== 'left').length || 0})</h4>
                            <div className="space-y-3">
                                {tenants?.filter((t: any) => !t.roomId && t.status !== 'left').map((tenant: any) => (
                                    <div key={tenant._id} className="flex items-center justify-between p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-700 font-semibold">
                                                {tenant.name?.charAt(0) || 'T'}
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm text-slate-900">{tenant.name}</p>
                                                <p className="text-xs text-slate-500">{tenant.email} • ₹{tenant.monthlyRent}/mo</p>
                                            </div>
                                        </div>
                                        <div className="text-xs text-yellow-700 font-medium">
                                            Waiting for room assignment
                                        </div>
                                    </div>
                                ))}
                                {(!tenants || tenants.filter((t: any) => !t.roomId && t.status !== 'left').length === 0) && (
                                    <p className="text-sm text-slate-500 text-center py-4">No unassigned tenants</p>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="space-y-6">
                <Card className="shadow-sm ring-1 ring-slate-200">
                    <CardHeader>
                        <CardTitle>Occupancy rate</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={chartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36}/>
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
                
                <Card className="shadow-sm ring-1 ring-slate-200">
                    <CardHeader>
                        <CardTitle>Quick actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <Button className="w-full" variant="secondary">View all bookings</Button>
                        <Button className="w-full" variant="outline">Download report</Button>
                    </CardContent>
                </Card>
            </div>
        </div>

        {/* Room Edit Modal */}
        {editingRoom && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setEditingRoom(null)}>
            <Card className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
              <CardHeader>
                <CardTitle>Edit Room #{editingRoom.data.number}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Room Number</label>
                  <Input 
                    value={editingRoom.data.number} 
                    onChange={(e) => setEditingRoom({ ...editingRoom, data: { ...editingRoom.data, number: e.target.value } })}
                    placeholder="e.g., 101"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Bed Count</label>
                  <Input 
                    type="number" 
                    value={editingRoom.data.bedCount} 
                    onChange={(e) => setEditingRoom({ ...editingRoom, data: { ...editingRoom.data, bedCount: parseInt(e.target.value) || 0 } })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Bed Type</label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={editingRoom.data.bedType}
                    onChange={(e) => setEditingRoom({ ...editingRoom, data: { ...editingRoom.data, bedType: e.target.value } })}
                  >
                    <option value="single">Single</option>
                    <option value="double">Double</option>
                    <option value="triple">Triple</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Monthly Cost (₹)</label>
                  <Input 
                    type="number" 
                    value={editingRoom.data.monthlyCost} 
                    onChange={(e) => setEditingRoom({ ...editingRoom, data: { ...editingRoom.data, monthlyCost: parseInt(e.target.value) || 0 } })}
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button onClick={handleSaveRoom} className="flex-1">Save Changes</Button>
                  <Button variant="outline" onClick={() => setEditingRoom(null)}>Cancel</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tenant Assignment Modal */}
        <ConfirmModal
          isOpen={!!assignTenant}
          onClose={() => setAssignTenant(null)}
          onConfirm={confirmAssignTenant}
          title="Assign Tenant to Room"
          message={`Are you sure you want to assign this tenant to room ${pg?.floors?.flatMap((f: any) => f.rooms)?.find((r: any) => r._id === assignTenant?.roomId)?.number}?`}
          confirmText="Assign Tenant"
          cancelText="Cancel"
        />

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={!!deleteConfirm}
          onClose={() => setDeleteConfirm(null)}
          onConfirm={confirmDeleteRoom}
          title="Delete Room"
          message="Are you sure you want to delete this room? This action cannot be undone."
          confirmText="Delete Room"
          cancelText="Cancel"
          variant="danger"
        />

        {/* Add Tenant Modal */}
        <Modal
          isOpen={showAddTenant}
          onClose={() => setShowAddTenant(false)}
          title="Add New Tenant"
          footer={
            <>
              <Button variant="outline" onClick={() => setShowAddTenant(false)}>Cancel</Button>
              <Button onClick={handleAddTenant} disabled={createTenant.isPending}>
                {createTenant.isPending ? 'Adding...' : 'Add Tenant'}
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Name</label>
              <Input 
                value={newTenant.name} 
                onChange={(e) => setNewTenant({ ...newTenant, name: e.target.value })} 
                placeholder="Enter tenant name"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Email</label>
              <Input 
                type="email"
                value={newTenant.email} 
                onChange={(e) => setNewTenant({ ...newTenant, email: e.target.value })} 
                placeholder="Enter email address"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Phone</label>
              <Input 
                value={newTenant.phone} 
                onChange={(e) => setNewTenant({ ...newTenant, phone: e.target.value })} 
                placeholder="Enter phone number"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Monthly Rent (₹)</label>
              <Input 
                type="number" 
                value={newTenant.monthlyRent} 
                onChange={(e) => setNewTenant({ ...newTenant, monthlyRent: parseInt(e.target.value) || 0 })} 
                placeholder="Enter monthly rent"
              />
            </div>
          </div>
        </Modal>

        {/* Tenant Assignment Modal */}
        <Modal
          isOpen={!!assignTenant}
          onClose={() => setAssignTenant(null)}
          title="Assign Tenant to Room"
        >
          <div className="space-y-4">
            {assignTenant?.roomId && !assignTenant.tenantId && (
              <>
                <p className="text-sm text-slate-600">Select a tenant to assign to this room:</p>
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {tenants?.filter((t: any) => !t.roomId && t.status !== 'left').map((tenant: any) => (
                    <div 
                      key={tenant._id} 
                      className="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
                      onClick={() => setAssignTenant({ ...assignTenant, tenantId: tenant._id })}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                          {tenant.name?.charAt(0) || 'T'}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{tenant.name}</p>
                          <p className="text-xs text-slate-500">{tenant.email}</p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline">Select</Button>
                    </div>
                  ))}
                  {(!tenants || tenants.filter((t: any) => !t.roomId && t.status !== 'left').length === 0) && (
                    <p className="text-sm text-slate-500 text-center py-4">No unassigned tenants available</p>
                  )}
                </div>
              </>
            )}
            {assignTenant?.tenantId && assignTenant?.roomId && (
              <>
                <p className="text-sm text-slate-600">
                  Are you sure you want to assign {tenants?.find((t: any) => t._id === assignTenant.tenantId)?.name} to this room?
                </p>
                <div className="flex gap-3 pt-4">
                  <Button variant="outline" onClick={() => setAssignTenant(null)}>Cancel</Button>
                  <Button onClick={confirmAssignTenant}>Assign Tenant</Button>
                </div>
              </>
            )}
          </div>
        </Modal>
      </div>
    </AuthGuard>
  );
}
