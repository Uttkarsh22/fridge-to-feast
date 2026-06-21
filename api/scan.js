const rateLimitMap = new Map();
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60000;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
    || req.socket?.remoteAddress
    || 'unknown';
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  if (record && now < record.resetAt) {
    if (record.count >= RATE_LIMIT) {
      return res.status(429).json({ error: 'Too many scans. Please wait a minute.' });
    }
    record.count++;
  } else {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
  }

  const { imageBase64, mimeType } = req.body;
  if (!imageBase64) {
    return res.status(400).json({ error: 'No image provided' });
  }

  const apiKey = process.env.OLAKRUTRIM_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured on server' });
  }

  try {
    const response = await fetch('https://cloud.olakrutrim.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gemma-4-31b-it',
        max_tokens: 256,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:${mimeType || 'image/jpeg'};base64,${imageBase64}` },
            },
            {
              type: 'text',
              text: 'Look at this image carefully. List every food ingredient, vegetable, fruit, meat, dairy product, spice, or cooking ingredient you can see. Return ONLY a valid JSON array of ingredient names in English. Example: ["Tomato","Onion","Chicken","Milk"]. No markdown, no explanation — just the JSON array.',
            },
          ],
        }],
      }),
    });

    const raw = await response.text();
    let data;
    try { data = JSON.parse(raw); } catch (_) {
      return res.status(502).json({ error: `Unexpected response from vision API: ${raw.slice(0, 100)}` });
    }

    if (!response.ok) {
      return res.status(response.status).json({ error: data?.error?.message || 'Vision API error' });
    }

    const content = data.choices?.[0]?.message?.content || '';
    // Strip markdown fences if model wraps output in ```json ... ```
    const cleaned = content.replace(/```json\s*/gi, '').replace(/```/g, '').trim();

    let ingredients;
    try {
      ingredients = JSON.parse(cleaned);
      if (!Array.isArray(ingredients)) throw new Error('not an array');
      // Keep only non-empty strings, trim whitespace
      ingredients = ingredients.map(i => String(i).trim()).filter(Boolean);
    } catch (_) {
      return res.status(200).json({ ingredients: [], error: 'Could not read ingredients from photo. Try a clearer image.' });
    }

    return res.status(200).json({ ingredients });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
