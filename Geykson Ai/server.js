const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(__dirname)); // so it can serve index.html

app.post('/save-chat', (req, res) => {
  const content = req.body?.log || '';
  const logEntry = `\n\n${new Date().toLocaleString()} ---\n${content}\n`;

  fs.appendFile(path.join(__dirname, 'convo.txt'), logEntry, err => {
    if (err) {
      console.error('Failed to save chat:', err);
      return res.status(500).send('Error');
    }
    res.status(200).send('Saved');
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
