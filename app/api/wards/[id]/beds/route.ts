import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/app/lib/prisma";
import { getSession, unauthorized } from "@/app/lib/auth";

const createBedSchema = z.object({
  bedNumber: z.string().min(1, "Bed number is required"),
});

// POST /api/wards/:id/beds — Add a bed to a ward
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = getSession(req);
  if (!session) return unauthorized();

  if (!["ADMIN", "NURSE"].includes(session.role)) {
    return NextResponse.json(
      { message: "You do not have permission to add beds." },
      { status: 403 }
    );
  }

  const { id: wardId } = await params;

  try {
    const body = await req.json();
    const parsed = createBedSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "Invalid input",
          errors: parsed.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        },
        { status: 400 }
      );
    }

    // Confirm the ward belongs to this hospital
    const ward = await prisma.ward.findFirst({
      where: { id: wardId, hospitalId: session.hospitalId },
      select: { id: true },
    });

    if (!ward) {
      return NextResponse.json(
        { message: "Ward not found" },
        { status: 404 }
      );
    }

    const bedNumber = parsed.data.bedNumber.trim();

    // Prevent duplicate bed numbers within the same ward
    const duplicate = await prisma.bed.findFirst({
      where: { wardId, bedNumber },
      select: { id: true },
    });

    if (duplicate) {
      return NextResponse.json(
        { message: `Bed ${bedNumber} already exists in this ward.` },
        { status: 409 }
      );
    }

    // Create the bed and bump the ward's capacity in one transaction
    const [bed] = await prisma.$transaction([
      prisma.bed.create({
        data: {
          bedNumber,
          wardId,
          status: "AVAILABLE",
        },
      }),
      prisma.ward.update({
        where: { id: wardId },
        data: { capacity: { increment: 1 } },
      }),
    ]);

    return NextResponse.json(
      { message: "Bed added successfully", bed },
      { status: 201 }
    );
  } catch (err) {
    console.error("[beds:create] error:", err);
    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}