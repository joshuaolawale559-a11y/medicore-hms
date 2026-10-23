import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/app/lib/prisma";
import { getSession, unauthorized } from "@/app/lib/auth";

const createDrugSchema = z.object({
  name: z.string().min(1, "Drug name is required"),
  genericName: z.string().optional(),
  form: z.enum([
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
  ]),
  strength: z.string().optional(),
  category: z.string().optional(),
  manufacturer: z.string().optional(),
  sellingPrice: z.coerce.number().nonnegative().default(0),
  costPrice: z.coerce.number().nonnegative().default(0),
  reorderLevel: z.coerce.number().int().nonnegative().default(10),
  description: z.string().optional(),
});

// ---- GET /api/drugs ----
// Returns all drugs in the hospital with computed total stock (sum of batches).
export async function GET(req: NextRequest) {
  const session = getSession(req);
  if (!session) return unauthorized();

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() || "";
  const category = searchParams.get("category")?.trim() || "";
  const lowStock = searchParams.get("lowStock") === "true";

  const where: any = {
    hospitalId: session.hospitalId,
    isActive: true,
  };
  if (category) where.category = category;
  if (q) {
    where.OR = [
      { name: { contains: q } },
      { genericName: { contains: q } },
      { category: { contains: q } },
    ];
  }

  const drugs = await prisma.drug.findMany({
    where,
    orderBy: { name: "asc" },
    include: {
      batches: {
        select: {
          id: true,
          batchNumber: true,
          quantity: true,
          expiryDate: true,
        },
      },
    },
  });

  // Compute total stock per drug + a flag for low stock / expiring soon
  const now = new Date();
  const soon = new Date();
  soon.setDate(soon.getDate() + 30); // "expiring within 30 days"

  const data = drugs.map((d) => {
    const totalStock = d.batches.reduce((s, b) => s + b.quantity, 0);
    const expiringSoon = d.batches.filter(
      (b) => b.quantity > 0 && new Date(b.expiryDate) <= soon
    ).length;
    const expired = d.batches.filter(
      (b) => b.quantity > 0 && new Date(b.expiryDate) < now
    ).length;

    return {
      id: d.id,
      name: d.name,
      genericName: d.genericName,
      form: d.form,
      strength: d.strength,
      category: d.category,
      sellingPrice: Number(d.sellingPrice),
      costPrice: Number(d.costPrice),
      reorderLevel: d.reorderLevel,
      totalStock,
      isLowStock: totalStock <= d.reorderLevel,
      expiringSoon,
      expired,
      batchCount: d.batches.length,
      createdAt: d.createdAt,
    };
  });

  const filtered = lowStock ? data.filter((d) => d.isLowStock) : data;

  return NextResponse.json({
    drugs: filtered,
    total: filtered.length,
    lowStockCount: data.filter((d) => d.isLowStock).length,
    expiringSoonCount: data.filter((d) => d.expiringSoon > 0).length,
  });
}

// ---- POST /api/drugs ----
export async function POST(req: NextRequest) {
  const session = getSession(req);
  if (!session) return unauthorized();

  if (!["ADMIN", "PHARMACIST"].includes(session.role)) {
    return NextResponse.json(
      { message: "You do not have permission to add drugs." },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const parsed = createDrugSchema.safeParse(body);

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

    const drug = await prisma.drug.create({
      data: {
        name: data.name.trim(),
        genericName: data.genericName?.trim() || null,
        form: data.form,
        strength: data.strength?.trim() || null,
        category: data.category?.trim() || null,
        manufacturer: data.manufacturer?.trim() || null,
        sellingPrice: data.sellingPrice,
        costPrice: data.costPrice,
        reorderLevel: data.reorderLevel,
        description: data.description?.trim() || null,
        hospitalId: session.hospitalId,
      },
    });

    return NextResponse.json(
      { message: "Drug added to catalog", drug },
      { status: 201 }
    );
  } catch (err) {
    console.error("[drugs:create] error:", err);
    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}