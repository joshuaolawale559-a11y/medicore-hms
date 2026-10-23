import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/app/lib/prisma";
import { getSession, unauthorized } from "@/app/lib/auth";

const updateSchema = z.object({
  cancel: z.boolean().optional(),
  notes: z.string().nullable().optional(),
});

// ---- GET /api/prescriptions/:id ----
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = getSession(req);
  if (!session) return unauthorized();

  const { id } = await params;

  const prescription = await prisma.prescription.findFirst({
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
      doctor: { select: { id: true, fullName: true } },
      dispensedBy: { select: { id: true, fullName: true } },
      items: {
        include: {
          drug: {
            select: {
              id: true,
              name: true,
              genericName: true,
              strength: true,
              form: true,
              sellingPrice: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!prescription) {
    return NextResponse.json(
      { message: "Prescription not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ prescription });
}

// ---- PATCH /api/prescriptions/:id ----
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

    const existing = await prisma.prescription.findFirst({
      where: { id, hospitalId: session.hospitalId },
      include: { items: true },
    });

    if (!existing) {
      return NextResponse.json(
        { message: "Prescription not found" },
        { status: 404 }
      );
    }

    const data = parsed.data;

    // Cancel action
    if (data.cancel === true) {
      if (!["ADMIN", "DOCTOR"].includes(session.role)) {
        return NextResponse.json(
          { message: "Only doctors and admins can cancel prescriptions." },
          { status: 403 }
        );
      }
      if (existing.status === "DISPENSED") {
        return NextResponse.json(
          { message: "Cannot cancel a fully dispensed prescription." },
          { status: 400 }
        );
      }
      if (existing.status === "CANCELLED") {
        return NextResponse.json(
          { message: "Prescription is already cancelled." },
          { status: 400 }
        );
      }
      // Block cancel if any item has already been partially dispensed
      const anyDispensed = existing.items.some((i) => i.dispensedQty > 0);
      if (anyDispensed) {
        return NextResponse.json(
          {
            message:
              "Cannot cancel: some drugs have already been dispensed.",
          },
          { status: 400 }
        );
      }

      const updated = await prisma.prescription.update({
        where: { id },
        data: { status: "CANCELLED" },
      });

      return NextResponse.json({
        message: "Prescription cancelled",
        prescription: updated,
      });
    }

    // Regular update: notes only (and only by doctor/admin)
    if (data.notes !== undefined) {
      if (!["ADMIN", "DOCTOR"].includes(session.role)) {
        return NextResponse.json(
          { message: "Only doctors and admins can edit notes." },
          { status: 403 }
        );
      }

      const updated = await prisma.prescription.update({
        where: { id },
        data: { notes: data.notes?.trim() || null },
      });

      return NextResponse.json({
        message: "Prescription updated",
        prescription: updated,
      });
    }

    return NextResponse.json(
      { message: "Nothing to update." },
      { status: 400 }
    );
  } catch (err) {
    console.error("[prescriptions:update] error:", err);
    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}