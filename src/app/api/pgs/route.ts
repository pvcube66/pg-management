import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { PG } from '@/models/PG';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();
  
  let query = {};
  if (session.user.role === 'pgowner') {
      query = { owner: session.user.id };
  } else if (session.user.role === 'incharge') {
      // Incharge sees the PG they are assigned to
      if (session.user.pgId) {
          query = { _id: session.user.pgId };
      } else {
          return NextResponse.json([]); // No PG assigned
      }
  }
  // Superadmin sees all (empty query)

  const pgs = await PG.find(query).populate('owner', 'email');
  return NextResponse.json(pgs);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'superadmin') {
      return NextResponse.json({ error: "Unauthorized - Only superadmin can create PGs" }, { status: 401 });
  }

  const body = await req.json();
  await dbConnect();

  try {
      const pg = await PG.create(body);
      return NextResponse.json(pg);
  } catch (error) {
      return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
