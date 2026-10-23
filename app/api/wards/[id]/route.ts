import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/app/lib/prisma";
import { getSession, unauthorized } from "@/app/lib/auth";

const updateWardSchema = z.object({
  name: z.string().min(1).optional(),
  floor: z.string().nullable().optional(),
  capacity: z.coerce.number().int().nonnegative().optional(),
});

// ---- GET /api/wards/:id ----
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = getSession(req);
  if (!session) return unauthorized();

  const { id } = await params;

  const ward = await prisma.ward.findFirst({
    where: { id, hospitalId: session.hospitalId },
    include: {
      beds: {
        orderBy: { bedNumber: "asc" },
        include: {
          admissions: {
            where: { status: "ACTIVE" },
            take: 1,
            include: {
              patient: {
                select: {
                  id: true,
                  patientCode: true,
                  firstName: true,
                  lastName: true,
                  phone: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!ward) {
    return NextResponse.json(
      { message: "Ward not found" },
      { status: 404 }
    );
  }

  // Shape the response: each bed gets an optional currentPatient
  const beds = ward.beds.map((b) => ({
    id: b.id,
    bedNumber: b.bedNumber,
    status: b.status,
    currentPatient: b.admissions[0]
      ? {
          admissionId: b.admissions[0].id,
          admissionNo: b.admissions[0].admissionNo,
          admittedAt: b.admissions[0].admittedAt,
          patient: b.admissions[0].patient,
        }
      : null,
  }));

  const stats = {
    total: beds.length,
    available: beds.filter((b) => b.status === "AVAILABLE").length,
    occupied: beds.filter((b) => b.status === "OCCUPIED").length,
    maintenance: beds.filter((b) => b.status === "MAINTENANCE").length,
  };

  return NextResponse.json({
    ward: {
      id: ward.id,
      name: ward.name,
      floor: ward.floor,
      capacity: ward.capacity,
      createdAt: ward.createdAt,
      updatedAt: ward.updatedAt,
      beds,
      stats,
    },
  });
}

// ---- PATCH /api/wards/:id ----
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = getSession(req);
  if (!session) return unauthorized();

  if (!["ADMIN", "NURSE"].includes(session.role)) {
    return NextResponse.json(
      { message: "You do not have permission to modify wards." },
      { status: 403 }
    );
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const parsed = updateWardSchema.safeParse(body);

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

    const existing = await prisma.ward.findFirst({
      where: { id, hospitalId: session.hospitalId },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json(
        { message: "Ward not found" },
        { status: 404 }
      );
    }

    const data = parsed.data;

    const updated = await prisma.ward.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name.trim() } : {}),
        ...(data.floor !== undefined
          ? { floor: data.floor?.trim() || null }
          : {}),
        ...(data.capacity !== undefined ? { capacity: data.capacity } : {}),
      },
    });

    return NextResponse.json({
      message: "Ward updated",
      ward: updated,
    });
  } catch (err) {
    console.error("[wards:update] error:", err);
    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}