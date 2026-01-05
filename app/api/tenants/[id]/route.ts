import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Tenant } from '@/models/Tenant';
import { PG } from '@/models/PG';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await dbConnect();
    const { id } = await params;

    const tenant = await Tenant.findById(id).populate('pgId');
    if (!tenant) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json(tenant);
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    await dbConnect();
    const { id } = await params;

    const tenant = await Tenant.findById(id);
    if (!tenant) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const pg = await PG.findById(tenant.pgId);
    if (!pg) return NextResponse.json({ error: "PG not found" }, { status: 404 });

    // If assigning to a new room
    if (body.roomId && body.roomId !== tenant.roomId?.toString()) {
        // Remove from old room if exists
        if (tenant.roomId) {
            for (let floor of pg.floors) {
                for (let room of floor.rooms) {
                    if (room._id.toString() === tenant.roomId.toString()) {
                        room.occupiedBeds = Math.max(0, (room.occupiedBeds || 0) - 1);
                        break;
                    }
                }
            }
        }

        // Add to new room
        for (let floor of pg.floors) {
            for (let room of floor.rooms) {
                if (room._id.toString() === body.roomId) {
                    room.occupiedBeds = (room.occupiedBeds || 0) + 1;
                    // Update tenant with room details
                    tenant.floorNumber = floor.number;
                    tenant.roomNumber = room.number;
                    tenant.monthlyRent = room.monthlyCost;
                    break;
                }
            }
        }
        await pg.save();
    }

    // If checking out, update room occupancy
    if (body.status === 'left' && tenant.status === 'active' && tenant.roomId) {
        for (let floor of pg.floors) {
            for (let room of floor.rooms) {
                if (room._id.toString() === tenant.roomId.toString()) {
                    room.occupiedBeds = Math.max(0, (room.occupiedBeds || 0) - 1);
                    await pg.save();
                    break;
                }
            }
        }
    }

    Object.assign(tenant, body);
    await tenant.save();

    return NextResponse.json(tenant);
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'superadmin') {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const { id } = await params;

    const tenant = await Tenant.findByIdAndDelete(id);
    if (!tenant) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ message: "Deleted successfully" });
}
