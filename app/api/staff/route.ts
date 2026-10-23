import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/app/lib/prisma";
import { getSession, unauthorized } from "@/app/lib/auth";

// ---- Validation ----
const createStaffSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional(),
  role: z.enum(["ADMIN", "DOCTOR", "NURSE", "RECEPTIONIST", "PHARMACIST"]),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

// ---- GET /api/staff ----
export async function GET(req: NextRequest) {
  const session = getSession(req);
  if (!session) return unauthorized();

  const { searchParams } = new URL(req.url);
  const role = searchParams.get("role");
  const q = searchParams.get("q")?.trim() || "";

  const where: any = { hospitalId: session.hospitalId };
  if (role) where.role = role;
  if (q) {
    where.OR = [
      { fullName: { contains: q } },
      { email: { contains: q } },
      { phone: { contains: q } },
    ];
  }

  const staff = await prisma.user.findMany({
    where,
    orderBy: [{ role: "asc" }, { fullName: "asc" }],
    select: {
      id: true,
      email: true,
      fullName: true,
      phone: true,
      role: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ staff, total: staff.length });
}

// ---- POST /api/staff ----
export async function POST(req: NextRequest) {
  const session = getSession(req);
  if (!session) return unauthorized();

  // Only admins can create staff
  if (session.role !== "ADMIN") {
    return NextResponse.json(
      { message: "Only administrators can add staff members." },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const parsed = createStaffSchema.safeParse(body);

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
    const email = data.email.toLowerCase();

    // Prevent duplicate emails across the platform
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { message: "An account with this email already exists." },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        fullName: data.fullName.trim(),
        phone: data.phone?.trim() || null,
        role: data.role,
        isActive: true,
        hospitalId: session.hospitalId,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      { message: "Staff member created successfully", user },
      { status: 201 }
    );
  } catch (err) {
    console.error("[staff:create] error:", err);
    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}