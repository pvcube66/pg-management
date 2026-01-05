import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Maintenance } from '@/models/Maintenance';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const pgId = searchParams.get('pgId');
    const status = searchParams.get('status');

    await dbConnect();
    
    let query: any = {};
    if (pgId) query.pgId = pgId;
    if (status) query.status = status;

    const requests = await Maintenance.find(query)
        .populate('reportedBy', 'email')
        .populate('tenantId', 'name phone')
        .populate('assignedTo', 'email')
        .sort({ createdAt: -1 });
    
    return NextResponse.json(requests);
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    await dbConnect();

    try {
        const maintenance = await Maintenance.create({
            ...body,
            reportedBy: session.user.id
        });
        return NextResponse.json(maintenance);
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}
