import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: load procurement with items, product details, and existing assignments
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const procurement = await prisma.procurement.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              include: {
                brand: true,
                stock: true,
              },
            },
            assignments: {
              include: {
                supplier: {
                  select: { id: true, name: true, shopName: true },
                },
              },
            },
          },
        },
      },
    });

    if (!procurement) {
      return NextResponse.json({ error: 'Procurement not found' }, { status: 404 });
    }

    // Flatten for easier frontend consumption
    const items = procurement.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      productName: item.product.name,
      productImage: item.product.image,
      sku: item.product.sku,
      brandName: item.product.brand?.name || null,
      mrp: item.mrp ?? item.product.mrp,
      costPrice: item.costPrice ?? item.product.costPrice,
      sellPrice: item.sellPrice ?? item.product.sellPrice,
      orderQuantity: item.orderQuantity,
      currentStock: item.product.stock?.quantity ?? 0,
      requiredQuantity: item.requiredQuantity,
      bidding: item.bidding,
      assignments: item.assignments.map((a) => ({
        supplierId: a.supplierId,
        supplierName: a.supplier.name,
        supplierShop: a.supplier.shopName,
        quantity: a.quantity,
        costPrice: a.costPrice,
      })),
    }));

    return NextResponse.json({ procurement: { ...procurement, items } });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch procurement' }, { status: 500 });
  }
}

// PUT: replace all assignments for the procurement items
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { assignments } = body; // expected shape: { procurementItemId, supplierId, quantity, costPrice }[]

    // Use a transaction to delete existing assignments and create new ones
    await prisma.$transaction(async (tx) => {
      // Get all procurement item IDs belonging to this procurement
      const items = await tx.procurementItem.findMany({
        where: { procurementId: id },
        select: { id: true },
      });
      const itemIds = items.map((i) => i.id);

      // Delete all existing assignments for these items
      await tx.procurementAssignment.deleteMany({
        where: { procurementItemId: { in: itemIds } },
      });

      // Create new assignments
      if (assignments && assignments.length > 0) {
        await tx.procurementAssignment.createMany({
          data: assignments.map((a: any) => ({
            procurementItemId: a.procurementItemId,
            supplierId: a.supplierId,
            quantity: a.quantity,
            costPrice: a.costPrice,
          })),
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to save assignments' }, { status: 500 });
  }
}