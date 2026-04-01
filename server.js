const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Maak admin.json aan bij eerste opstart als die ontbreekt
const adminPath = path.join(__dirname, 'data/admin.json');
if (!fs.existsSync(adminPath)) {
  const wachtwoord = process.env.ADMIN_WACHTWOORD || 'admin123';
  const hash = bcrypt.hashSync(wachtwoord, 10);
  fs.writeFileSync(adminPath, JSON.stringify({ gebruikersnaam: 'sven', wachtwoord: hash }, null, 2));
  console.log('admin.json aangemaakt');
}

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
  res.json(JSON.parse(fs.readFileSync(path.join(__dirname, 'data/content.json'), 'utf-8')));
});

// Statische bestanden (HTML, CSS, JS, afbeeldingen) – geen cache
app.use(express.static(path.join(__dirname), {
  etag: false,
  lastModified: false,
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.css') || filePath.endsWith('.js')) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    }
  }
}));

// Homepage
app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server draait op http://localhost:${PORT}`);
  console.log(`Admin panel: http://localhost:${PORT}/admin`);
});
