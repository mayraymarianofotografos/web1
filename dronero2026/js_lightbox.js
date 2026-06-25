// ─── Lightbox para previsualización de imágenes ───────────────────────────────
// Integrado con el estado compartido en window.selected (definido en js.js o scarica.html)

let _lbLocalItems = [];
let _lbIndex      = 0;
let _lbImg        = null;
let _lbLightbox   = null;
let _lbSelect     = null;
let _lbDownload   = null;

document.addEventListener('DOMContentLoaded', () => {
    _lbLightbox = document.getElementById('lightbox');
    _lbImg      = document.getElementById('lb-img');
    _lbSelect   = document.getElementById('lb-select');
    _lbDownload = document.getElementById('lb-download');
    
    const lbClose   = document.getElementById('lb-close');
    const lbPrev    = document.getElementById('lb-prev');
    const lbNext    = document.getElementById('lb-next');
    const lbConfirm = document.getElementById('lb-confirm');

    if (!_lbLightbox) return;

    lbClose?.addEventListener('click', closeLightbox);

    lbPrev?.addEventListener('click', () => {
        _lbIndex = (_lbIndex - 1 + _lbLocalItems.length) % _lbLocalItems.length;
        refreshLightboxUI();
    });

    lbNext?.addEventListener('click', () => {
        _lbIndex = (_lbIndex + 1) % _lbLocalItems.length;
        refreshLightboxUI();
    });

    lbConfirm?.addEventListener('click', () => {
        if (!window.selected?.size) return;
        closeLightbox();
        if (typeof window.openPreviewOverlay === 'function') window.openPreviewOverlay();
    });

    // Botón Scarica — download forzato via fetch+blob (funziona su tutti i browser)
    _lbDownload?.addEventListener('click', async (e) => {
        e.stopPropagation();
        const it = _lbLocalItems[_lbIndex];
        if (!it) return;

        const origText = _lbDownload.innerHTML;
        _lbDownload.innerHTML = '⏳';
        _lbDownload.disabled = true;

        try {
            const res = await fetch(it.src, { cache: 'no-store' });
            if (!res.ok) throw new Error('fetch failed');
            const blob = await res.blob();
            const ext = (blob.type === 'image/webp') ? '.webp' : '.jpg';
            const name = it.src.split('/').pop().replace(/\.[^.]+$/, '') + ext;
            const blobUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = name;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setTimeout(() => URL.revokeObjectURL(blobUrl), 3000);
        } catch {
            const link = document.createElement('a');
            link.href = it.src;
            link.download = it.src.split('/').pop();
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }

        _lbDownload.innerHTML = origText;
        _lbDownload.disabled = false;
    });

    // Botón Stampa (Selección para WhatsApp)
    _lbSelect?.addEventListener('click', () => {
        const it = _lbLocalItems[_lbIndex];
        if (!it) return;

        const domItem = document.querySelector(`.gallery-item[data-name='${CSS.escape(it.name)}']`);

        if (window.selected?.has(it.name)) {
            window.selected.delete(it.name);
            domItem?.classList.remove('selected');
        } else {
            window.selected?.add(it.name);
            domItem?.classList.add('selected');
        }

        window.updateBar?.();
        refreshLightboxUI();
    });

    document.addEventListener('keydown', (e) => {
        if (!_lbLightbox || !_lbLightbox.classList.contains('active')) return;
        switch (e.key) {
            case 'ArrowLeft':
                _lbIndex = (_lbIndex - 1 + _lbLocalItems.length) % _lbLocalItems.length;
                refreshLightboxUI();
                break;
            case 'ArrowRight':
                _lbIndex = (_lbIndex + 1) % _lbLocalItems.length;
                refreshLightboxUI();
                break;
        }
    });

    // ── Swipe táctil ──────────────────────────────────────────────────────────
    let touchStartX = 0;

    _lbLightbox.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    _lbLightbox.addEventListener('touchend', (e) => {
        const diff = touchStartX - e.changedTouches[0].screenX;
        if (Math.abs(diff) < 50) return;
        _lbIndex = diff > 0
            ? (_lbIndex + 1) % _lbLocalItems.length
            : (_lbIndex - 1 + _lbLocalItems.length) % _lbLocalItems.length;
        refreshLightboxUI();
    }, { passive: true });

    _lbLightbox.addEventListener('click', (e) => {
        if (e.target === _lbLightbox) closeLightbox();
    });
});

// ─── Helpers internos ─────────────────────────────────────────────────────────
function closeLightbox() {
    if (_lbLightbox) _lbLightbox.classList.remove('active');
}

function refreshLightboxUI() {
    const it = _lbLocalItems[_lbIndex];
    if (!it) return;
    
    if (_lbImg) { 
        _lbImg.src = it.src; 
        _lbImg.alt = it.name || 'Immagine'; 
    }
    
    if (_lbSelect) {
        if (window.selected?.has(it.name)) {
            _lbSelect.innerHTML = '✓ Selezionata';
            _lbSelect.classList.add('selected');
        } else {
            _lbSelect.innerHTML = '🖨 Da Stampare';
            _lbSelect.classList.remove('selected');
        }
    }
    
    const next = _lbLocalItems[(_lbIndex + 1) % _lbLocalItems.length];
    if (next) { 
        const pre = new Image(); 
        pre.src = next.src; 
    }
}

// ─── API pública ──────────────────────────────────────────────────────────────
function openLightboxForIndex(index) {
    _lbLocalItems = window._currentGalleryItems || [];
    if (!_lbLocalItems.length) return;
    _lbIndex = index;
    if (_lbLightbox) _lbLightbox.classList.add('active');
    refreshLightboxUI();
}

window.openLightboxForIndex = openLightboxForIndex;
window.refreshLightboxUI    = refreshLightboxUI;
