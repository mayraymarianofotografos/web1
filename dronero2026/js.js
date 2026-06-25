// ─── Configuración ────────────────────────────────────────────────────────────
const WHATSAPP = '393481143529';
const PRICE_PER_PRINT = 2;               // € por stampa
const MAX_LOADS = 1000;            // Máx. fotos posibles por carpeta
const BATCH_SIZE = 10;              // Requests paralelos por lote
const MAX_MISSES = 50;              // Fallos consecutivos antes de parar
const MAX_QTY = 10;             // Copie massime per foto

// Metodo di pagamento mostrato nel form e nel messaggio WhatsApp
const PAYMENT_INFO = 'Pagamento: contanti alla consegna.';

// ─── Estado compartido ────────────────────────────────────────────────────────
const selected = new Set();
window.selected = selected;

let pendingPreview = null;
let previewQuantities = {};
let currentTipo = null;
let fotos = [];
let isLoading = false;

// ─── Referencias DOM ──────────────────────────────────────────────────────────
const tipoBtns = document.querySelectorAll('.tipo-btn');
const gallerySection = document.getElementById('gallery-section');
const galleryContainer = document.getElementById('gallery-container');
const galleryTitle = document.getElementById('gallery-title');
const galleryCount = document.getElementById('gallery-count');
const selectionBar = document.getElementById('selection-bar');
const selectionCount = document.getElementById('selection-count');
const btnEnviar = document.getElementById('btn-enviar');
const formOverlay = document.getElementById('form-overlay');
const formSubmit = document.getElementById('form-submit');
const formCancel = document.getElementById('form-cancel');
const formAlert = document.getElementById('form-alert');
const successBanner = document.getElementById('success-banner');

// ─── Utilidades ───────────────────────────────────────────────────────────────
function tryLoadImage(src) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = src;
    });
}

function calcTotal(quantities) {
    return Object.values(quantities).reduce((sum, q) => sum + q * PRICE_PER_PRINT, 0);
}

function resetAll() {
    selected.clear();
    pendingPreview = null;
    previewQuantities = {};
    window.updateBar();
    document.querySelectorAll('.gallery-item.selected')
        .forEach(el => el.classList.remove('selected'));
}

// ─── Descubrimiento de fotos (lotes paralelos) ────────────────────────────────
async function discoverFotos(tipo, onProgress) {
    const folder = `${tipo}/`;
    const results = [];
    let misses = 0;

    for (let f = 1; f <= MAX_LOADS && misses < MAX_MISSES; f += BATCH_SIZE) {
        const batchIndices = Array.from({ length: BATCH_SIZE }, (_, i) => f + i);
        const batchResults = await Promise.all(
            batchIndices.map(n => {
                let url;
                if (tipo === 'cresima') {
                    url = `${folder}extra (${n}).jpg`;
                } else {
                    url = `${folder}comunione (${n}).jpg`; // Predeterminado para comunione
                }
                return tryLoadImage(url).then(ok => ({ ok, n, url }));
            })
        );

        for (const { ok, n, url } of batchResults) {
            if (n > MAX_LOADS) break;
            if (ok) {
                const name = url.split('/').pop();
                results.push({ src: url, name });
                misses = 0;
            } else {
                misses++;
                if (misses >= MAX_MISSES) break;
            }
        }

        if (results.length > 0) {
            onProgress?.(results.length);
        }
    }

    return results;
}

// ─── Render galería ───────────────────────────────────────────────────────────
function renderGallery(tipo, items) {
    const label = tipo === 'cresima' ? 'Cresima' : 'Comunione';
    galleryTitle.textContent = label;
    galleryCount.textContent = `${items.length} foto disponibili`;
    galleryContainer.innerHTML = '';

    // ── Leggi selezione salvata PRIMA di resetAll ─────────────────────────────
    let _savedNomi = [];
    try {
        const _saved = JSON.parse(localStorage.getItem('mm_selezione') || 'null');
        if (_saved?.tipo === tipo && Array.isArray(_saved.nomi) && _saved.nomi.length) {
            _savedNomi = _saved.nomi;
        }
    } catch (_) {}

    resetAll();

    const grid = document.createElement('div');
    grid.className = 'gallery-grid';

    items.forEach((item, idx) => {
        const div = document.createElement('div');
        div.className = 'gallery-item';
        div.dataset.name = item.name;

        const img = document.createElement('img');
        img.src = item.src;
        img.alt = label;
        img.loading = 'lazy';
        img.draggable = false;
        div.appendChild(img);

        div.addEventListener('click', (ev) => {
            if (ev.metaKey || ev.ctrlKey) {
                if (selected.has(item.name)) {
                    selected.delete(item.name);
                    div.classList.remove('selected');
                } else {
                    selected.add(item.name);
                    div.classList.add('selected');
                }
                window.updateBar();
            } else {
                if (typeof window.openLightboxForIndex === 'function') {
                    window.openLightboxForIndex(idx);
                }
            }
        });

        grid.appendChild(div);
    });

    galleryContainer.appendChild(grid);
    window._currentGalleryItems = items;

    // ── Ripristina selezione salvata ──────────────────────────────────────────
    if (_savedNomi.length) {
        const nameSet = new Set(items.map(it => it.name));
        _savedNomi.forEach(name => {
            if (!nameSet.has(name)) return;          // foto non più disponibile
            selected.add(name);
            grid.querySelector(`.gallery-item[data-name='${CSS.escape(name)}']`)
                ?.classList.add('selected');
        });
        if (selected.size > 0) window.updateBar();
    }
}

// ─── Barra de selección ───────────────────────────────────────────────────────
window.updateBar = function updateBar() {
    const n = selected.size;
    selectionCount.textContent = `${n} selezionat${n === 1 ? 'a' : 'e'}`;
    selectionBar.classList.toggle('visible', n > 0);
    // ── Persistenza selezione su localStorage ────────────────────────────────
    try {
        if (n > 0 && currentTipo) {
            localStorage.setItem('mm_selezione', JSON.stringify({ tipo: currentTipo, nomi: [...selected] }));
        } else {
            localStorage.removeItem('mm_selezione');
        }
    } catch (_) {}
};

// ─── Preview overlay ──────────────────────────────────────────────────────────
window.openPreviewOverlay = function openPreviewOverlay() {
    const overlay = document.getElementById('preview-overlay');
    const grid = document.getElementById('preview-grid');
    const totalEl = document.getElementById('preview-total');

    const backBtn = overlay.querySelector('#preview-back');
    const contBtn = overlay.querySelector('#preview-continue');
    const freshBack = backBtn.cloneNode(true);
    const freshCont = contBtn.cloneNode(true);
    backBtn.replaceWith(freshBack);
    contBtn.replaceWith(freshCont);

    grid.innerHTML = '';

    const items = window._currentGalleryItems || [];
    const map = new Map(items.map(it => [it.name, it.src]));

    previewQuantities = {};
    Array.from(selected).forEach(name => { previewQuantities[name] = 1; });

    function renderTotal() {
        if (totalEl) totalEl.textContent = `Totale stimato: ${calcTotal(previewQuantities)}€`;
    }

    Array.from(selected).forEach(name => {
        const src = map.get(name);
        if (!src) return;

        const card = document.createElement('div');
        card.className = 'preview-card';
        card.innerHTML = `
            <button class="preview-remove" data-name="${name}" aria-label="Rimuovi">✕</button>
            <img src="${src}" alt="${name}" class="preview-thumb" />
            <div class="preview-card-label">${name}</div>
            <div class="preview-qty-control">
                <button class="qty-btn qty-minus" data-name="${name}" aria-label="Riduci copie">−</button>
                <span class="qty-value" data-name="${name}">1</span>
                <button class="qty-btn qty-plus" data-name="${name}" aria-label="Aumenta copie">+</button>
            </div>`;
        grid.appendChild(card);
    });

    grid.querySelectorAll('.preview-qty-control').forEach(ctrl => {
        const minusBtn = ctrl.querySelector('.qty-minus');
        const plusBtn = ctrl.querySelector('.qty-plus');
        const valSpan = ctrl.querySelector('.qty-value');
        const name = valSpan.dataset.name;

        function syncButtons() {
            minusBtn.disabled = previewQuantities[name] <= 1;
            plusBtn.disabled = previewQuantities[name] >= MAX_QTY;
        }

        minusBtn.addEventListener('click', () => {
            if (previewQuantities[name] > 1) {
                previewQuantities[name]--;
                valSpan.textContent = previewQuantities[name];
                renderTotal();
                syncButtons();
            }
        });
        plusBtn.addEventListener('click', () => {
            if (previewQuantities[name] < MAX_QTY) {
                previewQuantities[name]++;
                valSpan.textContent = previewQuantities[name];
                renderTotal();
                syncButtons();
            }
        });

        syncButtons();
    });

    grid.querySelectorAll('.preview-remove').forEach(btn => {
        btn.addEventListener('click', () => {
            const name = btn.dataset.name;
            selected.delete(name);
            delete previewQuantities[name];
            document.querySelector(`.gallery-item[data-name='${CSS.escape(name)}']`)?.classList.remove('selected');
            btn.closest('.preview-card').remove();
            renderTotal();
            window.updateBar();
            if (selected.size === 0) overlay.classList.remove('active');
        });
    });

    renderTotal();

    freshBack.addEventListener('click', () => {
        overlay.classList.remove('active');
    });

    freshCont.addEventListener('click', () => {
        overlay.classList.remove('active');

        const summaryEl = document.getElementById('form-summary');
        if (summaryEl) {
            const n = selected.size;
            const total = calcTotal(previewQuantities);
            summaryEl.textContent = `${n} foto selezionat${n === 1 ? 'a' : 'e'} · Totale: €${total}`;
        }

        formOverlay.classList.add('active');
        formAlert.style.display = 'none';
        document.getElementById('form-nome').value = '';
        document.getElementById('form-telefono').value = '';
        document.getElementById('form-nome').focus();
    });

    overlay.classList.add('active');
    pendingPreview = { label: currentTipo, items: Array.from(selected) };

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.classList.remove('active');
    }, { once: true });
};

// ─── Modal de confirmación antes de WhatsApp ──────────────────────────────────
function openConfirmModal(onConfirm) {
    const modal = document.getElementById('confirm-modal');
    const yesBtn = document.getElementById('confirm-yes');
    const noBtn = document.getElementById('confirm-no');

    modal.classList.add('active');

    yesBtn.addEventListener('click', () => {
        modal.classList.remove('active');
        onConfirm();
    }, { once: true });

    noBtn.addEventListener('click', () => {
        modal.classList.remove('active');
    }, { once: true });
}

// ─── Carga de galería ─────────────────────────────────────────────────────────
async function loadGallery(tipo) {
    if (isLoading) return;
    currentTipo = tipo;

    tipoBtns.forEach(b => { b.classList.remove('active'); b.disabled = true; });
    const activeBtn = document.querySelector(`.tipo-btn[data-tipo="${tipo}"]`);
    if (activeBtn) activeBtn.classList.add('active');
    isLoading = true;

    if (successBanner) successBanner.style.display = 'none';

    gallerySection.classList.remove('hidden');
    galleryContainer.innerHTML = '<div class="gallery-loading">Caricamento foto…</div>';
    gallerySection.scrollIntoView({ behavior: 'smooth', block: 'start' });

    fotos = await discoverFotos(tipo, (n) => {
        galleryContainer.innerHTML = `<div class="gallery-loading">Caricate ${n} foto…</div>`;
    });

    tipoBtns.forEach(b => { b.disabled = false; });
    isLoading = false;

    if (fotos.length === 0) {
        galleryContainer.innerHTML =
            '<div class="gallery-loading">Nessuna foto disponibile al momento.</div>';
        selectionBar.classList.remove('visible');
    } else {
        renderGallery(tipo, fotos);
    }
}

// ─── Botones de categoría ─────────────────────────────────────────────────────
tipoBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
        const tipo = btn.dataset.tipo;
        loadGallery(tipo);
    });
});

// ─── Botón "Invia al fotografo" ───────────────────────────────────────────────
btnEnviar.addEventListener('click', () => {
    if (selected.size === 0) return;
    window.openPreviewOverlay();
});

// ─── Modal de formulario ──────────────────────────────────────────────────────
formCancel.addEventListener('click', () => {
    formOverlay.classList.remove('active');
});

formOverlay.addEventListener('click', (e) => {
    if (e.target === formOverlay) formOverlay.classList.remove('active');
});

formSubmit.addEventListener('click', () => {
    const nome = document.getElementById('form-nome').value.trim();
    const telefono = document.getElementById('form-telefono').value.trim();

    if (!nome || !telefono) {
        formAlert.textContent = 'Per favore, compila tutti i campi.';
        formAlert.style.display = 'block';
        return;
    }

    const digits = telefono.replace(/\D/g, '');
    if (digits.length < 7 || digits.length > 15) {
        formAlert.textContent = 'Inserisci un numero di telefono valido.';
        formAlert.style.display = 'block';
        return;
    }

    formOverlay.classList.remove('active');

    openConfirmModal(() => {
        const label = currentTipo === 'cresima' ? 'Cresima' : 'Comunione';
        const lines = Array.from(selected).map(n => {
            const q = previewQuantities[n] || 1;
            return `${n} x${q}`;
        });
        const total = calcTotal(previewQuantities);
        const lista = lines.join('\n- ');
        const comunioneNote = currentTipo === 'comunione'
            ? `\n(Le prime ${FREE_PRINTS_COMUNIONE} foto sono incluse nel pacchetto + ampliamento di gruppo)\n`
            : '';

        const msg =
            `Ciao! Sono ${nome}, il mio numero è ${telefono} ` +
            `e ho scelto le seguenti foto da stampare per la ${label}:\n\n` +
            `- ${lista}\n${comunioneNote}\n` +
            `Totale da pagare: €${total}\n\n` +
            `${PAYMENT_INFO}`;

        window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`, '_blank');

        resetAll();

        if (successBanner) {
            successBanner.style.display = 'flex';
            successBanner.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    });
});

document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    document.querySelectorAll('.form-overlay.active, #lightbox.active, #confirm-modal.active')
        .forEach(el => el.classList.remove('active'));
});
