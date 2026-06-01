export async function POST(request) {
  const { ticker } = await request.json();
  if (!ticker || ticker.length > 10) {
    return Response.json({ error: "Ticker inválido" }, { status: 400 });
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
      max_tokens: 1500,
      system: `Eres un analista financiero experto. Responde SOLO con JSON válido, sin backticks ni texto extra. Estructura exacta:
{"ticker":"","company":"","sector":"","price":"$XXX.XX","change":"+X.X% hoy","marketCap":"$XB","pe":"XX.Xx","peLabel":"vs sector XX","signal":"COMPRAR|VENDER|MANTENER","confidence":"XX%","rsi":65,"rsiLabel":"Neutral|Sobrecomprado|Sobrevendido","technicals":[{"name":"Media Móvil 50d","value":"$XXX","signal":"COMPRAR|VENDER|MANTENER"},{"name":"MACD","value":"positivo","signal":"COMPRAR"},{"name":"RSI","value":"65","signal":"MANTENER"},{"name":"Bollinger Bands","value":"banda media","signal":"MANTENER"},{"name":"Volumen relativo","value":"1.2x promedio","signal":"COMPRAR"}],"fundamentals":[{"name":"Margen neto","value":"XX%","signal":"Positivo|Negativo|Neutro"},{"name":"Deuda/Capital","value":"XX%","signal":"Positivo"},{"name":"Crecimiento ingresos","value":"XX%","signal":"Positivo"},{"name":"ROE","value":"XX%","signal":"Positivo"},{"name":"Flujo de caja libre","value":"$XB","signal":"Positivo"}],"analysis":"Párrafo situación actual.\n\nPárrafo análisis técnico.\n\nPárrafo fundamental.\n\nPárrafo riesgos y recomendación.","news":[{"title":"titular noticia","source":"Reuters","sentiment":"Positivo|Negativo|Neutro"},{"title":"segunda noticia","source":"Bloomberg","sentiment":"Neutro"},{"title":"tercera noticia","source":"CNBC","sentiment":"Positivo"}]}`,
      messages: [{ role: "user", content: `Analiza la acción ${ticker.toUpperCase()}` }],
    }),
  });
  const data = await res.json();
  const text = (data.content || []).map((b) => b.text || "").join("");
  try {
    const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
    return Response.json(parsed);
  } catch {
    return Response.json({ error: "Error al procesar la respuesta" }, { status: 500 });
  }
}
