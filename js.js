// PARTE 1: CÓDIGO BASE Y CONFIGURACIÓN DE CARRUSELES

// ==================== SISTEMA DE CARRUSEL UNIVERSAL ====================
// Este sistema maneja todas las secciones con el mismo comportamiento que HERO

class UniversalCarousel {
    constructor(config) {
        this.sectionSelector = config.sectionSelector;
        this.carouselSelector = config.carouselSelector;
        this.slideClass = config.slideClass;
        this.startIndex = config.startIndex || 0; // 0 para hero, 1 para el resto (texto)
        this.currentIndex = this.startIndex;
        
        this.section = document.querySelector(this.sectionSelector);
        if (!this.section) return;
        
        this.carousel = this.section.querySelector(this.carouselSelector);
        this.btnPrev = this.section.querySelector('.carousel-btn.prev');
        this.btnNext = this.section.querySelector('.carousel-btn.next');
        
        if (!this.carousel || !this.btnPrev || !this.btnNext) return;
        
        this.init();
    }
    
    init() {
        // Variables para detectar si el usuario está interactuando manualmente
        let isDragging = false;
        let startX = 0;
        let scrollLeft = 0;
        let hasUserInteracted = false;
        
        const markInteracted = () => { hasUserInteracted = true; };

        // Inicializar botones
        this.btnPrev.addEventListener('click', () => {
            markInteracted();
            this.prev();
        });
        this.btnNext.addEventListener('click', () => {
            markInteracted();
            this.next();
        });
        
        // Registrar interacción para no quitarle el control al usuario
        this.carousel.addEventListener('touchstart', markInteracted, { passive: true });
        this.carousel.addEventListener('wheel', markInteracted, { passive: true });
        this.carousel.addEventListener('scroll', markInteracted, { passive: true });
        
        // Mouse drag para desktop
        this.carousel.addEventListener('mousedown', (e) => {
            markInteracted();
            isDragging = true;
            startX = e.pageX - this.carousel.offsetLeft;
            scrollLeft = this.carousel.scrollLeft;
        });
        
        this.carousel.addEventListener('mouseleave', () => {
            isDragging = false;
        });
        
        this.carousel.addEventListener('mouseup', () => {
            isDragging = false;
        });
        
        this.carousel.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            e.preventDefault();
            const x = e.pageX - this.carousel.offsetLeft;
            const walk = (x - startX) * 2;
            this.carousel.scrollLeft = scrollLeft - walk;
        });

        // ==============================================================
        // NUEVO: Vigilante para auto-centrar mientras las imágenes cargan
        // ==============================================================
        if (window.ResizeObserver) {
            const track = this.carousel.firstElementChild;
            let resizeTimeout;
            
            this.resizeObserver = new ResizeObserver(() => {
                // Solo mantenemos el centrado forzado si el usuario NO ha tocado el carrusel
                if (hasUserInteracted || isDragging) return;
                
                clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout(() => {
                    // Re-centrar usando salto instantáneo ('auto') para que no se note
                    this.scrollToIndex(this.currentIndex, 'auto');
                }, 30);
            });
            
            if (track) {
                this.resizeObserver.observe(track);
            }
        }
    }
    
    getSlides() {
        return this.carousel.querySelectorAll(`.${this.slideClass}`);
    }
    
    scrollToIndex(index, behavior = 'smooth') {
        const slides = this.carousel.querySelectorAll(`.${this.slideClass}`);
        if (slides[index]) {
            this.currentIndex = index;
            const targetSlide = slides[index];

            // Calculamos el centro
            const offsetLeft = targetSlide.offsetLeft;
            const clientWidth = this.carousel.clientWidth;
            const slideWidth = targetSlide.clientWidth;

            const scrollTo = offsetLeft - (clientWidth / 2) + (slideWidth / 2);

            this.carousel.scrollTo({
                left: scrollTo,
                behavior: behavior // Usamos el comportamiento pasado (auto o smooth)
            });
        }
    }
    
    prev() {
        const slides = this.getSlides();
        if (slides.length === 0) return;
        
        this.currentIndex = (this.currentIndex - 1 + slides.length) % slides.length;
        this.scrollToIndex(this.currentIndex);
    }
    
    next() {
        const slides = this.getSlides();
        if (slides.length === 0) return;
        
        this.currentIndex = (this.currentIndex + 1) % slides.length;
        this.scrollToIndex(this.currentIndex);
    }
    
    resetToStart() {
        this.scrollToIndex(this.startIndex);
    }
}

// Instancias de carruseles - se inicializan después de cargar las imágenes
let carousels = {
    hero: null,
    preWedding: null,
    festa: null,
    postWedding: null,
    noi: null,
    documental: null,
    reportajes: null
};

// ==================== SISTEMA DE RESET AUTOMÁTICO DESPUÉS DE SCROLL ====================
// Resetea cada carrusel individualmente, 5 segundos después de que su sección
// haya desaparecido completamente de la pantalla.

const carouselResetConfig = [
    { key: 'preWedding',  sectionSelector: '.pre-wedding-section' },
    { key: 'festa',       sectionSelector: '.festa-section' },
    { key: 'postWedding', sectionSelector: '.post-wedding-section' },
    { key: 'noi',         sectionSelector: '.noi-section' },
    { key: 'documental',  sectionSelector: '.documental-section' },
    { key: 'reportajes',  sectionSelector: '.reportajes-section' },
];

// Mapa de timers individuales por carrusel
const resetTimers = {};

function isCompletelyOutOfView(el) {
    if (!el) return false;
    const rect = el.getBoundingClientRect();
    // La sección está completamente fuera si su bottom <= 0 (arriba) o su top >= viewport (abajo)
    return rect.bottom <= 0 || rect.top >= window.innerHeight;
}

window.addEventListener('scroll', () => {
    carouselResetConfig.forEach(({ key, sectionSelector }) => {
        const section = document.querySelector(sectionSelector);
        if (!section) return;

        if (isCompletelyOutOfView(section)) {
            // Sección fuera de pantalla: arrancar timer si no hay uno ya corriendo
            if (!resetTimers[key]) {
                resetTimers[key] = setTimeout(() => {
                    if (carousels[key]) carousels[key].resetToStart();
                    resetTimers[key] = null;
                }, 1500);
            }
        } else {
            // Sección visible: cancelar timer (el usuario volvió antes de los 5s)
            if (resetTimers[key]) {
                clearTimeout(resetTimers[key]);
                resetTimers[key] = null;
            }
        }
    });
}, { passive: true });

// ==================== TRADUCCIONES ====================
const translations = {
    it: {
        // ── HERO ──────────────────────────────────────────────────────────────
        subtitle: "Fotografiamo i momenti più belli delle famiglie fin dal loro matrimonio.",

        // ── PRE-MATRIMONIALE ──────────────────────────────────────────────────
        preWeddingTitle: "Fotografia<br>Pre-Matrimoniale",
        preWeddingText: "L'idea di questa sessione è semplicemente vivere un momento insieme, unico e sincero. Vogliamo catturare la spontaneità e la complicità che vi lega, mentre ci conosciamo e condividiamo idee, emozioni e momenti veri.\n\nSe vi va, potete scorrere e dare un'occhiata a quello che creiamo insieme.",

        // ── FESTA ─────────────────────────────────────────────────────────────
        festaTitle: "Fotografie<br>durante<br>l'Evento",
        festaText: "Il matrimonio è un giorno pieno di emozioni vere, sorrisi, abbracci e piccoli istanti che raccontano la vostra storia. Noi ci mettiamo accanto a voi per osservare, ridere, vivere quei momenti e trasformarli in immagini che parlano di voi, della vostra complicità e dell'amore che vi lega, così com'è, autentico e senza tempo.\n\nPotete scorrere e vedere come prende forma tutto questo.",

        // ── POST-MATRIMONIALE ─────────────────────────────────────────────────
        postWeddingTitle: "Fotografia<br>Post-Matrimoniale",
        postWeddingText: "Qualche tempo dopo il matrimonio, quando la vita è tornata alla normalità, ci prendiamo un momento tutto per voi. L'idea è tornare a vestirvi da sposi, senza paura di sporcarvi e divertirvi al massimo, mentre vi catturiamo in un posto bello per fare foto.\n\nSe vi va, potete scorrere e vedere com'è vivere questo momento con noi.",

        // ── REPORTAGE ─────────────────────────────────────────────────────────
        reportajesTitle: "Reportage Completi",
        reportajesText: "Ogni coppia è speciale e unica, e ogni matrimonio ha la sua storia da raccontare. Vi portiamo con noi in quei momenti veri, che raccontano l'amore così com'è. Scorri per scoprire le giornate dall'inizio alla fine e clicca sulle foto per immergerti completamente in ogni racconto.",

        // ── DOCUMENTAL ────────────────────────────────────────────────────────
        documentalTitle: "Documental<br>Familiar",
        documentalText: "Raccontiamo la vostra famiglia così com'è, senza filtri. Dai momenti di tutti i giorni a quelli che contano di più. Complicità e piccole emozioni che rendono unica la vostra storia.\n\nPotete scorrere e entrare un po' nella vita di queste famiglie.",

        // ── MONTAGGIO (sección comentada, se mantiene por si se reactiva) ─────
        montaggioTitle: "<span>MONTAGGIO</span><br>SERALE<br><small>(OMAGGIO)</small>",
        montaggioText: "Arrivati alla fine della festa, riviviamo insieme i momenti più belli della giornata. Voi e i vostri ospiti potrete vedervi festeggiare in un video di foto montato durante l'evento e proiettato alla fine. Un regalo speciale che vi faremo per chiudere il giorno con ancora più magia.",
        montaggioBtn: "▶ Guarda il Video",

        // ── NOI ───────────────────────────────────────────────────────────────
        noiTitle: "Su di Noi",
        noiText1: "Forse bisognerebbe dire che ci siamo conosciuti quando avevamo 16 anni, e da allora abbiamo camminato insieme. Forse perché a entrambi piacciono la musica, il disegno, il cinema, le serie e le fotografie, o forse perché siamo tanto simili quanto diversi… sì… forse è questo. Perché guardiamo tutto da due punti di vista diversi: quando uno vede nuvole bellissime, l'altro vede il sole debole che filtra tra gli alberi; quando uno guarda i sorrisi, l'altro guarda gli occhi, o i capelli, o le mani; perché quando stiamo fotografando una coppia, uno cura i dettagli del vestito o dei capelli, mentre l'altro osserva le luci sui muri o sul fiume. È uno dei due quello che capisce di più delle cose \"da ragazze\", mentre l'altro, più goffo, la fa sorridere con qualche commento.",
        noiScroll: "Continua ->",
        noiText2: "Sì, forse è per questo. Perché siamo in due… che siamo uno. Forse è per tutti questi anni d'amore che abbiamo deciso di fotografare la vita, perché sappiamo che ogni momento che passiamo insieme è speciale, e che è la somma di tutti questi a scrivere la nostra storia. Ogni risata, passeggiata, carezza, bacio, amici… ognuno di questi dettagli è ciò che raccontiamo nelle nostre fotografie.",

        // ── TESTIMONIOS ───────────────────────────────────────────────────────
        testimoniosTitle: "Le Nostre Recensioni",
        testimoniosText: "Leggi le opinioni più recenti delle coppie che hanno affidato a noi il loro giorno più bello.",

        // ── CONTACTO ──────────────────────────────────────────────────────────
        contactTitle: "Contatti & Prenotazioni",
        contactText: "Siamo pronti ad ascoltare la vostra storia. Contattateci e raccontateci il vostro giorno.",
        contactBtn: "Richiedi un Preventivo su WhatsApp",

        // ── GENERALES ─────────────────────────────────────────────────────────
        scrollIndicator: "scorri per vedere le foto",
        scrollIndicatorReportajes: "scorri per vedere le foto",

        // ── MODAL ─────────────────────────────────────────────────────────────
        modalTitle: "Richiedi un preventivo",
        modalName: "Nome e Cognome",
        modalNamePlaceholder: "Il tuo nome completo",
        modalDate: "Data del matrimonio",
        modalDatePlaceholder: "gg/mm/aaaa",
        modalLocation: "Luogo del matrimonio",
        modalLocationPlaceholder: "Città o location",
        modalSend: "Invia",
        modalClose: "Chiudi",
        modalAlert: "Per favore, compila tutti i campi obbligatori.",
        whatsappMessage: "Ciao! 😊 Mi chiamo {name} e il mio matrimonio sarà il giorno {date} a {location}. Vorrei ricevere un preventivo. Grazie mille!"
    },
    es: {
        // ── HERO ──────────────────────────────────────────────────────────────
        subtitle: "Fotografiamos los momentos más bellos de las familias desde su boda.",

        // ── PRE-BODA ──────────────────────────────────────────────────────────
        preWeddingTitle: "Fotografía<br>Pre-Boda",
        preWeddingText: "La idea de esta sesión es simplemente vivir un momento juntos, único y sincero. Queremos capturar la espontaneidad y la complicidad que os une, mientras nos conocemos y compartimos ideas, emociones y momentos reales.\n\nSi os apetece, podéis deslizar y echar un vistazo a lo que creamos juntos.",

        // ── FESTA ─────────────────────────────────────────────────────────────
        festaTitle: "Fotografías<br>durante<br>el Evento",
        festaText: "La boda es un día lleno de emociones reales, sonrisas, abrazos y pequeños instantes que cuentan vuestra historia. Nosotros nos ponemos a vuestro lado para observar, reír, vivir esos momentos y transformarlos en imágenes que hablan de vosotros, de vuestra complicidad y del amor que os une, tal como es, auténtico y eterno.\n\nPodéis deslizar y ver cómo toma forma todo esto.",

        // ── POST-BODA ─────────────────────────────────────────────────────────
        postWeddingTitle: "Fotografía<br>Post-Boda",
        postWeddingText: "Algún tiempo después de la boda, cuando la vida ha vuelto a la normalidad, nos tomamos un momento solo para vosotros. La idea es volver a vestiros de novios, sin miedo a ensuciaros y disfrutar al máximo, mientras os capturamos en un lugar bonito para hacer fotos.\n\nSi os apetece, podéis deslizar y ver cómo es vivir este momento con nosotros.",

        // ── REPORTAJES ────────────────────────────────────────────────────────
        reportajesTitle: "Reportajes Completos",
        reportajesText: "Cada pareja es especial y única, y cada boda tiene su historia que contar. Os llevamos con nosotros a esos momentos reales, que cuentan el amor tal como es. Desliza para descubrir las jornadas de principio a fin y haz clic en las fotos para sumergirte completamente en cada historia.",

        // ── DOCUMENTAL ────────────────────────────────────────────────────────
        documentalTitle: "Documental<br>Familiar",
        documentalText: "Contamos vuestra familia tal como es, sin filtros. Desde los momentos del día a día hasta los que más importan. Complicidad y pequeñas emociones que hacen única vuestra historia.\n\nPodéis deslizar y entrar un poco en la vida de estas familias.",

        // ── MONTAGGIO ─────────────────────────────────────────────────────────
        montaggioTitle: "<span>MONTAJE</span><br>NOCTURNO<br><small>(REGALO)</small>",
        montaggioText: "Al llegar al final de la fiesta, revivimos juntos los momentos más bellos del día. Vosotros y vuestros invitados podréis veros celebrando en un video de fotos montado durante el evento y proyectado al final. Un regalo especial que os haremos para cerrar el día con aún más magia.",
        montaggioBtn: "▶ Ver el Video",

        // ── NOI ───────────────────────────────────────────────────────────────
        noiTitle: "Sobre Nosotros",
        noiText1: "Quizás habría que decir que nos conocimos cuando teníamos 16 años, y desde entonces hemos caminado juntos. Quizás porque a los dos nos gustan la música, el dibujo, el cine, las series y las fotografías, o quizás porque somos tan similares como diferentes… sí… quizás es eso. Porque miramos todo desde dos puntos de vista distintos: cuando uno ve nubes hermosas, el otro ve el sol débil que se filtra entre los árboles; cuando uno mira las sonrisas, el otro mira los ojos, o el pelo, o las manos; porque cuando estamos fotografiando a una pareja, uno cuida los detalles del vestido o del pelo, mientras el otro observa las luces en las paredes o en el río. Es uno de los dos el que entiende más de las cosas \"de chicas\", mientras el otro, más torpe, la hace sonreír con algún comentario.",
        noiScroll: "Continúa ->",
        noiText2: "Sí, quizás es por eso. Porque somos dos… que somos uno. Quizás es por todos estos años de amor que decidimos fotografiar la vida, porque sabemos que cada momento que pasamos juntos es especial, y que es la suma de todos estos la que escribe nuestra historia. Cada risa, paseo, caricia, beso, amigos… cada uno de estos detalles es lo que contamos en nuestras fotografías.",

        // ── TESTIMONIOS ───────────────────────────────────────────────────────
        testimoniosTitle: "Nuestras Reseñas",
        testimoniosText: "Lee las opiniones más recientes de las parejas que nos confiaron su día más especial.",

        // ── CONTACTO ──────────────────────────────────────────────────────────
        contactTitle: "Contacto & Reservas",
        contactText: "Estamos listos para escuchar vuestra historia. Contactadnos y contadnos vuestro día.",
        contactBtn: "Solicitar Presupuesto por WhatsApp",

        // ── GENERALES ─────────────────────────────────────────────────────────
        scrollIndicator: "desliza para ver las fotos",
        scrollIndicatorReportajes: "desliza para ver las fotos",

        // ── MODAL ─────────────────────────────────────────────────────────────
        modalTitle: "Solicitar presupuesto",
        modalName: "Nombre y Apellido",
        modalNamePlaceholder: "Tu nombre completo",
        modalDate: "Fecha de la boda",
        modalDatePlaceholder: "dd/mm/aaaa",
        modalLocation: "Lugar de la boda",
        modalLocationPlaceholder: "Ciudad o ubicación",
        modalSend: "Enviar",
        modalClose: "Cerrar",
        modalAlert: "Por favor, completa todos los campos obligatorios.",
        whatsappMessage: "¡Hola! 😊 Me llamo {name} y mi boda será el día {date} en {location}. Quisiera recibir un presupuesto. ¡Muchas gracias!"
    },
    en: {
        // ── HERO ──────────────────────────────────────────────────────────────
        subtitle: "We photograph the most beautiful moments of families from their wedding day.",

        // ── PRE-WEDDING ───────────────────────────────────────────────────────
        preWeddingTitle: "Pre-Wedding<br>Photography",
        preWeddingText: "The idea behind this session is simply to share a moment together, unique and sincere. We want to capture the spontaneity and the connection that binds you, as we get to know each other and share ideas, emotions and real moments.\n\nFeel free to scroll and take a look at what we create together.",

        // ── FESTA ─────────────────────────────────────────────────────────────
        festaTitle: "Photography<br>During<br>the Event",
        festaText: "Your wedding day is filled with real emotions, smiles, hugs and small instants that tell your story. We stand by your side to observe, laugh and live those moments — turning them into images that speak of you, your connection and the love that binds you, just as it is, authentic and timeless.\n\nScroll and see how all of this comes together.",

        // ── POST-WEDDING ──────────────────────────────────────────────────────
        postWeddingTitle: "Post-Wedding<br>Photography",
        postWeddingText: "Some time after the wedding, when life has returned to normal, we take a moment that is just for you. The idea is to dress up as bride and groom again, without worrying about getting dirty, having the most fun, while we capture you in a beautiful location.\n\nFeel free to scroll and see what it is like to live this moment with us.",

        // ── REPORTAGES ────────────────────────────────────────────────────────
        reportajesTitle: "Complete Reportages",
        reportajesText: "Every couple is special and unique, and every wedding has its own story to tell. We take you with us into those real moments that capture love just as it is. Scroll to discover each wedding day from beginning to end and click on the photos to fully immerse yourself in every story.",

        // ── DOCUMENTARY ───────────────────────────────────────────────────────
        documentalTitle: "Family<br>Documentary",
        documentalText: "We tell your family's story just as it is, unfiltered. From everyday moments to the ones that matter most. Complicity and small emotions that make your story unique.\n\nScroll and step into the lives of these families for a moment.",

        // ── MONTAGGIO ─────────────────────────────────────────────────────────
        montaggioTitle: "<span>EVENING</span><br>SLIDESHOW<br><small>(COMPLIMENTARY)</small>",
        montaggioText: "As the party comes to an end, we relive together the most beautiful moments of the day. You and your guests will be able to see yourselves celebrating in a photo video assembled during the event and projected at the end. A special gift to close the day with even more magic.",
        montaggioBtn: "▶ Watch the Video",

        // ── ABOUT US ──────────────────────────────────────────────────────────
        noiTitle: "About Us",
        noiText1: "Perhaps it should be said that we met when we were 16 years old, and since then we have walked together. Maybe because we both love music, drawing, cinema, series and photography, or maybe because we are as similar as we are different… yes… maybe that is it. Because we look at everything from two different points of view: when one sees beautiful clouds, the other sees the faint sun filtering through the trees; when one looks at smiles, the other looks at eyes, or hair, or hands; because when we are photographing a couple, one takes care of the details of the dress or the hair, while the other observes the light on the walls or on the river. It is one of the two who understands more about \"girl things\", while the other, clumsier, makes her smile with some comment.",
        noiScroll: "Continue ->",
        noiText2: "Yes, maybe that is why. Because we are two… who are one. Maybe it is for all these years of love that we decided to photograph life, because we know that every moment we spend together is special, and that it is the sum of all of these that writes our story. Every laugh, walk, caress, kiss, friends… each of these details is what we tell in our photographs.",

        // ── REVIEWS ───────────────────────────────────────────────────────────
        testimoniosTitle: "Our Reviews",
        testimoniosText: "Read the most recent opinions of the couples who entrusted us with their most beautiful day.",

        // ── CONTACT ───────────────────────────────────────────────────────────
        contactTitle: "Contact & Bookings",
        contactText: "We are ready to listen to your story. Get in touch and tell us about your day.",
        contactBtn: "Request a Quote on WhatsApp",

        // ── GENERAL ───────────────────────────────────────────────────────────
        scrollIndicator: "scroll to see the photos",
        scrollIndicatorReportajes: "scroll to see the photos",

        // ── MODAL ─────────────────────────────────────────────────────────────
        modalTitle: "Request a quote",
        modalName: "Full Name",
        modalNamePlaceholder: "Your full name",
        modalDate: "Wedding Date",
        modalDatePlaceholder: "mm/dd/yyyy",
        modalLocation: "Wedding Location",
        modalLocationPlaceholder: "City or venue",
        modalSend: "Send",
        modalClose: "Close",
        modalAlert: "Please fill in all required fields.",
        whatsappMessage: "Hello! 😊 My name is {name} and my wedding will be on {date} in {location}. I would like to receive a quote. Thank you very much!"
    }
};

let currentLang = localStorage.getItem('site-language') || 'it';
const langBtn = document.getElementById('current-lang');
const langDropdown = document.getElementById('lang-dropdown');
const langOptions = document.querySelectorAll('.language-option');

if (langBtn && langDropdown) {
    langBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        langDropdown.classList.toggle('show');
    });
    document.addEventListener('click', () => {
        langDropdown.classList.remove('show');
    });
    langOptions.forEach(option => {
        option.addEventListener('click', (e) => {
            e.stopPropagation();
            const selectedLang = option.dataset.lang;
            if (selectedLang !== currentLang) {
                currentLang = selectedLang;
                localStorage.setItem('site-language', selectedLang);
                updateLanguage(selectedLang);
                const flagImg = langBtn.querySelector('.flag-icon');
                flagImg.src = option.querySelector('.flag-icon').src;
                flagImg.alt = option.querySelector('.flag-icon').alt;
                updateDropdownOptions();
            }
            langDropdown.classList.remove('show');
        });
    });
}

function updateDropdownOptions() {
    langOptions.forEach(option => {
        if (option.dataset.lang === currentLang) {
            option.style.display = 'none';
        } else {
            option.style.display = 'flex';
        }
    });
}

function updateLanguage(lang) {
    const t = translations[lang];

    // HERO
    document.querySelector('.subtitle').textContent = t.subtitle;

    // PRE-MATRIMONIALE
    const preText = document.querySelector('.pre-wedding-text');
    if (preText) {
        preText.querySelector('h2').innerHTML = t.preWeddingTitle;
        preText.querySelector('p:not(.scroll-indicator)').textContent = t.preWeddingText;
        preText.querySelector('.scroll-indicator').textContent = t.scrollIndicator;
    }

    // FESTA
    const festaText = document.querySelector('.festa-text');
    if (festaText) {
        festaText.querySelector('h2').innerHTML = t.festaTitle;
        festaText.querySelector('p:not(.scroll-indicator)').textContent = t.festaText;
        festaText.querySelector('.scroll-indicator').textContent = t.scrollIndicator;
    }

    // POST-MATRIMONIALE
    const postText = document.querySelector('.post-wedding-text');
    if (postText) {
        postText.querySelector('h2').innerHTML = t.postWeddingTitle;
        postText.querySelector('p:not(.scroll-indicator)').textContent = t.postWeddingText;
        postText.querySelector('.scroll-indicator').textContent = t.scrollIndicator;
    }

    // REPORTAGE
    const reportajeBlock = document.querySelector('.reportaje-text-block');
    if (reportajeBlock) {
        reportajeBlock.querySelector('.section-title').textContent = t.reportajesTitle;
        reportajeBlock.querySelector('.description-text').textContent = t.reportajesText;
        reportajeBlock.querySelector('.scroll-indicator').textContent = t.scrollIndicatorReportajes;
    }

    // DOCUMENTAL
    const documentalText = document.querySelector('.documental-text');
    if (documentalText) {
        documentalText.querySelector('h2').innerHTML = t.documentalTitle;
        documentalText.querySelector('p:not(.scroll-indicator)').textContent = t.documentalText;
        documentalText.querySelector('.scroll-indicator').textContent = t.scrollIndicator;
    }

    // MONTAGGIO (sección comentada — se actualiza solo si existe en el DOM)
    const montaggioContent = document.querySelector('.montaggio-content');
    if (montaggioContent) {
        montaggioContent.querySelector('h2').innerHTML = t.montaggioTitle;
        montaggioContent.querySelector('p').textContent = t.montaggioText;
        const playBtn = document.querySelector('.play-video-btn');
        if (playBtn) playBtn.innerHTML = t.montaggioBtn;
    }

    // NOI
    const noiText1El = document.querySelector('.noi-text-1');
    if (noiText1El) {
        noiText1El.querySelector('h2').textContent = t.noiTitle;
        noiText1El.querySelector('p:not(.scroll-indicator)').textContent = t.noiText1;
        const noiScroll = noiText1El.querySelector('.scroll-indicator');
        if (noiScroll) noiScroll.textContent = t.noiScroll;
    }
    const noiText2El = document.querySelector('.noi-text-2');
    if (noiText2El) {
        noiText2El.querySelector('p').textContent = t.noiText2;
    }

    // TESTIMONIOS
    const testimoniosTitle = document.querySelector('.testimonials-section .section-title');
    if (testimoniosTitle) testimoniosTitle.textContent = t.testimoniosTitle;
    const testimoniosText = document.querySelector('.testimonials-section .description-text');
    if (testimoniosText) testimoniosText.textContent = t.testimoniosText;

    // CONTACTO
    const contactTitle = document.querySelector('.contact-section .section-title');
    if (contactTitle) contactTitle.textContent = t.contactTitle;
    const contactText = document.querySelector('.contact-section .description-text');
    if (contactText) contactText.textContent = t.contactText;
    const contactBtn = document.querySelector('.primary-contact');
    if (contactBtn) contactBtn.textContent = t.contactBtn;

    document.documentElement.lang = lang;
}

window.addEventListener('DOMContentLoaded', () => {
    updateLanguage(currentLang);
    const flagUrls = {
        it: 'https://flagcdn.com/w40/it.png',
        es: 'https://flagcdn.com/w40/es.png',
        en: 'https://flagcdn.com/w40/gb.png'
    };
    if (langBtn) {
        const flagImg = langBtn.querySelector('.flag-icon');
        flagImg.src = flagUrls[currentLang];
        updateDropdownOptions();
    }
});

// ==================== MODAL Y BOTONES ====================
const contactButtons = document.querySelectorAll('.contact-btn.primary-contact');
contactButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        openContactModal('whatsapp');
    });
});

function openContactModal(platform) {
    if (document.querySelector('.contact-modal')) return;
    const t = translations[currentLang];
    const modal = document.createElement("div");
    modal.className = "contact-modal";
    modal.innerHTML = `
        <div class="contact-modal-backdrop"></div>
        <div class="contact-modal-content" role="dialog" aria-modal="true">
            <button class="contact-modal-close" aria-label="${t.modalClose}">✕</button>
            <h3>${t.modalTitle}</h3>
            <label for="contact-name">${t.modalName}</label>
            <input type="text" id="contact-name" placeholder="${t.modalNamePlaceholder}" />
            <label for="contact-date">${t.modalDate}</label>
            <input type="text" id="contact-date" placeholder="${t.modalDatePlaceholder}" />
            <label for="contact-location">${t.modalLocation}</label>
            <input type="text" id="contact-location" placeholder="${t.modalLocationPlaceholder}" />
            <div class="contact-buttons">
                <button id="send-contact" class="btn-primary">${t.modalSend}</button>
                <button id="close-contact" class="btn-secondary">${t.modalClose}</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    const closeButtons = modal.querySelectorAll('.contact-modal-close, #close-contact, .contact-modal-backdrop');
    closeButtons.forEach(b => b.addEventListener('click', () => modal.remove()));
    modal.querySelector('#send-contact').addEventListener('click', () => {
        const name = modal.querySelector("#contact-name").value.trim();
        const date = modal.querySelector("#contact-date").value.trim();
        const location = modal.querySelector("#contact-location").value.trim();
        if (!name || !date || !location) {
            alert(t.modalAlert);
            return;
        }
        const msg = encodeURIComponent(t.whatsappMessage.replace('{name}', name).replace('{date}', date).replace('{location}', location));
        window.open(`https://wa.me/393481143529?text=${msg}`, "_blank");
        modal.remove();
    });
    modal.querySelector('#contact-name').focus();
}

// ==================== GENERACIÓN DE IMÁGENES HERO ====================
// Cantidades conocidas — sin fetch de verificación
const IMAGE_COUNTS = {
    hero:              189,
    festa:             392,
    documental:        202,
    noi:                 3,
    postMatrimoniale:   23,
    preMatrimoniale:   309
};

function generateHeroImages() {
    const heroTrack = document.querySelector('.hero-track');
    if (!heroTrack) return;

    const total = IMAGE_COUNTS.hero;

    // Generar array [1..total], mezclar y construir slides
    const indices = Array.from({ length: total }, (_, i) => i + 1);
    indices.sort(() => Math.random() - 0.5);

    indices.forEach((i, arrayIndex) => {
        const imageUrl = `images/hero/hero (${i}).webp`;
        const figure = document.createElement('figure');
        figure.className = 'hero-slide hero-photo';
        const loadingAttr = arrayIndex === 0
            ? 'loading="eager" fetchpriority="high"'
            : 'loading="lazy"';
        figure.innerHTML = `<img src="${imageUrl}" alt="Fotografia matrimonio Cuneo ${i}" ${loadingAttr}>`;
        heroTrack.appendChild(figure);
    });

    console.log(`✅ Hero: ${total} imágenes generadas`);

    // Inicializar carrusel HERO (empieza en índice 0)
    carousels.hero = new UniversalCarousel({
        sectionSelector: '.hero-section',
        carouselSelector: '.hero-carousel',
        slideClass: 'hero-slide',
        startIndex: 0
    });

    if (carousels.hero) {
        carousels.hero.scrollToIndex(0);
    }
}

generateHeroImages();

// ==================== VIDEO MONTAGGIO ====================
const playBtn = document.querySelector(".play-video-btn");
const overlay = document.getElementById("video-overlay");
const video = document.getElementById("montaggio-video");
const closeBtn = document.getElementById("close-video-btn");

if (playBtn) {
    playBtn.addEventListener("click", () => {
        const videoSrc = window.innerWidth < 768 ? "videos/montaggio-mobile.mp4" : "videos/montaggio-desktop.mp4";
        video.src = videoSrc;
        overlay.classList.add("visible");
        document.body.classList.add("fade-to-black");
        document.body.style.overflow = "hidden";
        setTimeout(() => video.play(), 800);
    });
}

const closeVideo = () => {
    if (video) { video.pause(); video.currentTime = 0; }
    if (overlay) overlay.classList.remove("visible");
    document.body.classList.remove("fade-to-black");
    document.body.style.overflow = "auto";
};

if (video) video.addEventListener("ended", closeVideo);
if (closeBtn) closeBtn.addEventListener("click", closeVideo);

// ==================== VIDEO INTRO ====================
document.addEventListener('DOMContentLoaded', function () {
    const overlayIntro = document.getElementById('intro-overlay');
    const contenidoPrincipal = document.getElementById('contenido-principal');
    const videoEscritorio = document.getElementById('video-escritorio');
    const videoMovil = document.getElementById('video-movil');
    if (!overlayIntro || !contenidoPrincipal || (!videoEscritorio && !videoMovil)) return;
    const esMovil = window.innerWidth < 768;
    let videoATocar = esMovil ? videoMovil : videoEscritorio;
    if (esMovil) {
        if (videoEscritorio) videoEscritorio.style.display = 'none';
        if (videoMovil) videoMovil.style.display = 'block';
    } else {
        if (videoMovil) videoMovil.style.display = 'none';
        if (videoEscritorio) videoEscritorio.style.display = 'block';
    }
    if (!videoATocar) {
        overlayIntro.style.display = 'none';
        return;
    }
    videoATocar.addEventListener('loadedmetadata', () => {
        videoATocar.play().catch(error => {
            console.error("Autoplay falló:", error);
            iniciarTransicion();
        });
    });
    videoATocar.addEventListener('ended', iniciarTransicion);

    function iniciarTransicion() {
        overlayIntro.style.transition = 'opacity 1s ease-out';
        overlayIntro.style.opacity = '0';
        setTimeout(() => {
            overlayIntro.style.visibility = 'hidden';
            overlayIntro.style.display = 'none';
        }, 1000);
    }
    videoATocar.load();
});

// ==================== REPORTAJES ====================
document.addEventListener('DOMContentLoaded', () => {
    const reportajesTrack = document.querySelector('.reportajes-track');
    if (!reportajesTrack) return;

    const maxReportajes = 13;
    const maxFotos = 200;
    const baseFolder = "reportajes/";

    // ─────────────────────────────────────────────────────────────
    // CONFIGURA AQUÍ los textos y el color del título de cada boda.
    // titleColor: cualquier valor CSS válido (#hex, rgb, hsl, etc.)
    // ─────────────────────────────────────────────────────────────
    const reportageTexts = [
        { title: "Moni e Arturo",     subtitle: "Qui, là e dappertutto 🇮🇹 ❤️🇲🇽",    titleColor: "#f3e246ff" },
        { title: "Alice e Pierric",     subtitle: "Tra le tue braccia ho trovato il mio posto preferito (Alice)",        titleColor: "#fdfdfdff" },
        { title: "Chiara e Francesco",     subtitle: "Finché si è vivi, bisogna amare il più possibile.",       titleColor: "#ffcfb3ff" },
        { title: "Cristina e Nico",      subtitle: "Non so chi ha creato il mondo, ma so che era innamorato.",    titleColor: "#c6f4c2d3" },
        { title: "Chry e France",       subtitle: "Non importa dove, se siamo insieme.",               titleColor: "#e0d426ff" },
        { title: "Emanuela e Paolo",    subtitle: "Stare con te o non stare con te è la misura del mio tempo.",         titleColor: "#f4d4c2" },
        { title: "Giorgia e Fede",   subtitle: "Lasciami vedere la luna nel tuo sguardo.",            titleColor: "#ffffffff" },
        { title: "Ilaria e Marco",     subtitle: "Sono tuo perché lo scelgo.",         titleColor: "#f4f0c2" },
        { title: "Alina e Giovanni",     subtitle: "Ci sto benissimo tra le tue braccia.",               titleColor: "#c2e4f4" },
        { title: "Sabri e Ale", subtitle: "Ma se non deliro con te, con chi sarà?",           titleColor: "#f4c2e0" },
        { title: "Daniela e Paolo",    subtitle: "Che i tuoi occhi continuino a essere la mia casa.",   titleColor: "#d4f4c2" },
        { title: "Sabri e Lucca",             subtitle: "Mi basta che tu sia nel mondo.",            titleColor: "#f4e6c2" },
        { title: "Cris e Alberto",             subtitle: "Il cielo di averti mi sembra una fantasia.",            titleColor: "#c2d4f4" }
    ];

    // Modal
    const modal = document.getElementById('reportaje-modal');
    const modalFotos = modal ? modal.querySelector('.modal-fotos') : null;
    const modalClose = modal ? modal.querySelector('.modal-close') : null;
    const modalBackdrop = modal ? modal.querySelector('.modal-backdrop') : null;

    // Modal - ahora recibe la carpeta y carga las fotos en el momento del click
    function openModal(folder, title) {
        if (!modalFotos || !modal) return;
        // Mostrar loading inmediatamente
        modalFotos.innerHTML = `<p style="color:white;text-align:center;padding:3rem;font-family:sans-serif;">Caricamento galleria…</p>`;
        modal.classList.add("visible");
        document.body.style.overflow = "hidden";
        modalFotos.scrollTop = 0;

        // Cargar fotos ahora (solo cuando el usuario las pide)
        (async () => {
            const fotos = [];
            for (let f = 1; f <= maxFotos; f++) {
                const url = await loadImageWithFallback(`${folder}rep (${f})`);
                if (url) fotos.push(url);
                else break;
            }
            // Si el modal ya fue cerrado antes de que terminara, no insertar nada
            if (!modal.classList.contains("visible")) return;
            modalFotos.innerHTML = "";
            fotos.forEach(url => {
                const img = document.createElement("img");
                img.src = url;
                img.loading = 'lazy';
                img.alt = title;
                const fig = document.createElement("figure");
                fig.appendChild(img);
                modalFotos.appendChild(fig);
            });
        })();
    }

    function closeModal() {
        if (!modal) return;
        modal.classList.remove("visible");
        if (modalFotos) modalFotos.innerHTML = "";
        document.body.style.overflow = "auto";
    }

    if (modalClose) modalClose.addEventListener("click", closeModal);
    if (modalBackdrop) modalBackdrop.addEventListener("click", closeModal);
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && modal && modal.classList.contains("visible")) closeModal();
    });

    // Carga SOLO la portada (las fotos del modal se cargan al hacer click)
    async function checkReportajePhotos(r) {
        const folder = `${baseFolder}boda ${r}/`;

        // Buscar portada con múltiples extensiones
        const extensions = ['webp', 'jpg', 'jpeg', 'png'];
        let portadaUrl = null;
        for (const ext of extensions) {
            try {
                const res = await fetch(`${folder}portada.${ext}`, { method: 'HEAD' });
                if (res.ok) { portadaUrl = `${folder}portada.${ext}`; break; }
            } catch (e) { /* continuar */ }
        }

        // Si no hay portada, la carpeta no existe o está incompleta
        if (!portadaUrl) return null;

        // Las fotos del modal se cargarán solo cuando el usuario haga click
        return { r, portadaUrl, folder };
    }

    const allPromises = [];
    for (let r = 1; r <= maxReportajes; r++) {
        allPromises.push(checkReportajePhotos(r));
    }

    Promise.all(allPromises).then((results) => {
        const reportajesTextSlide = reportajesTrack.querySelector('.reportaje-text-block');
        const validReportajes = results.filter(r => r !== null);
        validReportajes.sort((a, b) => a.r - b.r);

        validReportajes.forEach(({ portadaUrl, folder, r }, arrayIndex) => {
            const slideMeta = reportageTexts[arrayIndex] || { title: `Matrimonio ${r}`, subtitle: "La Vostra Storia", titleColor: "#f4e6c2" };

            const figure = document.createElement('figure');
            figure.className = 'reportaje-slide reportaje-foto-slide';
            figure.innerHTML = `
                <img src="${portadaUrl}" alt="Reportage matrimonio completo ${r}" loading="lazy">
                <div class="reportaje-title-overlay">
                    <h3 class="reportaje-titulo" style="color: ${slideMeta.titleColor}">${slideMeta.title}</h3>
                    <p class="reportaje-subtitulo">${slideMeta.subtitle}</p>
                </div>
                <div class="reportaje-hover-overlay">
                    <div class="reportaje-hover-content">
                        <i class="fa fa-images"></i>
                        <span>Vedi Galleria Completa</span>
                    </div>
                </div>
            `;

            figure.addEventListener('click', () => openModal(folder, slideMeta.title));

            if (arrayIndex === 0) {
                reportajesTrack.insertBefore(figure, reportajesTextSlide);
            } else {
                reportajesTrack.appendChild(figure);
            }
        });

        console.log(`✅ Reportajes: ${validReportajes.length} bodas cargadas`);

        carousels.reportajes = new UniversalCarousel({
            sectionSelector: '.reportajes-section',
            carouselSelector: '.reportajes-carousel',
            slideClass: 'reportaje-slide',
            startIndex: 1
        });

        // Posicionar instantáneamente y revelar en el mismo frame (sin flash)
        requestAnimationFrame(() => {
            if (carousels.reportajes) {
                carousels.reportajes.scrollToIndex(1, 'auto');
                const el = document.querySelector('.reportajes-carousel');
                if (el) el.classList.add('carousel-ready');
            }
        });
    });
});

// ==================== FUNCIONES AUXILIARES ====================
function loadImageWithFallback(basePath) {
    return new Promise(async (resolve) => {
        const webpUrl = `${basePath}.webp`;
        try {
            // Eliminamos el signal: AbortSignal para que Netlify tenga tiempo de responder
            const response = await fetch(webpUrl, { method: 'HEAD' }); 
            if (response.ok) {
                resolve(webpUrl);
            } else {
                resolve(null);
            }
        } catch (e) {
            resolve(null);
        }
    });
}

// ==================== CARGA DIRECTA DE IMÁGENES (sin fetch) ====================
// Las cantidades exactas se definen en IMAGE_COUNTS al inicio del archivo.
// Se genera directamente el array de rutas y se insertan en el DOM;
// el browser carga cada imagen con lazy loading cuando la necesita.

function buildShuffledIndices(total) {
    const arr = Array.from({ length: total }, (_, i) => i + 1);
    arr.sort(() => Math.random() - 0.5);
    return arr;
}

function buildShuffledIndicesExcluding(total, fixed) {
    const arr = Array.from({ length: total }, (_, i) => i + 1).filter(i => i !== fixed);
    arr.sort(() => Math.random() - 0.5);
    return arr;
}

document.addEventListener('DOMContentLoaded', () => {

    // ==================== PRE-MATRIMONIALE ====================
    const preWeddingTrack = document.querySelector('.pre-wedding-track');
    if (preWeddingTrack) {
        const preWeddingTextSlide = preWeddingTrack.querySelector('.pre-wedding-text');
        // Primera foto fija (portrait), siempre la misma
        const preWeddingFixed = document.createElement('figure');
        preWeddingFixed.className = 'pre-wedding-slide pre-wedding-photo';
        preWeddingFixed.innerHTML = `<img src="images/pre-matrimoniale/pre-matrimoniale (1).webp" alt="Servizio fotografico pre-matrimoniale Cuneo Langhe Piemonte" loading="eager">`;
        preWeddingTrack.insertBefore(preWeddingFixed, preWeddingTextSlide);

        // Resto aleatorio (excluye el 1)
        buildShuffledIndicesExcluding(IMAGE_COUNTS.preMatrimoniale, 1).forEach(i => {
            const figure = document.createElement('figure');
            figure.className = 'pre-wedding-slide pre-wedding-photo';
            figure.innerHTML = `<img src="images/pre-matrimoniale/pre-matrimoniale (${i}).webp" alt="Servizio fotografico pre-matrimoniale Cuneo Langhe Piemonte" loading="lazy">`;
            preWeddingTrack.appendChild(figure);
        });

        console.log(`✅ Pre-Wedding: ${IMAGE_COUNTS.preMatrimoniale} imágenes (aleatorias)`);

        carousels.preWedding = new UniversalCarousel({
            sectionSelector: '.pre-wedding-section',
            carouselSelector: '.pre-wedding-carousel',
            slideClass: 'pre-wedding-slide',
            startIndex: 1
        });

        // RAF 1: aplicar scroll. RAF 2: revelar (ya centrado).
        requestAnimationFrame(() => {
            if (carousels.preWedding) carousels.preWedding.scrollToIndex(1, 'auto');
            requestAnimationFrame(() => {
                const el = document.querySelector('.pre-wedding-carousel');
                if (el) el.classList.add('carousel-ready');
            });
        });
    }

    // ==================== FESTA ====================
    const festaTrack = document.querySelector('.festa-track');
    if (festaTrack) {
        const festaTextSlide = festaTrack.querySelector('.festa-text');
        // Primera foto fija (portrait), siempre la misma
        const festaFixed = document.createElement('figure');
        festaFixed.className = 'festa-slide festa-photo';
        festaFixed.innerHTML = `<img src="images/festa/festa (1).webp" alt="Fotografo matrimonio Cuneo Langhe Alba Piemonte" loading="eager">`;
        festaTrack.insertBefore(festaFixed, festaTextSlide);

        // Resto aleatorio (excluye el 1)
        buildShuffledIndicesExcluding(IMAGE_COUNTS.festa, 1).forEach(i => {
            const figure = document.createElement('figure');
            figure.className = 'festa-slide festa-photo';
            figure.innerHTML = `<img src="images/festa/festa (${i}).webp" alt="Fotografo matrimonio Cuneo Langhe Alba Piemonte" loading="lazy">`;
            festaTrack.appendChild(figure);
        });

        console.log(`✅ Festa: ${IMAGE_COUNTS.festa} imágenes (aleatorias)`);

        carousels.festa = new UniversalCarousel({
            sectionSelector: '.festa-section',
            carouselSelector: '.festa-carousel',
            slideClass: 'festa-slide',
            startIndex: 1
        });

        requestAnimationFrame(() => {
            if (carousels.festa) carousels.festa.scrollToIndex(1, 'auto');
            requestAnimationFrame(() => {
                const el = document.querySelector('.festa-carousel');
                if (el) el.classList.add('carousel-ready');
            });
        });
    }

    // ==================== NOI ====================
    const noiTrack = document.querySelector('.noi-track');
    if (noiTrack) {
        const noiText1 = noiTrack.querySelector('.noi-text-1');
        const noiText2 = noiTrack.querySelector('.noi-text-2');
        // Primera foto fija (portrait), siempre la misma
        const noiFixed = document.createElement('figure');
        noiFixed.className = 'noi-slide noi-photo';
        noiFixed.innerHTML = `<img src="images/noi/noi (1).webp" alt="Mayra e Mariano fotografi matrimonio Cuneo" loading="eager">`;
        if (noiText1) noiTrack.insertBefore(noiFixed, noiText1);

        // Resto aleatorio (excluye el 1)
        buildShuffledIndicesExcluding(IMAGE_COUNTS.noi, 1).forEach((i, arrayIndex) => {
            const figure = document.createElement('figure');
            figure.className = 'noi-slide noi-photo';
            figure.innerHTML = `<img src="images/noi/noi (${i}).webp" alt="Mayra e Mariano fotografi matrimonio Cuneo" loading="lazy">`;
            if (arrayIndex === 0 && noiText2) {
                noiTrack.insertBefore(figure, noiText2);
            } else {
                noiTrack.appendChild(figure);
            }
        });

        console.log(`✅ Noi: ${IMAGE_COUNTS.noi} imágenes (aleatorias)`);

        carousels.noi = new UniversalCarousel({
            sectionSelector: '.noi-section',
            carouselSelector: '.noi-carousel',
            slideClass: 'noi-slide',
            startIndex: 1
        });

        requestAnimationFrame(() => {
            if (carousels.noi) carousels.noi.scrollToIndex(1, 'auto');
            requestAnimationFrame(() => {
                const el = document.querySelector('.noi-carousel');
                if (el) el.classList.add('carousel-ready');
            });
        });
    }

    // ==================== DOCUMENTAL ====================
    const documentalTrack = document.querySelector('.documental-track');
    if (documentalTrack) {
        const documentalTextSlide = documentalTrack.querySelector('.documental-text');
        // Primera foto fija (portrait), siempre la misma
        const documentalFixed = document.createElement('figure');
        documentalFixed.className = 'documental-slide documental-photo';
        documentalFixed.innerHTML = `<img src="images/documental/documental (1).webp" alt="Fotografo famiglia bambini Cuneo Piemonte" loading="eager">`;
        documentalTrack.insertBefore(documentalFixed, documentalTextSlide);

        // Resto aleatorio (excluye el 1)
        buildShuffledIndicesExcluding(IMAGE_COUNTS.documental, 1).forEach(i => {
            const figure = document.createElement('figure');
            figure.className = 'documental-slide documental-photo';
            figure.innerHTML = `<img src="images/documental/documental (${i}).webp" alt="Fotografo famiglia bambini Cuneo Piemonte" loading="lazy">`;
            documentalTrack.appendChild(figure);
        });

        console.log(`✅ Documental: ${IMAGE_COUNTS.documental} imágenes (aleatorias)`);

        carousels.documental = new UniversalCarousel({
            sectionSelector: '.documental-section',
            carouselSelector: '.documental-carousel',
            slideClass: 'documental-slide',
            startIndex: 1
        });

        requestAnimationFrame(() => {
            if (carousels.documental) carousels.documental.scrollToIndex(1, 'auto');
            requestAnimationFrame(() => {
                const el = document.querySelector('.documental-carousel');
                if (el) el.classList.add('carousel-ready');
            });
        });
    }

    // ==================== POST-MATRIMONIALE ====================
    const postWeddingTrack = document.querySelector('.post-wedding-track');
    if (postWeddingTrack) {
        const postWeddingTextSlide = postWeddingTrack.querySelector('.post-wedding-text');
        // Primera foto fija (portrait), siempre la misma
        const postWeddingFixed = document.createElement('figure');
        postWeddingFixed.className = 'post-wedding-slide post-wedding-photo';
        postWeddingFixed.innerHTML = `<img src="images/post-matrimoniale/post-matrimoniale (1).webp" alt="Sessione fotografica post-matrimoniale Cuneo Piemonte" loading="eager">`;
        postWeddingTrack.insertBefore(postWeddingFixed, postWeddingTextSlide);

        // Resto aleatorio (excluye el 1)
        buildShuffledIndicesExcluding(IMAGE_COUNTS.postMatrimoniale, 1).forEach(i => {
            const figure = document.createElement('figure');
            figure.className = 'post-wedding-slide post-wedding-photo';
            figure.innerHTML = `<img src="images/post-matrimoniale/post-matrimoniale (${i}).webp" alt="Sessione fotografica post-matrimoniale Cuneo Piemonte" loading="lazy">`;
            postWeddingTrack.appendChild(figure);
        });

        console.log(`✅ Post-Wedding: ${IMAGE_COUNTS.postMatrimoniale} imágenes (aleatorias)`);

        carousels.postWedding = new UniversalCarousel({
            sectionSelector: '.post-wedding-section',
            carouselSelector: '.post-wedding-carousel',
            slideClass: 'post-wedding-slide',
            startIndex: 1
        });

        requestAnimationFrame(() => {
            if (carousels.postWedding) carousels.postWedding.scrollToIndex(1, 'auto');
            requestAnimationFrame(() => {
                const el = document.querySelector('.post-wedding-carousel');
                if (el) el.classList.add('carousel-ready');
            });
        });
    }
});


// FIN DEL ARCHIVO

// ==================== FADE-IN AL SCROLL ====================
document.addEventListener('DOMContentLoaded', () => {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.15 });

    document.querySelectorAll('.fade-in-section').forEach(el => observer.observe(el));
});