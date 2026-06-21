// In-memory rate limiter — resets on Vercel cold starts (acceptable for MVP)
const rateLimitMap = new Map();
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60000;

const REGION_GUIDES = {
  "Andhra Pradesh / Telugu": "Andhra food is known for being very spicy and hot. Common dishes are pesarattu (green moong crepe), gongura pachadi (sorrel chutney), pulihora (tamarind rice), gutti vankaya (stuffed brinjal curry), and pappu (dal). Andhra cooking uses a lot of red chili, tamarind, and mustard seeds. The taste is bold, tangy, and fiery.",
  "Assam / Assamese": "Assamese food is light, simple, and mildly spiced. Common dishes are masor tenga (sour fish curry), khar (alkaline curry), aloo pitika (mashed potato with mustard oil), and panta bhat (fermented rice). Mustard oil, fermented ingredients, and light spices are key. The taste is mild, earthy, and sour.",
  "Bengal / Bengali": "Bengali food loves mustard oil, mustard paste, and fish. Common dishes are macher jhol (light fish curry), aloo posto (potato with poppy seeds), shorshe ilish (hilsa in mustard gravy), cholar dal (chana dal), and mishti doi (sweet curd). The taste is delicate, slightly sweet, and uses panch phoron (5-spice mix).",
  "Bihar / Bihari": "Bihari food is simple and wholesome. Common dishes are litti chokha (baked wheat balls with roasted brinjal mash), sattu paratha, dal puri, chana ghugni, and kadhi. Bihari cooking uses mustard oil, sattu (roasted gram flour), and simple spices. The taste is earthy and filling.",
  "Goa / Goan": "Goan food is coastal and uses coconut, tamarind, and vinegar. Common dishes are fish curry rice, prawn balchao, chicken cafreal, pork vindaloo, and xacuti. Kokum, coconut milk, and red chilies are key. The taste is tangy, coconut-rich, and mildly spicy.",
  "Gujarat / Gujarati": "Gujarati food is mostly vegetarian, mildly sweet, and balances sweet-salty-sour in every dish. Common dishes are dhokla, thepla, undhiyu, dal dhokli, and kadhi. Jaggery and lemon are added to many dishes. The taste is light, slightly sweet, and comforting.",
  "Hyderabad / Hyderabadi": "Hyderabadi food is rich, aromatic, and Mughal-influenced. Famous dishes are Hyderabadi biryani, haleem, mirchi ka salan, bagara baingan, and double ka meetha. Fried onions, whole spices, and slow dum cooking are key. The taste is rich, meaty, and deeply spiced.",
  "Karnataka / Kannadiga": "Karnataka food uses rice, ragi, and coconut heavily. Common dishes are bisi bele bath (rice-lentil-vegetable dish), jolada rotti (jowar flatbread), vangi bath, akki rotti, and saaru (rasam). The taste is mild to medium spicy with coconut and tamarind flavors.",
  "Kashmir / Kashmiri": "Kashmiri food is rich and warming, using Kashmiri red chili (gives color but not too much heat), fennel, and dry ginger. Common dishes are rogan josh, yakhni (curd-based lamb), dum aloo, methi chaman, and kahwa. No onion or garlic in many Kashmiri Pandit dishes. The taste is aromatic and warming.",
  "Kerala / Keralite": "Kerala food is coconut-heavy and uses coconut oil, coconut milk, and curry leaves. Common dishes are fish molee, appam with stew, puttu with kadala curry, avial (mixed vegetable coconut dish), and sambar. The taste is mildly spiced, coconut-forward, and fresh.",
  "Madhya Pradesh / Malwi": "MP food is rustic and wheat-based. Common dishes are dal baati churma, bhutte ki kees (spiced corn), poha, chakki ki shak, and bhopali gosht korma. Ghee is used generously. The taste is hearty, wholesome, and mildly spiced.",
  "Maharashtra / Maharashtrian": "Maharashtrian food uses peanuts, sesame, and kokum. Common dishes are varan bhaat (simple dal rice), misal pav, thalipeeth (multigrain flatbread), puran poli, and bharli vangi (stuffed brinjal). The taste ranges from mild coastal to spicy Kolhapuri.",
  "Odisha / Odia": "Odia food is simple, lightly spiced, and temple-style. Common dishes are dalma (dal with vegetables), pakhala bhata (fermented rice), santula (boiled vegetables), machha jhola (fish curry), and rasabali (sweet). Minimal oil and spices are used. The taste is clean, simple, and wholesome.",
  "Punjab / Punjabi": "Punjabi food is rich, hearty, and uses lots of ghee, butter, and cream. Famous dishes are dal makhani, butter chicken, sarson da saag with makki di roti, rajma chawal, and chole bhature. The taste is bold, rich, and deeply satisfying.",
  "Rajasthan / Rajasthani": "Rajasthani food is very spicy, dried, and long-lasting (desert cooking). Common dishes are dal baati churma, gatte ki sabzi (gram flour dumplings in curd gravy), ker sangri, laal maas (red spicy mutton), and bajre ki roti with lasun chutney. The taste is very spicy, tangy, and bold.",
  "Tamil Nadu / Tamil": "Tamil food uses rice, tamarind, and a lot of curry leaves and mustard seeds. Common dishes are sambar, rasam, curd rice, pongal (rice-lentil porridge), kootu (vegetable-lentil dish), and idli-dosa. Sesame oil and tamarind are key. The taste is tangy, mildly spicy, and aromatic.",
  "Telangana": "Telangana food is earthier than Andhra. Common dishes are sajja roti (pearl millet bread), sarva pindi (rice flour pancake), gongura chicken, pesarattu, and jonna roti. Red chili and tamarind are used heavily. The taste is bold, spicy, and rustic.",
  "Uttar Pradesh / Awadhi": "Awadhi food from UP is refined and aromatic, developed in royal kitchens. Famous dishes are biryani (dum-style), nihari, kebabs (galouti, seekh), korma, and dal tadka. Slow cooking and whole spices are key. The taste is rich, mildly spiced, and fragrant.",
  "Uttarakhand / Pahari": "Pahari food is simple and nourishing. Common dishes are aloo ke gutke (spiced potatoes), kafuli (spinach-fenugreek curry), chainsoo (black dal), bhang ki chutney, and bal mithai. Minimal oil is used. The taste is simple, earthy, and wholesome.",
  "Chinese": "Authentic Chinese home cooking uses soy sauce, sesame oil, ginger, garlic, and rice wine. Common dishes are egg fried rice, mapo tofu, kung pao chicken, stir-fried vegetables, and congee. The taste is umami-rich, savory, and balanced.",
  "French": "French home cooking uses butter, cream, and fresh herbs like thyme and bay leaf. Common dishes are ratatouille, French omelette, soupe a l oignon, quiche, and poulet roti. The taste is buttery, rich, and herb-forward.",
  "Greek": "Greek food uses olive oil, lemon, garlic, and oregano heavily. Common dishes are moussaka, spanakopita, Greek salad, fasolada (bean soup), and souvlaki. The taste is fresh, lemony, and Mediterranean.",
  "Italian": "Italian home cooking is simple and lets ingredients shine. Common dishes are pasta aglio e olio, risotto, pizza margherita, minestrone soup, and bruschetta. Good olive oil, garlic, and tomatoes are the base. The taste is fresh, clean, and comforting.",
  "Japanese": "Japanese home cooking is simple, clean, and umami-rich. Common dishes are miso soup, tamago gohan (egg rice), oyakodon (chicken-egg rice bowl), nikujaga (meat-potato stew), and yakimeshi (fried rice). Soy sauce, mirin, and dashi are key. The taste is delicate, savory, and balanced.",
  "Lebanese / Middle Eastern": "Lebanese food uses olive oil, lemon, garlic, cumin, and fresh herbs. Common dishes are hummus, tabbouleh, fattoush, lentil soup, and shawarma. The taste is fresh, tangy, and herb-forward.",
  "Mexican": "Mexican home cooking uses cumin, chili, lime, garlic, and tomatoes. Common dishes are tacos, frijoles (beans), arroz rojo (red rice), quesadillas, and guacamole. The taste is bold, smoky, and tangy.",
  "Thai": "Thai food balances sweet, sour, salty, and spicy in every dish. Common dishes are pad Thai, khao pad (fried rice), tom kha (coconut soup), som tam (green papaya salad), and green curry. Fish sauce, lime, and chili are key. The taste is vibrant and balanced.",
  "Turkish": "Turkish home cooking uses yogurt, tomatoes, eggplant, and olive oil. Common dishes are menemen (scrambled eggs with tomatoes), mercimek corbasi (lentil soup), imam bayildi (stuffed eggplant), pilaf, and kofte. The taste is savory, mild, and comforting.",
  "American": "American home cooking is hearty and comforting. Common dishes are mac and cheese, grilled cheese sandwich, chicken soup, meatloaf, mashed potatoes, and pancakes. Butter, cheese, and simple seasonings are key. The taste is rich, filling, and comforting."
};

const SYSTEM_PROMPT = `You are a home cooking expert who knows recipes from every part of the world.

STRICT RULES — follow every single one:

RULE 1 — REALISTIC DISH: Only suggest a dish that people actually cook and eat at home. The dish must be genuinely cookable with the listed ingredients plus basic pantry staples.

RULE 2 — SIMPLE COMMON INGREDIENTS ONLY: Only use ingredients found in a normal home kitchen — salt, oil, onion, garlic, ginger, tomato, green chili, red chili powder, turmeric, cumin, coriander powder, mustard seeds, curry leaves, ghee, butter, milk, rice, flour, sugar, jaggery, tamarind, lemon, yogurt, water. Do NOT add rare or hard-to-find items.

RULE 3 — SIMPLE ENGLISH ONLY: Write every step in short, easy sentences. Use the simplest words possible.
BAD: "Saute the aromatics until translucent and deglaze with stock."
GOOD: "Cook the onion in oil for 3 minutes until soft and light brown."
Anyone with basic English must be able to follow each step.

RULE 4 — SHORT STEPS: Each step = 1 to 2 sentences only. No long paragraphs.

RULE 5 — USE THE USER'S INGREDIENTS: Build the recipe around what the user already has. Only add very basic pantry items if truly needed.

RULE 6 — RESPECT DIETARY RESTRICTIONS: If dietary restrictions are given, follow them strictly. Do not include any ingredient that violates them.

Respond ONLY with a valid JSON object — no markdown, no extra text:
{
  "recipe_name": "Actual name of the dish",
  "cuisine": "Name of the cuisine / region",
  "servings": 2,
  "prep_time": "10 mins",
  "cook_time": "20 mins",
  "ingredients_used": [
    {"name": "ingredient name", "amount": "quantity with unit"}
  ],
  "steps": [
    "Step written in simple English",
    "Next step in simple English"
  ],
  "chef_tip": "One short practical tip",
  "nutrition_per_serving": {
    "calories": 350,
    "protein_g": 18,
    "carbs_g": 42,
    "fat_g": 12,
    "fiber_g": 5,
    "sodium_mg": 480
  }
}

Nutrition values must be realistic.`;

function buildUserMessage(ingredients, region, dietary) {
  const ingredientList = ingredients
    .map(i => `${i.name}${i.qty ? ` (${i.qty} ${i.unit})` : ''}`)
    .join(', ');

  let cuisineInstruction;
  if (!region || region === 'Surprise Me') {
    cuisineInstruction = 'Pick the BEST cuisine and dish that works perfectly with the user\'s ingredients. Choose any cuisine from the world — Indian, Chinese, Italian, Mexican, Thai, Middle Eastern, American, etc. Pick whatever dish would taste best and be simplest to make with these exact ingredients.';
  } else {
    const guide = REGION_GUIDES[region] || '';
    cuisineInstruction = `Make a dish from ${region} cuisine.${guide ? `\n\nABOUT THIS CUISINE:\n${guide}` : ''}`;
  }

  let dietaryText = '';
  if (dietary && dietary.length > 0) {
    dietaryText = `\nDietary restrictions: Must be ${dietary.join(', ')}.`;
  }

  return `The user has these ingredients: ${ingredientList}.\n${cuisineInstruction}${dietaryText}`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Rate limiting
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
    || req.socket?.remoteAddress
    || 'unknown';
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  if (record && now < record.resetAt) {
    if (record.count >= RATE_LIMIT) {
      return res.status(429).json({ error: 'Too many requests. Please wait a minute.' });
    }
    record.count++;
  } else {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
  }

  const { ingredients, region, dietary } = req.body;

  if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
    return res.status(400).json({ error: 'No ingredients provided' });
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
        max_tokens: 2048,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: buildUserMessage(ingredients, region, dietary) },
        ],
      }),
    });

    const raw = await response.text();
    let data;
    try { data = JSON.parse(raw); } catch (_) {
      return res.status(502).json({ error: `Krutrim returned unexpected response: ${raw.slice(0, 120)}` });
    }

    if (!response.ok) {
      return res.status(response.status).json({ error: data?.error?.message || 'Krutrim API error' });
    }

    const text = data.choices?.[0]?.message?.content || '';
    return res.status(200).json({ text });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
