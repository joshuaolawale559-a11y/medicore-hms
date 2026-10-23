import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getSession, unauthorized } from "@/app/lib/auth";

export async function GET(req: NextRequest) {
  const session = getSession(req);
  if (!session) return unauthorized();

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      hospitalId: true,
      hospital: {
        select: { id: true, name: true },
      },
    },
  });

  if (!user) return unauthorized();

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      hospitalId: user.hospitalId,
      hospitalName: user.hospital.name,
    },
  });
}