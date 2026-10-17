import {
  categoryMaster,
  priorityMaster,
} from "../features/requests/request-master";

type Classification = {
  category: (typeof categoryMaster)[number];
  priority: (typeof priorityMaster)[number];
};

export async function classifyRequest(
  title: string,
  description: string,
): Promise<Classification> {
  const fallback: Classification = { category: "General", priority: "MEDIUM" };
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return fallback;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{
              text: `Classify maintenance issues only using these masters. Return JSON only: {"category":"...","priority":"..."}. Categories: ${categoryMaster.join(", ")}. Priorities: ${priorityMaster.join(", ")}.`,
            }],
          },
          contents: [{
            role: "user",
            parts: [{ text: `Title: ${title}\nDescription: ${description}` }],
          }],
          generationConfig: { responseMimeType: "application/json" },
        }),
      },
    );
    if (!response.ok) return fallback;
    const data = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text;
    const parsed = raw ? JSON.parse(raw) as Partial<Classification> : {};
    const category = categoryMaster.includes(parsed.category as never)
      ? parsed.category as Classification["category"]
      : fallback.category;
    const priority = priorityMaster.includes(parsed.priority as never)
      ? parsed.priority as Classification["priority"]
      : fallback.priority;
    return { category, priority };
  } catch {
    return fallback;
  }
}
