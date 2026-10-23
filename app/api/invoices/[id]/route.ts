import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/app/lib/prisma";
import { getSession, unauthorized } from "@/app/lib/auth";

const updateInvoiceSchema = z.object({
  dueDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  // Only allow cancelling via PATCH — status changes for PAID/PARTIAL
  // happen automatically when payments are recorded.
  cancel: z.boolean().optional(),
});

// ---- GET /api/invoices/:id ----
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = getSession(req);
  if (!session) return unauthorized();

  const { id } = await params;

  const invoice = await prisma.invoice.findFirst({
    where: { id, hospitalId: session.hospitalId },
    include: {
      patient: {
        select: {
          id: true,
          patientCode: true,
          firstName: true,
          lastName: true,
          phone: true,
          email: true,
        },
      },
      items: { orderBy: { createdAt: "asc" } },
      payments: {
        orderBy: { paidAt: "desc" },
        include: {
          receivedBy: {
            select: { id: true, fullName: true },
          },
        },
      },
      createdBy: {
        select: { id: true, fullName: true },
      },
    },
  });

  if (!invoice) {
    return NextResponse.json(
      { message: "Invoice not found" },
      { status: 404 }
    );
  }

  const totalAmount = Number(invoice.totalAmount);
  const paidAmount = invoice.payments.reduce(
    (sum, p) => sum + Number(p.amount),
    0
  );
  const outstanding = Math.max(0, totalAmount - paidAmount);

  return NextResponse.json({
    invoice: {
      ...invoice,
      totalAmount,
      paidAmount,
      outstanding,
    },
  });
}

// ---- PATCH /api/invoices/:id ----
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = getSession(req);
  if (!session) return unauthorized();

  // Only admin and receptionist can modify invoices
  if (!["ADMIN", "RECEPTIONIST"].includes(session.role)) {
    return NextResponse.json(
      { message: "You do not have permission to modify invoices." },
      { status: 403 }
    );
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const parsed = updateInvoiceSchema.safeParse(body);

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

    const existing = await prisma.invoice.findFirst({
      where: { id, hospitalId: session.hospitalId },
      include: {
        payments: { select: { amount: true } },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { message: "Invoice not found" },
        { status: 404 }
      );
    }

    const data = parsed.data;

    // If cancelling: block if any payments have been received
    if (data.cancel === true) {
      const paidAmount = existing.payments.reduce(
        (sum, p) => sum + Number(p.amount),
        0
      );
      if (paidAmount > 0) {
        return NextResponse.json(
          {
            message:
              "Cannot cancel an invoice that has payments recorded against it.",
          },
          { status: 400 }
        );
      }
      if (existing.status === "CANCELLED") {
        return NextResponse.json(
          { message: "Invoice is already cancelled." },
          { status: 400 }
        );
      }

      const updated = await prisma.invoice.update({
        where: { id },
        data: { status: "CANCELLED" },
      });

      return NextResponse.json({
        message: "Invoice cancelled",
        invoice: updated,
      });
    }

    // Otherwise: update notes / dueDate only
    const updated = await prisma.invoice.update({
      where: { id },
      data: {
        ...(data.notes !== undefined ? { notes: data.notes || null } : {}),
        ...(data.dueDate !== undefined
          ? { dueDate: data.dueDate ? new Date(data.dueDate) : null }
          : {}),
      },
    });

    return NextResponse.json({
      message: "Invoice updated",
      invoice: updated,
    });
  } catch (err) {
    console.error("[invoices:update] error:", err);
    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}