// =====================================================
// INVITO MATRIMONIO — Script condiviso v2
// Legge dati da ?c=nome_coppia o da body[data-couple]
// =====================================================

(async function () {
  const params = new URLSearchParams(window.location.search);
  const coupleName = params.get('c') || document.body.dataset.couple || 'moni_arturo';
  const hasPhotos = document.body.dataset.photos === 'true';

  let data;
  try {
    const res = await fetch(`./${coupleName}.txt`);
    if (!res.ok) throw new Error('File non trovato');
    data = await res.json();
  } catch (e) {
    console.error('Errore caricamento dati:', e);
    return;
  }

  window.INVITO = data;

  fillBasicData(data);
  buildTimeline(data.orari);
  buildInfoUtili(data.info_utili);
  buildHotels(data.hotels);
  buildContatti(data.contatti);
  buildFooter(data.brand, data.coppia);
  buildPlaylist(data.playlist);
  buildMap(data.location);
  startCountdown(data.matrimonio.data_iso);
  if (hasPhotos) {
    buildGallery(data.coppia);
    setHeroPhoto(data.coppia);
  }
  setupForm(data.form_action, data.coppia);

  // ── Reveal Observer ─────────────────────────────────
  // Gestisce reveal, reveal-left, reveal-right per tutti gli stili
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0, rootMargin: '0px 0px -50px 0px' });

  // Auto-applica reveal a tutte le sezioni e al footer
  const colorSections = ['section-terra', 'section-dark', 'section-sage', 'section-cream-dk'];
  document.querySelectorAll('section, footer').forEach((el, i) => {
    if (!el.classList.contains('hero')) {
      const isColorBlock = colorSections.some(c => el.classList.contains(c));
      if (isColorBlock) {
        el.classList.add(i % 2 === 0 ? 'reveal-left' : 'reveal-right');
      } else {
        el.classList.add('reveal');
      }
      el.style.transitionDelay = `${i * 0.03}s`;
      obs.observe(el);
    }
  });

  // Osserva anche gli elementi interni con classi reveal
  document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-fade').forEach(el => obs.observe(el));

})();

// ── Helpers ────────────────────────────────────────

function fillBasicData(d) {
  const c = d.coppia;
  const m = d.matrimonio;
  const l = d.location;
  document.querySelectorAll('[data-f="nomi"]').forEach(el => el.textContent = c.nome_completo);
  document.querySelectorAll('[data-f="data"]').forEach(el => el.textContent = m.data_display);
  document.querySelectorAll('[data-f="location-nome"]').forEach(el => el.textContent = l.nome);
  document.querySelectorAll('[data-f="location-indirizzo"]').forEach(el => el.textContent = l.indirizzo);
  document.querySelectorAll('[data-f="sposa"]').forEach(el => el.textContent = c.sposa);
  document.querySelectorAll('[data-f="sposo"]').forEach(el => el.textContent = c.sposo);
  document.title = `Matrimonio ${c.nome_completo} — ${m.data_display}`;
}

function setHeroPhoto(c) {
  const hero = document.querySelector('.hero-bg');
  if (hero) {
    // URL encode spaces in folder name
    const folder = encodeURIComponent(c.cartella_foto).replace(/%20/g, '%20');
    hero.style.backgroundImage = `url('${c.cartella_foto}/${c.foto_hero}')`;
  }
}

function buildGallery(c) {
  const grid = document.getElementById('gallery-grid');
  if (!grid) return;
  const nums = [1, 2, 3, 4, 5, 6];
  // Tenta nomi con parentesi tonde o senza
  nums.forEach((n, i) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'gallery-item';
    // Delay a cascata per l'entrata dei polaroid
    wrapper.style.transitionDelay = `${i * 0.1}s`;
    const img = document.createElement('img');
    img.src = `${c.cartella_foto}/${c.cartella_foto} (${n}).webp`;
    img.alt = `Foto ${c.nome_completo}`;
    img.loading = 'lazy';
    img.onerror = () => { img.src = `${c.cartella_foto}/${c.cartella_foto} ${n}.webp`; };
    img.onclick = () => openLightbox(img.src);
    wrapper.appendChild(img);
    grid.appendChild(wrapper);
  });
  // Osserva le gallery-item per l'animazione
  const obs2 = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs2.unobserve(e.target); } });
  }, { threshold: 0.1 });
  grid.querySelectorAll('.gallery-item').forEach(el => { el.classList.add('reveal'); obs2.observe(el); });
  createLightbox();
}

function createLightbox() {
  const lb = document.createElement('div');
  lb.id = 'lightbox';
  lb.innerHTML = `<div class="lb-backdrop" onclick="closeLightbox()"></div><img id="lb-img" src="" alt="foto"><button class="lb-close" onclick="closeLightbox()">✕ chiudi</button>`;
  document.body.appendChild(lb);
}
window.openLightbox = function (src) {
  document.getElementById('lb-img').src = src;
  document.getElementById('lightbox').classList.add('active');
};
window.closeLightbox = function () {
  document.getElementById('lightbox').classList.remove('active');
};

// ── Timeline — struttura con 3 colonne (ora | linea | testo)
function buildTimeline(orari) {
  const el = document.getElementById('timeline');
  if (!el || !orari) return;
  el.innerHTML = orari.map((o, i) => `
    <div class="timeline-item" style="transition-delay:${i * 0.12}s">
      <div class="tl-icon">${o.ora.split(':')[0]}<span style="font-size:0.5em;vertical-align:middle">:${o.ora.split(':')[1]}</span></div>
      <div></div>
      <div class="tl-content">
        <div class="tl-titolo">${o.titolo}</div>
        <div class="tl-desc">${o.descrizione}</div>
      </div>
    </div>`).join('');
}

function buildInfoUtili(info) {
  const el = document.getElementById('info-grid');
  if (!el || !info) return;
  el.innerHTML = Object.values(info).map(i => `
    <div class="info-card">
      <div class="info-titolo">${i.titolo}</div>
      <div class="info-testo">${i.testo}</div>
    </div>`).join('');
}

function buildHotels(hotels) {
  const el = document.getElementById('hotels-grid');
  if (!el || !hotels) return;
  el.innerHTML = hotels.map(h => `
    <div class="hotel-card">
      <div>
        <div class="hotel-nome">${h.nome}</div>
        <div class="hotel-citta">${h.citta} &mdash; ${h.distanza}</div>
      </div>
      <div class="hotel-azioni">
        <a href="tel:${h.telefono}" class="btn-hotel">Chiama</a>
        <a href="${h.url}" target="_blank" rel="noopener" class="btn-hotel">Sito web</a>
      </div>
    </div>`).join('');
}

function buildContatti(contatti) {
  const btnSposa = document.getElementById('btn-whatsapp-sposa');
  const btnSposo = document.getElementById('btn-whatsapp-sposo');
  if (btnSposa && contatti?.sposa) {
    const wa = contatti.sposa;
    btnSposa.href = `https://wa.me/${wa.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(wa.messaggio)}`;
    const nEl = btnSposa.querySelector('.wa-nome');
    if (nEl) nEl.textContent = wa.nome;
  }
  if (btnSposo && contatti?.sposo) {
    const wa = contatti.sposo;
    btnSposo.href = `https://wa.me/${wa.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(wa.messaggio)}`;
    const nEl = btnSposo.querySelector('.wa-nome');
    if (nEl) nEl.textContent = wa.nome;
  }
}

function buildPlaylist(pl) {
  const el = document.getElementById('playlist-msg');
  if (el && pl) el.textContent = pl.messaggio;
  const btn = document.getElementById('btn-playlist');
  if (btn) {
    if (pl?.url) { btn.href = pl.url; }
    btn.style.display = '';
  }
}

function buildMap(location) {
  const iframe = document.getElementById('map-iframe');
  if (iframe && location) iframe.src = location.maps_embed;
  const link = document.getElementById('map-link');
  if (link && location) link.href = location.maps_url;
  document.querySelectorAll('[data-f="location-nome"]').forEach(el => el.textContent = location.nome);
}

function buildFooter(brand, coppia) {
  const fnomi = document.getElementById('footer-nomi');
  if (fnomi) fnomi.textContent = coppia?.nome_completo || '';
  const fbrand = document.getElementById('footer-brand');
  if (fbrand) fbrand.innerHTML = `<a href="${brand?.url || '#'}" target="_blank">By ${brand?.nome || 'Mayra e Mariano Fotografi'}</a>`;
  const flogo = document.getElementById('footer-logo');
  if (flogo) flogo.src = brand?.logo || '../logo.png';
}

function startCountdown(targetISO) {
  const els = {
    g: document.getElementById('cd-giorni'),
    o: document.getElementById('cd-ore'),
    m: document.getElementById('cd-minuti'),
    s: document.getElementById('cd-secondi')
  };
  if (!els.g) return;
  function tick() {
    const diff = new Date(targetISO) - new Date();
    if (diff <= 0) { document.getElementById('countdown-wrap')?.remove(); return; }
    const g = Math.floor(diff / 86400000);
    const o = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    if (els.g) els.g.textContent = String(g).padStart(3, '0');
    if (els.o) els.o.textContent = String(o).padStart(2, '0');
    if (els.m) els.m.textContent = String(m).padStart(2, '0');
    if (els.s) els.s.textContent = String(s).padStart(2, '0');
  }
  tick();
  setInterval(tick, 1000);
}

function setupForm(action, coppia) {
  const form = document.getElementById('rsvp-form');
  if (!form) return;
  if (action && !action.includes('XXXX')) form.action = action;
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    const btn = form.querySelector('[type=submit]');
    btn.textContent = 'Inviando...';
    btn.disabled = true;
    const formData = new FormData(form);
    formData.append('coppia', coppia?.nome_completo || '');
    fetch(form.action || '#', { method: 'POST', body: formData, headers: { 'Accept': 'application/json' } })
      .then(r => {
        if (r.ok) {
          form.innerHTML = '<div class="form-success">Grazie — la vostra presenza è confermata.</div>';
        } else {
          btn.textContent = 'Riprova';
          btn.disabled = false;
        }
      }).catch(() => { btn.textContent = 'Riprova'; btn.disabled = false; });
  });
}
