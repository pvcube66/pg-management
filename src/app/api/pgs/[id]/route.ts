import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { PG } from '@/models/PG';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await dbConnect();
  // Await params (Next 15)
  const { id } = await params;

  const pg = await PG.findById(id).populate('owner');
  if (!pg) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Access control: Only owner, superadmin, or assigned incharge can view
  const isOwner = session.user.id === pg.owner._id.toString();
  const isAdmin = session.user.role === 'superadmin';
  const isIncharge = session.user.role === 'incharge' && session.user.pgId === id;

  if (!isOwner && !isAdmin && !isIncharge) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(pg);
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    await dbConnect();
    const { id } = await params;

    const pg = await PG.findById(id);
    if (!pg) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (session.user.role !== 'superadmin' && session.user.id !== pg.owner.toString()) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    Object.assign(pg, body);
    await pg.save();

    return NextResponse.json(pg);
}
