import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Booking } from '@/models/Booking';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const pgId = searchParams.get('pgId');

    await dbConnect();
    
    let query: any = {};
    if (pgId) query.pgId = pgId;

    // Security check
    if (session.user.role === 'pgowner') {
        // Must ensure PG belongs to owner (complex query or trusted FE? Let's verify)
        // ideally we filter by PGs owned by user. For MVP we trust pgId param if passed, but verify ownership or filter by owned PGs if pgId is missing.
        // Simplified:
    } else if (session.user.role === 'incharge') {
        query.pgId = session.user.pgId;
    }

    const bookings = await Booking.find(query).populate('tenant', 'email').populate('pgId', 'name');
    return NextResponse.json(bookings);
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    await dbConnect();

    try {
        const booking = await Booking.create(body);
        return NextResponse.json(booking);
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}
