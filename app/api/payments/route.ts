import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Payment } from '@/models/Payment';
import { Tenant } from '@/models/Tenant';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const pgId = searchParams.get('pgId');
    const tenantId = searchParams.get('tenantId');
    const status = searchParams.get('status');
    const month = searchParams.get('month');

    await dbConnect();
    
    let query: any = {};
    
    if (pgId) query.pgId = pgId;
    if (tenantId) query.tenantId = tenantId;
    if (status) query.status = status;
    if (month) query.month = month;

    const payments = await Payment.find(query)
        .populate('tenantId', 'name email phone')
        .populate('pgId', 'name')
        .sort({ dueDate: -1 });
    
    return NextResponse.json(payments);
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !['superadmin', 'pgowner', 'incharge'].includes(session.user.role)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    await dbConnect();

    try {
        const payment = await Payment.create(body);
        return NextResponse.json(payment);
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}
