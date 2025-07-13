const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON requests
app.use(express.json());

// Serve static files from the current directory (index.html, etc.)
app.use(express.static(__dirname));

// API endpoint to save chat logs
app.post('/save-chat', (req, res) => {
  const content = req.body?.log || '';
  const logEntry = `\n\n${new Date().toLocaleString()} ---\n${content}\n`;

  fs.appendFile(path.join(__dirname, 'convo.txt'), logEntry, err => {
    if (err) {
      console.error('❌ Failed to save chat:', err);
      return res.status(500).send('Error saving chat');
    }
    console.log(`✅ Chat saved: ${content}`);
    res.status(200).send('Saved');
  });
});

// Optional endpoint to read the full convo file (publicly viewable)
app.get('/convo.txt', (req, res) => {
  res.sendFile(path.join(__dirname, 'convo.txt'));
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
