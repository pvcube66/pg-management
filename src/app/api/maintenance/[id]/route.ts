import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Maintenance } from '@/models/Maintenance';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    await dbConnect();
    const { id } = await params;

    const maintenance = await Maintenance.findByIdAndUpdate(id, body, { new: true });
    if (!maintenance) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json(maintenance);
}
