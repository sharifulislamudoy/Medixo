import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import DeliveryShipmentClient from "@/components/admin/DeliveryShipmentClient";


export default async function DeliveryShipmentPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  return <DeliveryShipmentClient />;
}