const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');

// @route POST /api/ai/recommendations
// @desc Get 3 smart recommendations based on current roadmap locations
router.post('/recommendations', async (req, res) => {
  try {
    const { locations } = req.body;
    
    // Check if API key exists in .env
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ message: 'GEMINI_API_KEY is not configured in the Backend .env file.' });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Build the prompt context
    let locationContext = 'a new area';
    if (locations && locations.length > 0) {
      locationContext = locations.join(' and ');
    }

    const prompt = `You are a travel expert planning a family trip. The family is currently planning to visit: ${locationContext}. 
    Please strongly recommend exactly 3 highly-rated, family-friendly tourist spots, viewpoints, or cafes near these locations. 
    You MUST return the output EXACTLY as a raw JSON array of objects. Do not use markdown backticks, do not include the word json at the start. Just the raw array.
    Each object must have these exact keys:
    "name": "Name of the spot",
    "icon": "A single emoji representing the spot (like 🏔️, ☕, 🏛️)",
    "description": "A very short, 1-sentence description of why locals/tourists love it (max 10 words)."`;

    const result = await model.generateContent(prompt);
    let text = result.response.text();
    
    // Clean up potential markdown formatting from the response
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();

    const recommendations = JSON.parse(text);

    res.json(recommendations);
  } catch (err) {
    console.error('AI Route Error:', err.message || err);
    res.status(500).json({ message: 'AI Error: ' + (err.message || 'Unknown generation failure.') });
  }
});

module.exports = router;
