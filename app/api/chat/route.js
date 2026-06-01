export async function POST(request) {
  const { question, context } = await request.json();
  if (!question || !context) {
    return Response.json({ error: "Datos incompletos" }, { status: 400 });
  }
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 800,
      system: `Eres un analista financiero experto. Contexto del análisis previo: ${context}. Responde en español de forma concisa. No des órdenes de inversión definitivas. Máximo 150 palabras.`,
      messages: [{ role: "user", content: question }],
    }),
  });
  const data = await res.json();
  const answer = (data.content || []).map((b) => b.text || "").join("");
  return Response.json({ answer });
}
