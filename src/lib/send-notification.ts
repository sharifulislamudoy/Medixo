// lib/send-notification.ts
import { messaging } from './firebase-admin';
import { prisma } from './prisma';

export async function sendNotificationToAllUsers(title: string, body: string, data?: Record<string, string>) {
  // Get all users with push tokens
  const users = await prisma.user.findMany({
    where: { pushToken: { not: null } },
    select: { pushToken: true },
  });

  const tokens = users.map(user => user.pushToken!).filter(Boolean);
  if (tokens.length === 0) return;

  const message = {
    notification: { title, body },
    data: data || {},
    tokens,
  };

  try {
    const response = await messaging.sendEachForMulticast(message);
    console.log(`Sent to ${response.successCount} devices, failed: ${response.failureCount}`);
    // Optionally handle failed tokens (invalid tokens)
    if (response.failureCount > 0) {
      const failedTokens: string[] = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          failedTokens.push(tokens[idx]);
        }
      });
      // Remove failed tokens from DB (optional)
      await prisma.user.updateMany({
        where: { pushToken: { in: failedTokens } },
        data: { pushToken: null },
      });
    }
  } catch (error) {
    console.error('Failed to send notifications', error);
  }
}