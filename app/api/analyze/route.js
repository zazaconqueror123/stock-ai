export async function POST(request) {
  try {
    const { ticker } = await request.json();
    if (!ticker || ticker.length > 10) {
      return Response.json({ error: "Ticker inválido" }, { status: 400 });
    }
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return Response.json({ error: "API key no configurada" }, { status: 500 });
    }
    const prompt = `Analiza la acción ${ticker.toUpperCase()} y devuelve ÚNICAMENTE un objeto JSON válido sin backticks ni texto extra. Estructura exacta:
{"ticker":"","company":"","sector":"","price":"$XXX","change":"+X.X% hoy","marketCap":"$XB","pe":"XX.Xx","peLabel":"vs sector XX","signal":"COMPRAR|VENDER|MANTENER","confidence":"XX%","rsi":65,"rsiLabel":"Neutral|Sobrecomprado|Sobrevendido","technicals":[{"name":"Media Móvil 50d","value":"$XXX","signal":"COMPRAR|VENDER|MANTENER"},{"name":"MACD","value":"positivo","signal":"COMPRAR"},{"name":"RSI","value":"65","signal":"MANTENER"},{"name":"Bollinger Bands","value":"banda media","signal":"MANTENER"},{"name":"Volumen","value":"1.2x","signal":"COMPRAR"}],"fundamentals":[{"name":"Margen neto","value":"XX%","signal":"Positivo|Negativo|Neutro"},{"name":"Deuda/Capital","value":"XX%","signal":"Positivo"},{"name":"Crecimiento","value":"XX%","signal":"Positivo"},{"name":"ROE","value":"XX%","signal":"Positivo"},{"name":"Flujo de caja","value":"$XB","signal":"Positivo"}],"analysis":"Párrafo situación actual.\n\nPárrafo técnico.\n\nPárrafo fundamental.\n\nPárrafo riesgos y recomendación.","news":[{"title":"titular noticia","source":"Reuters","sentiment":"Positivo|Negativo|Neutro"},{"title":"segunda noticia","source":"Bloomberg","sentiment":"Neutro"},{"title":"tercera noticia","source":"CNBC","sentiment":"Positivo"}]}
Devuelve SOLO el JSON para ${ticker.toUpperCase()}, sin texto antes ni después.`;
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5",
        max_tokens: 2000,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!res.ok) {
      const errText = await res.text();
      return Response.json({ error: `API error ${res.status}: ${errText.slice(0,200)}` }, { status: 500 });
    }
    const data = await res.json();
    const raw = (data.content || []).map(b => b.text || "").join("").trim();
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return Response.json({ error: "Sin JSON en respuesta: " + raw.slice(0,200) }, { status: 500 });
    try {
      return Response.json(JSON.parse(match[0]));
    } catch(e) {
      return Response.json({ error: "JSON inválido: " + e.message }, { status: 500 });
    }
  } catch(err) {
    return Response.json({ error: "Error: " + err.message }, { status: 500 });
  }
}
