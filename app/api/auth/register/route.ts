import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/app/lib/prisma";

// ---- Validation schema (matches the register wizard fields) ----
const registerSchema = z.object({
  // Hospital info (step 1)
  hospitalName: z.string().min(2, "Hospital name is required"),
  hospitalType: z.string().min(2, "Hospital type is required"),
  yearEstablished: z.string().optional(),
  licenseNumber: z.string().optional(),
  beds: z.string().optional(),
  departments: z.string().optional(),

  // Contact info (step 2)
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().optional(),
  country: z.string().min(1, "Country is required"),
  hospitalPhone: z.string().min(5, "Hospital phone is required"),
  hospitalEmail: z.string().email("Hospital email must be valid"),
  website: z.string().optional(),

  // Admin account (step 3)
  adminName: z.string().min(2, "Admin name is required"),
  adminRole: z.string().optional(),
  adminEmail: z.string().email("Admin email must be valid"),
  adminPhone: z.string().optional(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(req: NextRequest) {
  try {
    // 1. Parse incoming JSON
    const body = await req.json();

    // 2. Validate with Zod
    const parsed = registerSchema.safeParse(body);
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

    // 3. Check that the admin email isn't already in use
    const existingUser = await prisma.user.findUnique({
      where: { email: data.adminEmail.toLowerCase() },
    });
    if (existingUser) {
      return NextResponse.json(
        { message: "An account with this email already exists." },
        { status: 409 }
      );
    }

    // 4. Hash the password
    const passwordHash = await bcrypt.hash(data.password, 12);

    // 5. Create Hospital + Admin User in a single transaction
    //    If any part fails, both are rolled back — no half-created hospitals.
    const result = await prisma.$transaction(async (tx) => {
      const hospital = await tx.hospital.create({
        data: {
          name: data.hospitalName,
          type: data.hospitalType,
          yearEstablished: data.yearEstablished
            ? parseInt(data.yearEstablished, 10)
            : null,
          licenseNumber: data.licenseNumber || null,
          beds: data.beds ? parseInt(data.beds, 10) : null,
          departments: data.departments
            ? parseInt(data.departments, 10)
            : null,

          address: data.address,
          city: data.city,
          state: data.state || null,
          country: data.country,
          phone: data.hospitalPhone,
          email: data.hospitalEmail.toLowerCase(),
          website: data.website || null,
        },
      });

      const admin = await tx.user.create({
        data: {
          email: data.adminEmail.toLowerCase(),
          passwordHash,
          fullName: data.adminName,
          phone: data.adminPhone || null,
          role: "ADMIN",
          hospitalId: hospital.id,
        },
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          hospitalId: true,
          createdAt: true,
        },
      });

      return { hospital, admin };
    });

    // 6. Return success
    return NextResponse.json(
      {
        message: "Hospital registered successfully",
        hospital: {
          id: result.hospital.id,
          name: result.hospital.name,
        },
        admin: result.admin,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[register] error:", err);
    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}