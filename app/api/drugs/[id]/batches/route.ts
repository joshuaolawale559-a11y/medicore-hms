import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/app/lib/prisma";
import { getSession, unauthorized } from "@/app/lib/auth";

const createBatchSchema = z.object({
  batchNumber: z.string().min(1, "Batch number is required"),
  quantity: z.coerce.number().int().positive("Quantity must be positive"),
  expiryDate: z.string().min(1, "Expiry date is required"),
  supplierName: z.string().optional(),
  notes: z.string().optional(),
});

const updateBatchSchema = z.object({
  quantity: z.coerce.number().int().nonnegative().optional(),
  notes: z.string().nullable().optional(),
});

// ---- POST /api/drugs/:id/batches ----
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = getSession(req);
  if (!session) return unauthorized();

  if (!["ADMIN", "PHARMACIST"].includes(session.role)) {
    return NextResponse.json(
      { message: "You do not have permission to add stock." },
      { status: 403 }
    );
  }

  const { id: drugId } = await params;

  try {
    const body = await req.json();
    const parsed = createBatchSchema.safeParse(body);

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

    const data = parsed.data;

    // Confirm the drug exists in this hospital
    const drug = await prisma.drug.findFirst({
      where: { id: drugId, hospitalId: session.hospitalId },
      select: { id: true },
    });
    if (!drug) {
      return NextResponse.json(
        { message: "Drug not found" },
        { status: 404 }
      );
    }

    // Reject batches that are already expired
    const expiry = new Date(data.expiryDate);
    if (expiry.getTime() < Date.now()) {
      return NextResponse.json(
        { message: "Cannot add a batch that is already expired." },
        { status: 400 }
      );
    }

    const batch = await prisma.drugBatch.create({
      data: {
        drugId,
        batchNumber: data.batchNumber.trim(),
        quantity: data.quantity,
        initialQty: data.quantity,
        expiryDate: expiry,
        supplierName: data.supplierName?.trim() || null,
        notes: data.notes?.trim() || null,
      },
    });

    return NextResponse.json(
      { message: "Batch added", batch },
      { status: 201 }
    );
  } catch (err) {
    console.error("[batches:create] error:", err);
    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

// ---- PATCH /api/drugs/:id/batches ----
// Adjusts a batch's remaining quantity or notes.
// Used for: correcting a counting mistake, marking damaged stock,
// or recording manual stock adjustments.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = getSession(req);
  if (!session) return unauthorized();

  if (!["ADMIN", "PHARMACIST"].includes(session.role)) {
    return NextResponse.json(
      { message: "You do not have permission to modify stock." },
      { status: 403 }
    );
  }

  const { id: drugId } = await params;

  try {
    const body = await req.json();
    const parsed = updateBatchSchema.safeParse(body);

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

    const { batchId, ...updates } = body;

    if (!batchId) {
      return NextResponse.json(
        { message: "batchId is required in the body." },
        { status: 400 }
      );
    }

    // Confirm the batch belongs to a drug in this hospital
    const batch = await prisma.drugBatch.findFirst({
      where: {
        id: batchId,
        drug: { id: drugId, hospitalId: session.hospitalId },
      },
    });

    if (!batch) {
      return NextResponse.json(
        { message: "Batch not found" },
        { status: 404 }
      );
    }

    const updated = await prisma.drugBatch.update({
      where: { id: batchId },
      data: {
        ...(updates.quantity !== undefined
          ? { quantity: updates.quantity }
          : {}),
        ...(updates.notes !== undefined
          ? { notes: updates.notes || null }
          : {}),
      },
    });

    return NextResponse.json({ message: "Batch updated", batch: updated });
  } catch (err) {
    console.error("[batches:update] error:", err);
    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}