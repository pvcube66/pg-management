import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Tenant } from '@/models/Tenant';
import { PG } from '@/models/PG';
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
    
    if (session.user.role === 'pgowner') {
        // Owner can see tenants from their PGs
        const pgs = await PG.find({ owner: session.user.id }).select('_id');
        query.pgId = { $in: pgs.map(pg => pg._id) };
    } else if (session.user.role === 'incharge') {
        query.pgId = session.user.pgId;
    }
    // Superadmin sees all
    
    if (pgId) query.pgId = pgId;
    if (status) query.status = status;

    const tenants = await Tenant.find(query).populate('pgId', 'name location').sort({ createdAt: -1 });
    return NextResponse.json(tenants);
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !['superadmin', 'pgowner', 'incharge'].includes(session.user.role)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    await dbConnect();

    try {
        // Update room occupancy
        if (body.roomId && body.status === 'active') {
            const pg = await PG.findById(body.pgId);
            if (pg) {
                for (let floor of pg.floors) {
                    for (let room of floor.rooms) {
                        if (room._id.toString() === body.roomId) {
                            room.occupiedBeds = (room.occupiedBeds || 0) + 1;
                            await pg.save();
                            break;
                        }
                    }
                }
            }
        }

        const tenant = await Tenant.create(body);
        return NextResponse.json(tenant);
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}
