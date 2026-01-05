import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { User } from '@/models/User';
import bcrypt from 'bcryptjs';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'superadmin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();
  const users = await User.find({}).select('-passwordHash');
  return NextResponse.json(users);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  // Allow superadmin or pgowner to create users (e.g. owners creating incharge)
  if (!session || !['superadmin', 'pgowner'].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  await dbConnect();

  try {
      const passwordHash = await bcrypt.hash(body.password, 10);
      const user = await User.create({
          email: body.email,
          passwordHash,
          role: body.role,
          pgId: body.pgId
      });
      return NextResponse.json(user);
  } catch (error) {
      return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
