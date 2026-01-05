import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { PG } from '@/models/PG';
import { Tenant } from '@/models/Tenant';
import { Payment } from '@/models/Payment';
import { Maintenance } from '@/models/Maintenance';
import { Expense } from '@/models/Expense';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const pgId = searchParams.get('pgId');

    await dbConnect();
    
    try {
        let pgQuery: any = {};
        
        if (session.user.role === 'pgowner') {
            pgQuery.owner = session.user.id;
        } else if (session.user.role === 'incharge' && session.user.pgId) {
            pgQuery._id = session.user.pgId;
        }
        
        if (pgId) pgQuery._id = pgId;

        const pgs = await PG.find(pgQuery);
        const pgIds = pgs.map(pg => pg._id);

        // Calculate occupancy
        let totalBeds = 0;
        let occupiedBeds = 0;
        pgs.forEach(pg => {
            pg.floors?.forEach((floor: any) => {
                floor.rooms?.forEach((room: any) => {
                    totalBeds += room.bedCount || 0;
                    occupiedBeds += room.occupiedBeds || 0;
                });
            });
        });

        const occupancyRate = totalBeds > 0 ? ((occupiedBeds / totalBeds) * 100).toFixed(1) : 0;

        // Tenant stats
        const activeTenants = await Tenant.countDocuments({ pgId: { $in: pgIds }, status: 'active' });
        const pendingTenants = await Tenant.countDocuments({ pgId: { $in: pgIds }, status: 'pending' });
        
        // Payment stats
        const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
        const payments = await Payment.find({ pgId: { $in: pgIds }, month: currentMonth });
        
        const totalRevenue = payments
            .filter(p => p.status === 'paid')
            .reduce((sum, p) => sum + p.amount, 0);
        
        const pendingPayments = payments
            .filter(p => p.status === 'pending')
            .reduce((sum, p) => sum + p.amount, 0);
        
        const overduePayments = payments
            .filter(p => p.status === 'overdue')
            .reduce((sum, p) => sum + p.amount, 0);

        // Maintenance stats
        const openMaintenance = await Maintenance.countDocuments({ pgId: { $in: pgIds }, status: 'open' });
        const urgentMaintenance = await Maintenance.countDocuments({ pgId: { $in: pgIds }, priority: 'urgent', status: { $ne: 'closed' } });

        // Expense stats (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentExpenses = await Expense.find({
            pgId: { $in: pgIds },
            date: { $gte: thirtyDaysAgo }
        });
        const totalExpenses = recentExpenses.reduce((sum, e) => sum + e.amount, 0);

        // Monthly trend (last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const monthlyPayments = await Payment.aggregate([
            { 
                $match: { 
                    pgId: { $in: pgIds },
                    status: 'paid',
                    paidDate: { $gte: sixMonthsAgo }
                }
            },
            {
                $group: {
                    _id: { $substr: ['$month', 0, 7] },
                    revenue: { $sum: '$amount' }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        return NextResponse.json({
            occupancy: {
                total: totalBeds,
                occupied: occupiedBeds,
                available: totalBeds - occupiedBeds,
                rate: occupancyRate
            },
            tenants: {
                active: activeTenants,
                pending: pendingTenants,
                total: activeTenants + pendingTenants
            },
            revenue: {
                collected: totalRevenue,
                pending: pendingPayments,
                overdue: overduePayments,
                total: totalRevenue + pendingPayments + overduePayments
            },
            maintenance: {
                open: openMaintenance,
                urgent: urgentMaintenance
            },
            expenses: {
                last30Days: totalExpenses
            },
            trends: {
                monthly: monthlyPayments
            },
            properties: pgs.length
        });
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}
