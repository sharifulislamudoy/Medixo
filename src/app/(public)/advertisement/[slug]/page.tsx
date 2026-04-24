import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Image from "next/image";

export default async function AnnouncementDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params; // 👈 await is critical

  const ad = await prisma.advertisement.findUnique({
    where: { slug, isVisible: true },
  });

  if (!ad || ad.category !== "ANNOUNCEMENT") {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">{ad.title}</h1>
      {ad.detailImage && (
        <div className="relative w-full h-64 md:h-96 rounded-xl overflow-hidden mb-6">
          <Image
            src={ad.detailImage}
            alt={ad.title}
            fill
            className="object-cover"
          />
        </div>
      )}
      {ad.description && (
        <div className="prose max-w-none text-gray-700 leading-relaxed">
          {ad.description.split("\n").map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>
      )}
    </div>
  );
}