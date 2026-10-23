import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/app/lib/prisma";
import { getSession, unauthorized } from "@/app/lib/auth";

const updateDrugSchema = z.object({
  name: z.string().min(1).optional(),
  genericName: z.string().nullable().optional(),
  form: z
    .enum([
      "TABLET",
      "CAPSULE",
      "SYRUP",
      "INJECTION",
      "CREAM",
      "OINTMENT",
      "DROPS",
      "INHALER",
      "SUPPOSITORY",
      "OTHER",
    ])
    .optional(),
  strength: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  manufacturer: z.string().nullable().optional(),
  sellingPrice: z.coerce.number().nonnegative().optional(),
  costPrice: z.coerce.number().nonnegative().optional(),
  reorderLevel: z.coerce.number().int().nonnegative().optional(),
  description: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

// ---- GET /api/drugs/:id ----
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = getSession(req);
  if (!session) return unauthorized();

  const { id } = await params;

  const drug = await prisma.drug.findFirst({
    where: { id, hospitalId: session.hospitalId },
    include: {
      batches: {
        orderBy: { expiryDate: "asc" },
      },
    },
  });

  if (!drug) {
    return NextResponse.json(
      { message: "Drug not found" },
      { status: 404 }
    );
  }

  const now = new Date();
  const soon = new Date();
  soon.setDate(soon.getDate() + 30);

  const batches = drug.batches.map((b) => ({
    id: b.id,
    batchNumber: b.batchNumber,
    quantity: b.quantity,
    initialQty: b.initialQty,
    expiryDate: b.expiryDate,
    receivedAt: b.receivedAt,
    supplierName: b.supplierName,
    notes: b.notes,
    isExpired: new Date(b.expiryDate) < now,
    isExpiringSoon:
      new Date(b.expiryDate) >= now && new Date(b.expiryDate) <= soon,
  }));

  const totalStock = batches.reduce((s, b) => s + b.quantity, 0);

  return NextResponse.json({
    drug: {
      id: drug.id,
      name: drug.name,
      genericName: drug.genericName,
      form: drug.form,
      strength: drug.strength,
      category: drug.category,
      manufacturer: drug.manufacturer,
      sellingPrice: Number(drug.sellingPrice),
      costPrice: Number(drug.costPrice),
      reorderLevel: drug.reorderLevel,
      description: drug.description,
      isActive: drug.isActive,
      createdAt: drug.createdAt,
      updatedAt: drug.updatedAt,
      batches,
      totalStock,
      isLowStock: totalStock <= drug.reorderLevel,
    },
  });
}

// ---- PATCH /api/drugs/:id ----
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = getSession(req);
  if (!session) return unauthorized();

  if (!["ADMIN", "PHARMACIST"].includes(session.role)) {
    return NextResponse.json(
      { message: "You do not have permission to modify drugs." },
      { status: 403 }
    );
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const parsed = updateDrugSchema.safeParse(body);

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

    const existing = await prisma.drug.findFirst({
      where: { id, hospitalId: session.hospitalId },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json(
        { message: "Drug not found" },
        { status: 404 }
      );
    }

    const d = parsed.data;

    const updated = await prisma.drug.update({
      where: { id },
      data: {
        ...(d.name !== undefined ? { name: d.name.trim() } : {}),
        ...(d.genericName !== undefined
          ? { genericName: d.genericName?.trim() || null }
          : {}),
        ...(d.form !== undefined ? { form: d.form } : {}),
        ...(d.strength !== undefined
          ? { strength: d.strength?.trim() || null }
          : {}),
        ...(d.category !== undefined
          ? { category: d.category?.trim() || null }
          : {}),
        ...(d.manufacturer !== undefined
          ? { manufacturer: d.manufacturer?.trim() || null }
          : {}),
        ...(d.sellingPrice !== undefined
          ? { sellingPrice: d.sellingPrice }
          : {}),
        ...(d.costPrice !== undefined ? { costPrice: d.costPrice } : {}),
        ...(d.reorderLevel !== undefined
          ? { reorderLevel: d.reorderLevel }
          : {}),
        ...(d.description !== undefined
          ? { description: d.description?.trim() || null }
          : {}),
        ...(d.isActive !== undefined ? { isActive: d.isActive } : {}),
      },
    });

    return NextResponse.json({ message: "Drug updated", drug: updated });
  } catch (err) {
    console.error("[drugs:update] error:", err);
    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}