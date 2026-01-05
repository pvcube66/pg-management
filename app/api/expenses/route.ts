import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Expense } from '@/models/Expense';
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

    const expenses = await Expense.find(query)
        .populate('addedBy', 'email')
        .sort({ date: -1 });
    
    return NextResponse.json(expenses);
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !['superadmin', 'pgowner', 'incharge'].includes(session.user.role)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    await dbConnect();

    try {
        const expense = await Expense.create({
            ...body,
            addedBy: session.user.id
        });
        return NextResponse.json(expense);
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}
