import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { User } from '@/models/User';
import { PG } from '@/models/PG';
import { Tenant } from '@/models/Tenant';
import { Payment } from '@/models/Payment';
import { Maintenance } from '@/models/Maintenance';
import bcrypt from 'bcryptjs';

export async function GET() {
  return POST();
}

export async function POST() {
    await dbConnect();

    try {
        const seedUsers = [
            { email: 'admin@pg.com', password: 'admin123', role: 'superadmin' },
            { email: 'owner@pg.com', password: 'owner123', role: 'pgowner' },
            { email: 'owner2@pg.com', password: 'owner123', role: 'pgowner' },
            { email: 'incharge@pg.com', password: 'incharge123', role: 'incharge' },
            { email: 'incharge2@pg.com', password: 'incharge123', role: 'incharge' }
        ];

        const users: Record<string, any> = {};

        for (const entry of seedUsers) {
            let user = await User.findOne({ email: entry.email });
            if (!user) {
                const passwordHash = await bcrypt.hash(entry.password, 10);
                user = await User.create({
                    email: entry.email,
                    passwordHash,
                    role: entry.role
                });
            }
            users[entry.email] = user;
        }

        const pgSeeds = [
            {
                name: 'Sunrise Residency',
                ownerEmail: 'owner@pg.com',
                inchargeEmail: 'incharge@pg.com',
                location: {
                    lat: 17.385,
                    lng: 78.4867,
                    address: 'Hyderabad, Telangana'
                },
                amenities: ['WiFi', 'AC', 'Meals', 'Laundry', 'Parking'],
                floors: [
                    {
                        number: 1,
                        rooms: [
                            { number: '101', bedCount: 2, bedType: 'double', monthlyCost: 5200, occupiedBeds: 1 },
                            { number: '102', bedCount: 1, bedType: 'single', monthlyCost: 7800, occupiedBeds: 0 }
                        ]
                    },
                    {
                        number: 2,
                        rooms: [
                            { number: '201', bedCount: 3, bedType: 'triple', monthlyCost: 4100, occupiedBeds: 2 }
                        ]
                    }
                ]
            },
            {
                name: 'Lakeside Haven',
                ownerEmail: 'owner2@pg.com',
                inchargeEmail: 'incharge2@pg.com',
                location: {
                    lat: 12.9716,
                    lng: 77.5946,
                    address: 'Bengaluru, Karnataka'
                },
                amenities: ['WiFi', '24x7 Power', 'Chef on-site', 'Housekeeping', 'Gym'],
                floors: [
                    {
                        number: 1,
                        rooms: [
                            { number: 'A1', bedCount: 2, bedType: 'double', monthlyCost: 6500, occupiedBeds: 1 },
                            { number: 'A2', bedCount: 2, bedType: 'double', monthlyCost: 6300, occupiedBeds: 0 }
                        ]
                    },
                    {
                        number: 2,
                        rooms: [
                            { number: 'B1', bedCount: 4, bedType: 'triple', monthlyCost: 5400, occupiedBeds: 3 },
                            { number: 'B2', bedCount: 1, bedType: 'single', monthlyCost: 9600, occupiedBeds: 1 }
                        ]
                    },
                    {
                        number: 3,
                        rooms: [
                            { number: 'C1', bedCount: 3, bedType: 'triple', monthlyCost: 5200, occupiedBeds: 2 }
                        ]
                    }
                ]
            }
        ];

        for (const pg of pgSeeds) {
            const owner = users[pg.ownerEmail];
            const incharge = users[pg.inchargeEmail];
            if (!owner) continue;

            const totalCapacity = pg.floors.reduce((sum, floor) => {
                return sum + floor.rooms.reduce((roomSum, room) => roomSum + room.bedCount, 0);
            }, 0);

            const existing = await PG.findOne({ name: pg.name });
            const basePayload = {
                name: pg.name,
                owner: owner._id,
                location: pg.location,
                amenities: pg.amenities,
                floors: pg.floors,
                totalCapacity
            };

            const createdPg = existing
                ? await PG.findByIdAndUpdate(existing._id, basePayload, { new: true })
                : await PG.create(basePayload);

            await User.findByIdAndUpdate(owner._id, { $addToSet: { ownedPgs: createdPg._id } });
            if (incharge) {
                await User.findByIdAndUpdate(incharge._id, { pgId: createdPg._id });
            }
        }

        // Seed tenants, payments, and maintenance
        const pgs = await PG.find({});
        if (pgs.length > 0) {
            const sampleTenants = [
                { name: 'Rajesh Kumar', email: 'rajesh@example.com', phone: '+91-9876543210' },
                { name: 'Priya Sharma', email: 'priya@example.com', phone: '+91-9876543211' },
                { name: 'Amit Patel', email: 'amit@example.com', phone: '+91-9876543212' },
                { name: 'Neha Singh', email: 'neha@example.com', phone: '+91-9876543213' },
                { name: 'Vikram Reddy', email: 'vikram@example.com', phone: '+91-9876543214' }
            ];

            for (const pg of pgs) {
                const existingTenants = await Tenant.countDocuments({ pgId: pg._id });
                if (existingTenants === 0) {
                    // Create sample tenants for this PG
                    for (let i = 0; i < Math.min(3, sampleTenants.length); i++) {
                        const tenant = sampleTenants[i];
                        const room = pg.floors[0]?.rooms[0];
                        if (room) {
                            const newTenant = await Tenant.create({
                                ...tenant,
                                pgId: pg._id,
                                roomId: room._id,
                                floorNumber: pg.floors[0].number,
                                roomNumber: room.number,
                                checkInDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
                                monthlyRent: room.monthlyCost,
                                securityDeposit: room.monthlyCost * 2,
                                status: 'active',
                                idProof: { type: 'aadhar', number: `XXXX-XXXX-${1000 + i}` }
                            });

                            // Create payment records
                            const currentMonth = new Date().toISOString().slice(0, 7);
                            const lastMonth = new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().slice(0, 7);
                            
                            await Payment.create({
                                tenantId: newTenant._id,
                                pgId: pg._id,
                                amount: room.monthlyCost,
                                type: 'rent',
                                month: lastMonth,
                                dueDate: new Date(new Date().setMonth(new Date().getMonth() - 1, 5)),
                                paidDate: new Date(new Date().setMonth(new Date().getMonth() - 1, 8)),
                                status: 'paid',
                                paymentMethod: 'upi'
                            });

                            await Payment.create({
                                tenantId: newTenant._id,
                                pgId: pg._id,
                                amount: room.monthlyCost,
                                type: 'rent',
                                month: currentMonth,
                                dueDate: new Date(new Date().setDate(5)),
                                status: Math.random() > 0.5 ? 'paid' : 'pending',
                                ...(Math.random() > 0.5 ? { paidDate: new Date(), paymentMethod: 'upi' } : {})
                            });
                        }
                    }

                    // Create maintenance requests
                    await Maintenance.create({
                        pgId: pg._id,
                        reportedBy: users['incharge@pg.com']._id,
                        title: 'AC not cooling properly',
                        description: 'Room 101 AC needs servicing',
                        category: 'appliance',
                        priority: 'high',
                        status: 'open',
                        roomNumber: '101',
                        floorNumber: 1
                    });

                    await Maintenance.create({
                        pgId: pg._id,
                        reportedBy: users['incharge@pg.com']._id,
                        title: 'Leaking tap in bathroom',
                        description: 'Common bathroom tap needs repair',
                        category: 'plumbing',
                        priority: 'medium',
                        status: 'in_progress'
                    });
                }
            }
        }

        return NextResponse.json({ 
            message: 'Seed successful', 
            usersSeeded: Object.keys(users).length, 
            pgsSeeded: pgSeeds.length,
            tenantsCreated: await Tenant.countDocuments({}),
            paymentsCreated: await Payment.countDocuments({}),
            maintenanceCreated: await Maintenance.countDocuments({})
        });
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}
