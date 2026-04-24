// lib/groq.ts

const GROQ_API_KEY = process.env.GROQ_API_KEY!;
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

interface ProductInfo {
  id: string;
  name: string;
}

export async function shuffleProductsWithGroq(
  products: ProductInfo[]
): Promise<string[]> {
  if (!GROQ_API_KEY) {
    console.warn("GROQ_API_KEY not set – using random shuffle");
    return products.map(p => p.id).sort(() => Math.random() - 0.5);
  }

  const productList = products
    .map((p, i) => `${i + 1}. ${p.name} (ID: ${p.id})`)
    .join("\n");

  const prompt = `You are a product sorting assistant for a Bangladeshi pharmacy. Given the following list of products, decide the order in which they should appear on the homepage to maximise customer interest and sales. Consider current health trends, common ailments in Bangladesh, and seasonal factors. Return ONLY a JSON array of the product IDs in the exact desired order, like this:
["id1", "id2", "id3"]

Products:
${productList}`;

  try {
    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",   // ✅ Updated to a working model
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    const data = await response.json();
    console.log("Groq response:", JSON.stringify(data, null, 2));

    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      console.error("Groq returned no content – full response:", data);
      throw new Error("No content from Groq");
    }

    // Extract JSON array from the response – works across all ES targets
    const match = content.match(/\[[\s\S]*\]/);
    if (!match) throw new Error("Could not parse JSON array from Groq response");

    const orderedIds: string[] = JSON.parse(match[0]);

    // Validate that all IDs are present (Groq might skip some, so fallback to original order)
    const existingIds = products.map(p => p.id);
    const validOrder = orderedIds.filter(id => existingIds.includes(id));
    const missing = existingIds.filter(id => !validOrder.includes(id));
    return [...validOrder, ...missing];
  } catch (error) {
    console.error("Groq shuffle failed, using default order", error);
    // Fallback: random shuffle
    return products.map(p => p.id).sort(() => Math.random() - 0.5);
  }
}