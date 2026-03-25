// components/NotificationHandler.tsx
"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { messaging, getToken, onMessage } from "@/lib/firebase-client";
import toast from "react-hot-toast";

export default function NotificationHandler() {
    const { data: session, status } = useSession();
    const [permissionGranted, setPermissionGranted] = useState(false);

    useEffect(() => {
        if (status !== "authenticated" || !messaging) return;

        const requestPermissionAndGetToken = async () => {
            if (!messaging) return; // 🔥 add this line

            try {
                const permission = await Notification.requestPermission();
                if (permission !== "granted") {
                    setPermissionGranted(false);
                    return;
                }

                setPermissionGranted(true);

                const token = await getToken(messaging, {
                    vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
                });

                if (token) {
                    await fetch("/api/notifications/register", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ token }),
                    });
                }
            } catch (error) {
                console.error("Error getting token:", error);
            }
        };

        requestPermissionAndGetToken();

        if (!messaging) return; // 🔥 add this also

        const unsubscribe = onMessage(messaging, (payload) => {
            toast.success(payload.notification?.body || "New notification!");
        });

        return () => unsubscribe();
    }, [status]);

    // Unregister token on logout (optional)
    useEffect(() => {
        if (status === "unauthenticated" && session === null) {
            // You might want to unregister token here, but the token will be removed on next login anyway
        }
    }, [status]);

    return null;
}