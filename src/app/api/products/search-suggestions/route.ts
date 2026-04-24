import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import Fuse from "fuse.js";
import { prisma } from "@/lib/prisma";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

export async function POST(req: Request) {
  try {
    const { query } = await req.json();
    if (!query || query.trim().length < 2) {
      return NextResponse.json({ products: [] });
    }

    const trimmedQuery = query.trim();

    // ---------- Try AI query expansion first ----------
    let suggestions: string[] = [];
    try {
      const prompt = `You are a product search assistant. The user is searching for a product by name or SKU. The input may contain spelling mistakes. Based on the input, generate up to 5 possible correct spellings, phonetic alternatives, or similar product names. Return a JSON array of strings.
Example: user input "paracitamol" -> ["paracetamol", "paracetomol", "paracet"]
User input: "${trimmedQuery}"
Return only the JSON array, nothing else.`;

      const completion = await groq.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "llama-3.1-8b-instant",
        temperature: 0.2,
        max_tokens: 200,
      });

      const content = completion.choices[0]?.message?.content;
      if (content) {
        const match = content.match(/\[[\s\S]*?\]/);
        if (match) {
          suggestions = JSON.parse(match[0]);
        }
      }
    } catch (err) {
      console.error("Groq query expansion failed:", err);
    }

    // Always include original query, plus AI suggestions if any
    const searchTerms = [trimmedQuery, ...suggestions].filter(Boolean);

    // ---------- First attempt: exact/contains search with expanded terms ----------
    const nameConditions = searchTerms.map((term) => ({
      name: { contains: term, mode: "insensitive" as const },
    }));
    const skuConditions = searchTerms.map((term) => ({
      sku: { contains: term, mode: "insensitive" as const },
    }));

    let products = await prisma.product.findMany({
      where: {
        status: true,
        OR: [...nameConditions, ...skuConditions],
      },
      select: {
        id: true,
        name: true,
        sku: true,
        mrp: true,
        costPrice: true,
        profitMargin: true,
        sellPrice: true,
        stock: { select: { quantity: true } },
        nextPurchasePrice: true,
        image: true,
      },
      take: 20,
    });

    // ---------- Fallback: fuzzy search with fuse.js if no results ----------
    if (products.length === 0) {
      // Fetch all active product names (only needed data for fuse)
      const allProducts = await prisma.product.findMany({
        where: { status: true },
        select: {
          id: true,
          name: true,
        },
      });

      const fuse = new Fuse(allProducts, {
        keys: ["name"],
        threshold: 0.4,        // 0 = strict, 1 = loose
        includeScore: true,
      });

      const fuseResults = fuse.search(trimmedQuery).slice(0, 5);
      const matchedIds = fuseResults.map(r => r.item.id);

      if (matchedIds.length > 0) {
        // Fetch full product details for the fuzzy matches
        products = await prisma.product.findMany({
          where: {
            id: { in: matchedIds },
            status: true,
          },
          select: {
            id: true,
            name: true,
            sku: true,
            mrp: true,
            costPrice: true,
            profitMargin: true,
            sellPrice: true,
            stock: { select: { quantity: true } },
            nextPurchasePrice: true,
            image: true,
          },
          take: 20,
        });
        // Sort them back to fuse order
        const idToProduct = Object.fromEntries(products.map(p => [p.id, p]));
        products = matchedIds.map(id => idToProduct[id]).filter(Boolean);
      }
    }

    const mapped = products.map((p) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      mrp: p.mrp,
      costPrice: p.costPrice,
      profitMargin: p.profitMargin,
      sellPrice: p.sellPrice,
      stock: p.stock?.quantity ?? 0,
      nextPurchasePrice: p.nextPurchasePrice,
      image: p.image,
    }));

    return NextResponse.json({ products: mapped });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}