import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getSession, unauthorized } from "@/app/lib/auth";

export async function GET(req: NextRequest) {
  const session = getSession(req);
  if (!session) return unauthorized();

  try {
    const { hospitalId, role, userId } = session;

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(startOfToday);
    endOfToday.setDate(endOfToday.getDate() + 1);

    function shapeAppointment(a: any) {
      return {
        id: a.id,
        patientName: `${a.patient.firstName} ${a.patient.lastName}`,
        doctorName: a.doctor.fullName,
        department: a.department,
        time: new Date(a.scheduledAt).toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        date: new Date(a.scheduledAt).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
        }),
        status: a.status,
      };
    }

    // ---------- DOCTOR ----------
    if (role === "DOCTOR") {
      const [myPatients, myAppointmentsToday, myUpcomingRaw, myRecentRaw] =
        await Promise.all([
          prisma.appointment
            .findMany({
              where: { hospitalId, doctorId: userId },
              select: { patientId: true },
              distinct: ["patientId"],
            })
            .then((rows) => rows.length),
          prisma.appointment.count({
            where: {
              hospitalId,
              doctorId: userId,
              scheduledAt: { gte: startOfToday, lt: endOfToday },
            },
          }),
          prisma.appointment.findMany({
            where: {
              hospitalId,
              doctorId: userId,
              scheduledAt: { gte: new Date() },
              status: "SCHEDULED",
            },
            orderBy: { scheduledAt: "asc" },
            take: 5,
            include: {
              patient: { select: { firstName: true, lastName: true } },
              doctor: { select: { fullName: true } },
            },
          }),
          prisma.appointment.findMany({
            where: { hospitalId, doctorId: userId },
            orderBy: { createdAt: "desc" },
            take: 5,
            include: {
              patient: { select: { firstName: true, lastName: true } },
              doctor: { select: { fullName: true } },
            },
          }),
        ]);

      return NextResponse.json({
        role: "DOCTOR",
        myPatients,
        myAppointmentsToday,
        myUpcoming: myUpcomingRaw.map(shapeAppointment),
        myRecent: myRecentRaw.map(shapeAppointment),
      });
    }

    // ---------- PHARMACIST ----------
    if (role === "PHARMACIST") {
      const [
        pendingPrescriptions,
        dispensedToday,
        allDrugs,
        recentRx,
      ] = await Promise.all([
        prisma.prescription.count({
          where: {
            hospitalId,
            status: { in: ["PENDING", "PARTIALLY_DISPENSED"] },
          },
        }),
        prisma.prescription.count({
          where: {
            hospitalId,
            status: "DISPENSED",
            dispensedAt: { gte: startOfToday, lt: endOfToday },
          },
        }),
        prisma.drug.findMany({
          where: { hospitalId, isActive: true },
          select: {
            id: true,
            name: true,
            strength: true,
            reorderLevel: true,
            batches: { select: { quantity: true } },
          },
        }),
        prisma.prescription.findMany({
          where: { hospitalId },
          orderBy: { createdAt: "desc" },
          take: 5,
          include: {
            patient: { select: { firstName: true, lastName: true } },
            doctor: { select: { fullName: true } },
            _count: { select: { items: true } },
          },
        }),
      ]);

      const drugsWithStock = allDrugs.map((d) => {
        const totalStock = d.batches.reduce((s, b) => s + b.quantity, 0);
        return {
          id: d.id,
          name: d.name,
          strength: d.strength,
          totalStock,
          reorderLevel: d.reorderLevel,
          isLowStock: totalStock <= d.reorderLevel,
        };
      });

      const lowStockItems = drugsWithStock.filter((d) => d.isLowStock).length;
      const lowStockList = drugsWithStock
        .filter((d) => d.isLowStock)
        .slice(0, 5);

      const recentPrescriptions = recentRx.map((rx) => ({
        id: rx.id,
        prescriptionNo: rx.prescriptionNo,
        patientName: `${rx.patient.firstName} ${rx.patient.lastName}`,
        doctorName: rx.doctor.fullName,
        status: rx.status,
        itemCount: rx._count.items,
        createdAt: rx.createdAt,
      }));

      return NextResponse.json({
        role: "PHARMACIST",
        pendingPrescriptions,
        dispensedToday,
        lowStockItems,
        totalDrugs: allDrugs.length,
        lowStockList,
        recentPrescriptions,
      });
    }

    // ---------- NURSE ----------
    if (role === "NURSE") {
      const [totalPatients, todayAppointments] = await Promise.all([
        prisma.patient.count({ where: { hospitalId } }),
        prisma.appointment.count({
          where: {
            hospitalId,
            scheduledAt: { gte: startOfToday, lt: endOfToday },
          },
        }),
      ]);

      return NextResponse.json({
        role: "NURSE",
        totalPatients,
        todayAppointments,
        wardOccupancy: 0,
      });
    }

    // ---------- RECEPTIONIST ----------
    if (role === "RECEPTIONIST") {
      const [totalPatients, todayAppointments, upcomingAppointments] =
        await Promise.all([
          prisma.patient.count({ where: { hospitalId } }),
          prisma.appointment.count({
            where: {
              hospitalId,
              scheduledAt: { gte: startOfToday, lt: endOfToday },
            },
          }),
          prisma.appointment.count({
            where: {
              hospitalId,
              scheduledAt: { gte: new Date() },
              status: "SCHEDULED",
            },
          }),
        ]);

      return NextResponse.json({
        role: "RECEPTIONIST",
        totalPatients,
        todayAppointments,
        upcomingAppointments,
      });
    }

    // ---------- ADMIN ----------
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const [
      totalPatients,
      totalDoctors,
      activeStaff,
      totalUsers,
      todayAppointments,
      recentAppointmentsRaw,
      revenueAgg,
      revenueByDayRaw,
      revenueTodayAgg,
      patientsThisWeek,
      patientsLastWeek,
      pendingInvoices,
    ] = await Promise.all([
      prisma.patient.count({ where: { hospitalId } }),
      prisma.user.count({
        where: { hospitalId, role: "DOCTOR", isActive: true },
      }),
      prisma.user.count({ where: { hospitalId, isActive: true } }),
      prisma.user.count({ where: { hospitalId } }),
      prisma.appointment.count({
        where: {
          hospitalId,
          scheduledAt: { gte: startOfToday, lt: endOfToday },
        },
      }),
      prisma.appointment.findMany({
        where: { hospitalId },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          patient: { select: { firstName: true, lastName: true } },
          doctor: { select: { fullName: true } },
        },
      }),
      prisma.payment.aggregate({
        where: { invoice: { hospitalId } },
        _sum: { amount: true },
      }),
      prisma.payment.findMany({
        where: {
          invoice: { hospitalId },
          paidAt: {
            gte: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
          },
        },
        select: { paidAt: true, amount: true },
      }),
      prisma.payment.aggregate({
        where: {
          invoice: { hospitalId },
          paidAt: { gte: startOfToday, lt: endOfToday },
        },
        _sum: { amount: true },
      }),
      prisma.patient.count({
        where: {
          hospitalId,
          createdAt: { gte: sevenDaysAgo },
        },
      }),
      prisma.patient.count({
        where: {
          hospitalId,
          createdAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo },
        },
      }),
      prisma.invoice.count({
        where: {
          hospitalId,
          status: { in: ["UNPAID", "PARTIAL"] },
        },
      }),
    ]);

    const totalRevenue = Number(revenueAgg._sum.amount ?? 0);
    const revenueToday = Number(revenueTodayAgg._sum.amount ?? 0);

    const days: { label: string; value: number; key: string }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      days.push({
        key,
        label: d.toLocaleDateString("en-GB", { weekday: "short" }),
        value: 0,
      });
    }
    const dayIndex = new Map(days.map((d, i) => [d.key, i]));

    for (const p of revenueByDayRaw) {
      const k = new Date(p.paidAt).toISOString().slice(0, 10);
      const idx = dayIndex.get(k);
      if (idx !== undefined) {
        days[idx].value += Number(p.amount);
      }
    }

    const dailyRevenue = days.map((d) => ({
      label: d.label,
      value: d.value,
    }));

    const patientDelta = patientsThisWeek - patientsLastWeek;

    return NextResponse.json({
      role: "ADMIN",
      totalPatients,
      totalDoctors,
      activeStaff,
      totalUsers,
      todayAppointments,
      totalRevenue,
      revenueToday,
      patientsThisWeek,
      patientDelta,
      pendingInvoices,
      recentAppointments: recentAppointmentsRaw.map(shapeAppointment),
      dailyRevenue,
    });
  } catch (err) {
    console.error("[dashboard:summary] error:", err);
    return NextResponse.json(
      { message: "Failed to load dashboard summary" },
      { status: 500 }
    );
  }
}