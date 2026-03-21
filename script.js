// ─── Navbar scroll effect ───────────────────────────────────────────────────
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 60);
});

// ─── Hamburger menu ──────────────────────────────────────────────────────────
const hamburger = document.getElementById('hamburger');
const navLinks  = document.getElementById('navLinks');

hamburger.addEventListener('click', () => {
  const open = navLinks.classList.toggle('open');
  hamburger.setAttribute('aria-expanded', open);
  document.body.style.overflow = open ? 'hidden' : '';
});

navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
    hamburger.setAttribute('aria-expanded', false);
    document.body.style.overflow = '';
  });
});

// ─── Hero foto zoom animatie (over.html) ─────────────────────────────────────
const heroImg = document.querySelector('.page-hero-img');
if (heroImg) {
  setTimeout(() => heroImg.classList.add('loaded'), 100);
}

// ─── Fade-in bij scrollen ────────────────────────────────────────────────────
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll(
  '.dienst-card, .prijs-categorie, .review-card, .tijd-row, .boek-box, ' +
  '.over-img, .over-tekst, .gallery-item, .cta-content, ' +
  '.intro-tekst, .intro-foto, .verhaal-foto, .verhaal-tekst, .spec-card, .sfeer-content'
).forEach(el => observer.observe(el));
