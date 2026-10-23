import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getSession, unauthorized } from "@/app/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = getSession(req);
  if (!session) return unauthorized();

  const { id } = await params;

  const user = await prisma.user.findFirst({
    where: {
      id,
      hospitalId: session.hospitalId,
    },
    select: {
      id: true,
      email: true,
      fullName: true,
      phone: true,
      role: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    return NextResponse.json(
      { message: "Staff member not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ user });
}