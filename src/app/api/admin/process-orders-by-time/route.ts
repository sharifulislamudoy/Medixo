import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// Define return type for the transaction
interface ProcessResult {
  updatedCount: number;
  mergedCount: number;
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { cutoff } = await req.json();
    if (!cutoff) {
      return NextResponse.json({ error: 'Cutoff time required' }, { status: 400 });
    }

    const cutoffDate = new Date(cutoff);

    // Increase transaction timeout to 30 seconds
    const result = await prisma.$transaction<ProcessResult>(
      async (tx) => {
        // 1. Find all PENDING orders placed before cutoff
        const pendingOrders = await tx.order.findMany({
          where: {
            status: 'PENDING',
            orderDate: { lte: cutoffDate },
          },
          select: { id: true },
        });

        const pendingIds = pendingOrders.map((o) => o.id);

        // 2. Update them to PROCESSING
        if (pendingIds.length > 0) {
          await tx.order.updateMany({
            where: { id: { in: pendingIds } },
            data: { status: 'PROCESSING' },
          });
        }

        // 3. Fetch all PROCESSING orders (including those just updated)
        const processingOrders = await tx.order.findMany({
          where: { status: 'PROCESSING' },
          include: {
            items: {
              include: {
                product: {
                  select: { id: true, name: true },
                },
              },
            },
          },
        });

        // 4. Merge orders per customer (by phone) and collect updated target order IDs
        const { mergedCount, updatedTargetIds } = await mergeProcessingOrders(tx, processingOrders);

        // 5. Apply cancellation (≤500) and discount (>4000) to all orders that are now in PROCESSING
        //    and were affected by this run (i.e., their IDs are in updatedTargetIds or were originally pending)
        const affectedOrderIds = [...new Set([...updatedTargetIds, ...pendingIds])];
        const ordersToProcess = await tx.order.findMany({
          where: {
            id: { in: affectedOrderIds },
            status: 'PROCESSING', // only those still PROCESSING (some may have been cancelled inside merge)
          },
          include: { items: true },
        });

        for (const order of ordersToProcess) {
          // Calculate total from items (should match order.totalAmount, but recalc to be safe)
          const itemsTotal = order.items.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0
          );

          // Only apply rules if discount hasn't been applied yet (discountAmount === 0)
          // This prevents re‑applying on subsequent runs
          if (order.discountAmount === 0) {
            if (itemsTotal <= 500) {
              // Cancel order
              await tx.order.update({
                where: { id: order.id },
                data: {
                  status: 'CANCELLED',
                  originalTotal: itemsTotal,
                  discountAmount: 0,
                },
              });
            } else if (itemsTotal > 4000) {
              // Apply 1% discount
              const discount = itemsTotal * 0.01;
              const finalTotal = itemsTotal - discount;
              await tx.order.update({
                where: { id: order.id },
                data: {
                  originalTotal: itemsTotal,
                  discountAmount: discount,
                  totalAmount: finalTotal,
                },
              });
            } else {
              // No discount, just store original total
              await tx.order.update({
                where: { id: order.id },
                data: {
                  originalTotal: itemsTotal,
                },
              });
            }
          }
        }

        return {
          updatedCount: pendingIds.length,
          mergedCount,
        };
      },
      { timeout: 30000 } // 30 seconds
    );

    return NextResponse.json({
      message: 'Orders processed, merged, and rules applied',
      count: result.updatedCount,
      merged: result.mergedCount,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

/**
 * Optimised merge: uses a Map for fast item lookups, batches total amount updates,
 * and deletes source orders in bulk. Returns the IDs of target orders that were updated.
 */
async function mergeProcessingOrders(
  tx: Prisma.TransactionClient,
  orders: any[]
): Promise<{ mergedCount: number; updatedTargetIds: string[] }> {
  // Group by customerPhone
  const groups = new Map<string, any[]>();
  for (const order of orders) {
    const key = order.customerPhone;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(order);
  }

  let mergedCount = 0;
  const updatedTargetIds: string[] = [];

  for (const [phone, group] of groups.entries()) {
    if (group.length <= 1) continue;

    // Skip if any order in the group has paymentStatus = 'PAID'
    if (group.some((o) => o.paymentStatus === 'PAID')) {
      console.log(`Skipping merge for phone ${phone} because at least one order is PAID`);
      continue;
    }

    // Choose target order: highest totalAmount (tie → earliest createdAt)
    const target = group.reduce((best, current) => {
      if (current.totalAmount > best.totalAmount) return current;
      if (current.totalAmount === best.totalAmount && current.createdAt < best.createdAt)
        return current;
      return best;
    });

    const sources = group.filter((o) => o.id !== target.id);
    const sourceIdsToDelete: string[] = [];

    // Build a quick‑lookup map for target items: key = `${productId}:${price}`
    const targetItemMap = new Map<string, any>();
    for (const item of target.items) {
      const key = `${item.productId}:${item.price}`;
      targetItemMap.set(key, item);
    }

    for (const source of sources) {
      let totalAmountToAdd = 0;

      for (const sourceItem of source.items) {
        const key = `${sourceItem.productId}:${sourceItem.price}`;
        const existingItem = targetItemMap.get(key);

        if (existingItem) {
          // Update existing item
          const newQuantity = existingItem.quantity + sourceItem.quantity;
          await tx.orderItem.update({
            where: { id: existingItem.id },
            data: { quantity: newQuantity },
          });
          // Update the map and in‑memory item for subsequent sources
          existingItem.quantity = newQuantity;
        } else {
          // Create new item in target order
          const newItem = await tx.orderItem.create({
            data: {
              orderId: target.id,
              productId: sourceItem.productId,
              quantity: sourceItem.quantity,
              price: sourceItem.price,
            },
          });
          // Add to map and to target.items array
          target.items.push({
            id: newItem.id,
            productId: sourceItem.productId,
            price: sourceItem.price,
            quantity: sourceItem.quantity,
          });
          targetItemMap.set(key, {
            id: newItem.id,
            productId: sourceItem.productId,
            price: sourceItem.price,
            quantity: sourceItem.quantity,
          });
        }

        totalAmountToAdd += sourceItem.price * sourceItem.quantity;
      }

      // Update target order total amount once per source order
      if (totalAmountToAdd > 0) {
        await tx.order.update({
          where: { id: target.id },
          data: { totalAmount: { increment: totalAmountToAdd } },
        });
      }

      // Mark source for deletion
      sourceIdsToDelete.push(source.id);
    }

    // Delete all source orders in one query
    if (sourceIdsToDelete.length > 0) {
      await tx.order.deleteMany({
        where: { id: { in: sourceIdsToDelete } },
      });
      mergedCount += sourceIdsToDelete.length;
      updatedTargetIds.push(target.id); // target was updated
    }
  }

  return { mergedCount, updatedTargetIds };
}