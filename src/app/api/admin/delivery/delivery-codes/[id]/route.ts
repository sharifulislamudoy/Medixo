import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

type Params = Promise<{ id: string }>;

export async function PUT(req: Request, context: { params: Params }) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const { areaIds } = await req.json();

    if (!areaIds || !Array.isArray(areaIds)) {
        return NextResponse.json(
            { error: "areaIds array is required" },
            { status: 400 }
        );
    }

    try {
        // Check if the delivery code exists
        const existing = await prisma.deliveryCode.findUnique({
            where: { id },
            include: { areas: true },
        });
        if (!existing) {
            return NextResponse.json(
                { error: "Delivery code not found" },
                { status: 404 }
            );
        }

        // Find areas that are already assigned to other delivery codes (excluding current)
        const conflictingAreas = await prisma.area.findMany({
            where: {
                id: { in: areaIds },
                AND: [
                    { deliveryCodeId: { not: null } },
                    { deliveryCodeId: { not: id } }
                ]
            },
            include: { deliveryCode: true },
        });

        if (conflictingAreas.length > 0) {
            const conflicting = conflictingAreas
                .map((a) => `${a.name} (already in ${a.deliveryCode?.code})`)
                .join(", ");
            return NextResponse.json(
                { error: `Some areas are already assigned: ${conflicting}` },
                { status: 400 }
            );
        }

        // Update: disconnect all, then connect selected
        const updated = await prisma.deliveryCode.update({
            where: { id },
            data: {
                areas: {
                    set: areaIds.map((id) => ({ id })),
                },
            },
            include: { areas: true },
        });

        return NextResponse.json(updated);
    } catch (error) {
        return NextResponse.json(
            { error: "Failed to update delivery code" },
            { status: 500 }
        );
    }
}

export async function DELETE(req: Request, context: { params: Params }) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    try {
        // First disconnect all areas (optional, but safer)
        await prisma.deliveryCode.update({
            where: { id },
            data: { areas: { set: [] } },
        });

        // Then delete the delivery code
        await prisma.deliveryCode.delete({ where: { id } });

        return NextResponse.json({ message: "Deleted" });
    } catch (error) {
        return NextResponse.json(
            { error: "Failed to delete delivery code" },
            { status: 500 }
        );
    }
}