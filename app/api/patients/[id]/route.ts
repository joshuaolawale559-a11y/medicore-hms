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

  try {
    const patient = await prisma.patient.findFirst({
      where: {
        id,
        hospitalId: session.hospitalId, // scope to their hospital
      },
      include: {
        createdBy: {
          select: { id: true, fullName: true, role: true },
        },
      },
    });

    if (!patient) {
      return NextResponse.json(
        { message: "Patient not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ patient });
  } catch (err) {
    console.error("[patients:get] error:", err);
    return NextResponse.json(
      { message: "Something went wrong." },
      { status: 500 }
    );
  }
}