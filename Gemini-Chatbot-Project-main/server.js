const express = require("express");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODELS = ["gemini-2.0-flash", "gemini-1.5-flash"];

app.use(express.json({ limit: "15mb" }));
app.use(express.static(path.join(__dirname)));

app.post("/api/generate", async (req, res) => {
  if (!GEMINI_API_KEY || GEMINI_API_KEY.trim().length < 20) {
    return res.status(500).json({
      error: { message: "Missing GEMINI_API_KEY in local .env file." },
    });
  }

  const { contents } = req.body || {};
  if (!Array.isArray(contents) || contents.length === 0) {
    return res.status(400).json({
      error: { message: "Invalid request body. 'contents' array is required." },
    });
  }

  let lastError = "Unable to get response from Gemini API.";

  for (const model of GEMINI_MODELS) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

    try {
      const geminiResponse = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents }),
      });

      const data = await geminiResponse.json();
      if (geminiResponse.ok) {
        return res.json(data);
      }

      lastError =
        data?.error?.message ||
        `Gemini request failed on model ${model} with status ${geminiResponse.status}.`;
    } catch (error) {
      lastError = error.message || lastError;
    }
  }

  return res.status(502).json({ error: { message: lastError } });
});

app.listen(PORT, () => {
  console.log(`Gemini chatbot running locally at http://localhost:${PORT}`);
});
