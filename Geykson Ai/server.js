const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('.'));
app.use(express.json({ limit: '1mb' }));
app.use('/save-chat', express.text());

app.post('/api/chat', async (req, res) => {
  const apiKey = process.env.AI_Key;
  if (!apiKey) {
    console.error('❌ Missing AI_Key environment variable');
    return res.status(500).json({ error: { message: 'Server AI_Key is not configured.' } });
  }

  try {
    const { contents, generationConfig } = req.body || {};
    if (!Array.isArray(contents) || contents.length === 0) {
      return res.status(400).json({ error: { message: 'Invalid request contents.' } });
    }

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          generationConfig: generationConfig || {
            maxOutputTokens: 1024,
            temperature: 0.75
          }
        })
      }
    );

    const data = await geminiRes.json();
    return res.status(geminiRes.status).json(data);
  } catch (err) {
    console.error('❌ Gemini proxy error:', err);
    return res.status(500).json({ error: { message: 'Failed to reach Gemini API.' } });
  }
});

app.post('/save-chat', (req, res) => {
  const entry = req.body;
  fs.appendFile('convo.txt', entry, (err) => {
    if (err) {
      console.error('❌ Failed to save:', err);
      return res.sendStatus(500);
    }
    console.log('✅ Chat saved:', entry.trim());
    res.sendStatus(200);
  });
});

app.get('/convo.txt', (req, res) => {
  res.sendFile(path.join(__dirname, 'convo.txt'));
});

app.listen(PORT, () => {
  console.log(`🟢 Listening at http://localhost:${PORT}`);
});