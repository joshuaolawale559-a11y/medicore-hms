import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getSession, unauthorized } from "@/app/lib/auth";

export async function GET(req: NextRequest) {
  const session = getSession(req);
  if (!session) return unauthorized();

  const doctors = await prisma.user.findMany({
    where: {
      hospitalId: session.hospitalId,
      role: "DOCTOR",
      isActive: true,
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
    },
    orderBy: { fullName: "asc" },
  });

  return NextResponse.json({ doctors });
}