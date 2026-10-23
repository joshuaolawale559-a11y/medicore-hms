import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/app/lib/prisma";
import { getSession, unauthorized } from "@/app/lib/auth";

const updateSchema = z.object({
  action: z.enum(["discharge", "transfer", "cancel"]),
  transferToBedId: z.string().optional(), // required if action === "transfer"
  notes: z.string().optional(),
});

// ---- GET /api/admissions/:id ----
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = getSession(req);
  if (!session) return unauthorized();

  const { id } = await params;

  const admission = await prisma.admission.findFirst({
    where: { id, hospitalId: session.hospitalId },
    include: {
      patient: {
        select: {
          id: true,
          patientCode: true,
          firstName: true,
          lastName: true,
          phone: true,
          email: true,
        },
      },
      bed: {
        select: {
          id: true,
          bedNumber: true,
          ward: { select: { id: true, name: true } },
        },
      },
      admittedBy: { select: { id: true, fullName: true } },
      dischargedBy: { select: { id: true, fullName: true } },
    },
  });

  if (!admission) {
    return NextResponse.json(
      { message: "Admission not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ admission });
}

// ---- PATCH /api/admissions/:id ----
// Handles discharge, transfer to another bed, or cancel (mistake correction).
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = getSession(req);
  if (!session) return unauthorized();

  if (!["ADMIN", "NURSE", "DOCTOR"].includes(session.role)) {
    return NextResponse.json(
      { message: "You do not have permission to modify admissions." },
      { status: 403 }
    );
  }

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

    const { action, transferToBedId, notes } = parsed.data;

    const admission = await prisma.admission.findFirst({
      where: { id, hospitalId: session.hospitalId },
      include: {
        bed: { select: { id: true, bedNumber: true, wardId: true } },
      },
    });

    if (!admission) {
      return NextResponse.json(
        { message: "Admission not found" },
        { status: 404 }
      );
    }

    if (admission.status !== "ACTIVE") {
      return NextResponse.json(
        {
          message: `This admission is already ${admission.status.toLowerCase()}.`,
        },
        { status: 400 }
      );
    }

    // ---------- DISCHARGE ----------
    if (action === "discharge") {
      const result = await prisma.$transaction(async (tx) => {
        const updated = await tx.admission.update({
          where: { id },
          data: {
            status: "DISCHARGED",
            dischargedAt: new Date(),
            dischargedById: session.userId,
            ...(notes !== undefined ? { notes: notes || null } : {}),
          },
        });

        await tx.bed.update({
          where: { id: admission.bed.id },
          data: { status: "AVAILABLE" },
        });

        return updated;
      });

      return NextResponse.json({
        message: "Patient discharged successfully",
        admission: result,
      });
    }

    // ---------- TRANSFER ----------
    if (action === "transfer") {
      if (!transferToBedId) {
        return NextResponse.json(
          { message: "transferToBedId is required for a transfer." },
          { status: 400 }
        );
      }

      if (transferToBedId === admission.bed.id) {
        return NextResponse.json(
          { message: "Cannot transfer to the same bed." },
          { status: 400 }
        );
      }

      const newBed = await prisma.bed.findFirst({
        where: {
          id: transferToBedId,
          ward: { hospitalId: session.hospitalId },
        },
        select: { id: true, bedNumber: true, status: true },
      });

      if (!newBed) {
        return NextResponse.json(
          { message: "Target bed not found." },
          { status: 404 }
        );
      }
      if (newBed.status !== "AVAILABLE") {
        return NextResponse.json(
          {
            message: `Target bed ${newBed.bedNumber} is not available.`,
          },
          { status: 400 }
        );
      }

      const oldBedId = admission.bed.id;

      await prisma.$transaction(async (tx) => {
        // Mark current admission as transferred
        await tx.admission.update({
          where: { id },
          data: {
            status: "TRANSFERRED",
            dischargedAt: new Date(),
            dischargedById: session.userId,
            ...(notes !== undefined ? { notes: notes || null } : {}),
          },
        });

        // Free the old bed
        await tx.bed.update({
          where: { id: oldBedId },
          data: { status: "AVAILABLE" },
        });

        // Occupy the new bed
        await tx.bed.update({
          where: { id: newBed.id },
          data: { status: "OCCUPIED" },
        });

        // Create a fresh admission at the new bed
        await tx.admission.create({
          data: {
            admissionNo: `ADM-${Date.now().toString(36).toUpperCase()}`,
            patientId: admission.patientId,
            bedId: newBed.id,
            hospitalId: session.hospitalId,
            admittedById: session.userId,
            reason: admission.reason ?? "Transfer from " + admission.bed.bedNumber,
            status: "ACTIVE",
          },
        });
      });

      return NextResponse.json({
        message: "Patient transferred successfully",
      });
    }

    // ---------- CANCEL (mistake correction) ----------
    if (action === "cancel") {
      await prisma.$transaction(async (tx) => {
        await tx.admission.delete({ where: { id } });
        await tx.bed.update({
          where: { id: admission.bed.id },
          data: { status: "AVAILABLE" },
        });
      });

      return NextResponse.json({
        message: "Admission cancelled",
      });
    }

    return NextResponse.json(
      { message: "Unknown action." },
      { status: 400 }
    );
  } catch (err) {
    console.error("[admissions:update] error:", err);
    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}