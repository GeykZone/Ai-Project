const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;

app.use(express.static('.'));
app.use('/save-chat', express.text());

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
