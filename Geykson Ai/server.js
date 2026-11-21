const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('.'));
app.use(express.json({ limit: '1mb' }));
app.use('/save-chat', express.text());

function getModelCandidates() {
  const candidates = [];
  if (process.env.AI_Model && process.env.AI_Model.trim()) {
    candidates.push(process.env.AI_Model.trim().replace(/^models\//, ''));
  }
  const defaults = ['gemini-3.5-flash', 'gemini-3-flash-preview'];
  for (const m of defaults) {
    if (!candidates.includes(m)) candidates.push(m);
  }
  return candidates;
}

function shouldTryNextModel(status, data) {
  if (status === 429) return true;
  const msg = (data?.error?.message || '').toLowerCase();
  const codeStatus = (data?.error?.status || '').toUpperCase();
  return (
    codeStatus === 'RESOURCE_EXHAUSTED' ||
    msg.includes('quota') ||
    msg.includes('rate limit') ||
    msg.includes('token')
  );
}

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

    const models = getModelCandidates();
    let lastData = null;
    let lastStatus = 500;

    for (let i = 0; i < models.length; i++) {
      const currentModel = models[i];
      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(currentModel)}:generateContent?key=${encodeURIComponent(apiKey)}`,
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
      lastData = data;
      lastStatus = geminiRes.status;

      if (geminiRes.ok) {
        return res.status(200).json(data);
      }

      const hasMore = i < models.length - 1;
      if (!hasMore || !shouldTryNextModel(geminiRes.status, data)) {
        return res.status(geminiRes.status).json(data);
      }

      console.warn(`⚠️ Model ${currentModel} hit limit (${geminiRes.status}), switching to ${models[i + 1]}...`);
    }

    return res.status(lastStatus).json(lastData);
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