const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// AI Plant Recommendations
router.post('/recommendations', async (req, res) => {
  const { lightLevel, difficulty, space, petFriendly } = req.body;

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ message: 'Gemini API key is missing' });
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `You are a plant expert assistant. Based on the user's preferences below, recommend 4-6 suitable plants.

User Preferences:
- Light Level: ${lightLevel}
- Care Difficulty: ${difficulty}
- Space Available: ${space}
- Pet-Friendly Required: ${petFriendly ? 'Yes' : 'No'}

Respond ONLY with a valid JSON array. No markdown, no code blocks, no explanation. Format:
[
  {
    "name": "Plant Name",
    "scientificName": "Scientific name",
    "reason": "Why this plant suits the user",
    "careTip": "One key care tip",
    "difficulty": "Easy | Medium | Hard",
    "light": "Low | Medium | High"
  }
]`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    // Strip any markdown code fences if Gemini adds them
    const cleaned = text.replace(/^```json\n?/, '').replace(/^```\n?/, '').replace(/\n?```$/, '').trim();

    res.json(JSON.parse(cleaned));
  } catch (err) {
    console.error('AI Recommendations Error:', err);
    res.status(500).json({ message: 'Failed to get AI recommendations', error: err.message });
  }
});

// AI Chat Assistant
router.post('/chat', async (req, res) => {
  const { messages, plantId } = req.body;

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ message: 'Gemini API key is missing' });
  }

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: `You are GreenThumb AI, an expert plant and gardening assistant. You help users with:
- Plant identification and care advice
- Watering, sunlight, and fertilization schedules
- Diagnosing plant problems (yellowing leaves, root rot, pests)
- Garden planning and layout suggestions
- Seasonal gardening tips

Keep responses friendly, concise, and practical. Use bullet points for care steps.
If the user asks about something unrelated to plants or gardening, politely redirect them.`,
    });

    // Build Gemini chat history from messages array (excluding the last user message)
    const history = messages.slice(0, -1).map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const chat = model.startChat({ history });

    // Send the last message
    const lastMessage = messages[messages.length - 1];
    const result = await chat.sendMessage(lastMessage.content);
    const text = result.response.text();

    res.json({ content: text });
  } catch (err) {
    console.error('AI Chat Error:', err);
    res.status(500).json({ message: 'Failed to communicate with AI', error: err.message });
  }
});

module.exports = router;
