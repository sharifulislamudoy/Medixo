import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

interface UserStats {
  totalOrders: number;
  totalPageViews: number;
  topPages: string[];
}

// ⚡ Simple in-memory cache (server-side, resets on restart)
const suspicionCache = new Map<string, boolean>();

function getCacheKey(stats: UserStats): string {
  return `${stats.totalOrders}-${stats.totalPageViews}-${stats.topPages.slice(0, 3).join(",")}`;
}

export async function isRateChecker(stats: UserStats): Promise<boolean> {
  // Return cached result if available
  const cacheKey = getCacheKey(stats);
  if (suspicionCache.has(cacheKey)) {
    return suspicionCache.get(cacheKey)!;
  }

  const prompt = `You are a business analyst for a wholesale medicine e‑commerce platform. 
A "rate checker" is a user who repeatedly visits product pages but never (or very rarely) places an order. 
Their goal is to steal pricing information, not to buy.

Here is a user's activity summary:
- Total orders: ${stats.totalOrders}
- Total page views: ${stats.totalPageViews}
- Most visited pages (top 5): ${stats.topPages.join(", ")}

Is this user likely a rate checker? Answer ONLY with "true" or "false".`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

    const chatCompletion = await groq.chat.completions.create(
      {
        messages: [{ role: "user", content: prompt }],
        model: "llama-3.3-70b-versatile",   // ✅ বর্তমান সাপোর্টেড মডেল
        temperature: 0,
        max_tokens: 5,
      },
      { signal: controller.signal }
    );

    clearTimeout(timeoutId);

    const answer = chatCompletion.choices[0]?.message?.content?.trim().toLowerCase();
    const result = answer === "true";
    suspicionCache.set(cacheKey, result);
    return result;
  } catch (error) {
    console.error("Groq AI analysis failed:", error);
    // Fallback: heuristic-based detection (no orders + high page views = suspicious)
    const heuristicResult = stats.totalOrders === 0 && stats.totalPageViews > 20;
    suspicionCache.set(cacheKey, heuristicResult);
    return heuristicResult;
  }
}