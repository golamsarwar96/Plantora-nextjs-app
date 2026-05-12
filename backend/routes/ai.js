const express = require('express');
const router = express.Router();
const Anthropic = require('@anthropic-ai/sdk');
const { authenticateToken } = require('../middleware/auth');

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// AI Recommendations
router.post('/recommendations', async (req, res) => {
  const { lightLevel, difficulty, space, petFriendly } = req.body;

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ message: 'Anthropic API key is missing' });
  }

  try {
    const prompt = `You are a plant expert assistant. Based on the user's preferences below, recommend 4-6 suitable plants.

User Preferences:
- Light Level: ${lightLevel}
- Care Difficulty: ${difficulty}
- Space Available: ${space}
- Pet-Friendly Required: ${petFriendly ? 'Yes' : 'No'}

Respond ONLY with a valid JSON array. No markdown, no explanation. Format:
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

    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0].text;
    res.json(JSON.parse(content));
  } catch (err) {
    console.error('AI Recommendations Error:', err);
    res.status(500).json({ message: 'Failed to get AI recommendations', error: err.message });
  }
});

// AI Chat Assistant (Streaming support placeholder)
router.post('/chat', async (req, res) => {
  const { messages, plantId } = req.body;

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ message: 'Anthropic API key is missing' });
  }

  try {
    const systemPrompt = `You are GreenThumb AI, an expert plant and gardening assistant. You help users with:
- Plant identification and care advice
- Watering, sunlight, and fertilization schedules
- Diagnosing plant problems (yellowing leaves, root rot, pests)
- Garden planning and layout suggestions
- Seasonal gardening tips

Keep responses friendly, concise, and practical. Use bullet points for care steps.
If the user asks about something unrelated to plants or gardening, politely redirect them.`;

    const response = await anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content
      })),
    });

    res.json({ content: response.content[0].text });
  } catch (err) {
    console.error('AI Chat Error:', err);
    res.status(500).json({ message: 'Failed to communicate with AI', error: err.message });
  }
});

module.exports = router;
