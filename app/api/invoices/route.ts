import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/app/lib/prisma";
import { getSession, unauthorized } from "@/app/lib/auth";

// ---- Validation ----
const createInvoiceSchema = z.object({
  patientId: z.string().min(1, "Patient is required"),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
  items: z
    .array(
      z.object({
        description: z.string().min(1, "Item description is required"),
        category: z.string().min(1, "Item category is required"),
        quantity: z.coerce.number().int().positive().default(1),
        unitPrice: z.coerce.number().nonnegative(),
      })
    )
    .min(1, "At least one invoice item is required"),
});

function generateInvoiceNo() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "INV-";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// ---- GET /api/invoices ----
export async function GET(req: NextRequest) {
  const session = getSession(req);
  if (!session) return unauthorized();

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const patientId = searchParams.get("patientId");
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get("limit") || "50", 10))
  );

  const where: any = { hospitalId: session.hospitalId };
  if (status) where.status = status;
  if (patientId) where.patientId = patientId;

  const [invoices, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
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
        _count: { select: { items: true, payments: true } },
      },
    }),
    prisma.invoice.count({ where }),
  ]);

  // Compute paid amount per invoice (sum of payments)
  const invoiceIds = invoices.map((i) => i.id);
  const paymentSums = await prisma.payment.groupBy({
    by: ["invoiceId"],
    where: { invoiceId: { in: invoiceIds } },
    _sum: { amount: true },
  });

  const paidByInvoice = new Map(
    paymentSums.map((p) => [p.invoiceId, Number(p._sum.amount ?? 0)])
  );

  const data = invoices.map((inv) => {
    const paid = paidByInvoice.get(inv.id) ?? 0;
    const totalAmount = Number(inv.totalAmount);
    return {
      ...inv,
      totalAmount,
      paidAmount: paid,
      outstanding: Math.max(0, totalAmount - paid),
    };
  });

  return NextResponse.json({
    data,
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
  });
}

// ---- POST /api/invoices ----
export async function POST(req: NextRequest) {
  const session = getSession(req);
  if (!session) return unauthorized();

  // Only admin and receptionist can create invoices
  if (!["ADMIN", "RECEPTIONIST"].includes(session.role)) {
    return NextResponse.json(
      { message: "You do not have permission to create invoices." },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const parsed = createInvoiceSchema.safeParse(body);

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

    // Patient must belong to this hospital
    const patient = await prisma.patient.findFirst({
      where: { id: data.patientId, hospitalId: session.hospitalId },
      select: { id: true },
    });
    if (!patient) {
      return NextResponse.json(
        { message: "Patient not found in your hospital" },
        { status: 404 }
      );
    }

    // Compute amounts (quantity × unitPrice)
    const computedItems = data.items.map((item) => ({
      description: item.description.trim(),
      category: item.category.trim(),
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      amount: item.quantity * item.unitPrice,
    }));

    const totalAmount = computedItems.reduce(
      (sum, item) => sum + item.amount,
      0
    );

    // Generate unique invoice number
    let invoiceNo = generateInvoiceNo();
    let attempts = 0;
    while (attempts < 5) {
      const existing = await prisma.invoice.findUnique({
        where: { invoiceNo },
      });
      if (!existing) break;
      invoiceNo = generateInvoiceNo();
      attempts++;
    }

    // Create invoice + items in a transaction
    const invoice = await prisma.$transaction(async (tx) => {
      const inv = await tx.invoice.create({
        data: {
          invoiceNo,
          patientId: data.patientId,
          hospitalId: session.hospitalId,
          createdById: session.userId,
          status: "UNPAID",
          totalAmount,
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
          notes: data.notes?.trim() || null,
        },
      });

      await tx.invoiceItem.createMany({
        data: computedItems.map((item) => ({
          ...item,
          invoiceId: inv.id,
        })),
      });

      return tx.invoice.findUnique({
        where: { id: inv.id },
        include: {
          items: true,
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              patientCode: true,
            },
          },
        },
      });
    });

    return NextResponse.json(
      { message: "Invoice created successfully", invoice },
      { status: 201 }
    );
  } catch (err) {
    console.error("[invoices:create] error:", err);
    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}