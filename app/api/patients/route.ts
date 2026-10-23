import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/app/lib/prisma";
import { getSession, unauthorized } from "@/app/lib/auth";

// ---- Validation ----
const createPatientSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  gender: z.enum(["Male", "Female", "Other"]),
  phone: z.string().min(5, "Phone is required"),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional(),
  bloodGroup: z.string().optional(),
genotype: z.string().optional(),
  allergies: z.string().optional(),
  notes: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
});

function generatePatientCode() {
  // PT-XXXXXX, where X is a random alphanumeric char
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "PT-";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// ---- GET /api/patients — list patients for this hospital ----
export async function GET(req: NextRequest) {
  const session = getSession(req);
  if (!session) return unauthorized();

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() || "";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get("limit") || "20", 10))
  );

  const where = {
    hospitalId: session.hospitalId,
    ...(q
      ? {
          OR: [
            { firstName: { contains: q } },
            { lastName: { contains: q } },
            { patientCode: { contains: q } },
            { phone: { contains: q } },
          ],
        }
      : {}),
  };

  const [patients, total] = await Promise.all([
    prisma.patient.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.patient.count({ where }),
  ]);

  return NextResponse.json({
    data: patients,
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
  });
}

// ---- POST /api/patients — create a new patient ----
export async function POST(req: NextRequest) {
  const session = getSession(req);
  if (!session) return unauthorized();

  try {
    const body = await req.json();
    const parsed = createPatientSchema.safeParse(body);

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

    // Generate a unique patient code, retrying on the rare collision
    let patientCode = generatePatientCode();
    let attempts = 0;
    while (attempts < 5) {
      const existing = await prisma.patient.findUnique({
        where: { patientCode },
      });
      if (!existing) break;
      patientCode = generatePatientCode();
      attempts++;
    }

    const patient = await prisma.patient.create({
      data: {
        patientCode,
        firstName: data.firstName,
        lastName: data.lastName,
        dateOfBirth: new Date(data.dateOfBirth),
        gender: data.gender,
        phone: data.phone,
        email: data.email || null,
        address: data.address || null,
        bloodGroup: data.bloodGroup || null,
        allergies: data.allergies || null,
        notes: data.notes || null,
        emergencyContactName: data.emergencyContactName || null,
        emergencyContactPhone: data.emergencyContactPhone || null,
        hospitalId: session.hospitalId,
        createdById: session.userId,
      },
    });

    return NextResponse.json(
      { message: "Patient registered successfully", patient },
      { status: 201 }
    );
  } catch (err) {
    console.error("[patients:create] error:", err);
    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}