import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/app/lib/prisma";
import { getSession, unauthorized } from "@/app/lib/auth";

const createPaymentSchema = z.object({
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  method: z.enum(["CASH", "CARD", "TRANSFER", "OTHER"]),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = getSession(req);
  if (!session) return unauthorized();

  // Only admin and receptionist can record payments
  if (!["ADMIN", "RECEPTIONIST"].includes(session.role)) {
    return NextResponse.json(
      { message: "You do not have permission to record payments." },
      { status: 403 }
    );
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const parsed = createPaymentSchema.safeParse(body);

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

    // Fetch the invoice with all its payments and remaining balance
    const invoice = await prisma.invoice.findFirst({
      where: { id, hospitalId: session.hospitalId },
      include: {
        payments: { select: { amount: true } },
      },
    });

    if (!invoice) {
      return NextResponse.json(
        { message: "Invoice not found" },
        { status: 404 }
      );
    }

    if (invoice.status === "CANCELLED") {
      return NextResponse.json(
        { message: "Cannot record a payment on a cancelled invoice." },
        { status: 400 }
      );
    }

    const totalAmount = Number(invoice.totalAmount);
    const paidSoFar = invoice.payments.reduce(
      (sum, p) => sum + Number(p.amount),
      0
    );
    const outstanding = totalAmount - paidSoFar;

    if (outstanding <= 0) {
      return NextResponse.json(
        { message: "Invoice is already fully paid." },
        { status: 400 }
      );
    }

    if (data.amount > outstanding + 0.001) {
      return NextResponse.json(
        {
          message: `Payment exceeds outstanding balance. Maximum allowed: ₦${outstanding.toFixed(
            2
          )}`,
        },
        { status: 400 }
      );
    }

    // Create payment + update invoice status in one transaction
    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          invoiceId: id,
          amount: data.amount,
          method: data.method,
          reference: data.reference?.trim() || null,
          notes: data.notes?.trim() || null,
          receivedById: session.userId,
        },
      });

      const newPaidAmount = paidSoFar + data.amount;
      const newStatus =
        newPaidAmount + 0.001 >= totalAmount ? "PAID" : "PARTIAL";

      const updatedInvoice = await tx.invoice.update({
        where: { id },
        data: { status: newStatus },
      });

      return { payment, invoice: updatedInvoice };
    });

    return NextResponse.json(
      {
        message: "Payment recorded successfully",
        payment: result.payment,
        invoice: result.invoice,
        paidAmount: paidSoFar + data.amount,
        outstanding: Math.max(0, totalAmount - (paidSoFar + data.amount)),
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[invoices:payment] error:", err);
    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}