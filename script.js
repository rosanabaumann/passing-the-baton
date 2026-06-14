/* ═══════════════════════════════════════════════════════════
   PASSING THE BATON — script.js
   Rosana del Carmen Baumann · Bachelor Graduation Project 2026
═══════════════════════════════════════════════════════════ */

/* ── LANGUAGE SYSTEM ────────────────────────────────────── */
let currentLang = 'en';
let translations = {};

async function loadTranslations(lang) {
  try {
    const res = await fetch(`data/${lang}.json`);
    if (!res.ok) throw new Error('not found');
    translations = await res.json();
    applyTranslations();
    document.documentElement.lang = lang;
    currentLang = lang;
  } catch {
    // Silently fall back to already-loaded English text if translation missing
    console.info(`Translation for "${lang}" not yet available.`);
  }
}

function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (translations[key]) el.innerHTML = translations[key];
  });
}

document.querySelectorAll('.lang-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    loadTranslations(btn.dataset.lang);
  });
});

// Load English on first paint (acts as default + sets up structure)
loadTranslations('en');

/* ── NAVIGATION ─────────────────────────────────────────── */
const nav       = document.getElementById('nav');
const hamburger = document.getElementById('hamburger');
const navLinks  = document.getElementById('navLinks');

window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 20);
}, { passive: true });

hamburger.addEventListener('click', () => {
  hamburger.classList.toggle('open');
  navLinks.classList.toggle('mobile-open');
});

// Close mobile menu on link click
navLinks.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => {
    hamburger.classList.remove('open');
    navLinks.classList.remove('mobile-open');
  });
});

/* ── SCROLL FADE-IN ─────────────────────────────────────── */
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

/* ── PROCESS PHASES (ACCORDION) ─────────────────────────── */
document.querySelectorAll('.phase__header').forEach(btn => {
  btn.addEventListener('click', () => {
    const phase  = btn.closest('.phase');
    const body   = phase.querySelector('.phase__body');
    const isOpen = btn.getAttribute('aria-expanded') === 'true';

    // Close all
    document.querySelectorAll('.phase__header').forEach(b => {
      b.setAttribute('aria-expanded', 'false');
      b.closest('.phase').querySelector('.phase__body').classList.remove('open');
    });

    // Open clicked (if it was closed)
    if (!isOpen) {
      btn.setAttribute('aria-expanded', 'true');
      body.classList.add('open');
    }
  });
});

/* ── BATON CARD ─────────────────────────────────────────── */
const batonFields  = document.querySelectorAll('.baton-field');
const batonDots    = document.querySelectorAll('.bc-dot');
const batonCounter = document.getElementById('batonCounter');
let currentField   = 0;

function showField(index) {
  batonFields.forEach((f, i) => f.classList.toggle('active', i === index));
  batonDots.forEach((d, i)   => d.classList.toggle('active', i === index));
  batonCounter.textContent = `${index + 1} / ${batonFields.length}`;
}

document.getElementById('batonNext').addEventListener('click', () => {
  currentField = (currentField + 1) % batonFields.length;
  showField(currentField);
});
document.getElementById('batonPrev').addEventListener('click', () => {
  currentField = (currentField - 1 + batonFields.length) % batonFields.length;
  showField(currentField);
});

/* Keyboard navigation inside baton card */
document.getElementById('batonCard').addEventListener('keydown', e => {
  if (e.key === 'ArrowRight') { currentField = (currentField + 1) % batonFields.length; showField(currentField); }
  if (e.key === 'ArrowLeft')  { currentField = (currentField - 1 + batonFields.length) % batonFields.length; showField(currentField); }
});

/* ── MARBLE JOURNEY SIMULATION ──────────────────────────── */
const MARBLE_COLORS = [
  { bg: '#7DBEA8', label: 'transport' },
  { bg: '#E4A96A', label: 'medication' },
  { bg: '#A89BD4', label: 'insurance' },
  { bg: '#E47C7C', label: 'GP update' },
  { bg: '#7CAED4', label: 'Spitex' },
  { bg: '#D4A8C4', label: 'history' },
];

const NO_BATON_MESSAGES = [
  'The patient moves to the GP. But some coordination tasks stay behind — nobody transferred them.',
  'The patient arrives at the hospital. More tasks scatter. The nurse starts from scratch.',
  'After discharge, Spitex receives the patient. Three tasks are missing. The family has to repeat everything.',
  'The patient is home. Only two tasks made it. The rest were lost along the way.',
  'The journey is complete — but much was dropped. <strong>This is what invisible coordination looks like.</strong>',
];

const WITH_BATON_MESSAGES = [
  'The patient moves to the GP. The baton travels with them — all tasks visible and transferred.',
  'The patient arrives at the hospital. The baton was handed over. The team knows the full picture.',
  'After discharge, Spitex receives the patient — and the baton. Nothing needs to be repeated.',
  'The patient is home. All tasks arrived. The next actor knows exactly where things stand.',
  'The journey is complete. <strong>Every coordination task travelled with the patient. The baton worked.</strong>',
];

let currentStep  = 0;
let useBaton     = false;
let marbleStates = []; // array of { lost: false } per marble

function initJourney() {
  currentStep  = 0;
  marbleStates = MARBLE_COLORS.map(() => ({ lost: false }));

  // Clear all step marble zones
  for (let i = 0; i < 5; i++) {
    const zone = document.getElementById(`stepMarbles${i}`);
    if (zone) zone.innerHTML = '';
  }

  // Place all marbles at step 0
  renderStep(0, marbleStates.map((_, i) => i));

  // Reset step highlights
  document.querySelectorAll('.journey__step').forEach((s, i) => {
    s.classList.toggle('active', i === 0);
    s.classList.remove('done');
  });

  const msg = document.getElementById('journeyMessage');
  msg.className = 'journey__message';
  msg.innerHTML = 'Click <strong>Move Patient</strong> to follow the patient through the journey.';

  document.getElementById('journeyNext').disabled = false;
}

function renderStep(stepIndex, marbleIndices) {
  const zone = document.getElementById(`stepMarbles${stepIndex}`);
  if (!zone) return;
  zone.innerHTML = '';
  marbleIndices.forEach(mi => {
    const m = document.createElement('div');
    m.className = 'marble';
    if (marbleStates[mi].lost) m.classList.add('marble--lost');
    m.style.background = MARBLE_COLORS[mi].bg;
    m.title = MARBLE_COLORS[mi].label;
    zone.appendChild(m);
  });
}

function advanceJourney() {
  if (currentStep >= 4) return;

  // Mark current as done
  const steps = document.querySelectorAll('.journey__step');
  steps[currentStep].classList.remove('active');
  steps[currentStep].classList.add('done');

  currentStep++;
  steps[currentStep].classList.add('active');

  // Determine which marbles are lost this step (without baton: some get lost)
  const lostCount = useBaton ? 0 : Math.floor(Math.random() * 2) + (currentStep === 1 ? 1 : 0);
  let lost = 0;
  marbleStates.forEach((m, i) => {
    if (!m.lost && !useBaton && lost < lostCount) {
      m.lost = true;
      lost++;
    }
  });

  // Clear old step marbles (they "stay behind")
  const prevZone = document.getElementById(`stepMarbles${currentStep - 1}`);
  if (prevZone && !useBaton) {
    // Keep lost ones at previous step, move others forward
    const remaining = marbleStates.map((m, i) => ({ ...m, i })).filter(m => m.lost && !alreadyRenderedLost(currentStep - 1, m.i));
    prevZone.innerHTML = '';
    remaining.forEach(m => {
      const el = document.createElement('div');
      el.className = 'marble marble--lost';
      el.style.background = MARBLE_COLORS[m.i].bg;
      el.title = MARBLE_COLORS[m.i].label + ' (lost)';
      prevZone.appendChild(el);
    });
  } else if (prevZone) {
    prevZone.innerHTML = '';
  }

  // Render active marbles at current step
  const activeMarbles = marbleStates.map((m, i) => i).filter(i => !marbleStates[i].lost);
  renderStep(currentStep, activeMarbles);

  // Message
  const msgEl = document.getElementById('journeyMessage');
  const messages = useBaton ? WITH_BATON_MESSAGES : NO_BATON_MESSAGES;
  msgEl.innerHTML = messages[currentStep - 1];
  msgEl.className = 'journey__message' + (useBaton ? ' success' : '');

  if (currentStep === 4) {
    document.getElementById('journeyNext').disabled = true;
  }
}

function alreadyRenderedLost(stepIndex, marbleIndex) {
  // Prevent double-rendering lost marbles
  return false;
}

// Mode toggle
document.getElementById('modeNoBaton').addEventListener('click', function() {
  useBaton = false;
  this.classList.add('active');
  document.getElementById('modeWithBaton').classList.remove('active');
  initJourney();
});
document.getElementById('modeWithBaton').addEventListener('click', function() {
  useBaton = true;
  this.classList.add('active');
  document.getElementById('modeNoBaton').classList.remove('active');
  initJourney();
});

document.getElementById('journeyNext').addEventListener('click', advanceJourney);
document.getElementById('journeyReset').addEventListener('click', initJourney);

// Init on load
initJourney();

/* ── SYSTEM MAP: close tooltip on outside click ─────────── */
document.addEventListener('click', e => {
  if (!e.target.closest('.sys-ring')) {
    document.querySelectorAll('.sys-ring__tip').forEach(t => {
      t.style.display = '';
    });
  }
});
