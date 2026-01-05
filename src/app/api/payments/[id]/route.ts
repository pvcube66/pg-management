import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Payment } from '@/models/Payment';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await dbConnect();
    const { id } = await params;

    const payment = await Payment.findById(id).populate('tenantId').populate('pgId');
    if (!payment) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json(payment);
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    await dbConnect();
    const { id } = await params;

    const payment = await Payment.findByIdAndUpdate(id, body, { new: true });
    if (!payment) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json(payment);
}
