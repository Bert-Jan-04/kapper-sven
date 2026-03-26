const express = require('express');
const session = require('express-session');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
  secret: 'kapper-sven-geheim-sleutel',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 8 } // 8 uur
}));

// Admin routes eerst (vóór static, anders worden ze geblokkeerd)
app.use('/admin', require('./admin/routes'));

// Publieke API: content ophalen voor de frontend
app.get('/api/content', (_req, res) => {
  const fs = require('fs');
  const contentPath = require('path').join(__dirname, 'data/content.json');
  res.json(JSON.parse(fs.readFileSync(contentPath, 'utf-8')));
});

// Statische bestanden (HTML, CSS, JS, afbeeldingen)
app.use(express.static(path.join(__dirname)));

// Homepage
app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server draait op http://localhost:${PORT}`);
  console.log(`Admin panel: http://localhost:${PORT}/admin`);
});
