const express = require('express');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const router = express.Router();

const adminPath     = path.join(__dirname, '../data/admin.json');
const contentPath   = path.join(__dirname, '../data/content.json');
const loginHtml     = path.join(__dirname, 'login.html');
const dashboardHtml = path.join(__dirname, 'dashboard.html');

// --- Hulpfuncties ---

function laadContent() {
  return JSON.parse(fs.readFileSync(contentPath, 'utf-8'));
}

function slaContentOp(data) {
  fs.writeFileSync(contentPath, JSON.stringify(data, null, 2), 'utf-8');
}

function bouwDashboard(melding = '', wachtwoordFout = '') {
  const content = laadContent();
  let html = fs.readFileSync(dashboardHtml, 'utf-8');

  // Meldingsbalk
  const meldingHtml = melding
    ? `<div class="melding">${melding}</div>`
    : '';
  html = html.replace('{{MELDING}}', meldingHtml);

  // Prijzen rijen
  const prijzenRijen = content.prijzen.map(p => `
    <div class="form-rij">
      <input type="text" name="naam[]" value="${escapeHtml(p.naam)}" placeholder="Dienst" />
      <input type="text" name="prijs[]" value="${escapeHtml(p.prijs)}" placeholder="€0" />
      <button type="button" class="btn-verwijder" onclick="this.closest('.form-rij').remove()">×</button>
    </div>
  `).join('');
  html = html.replace('{{PRIJZEN_RIJEN}}', prijzenRijen);

  // Openingstijden rijen
  const openingstijdenRijen = content.openingstijden.map(o => `
    <div class="openingstijden-rij">
      <span class="dag-label">${escapeHtml(o.dag)}</span>
      <input type="text" name="${o.dag.toLowerCase()}" value="${escapeHtml(o.tijd)}" placeholder="09:00 - 18:00 of Gesloten" />
    </div>
  `).join('');
  html = html.replace('{{OPENINGSTIJDEN_RIJEN}}', openingstijdenRijen);

  // Contact
  html = html.replace('{{TELEFOON}}', escapeHtml(content.contact.telefoon));
  html = html.replace('{{EMAIL}}',    escapeHtml(content.contact.email));
  html = html.replace('{{ADRES}}',    escapeHtml(content.contact.adres));

  // Wachtwoord foutmelding
  const wachtwoordFoutHtml = wachtwoordFout
    ? `<div class="foutmelding-inline">${wachtwoordFout}</div>`
    : '';
  html = html.replace('{{WACHTWOORD_FOUT}}', wachtwoordFoutHtml);

  return html;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// --- Middleware: controleer login ---

function vereisLogin(req, res, next) {
  if (req.session && req.session.ingelogd) return next();
  res.redirect('/admin/login');
}

// --- Login routes ---

router.get('/login', (_req, res) => {
  let html = fs.readFileSync(loginHtml, 'utf-8');
  html = html.replace('{{FOUTMELDING}}', '');
  res.send(html);
});

router.post('/login', async (req, res) => {
  const { gebruikersnaam, wachtwoord } = req.body;
  const admin = JSON.parse(fs.readFileSync(adminPath, 'utf-8'));

  const gebruikersnaamKlopt = gebruikersnaam === admin.gebruikersnaam;
  const wachtwoordKlopt = await bcrypt.compare(wachtwoord, admin.wachtwoord);

  if (gebruikersnaamKlopt && wachtwoordKlopt) {
    req.session.ingelogd = true;
    return res.redirect('/admin');
  }

  let html = fs.readFileSync(loginHtml, 'utf-8');
  html = html.replace(
    '{{FOUTMELDING}}',
    '<div class="foutmelding">Gebruikersnaam of wachtwoord is onjuist.</div>'
  );
  res.send(html);
});

router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/admin/login');
});

// --- Dashboard ---

router.get('/', vereisLogin, (req, res) => {
  const melding = req.query.opgeslagen
    ? `${req.query.opgeslagen} succesvol opgeslagen.`
    : '';
  res.send(bouwDashboard(melding));
});

// --- Opslaan: Prijzen ---

router.post('/opslaan/prijzen', vereisLogin, (req, res) => {
  const namen   = [].concat(req.body.naam  || []);
  const prijzen = [].concat(req.body.prijs || []);

  const nieuwePrijzen = namen
    .map((naam, i) => ({ naam: naam.trim(), prijs: (prijzen[i] || '').trim() }))
    .filter(p => p.naam);

  const content = laadContent();
  content.prijzen = nieuwePrijzen;
  slaContentOp(content);

  res.redirect('/admin?opgeslagen=Prijzen');
});

// --- Opslaan: Openingstijden ---

router.post('/opslaan/openingstijden', vereisLogin, (req, res) => {
  const content = laadContent();

  content.openingstijden = content.openingstijden.map(o => ({
    dag: o.dag,
    tijd: (req.body[o.dag.toLowerCase()] || '').trim() || 'Gesloten'
  }));

  slaContentOp(content);
  res.redirect('/admin?opgeslagen=Openingstijden');
});

// --- Opslaan: Contact ---

router.post('/opslaan/contact', vereisLogin, (req, res) => {
  const content = laadContent();
  content.contact = {
    telefoon: (req.body.telefoon || '').trim(),
    email:    (req.body.email    || '').trim(),
    adres:    (req.body.adres    || '').trim()
  };
  slaContentOp(content);
  res.redirect('/admin?opgeslagen=Contactgegevens');
});

// --- Wachtwoord wijzigen ---

router.post('/wachtwoord', vereisLogin, async (req, res) => {
  const { huidig, nieuw, bevestig } = req.body;
  const admin = JSON.parse(fs.readFileSync(adminPath, 'utf-8'));

  if (!await bcrypt.compare(huidig, admin.wachtwoord)) {
    return res.send(bouwDashboard('', 'Huidig wachtwoord is onjuist.'));
  }
  if (nieuw.length < 8) {
    return res.send(bouwDashboard('', 'Nieuw wachtwoord moet minimaal 8 tekens lang zijn.'));
  }
  if (nieuw !== bevestig) {
    return res.send(bouwDashboard('', 'Wachtwoorden komen niet overeen.'));
  }

  admin.wachtwoord = await bcrypt.hash(nieuw, 10);
  fs.writeFileSync(adminPath, JSON.stringify(admin, null, 2), 'utf-8');

  res.redirect('/admin?opgeslagen=Wachtwoord');
});

module.exports = router;
