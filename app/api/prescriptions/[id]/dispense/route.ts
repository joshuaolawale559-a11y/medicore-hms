import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/app/lib/prisma";
import { getSession, unauthorized } from "@/app/lib/auth";

const dispenseSchema = z.object({
  // Optional: dispense only specific items (partial dispensing).
  // If omitted, tries to dispense ALL pending items fully.
  itemIds: z.array(z.string()).optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = getSession(req);
  if (!session) return unauthorized();

  if (!["ADMIN", "PHARMACIST"].includes(session.role)) {
    return NextResponse.json(
      { message: "Only pharmacists and admins can dispense." },
      { status: 403 }
    );
  }

  const { id: prescriptionId } = await params;

  try {
    const body = await req.json().catch(() => ({}));
    const parsed = dispenseSchema.safeParse(body);
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

    const { itemIds } = parsed.data;

    // Load the prescription and its items
    const prescription = await prisma.prescription.findFirst({
      where: { id: prescriptionId, hospitalId: session.hospitalId },
      include: { items: true },
    });

    if (!prescription) {
      return NextResponse.json(
        { message: "Prescription not found" },
        { status: 404 }
      );
    }

    if (prescription.status === "CANCELLED") {
      return NextResponse.json(
        { message: "Cannot dispense a cancelled prescription." },
        { status: 400 }
      );
    }

    if (prescription.status === "DISPENSED") {
      return NextResponse.json(
        { message: "Prescription is already fully dispensed." },
        { status: 400 }
      );
    }

    // Which items are we dispensing?
    const itemsToDispense = itemIds
      ? prescription.items.filter((i) => itemIds.includes(i.id))
      : prescription.items;

    if (itemsToDispense.length === 0) {
      return NextResponse.json(
        { message: "No matching items found to dispense." },
        { status: 400 }
      );
    }

    // How much does each item still need?
    const needs = itemsToDispense
      .map((item) => ({
        item,
        remaining: item.quantity - item.dispensedQty,
      }))
      .filter((n) => n.remaining > 0);

    if (needs.length === 0) {
      return NextResponse.json(
        { message: "All specified items are already dispensed." },
        { status: 400 }
      );
    }

    // ---------- FEFO LOGIC ----------
    // Before writing anything, check that sufficient unexpired stock
    // exists for every item that needs dispensing. If any drug is short,
    // the entire operation is rejected — no partial commits.
    const now = new Date();

    type Plan = {
      itemId: string;
      drugId: string;
      drugName: string;
      needed: number;
      deductions: { batchId: string; take: number }[];
    };

    const plans: Plan[] = [];

    for (const need of needs) {
      const drug = await prisma.drug.findUnique({
        where: { id: need.item.drugId },
        select: { id: true, name: true, strength: true },
      });
      if (!drug) {
        return NextResponse.json(
          { message: `Drug for item not found.` },
          { status: 404 }
        );
      }

      // Fetch batches with remaining stock, unexpired, sorted by
      // expiry date ascending (First Expiry = First Out).
      const batches = await prisma.drugBatch.findMany({
        where: {
          drugId: drug.id,
          quantity: { gt: 0 },
          expiryDate: { gt: now },
        },
        orderBy: { expiryDate: "asc" },
      });

      const available = batches.reduce((s, b) => s + b.quantity, 0);

      if (available < need.remaining) {
        return NextResponse.json(
          {
            message: `Insufficient stock for ${drug.name}${
              drug.strength ? ` ${drug.strength}` : ""
            }. Need ${need.remaining}, available ${available}.`,
          },
          { status: 400 }
        );
      }

      // Plan how much comes from each batch
      let stillNeeded = need.remaining;
      const deductions: { batchId: string; take: number }[] = [];
      for (const b of batches) {
        if (stillNeeded <= 0) break;
        const take = Math.min(b.quantity, stillNeeded);
        deductions.push({ batchId: b.id, take });
        stillNeeded -= take;
      }

      plans.push({
        itemId: need.item.id,
        drugId: drug.id,
        drugName: drug.name,
        needed: need.remaining,
        deductions,
      });
    }

    // ---------- EXECUTE (in a transaction) ----------
    const result = await prisma.$transaction(async (tx) => {
      for (const plan of plans) {
        // Deduct from each batch in FEFO order
        for (const d of plan.deductions) {
          await tx.drugBatch.update({
            where: { id: d.batchId },
            data: { quantity: { decrement: d.take } },
          });
        }

        // Update the item's dispensedQty
        await tx.prescriptionItem.update({
          where: { id: plan.itemId },
          data: { dispensedQty: { increment: plan.needed } },
        });
      }

      // Determine the new prescription status
      const updatedItems = await tx.prescriptionItem.findMany({
        where: { prescriptionId },
      });
      const allFull = updatedItems.every(
        (i) => i.dispensedQty >= i.quantity
      );
      const someDispensed = updatedItems.some((i) => i.dispensedQty > 0);

      const newStatus = allFull
        ? "DISPENSED"
        : someDispensed
        ? "PARTIALLY_DISPENSED"
        : "PENDING";

      return tx.prescription.update({
        where: { id: prescriptionId },
        data: {
          status: newStatus,
          ...(allFull
            ? { dispensedAt: new Date(), dispensedById: session.userId }
            : {}),
        },
        include: {
          items: {
            include: {
              drug: {
                select: {
                  id: true,
                  name: true,
                  strength: true,
                  form: true,
                },
              },
            },
          },
        },
      });
    });

    return NextResponse.json({
      message: "Dispensed successfully",
      prescription: result,
      dispensedCount: plans.length,
    });
  } catch (err) {
    console.error("[prescriptions:dispense] error:", err);
    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}