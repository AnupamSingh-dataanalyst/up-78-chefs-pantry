exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { ingredients } = JSON.parse(event.body);
  const apiKey = process.env.GEMINI_API_KEY;

  const prompt = `You are an Indian recipe assistant. Based on these ingredients: ${ingredients.join(', ')}

Suggest 4-5 Indian/Hinglish recipes. For each recipe give:
- Recipe name (Hinglish like Dal Tadka, Aloo Pyaaz Sabzi etc)
- Ingredients needed (short list, Hinglish names)

Format strictly as JSON array:
[{"name":"Dal Tadka","ingredients":"Dal, Ghee, Jeera, Lahsun, Mirch"},...]

Only JSON, no extra text.`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      }
    );

    const data = await res.json();
    if (data.error) throw new Error(data.error.message);

    let text = data.candidates[0].content.parts[0].text;
    text = text.replace(/```json|```/g, '').trim();
    const recipes = JSON.parse(text);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipes })
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message })
    };
  }
};
