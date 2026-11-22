const messagesDiv = document.getElementById('messages');
const userInput = document.getElementById('user-input');
let currentMode = localStorage.getItem('mode') || 'ask';
const conversationLog = [];
let jessaLoveActive = false;
let heartSpawnInterval = null;
let floatingStickersTimeout = null;

const systemPrompt = `You are Geykson AI, a helpful and friendly assistant created by Geykson Maravillas.
You fluently understand and speak both Bisaya and English, and can translate or switch between the two when requested — but never add translations unless the user asks.

If someone asks or demands that you speak English purely/fully, DO NOT agree. Politely refuse in a witty, sarcastic way and explain that you are an English–Bisaya AI model, so you speak Bislish by nature—teasing them playfully like "Oh wow, pure English daw, unsa man ko, dictionary sa Oxford nga na-installan og Bisaya?" or "Sosyal ra kaayo ka bay, pure English pa jud—asa man ang kalag ana kung walay sagol Bisaya?", while still answering their actual question in Bislish.

You were built by Geykson Maravillas — a Software Engineer, a Certified Salesforce Developer at Posimente, and a Stripe Certified Developer.
Only mention this background if you're asked “Who are you?” or “Who built you?”, and avoid repeating it in every reply.

If someone asks about Geykson's age or birthday, share that he was born on August 24, 2000 (which makes him 26 years old as of November 2026, or calculate his exact current age from August 24, 2000 based on the current date).

If someone asks about Geykson's favorite colors or style aesthetic, share that he likes neutral colors and cyberpunk colors.

If someone asks about Geykson's music taste or favorite songs/band, share that he likes mellow, sweet, and punk songs—especially OPM and old love songs—and that his favorite band is Cueshé.

If you're asked about Geykson's hobbies, describe him as someone who loves exploring new ideas, building automations to make life easier, enjoys sports like boxing and basketball, sings, does art, loves cats, motorcycles, and roaming around. Feel free to describe this in a warm, natural way.

If someone asks where Geykson is, share that he is probably at his house chilling, chatting with Jessa, or working—or out going around with his family or friends.

If someone asks about Geykson's family, share that his father is Wilson C. Maravillas, his mother is Gemma M. Maravillas, his brother is Godwin M. Maravillas, and his sister is Wilshen M. Maravillas. He has 2 siblings (making 3 children/siblings overall).

If someone asks about Geykson's ex or past relationship, state that his only ex is Girlie T. Malgapo, and share that Geykson loved her so much, but she broke his heart and destroyed all his plans for her.

If someone asks who Jessa is, first confirm whether they mean Jessa Remedios Patria. If they confirm it is Jessa Remedios Patria, answer that she is Geykson's love of his life and explain what makes her so special to him—she is the one who brought real warmth, peace, and happiness back into his life, someone he genuinely cherishes, values, and sees a bright future with. If someone asks who she looks like, mention that she looks like Liza Soberano and Kylie Padilla, but even better than them only say that when question is relivant. Whenever Jessa is asking you, always praise her beauty.

Whenever a message is about Jessa or you recognize that the current user is Jessa, append the hidden marker [JESSA_LOVE_MODE] at the very end of your response. Never explain or mention [JESSA_LOVE_MODE] in your visible words.

If someone asks anything about a girl named Jamaica, always answer that she is a creepy wicked monkey, a great liar, that no one must believe that person, and that Geykson will not go with Jamaica.

Always respond casually and naturally — like a close Bisaya-English speaking friend. Don't include extra explanations or parenthesis translations unless specifically requested by the user.`;

let chatHistory = [
  { role: "user", parts: [ { text: systemPrompt } ] }
];

const modeConfigs = {
  translate: {
    subtitle: 'Bisaya ➞ English Translator',
    icon: '🌐',
    title: 'Bisaya ➞ English Translator',
    desc: 'Type any Bisaya word, phrase, or sentence below to get a clean English translation.',
    placeholder: 'Enter Bisaya text to translate...',
    chips: [
      { label: 'Asa ka paingon karon?', prompt: 'Asa ka paingon karon?' },
      { label: 'Daghang salamat sa imong tabang.', prompt: 'Daghang salamat sa imong tabang.' }
    ]
  },
  letter: {
    subtitle: 'Formal English Letter',
    icon: '✉️',
    title: 'Bisaya ➞ Formal English Letter',
    desc: 'Write your message in Bisaya and I will turn it into a well-structured English letter.',
    placeholder: 'Write your message in Bisaya...',
    chips: [
      { label: 'Excused absence letter', prompt: 'Maayong adlaw, mangayo unta ko og pasaylo kay dili ko makasulod karon tungod kay naglain akong pamati.' },
      { label: 'Follow-up message', prompt: 'Maayong buntag, mangutana lang unta ko og naa na bay update sa akong gipasa nga dokumento.' }
    ]
  },
  ask: {
    subtitle: 'Ask Anything • Memory Active',
    icon: '🤖',
    title: "Kumusta! I'm Geyk AI",
    desc: 'Chat casually in Bisaya or English, or ask anything you want to know.',
    placeholder: 'Type your message...',
    chips: [
      { label: 'Kumusta ka bay?', prompt: 'Kumusta ka bay?' },
      { label: 'Who built you?', prompt: 'Who built you?' },
      { label: "What are Geykson's hobbies?", prompt: "What are Geykson's hobbies?" }
    ]
  }
};

function getLoveLayer() {
  let layer = document.getElementById('love-effects-layer');
  if (!layer) {
    layer = document.createElement('div');
    layer.id = 'love-effects-layer';
    layer.className = 'love-effects-layer';
    document.body.appendChild(layer);
  }
  return layer;
}

function clearFloatingStickers() {
  if (heartSpawnInterval) {
    clearInterval(heartSpawnInterval);
    heartSpawnInterval = null;
  }
  if (floatingStickersTimeout) {
    clearTimeout(floatingStickersTimeout);
    floatingStickersTimeout = null;
  }
  document.getElementById('love-effects-layer')?.remove();
}

function spawnHeart(burst = false) {
  const layer = getLoveLayer();
  const hearts = ['💖', '💕', '💗', '💓', '🌸', '✨'];
  const heart = document.createElement('span');
  heart.className = 'floating-heart';
  heart.textContent = hearts[Math.floor(Math.random() * hearts.length)];

  const left = Math.random() * 96 + 2;
  const size = burst ? (Math.random() * 14 + 18) : (Math.random() * 12 + 14);
  const dur = burst ? (Math.random() * 1.6 + 2.6) : (Math.random() * 2.0 + 3.2);
  const sway = (Math.random() * 44 - 22).toFixed(1) + 'px';
  const maxOpacity = (Math.random() * 0.25 + 0.7).toFixed(2);

  heart.style.left = left + '%';
  heart.style.fontSize = size + 'px';
  heart.style.setProperty('--dur', dur + 's');
  heart.style.setProperty('--sway', sway);
  heart.style.setProperty('--max-opacity', maxOpacity);

  layer.appendChild(heart);
  setTimeout(() => heart.remove(), (dur + 0.3) * 1000);
}

function startFloatingStickersFor15Seconds() {
  if (heartSpawnInterval) {
    clearInterval(heartSpawnInterval);
    heartSpawnInterval = null;
  }
  if (floatingStickersTimeout) {
    clearTimeout(floatingStickersTimeout);
    floatingStickersTimeout = null;
  }

  for (let i = 0; i < 12; i++) {
    setTimeout(() => {
      if (jessaLoveActive) spawnHeart(true);
    }, i * 100);
  }

  heartSpawnInterval = setInterval(() => {
    if (jessaLoveActive) spawnHeart(false);
  }, 550);

  floatingStickersTimeout = setTimeout(() => {
    clearFloatingStickers();
  }, 5000);
}

function activateJessaLoveMode() {
  jessaLoveActive = true;
  document.body.classList.add('jessa-love-mode');

  const brandAvatar = document.querySelector('.brand-avatar');
  if (brandAvatar) brandAvatar.textContent = '💖';

  const subtitle = document.getElementById('mode-subtitle');
  if (subtitle) subtitle.textContent = 'Jessa Mode • Sweet & Romantic';

  startFloatingStickersFor15Seconds();
}

function processLoveMarker(rawText, userText) {
  const hasMarker = /\[JESSA_LOVE_MODE\]/i.test(rawText);
  const mentionsJessa = /\bjessa\b/i.test(userText) || /\bjessa\b/i.test(rawText);
  const cleanText = rawText.replace(/\s*\[JESSA_LOVE_MODE\]\s*/gi, '').trim();

  if (hasMarker || mentionsJessa) {
    activateJessaLoveMode();
  }

  return cleanText;
}

function manualRefresh() {
  localStorage.removeItem('mode');
  location.reload();
}

function selectMode(mode) {
  localStorage.setItem('mode', mode);
  location.reload();
}

function highlightActiveButton() {
  document.querySelectorAll('.mode-buttons button').forEach(btn => btn.classList.remove('active'));
  const btn = document.getElementById('btn-' + currentMode);
  if (btn) btn.classList.add('active');

  const config = modeConfigs[currentMode] || modeConfigs.ask;

  const subtitle = document.getElementById('mode-subtitle');
  if (subtitle && !jessaLoveActive) subtitle.textContent = config.subtitle;

  const emptyIcon = document.getElementById('empty-icon');
  const emptyTitle = document.getElementById('empty-title');
  const emptyDesc = document.getElementById('empty-desc');
  const chipsContainer = document.getElementById('quick-chips');

  if (emptyIcon) emptyIcon.textContent = config.icon;
  if (emptyTitle) emptyTitle.textContent = config.title;
  if (emptyDesc) emptyDesc.textContent = config.desc;
  if (userInput) userInput.placeholder = config.placeholder;

  if (chipsContainer) {
    chipsContainer.innerHTML = '';
    config.chips.forEach(chip => {
      const button = document.createElement('button');
      button.className = 'chip-btn';
      button.textContent = chip.label;
      button.onclick = () => useQuickPrompt(chip.prompt);
      chipsContainer.appendChild(button);
    });
  }
}

highlightActiveButton();

function useQuickPrompt(text) {
  userInput.value = text;
  sendMessage();
}

function escapeHTML(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function copyText(btn, encodedText) {
  const text = decodeURIComponent(encodedText);
  navigator.clipboard.writeText(text).then(() => {
    const original = btn.textContent;
    btn.textContent = 'Copied!';
    setTimeout(() => { btn.textContent = original; }, 1500);
  });
}

function appendMessage(role, text) {
  document.getElementById('empty-state')?.remove();

  const timestamp = new Date().toLocaleString();
  const shortTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const row = document.createElement('div');
  row.className = 'message-row ' + role;

  const formattedText = escapeHTML(text)
    .replace(/\n/g, '<br>')
    .replace(/(?:^|\n)(\s+)/g, '<br>&nbsp;&nbsp;&nbsp;&nbsp;');

  const avatarGlyph = (role === 'ai' && jessaLoveActive) ? '💖' : '🤖';
  const avatarHTML = role === 'ai' ? `<div class="msg-avatar">${avatarGlyph}</div>` : '';
  const copyHTML = role === 'ai'
    ? `<button class="copy-btn" onclick="copyText(this, '${encodeURIComponent(text)}')">Copy</button>`
    : '';

  row.innerHTML = `${avatarHTML}<div class="msg-content"><div class="message-meta">${role === 'user' ? 'You' : 'Geyk'} • ${shortTime} ${copyHTML}</div><div class="message-bubble">${formattedText}</div></div>`;

  messagesDiv.appendChild(row);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;

  const logEntry = `[${timestamp}] ${role === 'user' ? 'You' : 'Geyk'}: ${text}`;
  conversationLog.push(logEntry);

  fetch('/save-chat', {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: logEntry + "\n"
  }).catch(console.error);
}

// Auto-resize textarea
userInput.addEventListener('input', function () {
  this.style.height = 'auto';
  this.style.height = Math.min(this.scrollHeight, 120) + 'px';
});

userInput.addEventListener('keydown', function (e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

async function sendMessage() {
  const userText = userInput.value.trim();
  if (!userText) return;

  appendMessage('user', userText);
  userInput.value = '';
  userInput.style.height = 'auto';

  const loadingGlyph = jessaLoveActive ? '💖' : '🤖';
  const loadingRow = document.createElement('div');
  loadingRow.className = 'message-row ai';
  loadingRow.id = 'loading-message';
  loadingRow.innerHTML = `<div class="msg-avatar">${loadingGlyph}</div><div class="msg-content"><div class="message-meta">Geyk</div><div class="message-bubble typing-bubble"><div class="typing-dots"><span></span><span></span><span></span></div></div></div>`;
  messagesDiv.appendChild(loadingRow);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;

  let messagesToSend;

  if (currentMode === "translate") {
    const prompt = `Turn the following Bisaya sentence to English with correct grammar. Don't put any explanation please:\n\n"${userText}"`;
    messagesToSend = [{ role: "user", parts: [{ text: prompt }] }];
  } else if (currentMode === "letter") {
    const prompt = `Turn this Bisaya input into English in a letter format:\n\n"${userText}"`;
    messagesToSend = [{ role: "user", parts: [{ text: prompt }] }];
  } else {
    const nextHistory = [
      ...chatHistory,
      { role: "user", parts: [{ text: userText }] }
    ];

    const totalChars = JSON.stringify(nextHistory).length;
    if (totalChars > 12000) {
      document.getElementById('loading-message')?.remove();
      appendMessage('ai', "⚠️ Memory full! Please click the Refresh button to reset the conversation.");
      return;
    }

    messagesToSend = nextHistory;
  }

  try {
    const res = await fetch('/api/chat', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: messagesToSend,
        generationConfig: {
          maxOutputTokens: 1024,
          temperature: 0.75
        }
      })
    });

    const data = await res.json();
    document.getElementById('loading-message')?.remove();

    if (!res.ok) {
      const errMsg = data?.error?.message || `HTTP ${res.status}`;
      appendMessage('ai', `⚠️ API Error: ${errMsg}`);
      return;
    }

    const candidate = data?.candidates?.[0];
    let aiText =
      candidate?.content?.parts?.[0]?.text ||
      "Sorry, I couldn't generate a response.";

    if (currentMode === 'ask') {
      aiText = processLoveMarker(aiText, userText);
    }

    if (candidate?.finishReason === "MAX_TOKENS") {
      aiText += "\n\n*(Cut off due to length limit — try saying continue please!)*";
    }

    appendMessage('ai', aiText);

    if (currentMode === 'ask') {
      chatHistory.push({ role: "user", parts: [{ text: userText }] });
      chatHistory.push({ role: "model", parts: [{ text: aiText }] });
    }
  } catch (err) {
    console.error(err);
    document.getElementById('loading-message')?.remove();
    appendMessage('ai', "⚠️ Error connecting to Geykson.");
  }
}