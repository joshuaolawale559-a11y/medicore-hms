import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/app/lib/prisma";
import { getSession, unauthorized } from "@/app/lib/auth";

const createWardSchema = z.object({
  name: z.string().min(1, "Ward name is required"),
  floor: z.string().optional(),
  capacity: z.coerce.number().int().nonnegative().optional(),
});

// ---- GET /api/wards ----
// Returns all wards in the hospital, each with its beds and admission counts.
export async function GET(req: NextRequest) {
  const session = getSession(req);
  if (!session) return unauthorized();

  const wards = await prisma.ward.findMany({
    where: { hospitalId: session.hospitalId },
    orderBy: { name: "asc" },
    include: {
      beds: {
        orderBy: { bedNumber: "asc" },
        select: {
          id: true,
          bedNumber: true,
          status: true,
        },
      },
    },
  });

  // Compute per-ward stats (available / occupied / maintenance)
  const data = wards.map((w) => {
    const total = w.beds.length;
    const available = w.beds.filter((b) => b.status === "AVAILABLE").length;
    const occupied = w.beds.filter((b) => b.status === "OCCUPIED").length;
    const maintenance = w.beds.filter(
      (b) => b.status === "MAINTENANCE"
    ).length;

    return {
      id: w.id,
      name: w.name,
      floor: w.floor,
      capacity: w.capacity,
      createdAt: w.createdAt,
      beds: w.beds,
      stats: { total, available, occupied, maintenance },
    };
  });

  return NextResponse.json({ wards: data, total: data.length });
}

// ---- POST /api/wards ----
// Only ADMIN and NURSE can create wards.
export async function POST(req: NextRequest) {
  const session = getSession(req);
  if (!session) return unauthorized();

  if (!["ADMIN", "NURSE"].includes(session.role)) {
    return NextResponse.json(
      { message: "You do not have permission to create wards." },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const parsed = createWardSchema.safeParse(body);

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

    const ward = await prisma.ward.create({
      data: {
        name: data.name.trim(),
        floor: data.floor?.trim() || null,
        capacity: data.capacity ?? 0,
        hospitalId: session.hospitalId,
      },
    });

    return NextResponse.json(
      { message: "Ward created successfully", ward },
      { status: 201 }
    );
  } catch (err) {
    console.error("[wards:create] error:", err);
    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}