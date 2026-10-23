import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/app/lib/prisma";
import { getSession, unauthorized } from "@/app/lib/auth";

const updateSchema = z.object({
  status: z
    .enum(["SCHEDULED", "COMPLETED", "CANCELLED", "NO_SHOW"])
    .optional(),
  notes: z.string().optional(),
  scheduledAt: z.string().optional(),
  department: z.string().optional(),
  reason: z.string().optional(),
  duration: z.coerce.number().int().positive().max(480).optional(),
});

// ---- GET /api/appointments/:id ----
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = getSession(req);
  if (!session) return unauthorized();

  const { id } = await params;

  const appointment = await prisma.appointment.findFirst({
    where: { id, hospitalId: session.hospitalId },
    include: {
      patient: true,
      doctor: {
        select: { id: true, fullName: true, email: true, phone: true },
      },
      createdBy: {
        select: { id: true, fullName: true },
      },
    },
  });

  if (!appointment) {
    return NextResponse.json(
      { message: "Appointment not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ appointment });
}

// ---- PATCH /api/appointments/:id ----
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = getSession(req);
  if (!session) return unauthorized();

  const { id } = await params;

  try {
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);

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

    // Confirm it belongs to this hospital
    const existing = await prisma.appointment.findFirst({
      where: { id, hospitalId: session.hospitalId },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json(
        { message: "Appointment not found" },
        { status: 404 }
      );
    }

    const data = parsed.data;

    const appointment = await prisma.appointment.update({
      where: { id },
      data: {
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.notes !== undefined ? { notes: data.notes } : {}),
        ...(data.department !== undefined
          ? { department: data.department }
          : {}),
        ...(data.reason !== undefined ? { reason: data.reason } : {}),
        ...(data.duration !== undefined ? { duration: data.duration } : {}),
        ...(data.scheduledAt !== undefined
          ? { scheduledAt: new Date(data.scheduledAt) }
          : {}),
      },
      include: {
        patient: {
          select: { id: true, firstName: true, lastName: true },
        },
        doctor: { select: { id: true, fullName: true } },
      },
    });

    return NextResponse.json({
      message: "Appointment updated",
      appointment,
    });
  } catch (err) {
    console.error("[appointments:update] error:", err);
    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}