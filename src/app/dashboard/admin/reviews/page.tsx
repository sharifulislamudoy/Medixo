import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Star } from "lucide-react";

export default async function AdminReviewsPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  const reviews = await prisma.order.findMany({
    where: {
      reviewRating: { not: null },
    },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      invoiceNo: true,
      reviewRating: true,
      reviewComment: true,
      customerName: true,
      deliveryDate: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          shopName: true,
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Customer Reviews</h1>

      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Invoice
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Customer
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Shop
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Phone
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Delivery Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rating
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Comment
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {reviews.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-gray-500">
                  No reviews yet.
                </td>
              </tr>
            ) : (
              reviews.map((review) => (
                <tr key={review.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 text-sm font-medium text-[#0F9D8F]">
                    {review.invoiceNo}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-800">
                    {review.user.name} ({review.user.email})
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-800">
                    {review.user.shopName || "—"}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600">
                    {review.user.phone}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600">
                    {review.deliveryDate.toLocaleDateString("en-BD", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={16}
                          className={`${
                            review.reviewRating! >= star
                              ? "text-yellow-400 fill-yellow-400"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600 max-w-xs">
                    {review.reviewComment || "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}