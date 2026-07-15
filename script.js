/* ===================================================================
   CNM — COPA NEXUS MONOSPOTO
   script.js — dados mock da temporada + comportamento da interface
   Organizado por módulos independentes, inicializados em DOMContentLoaded.
   =================================================================== */

/* --------------------------- DADOS MOCK ---------------------------
   Em produção, substitua estes arrays por dados vindos de uma API. */

let NEWS_DATA = [
  {
    category: 'Classificação',
    title: 'Volta de bandeira: novo recorde é batido em Nexus Park',
    desc: 'Na sessão classificatória mais disputada do ano, o grid viu um novo recorde da pista cair nos últimos segundos da Q3.',
    icon: 'flag'
  },
  {
    category: 'Equipes',
    title: 'Vortex Racing anuncia atualização aerodinâmica para a próxima etapa',
    desc: 'O novo pacote de asa traseira promete ganho de carga aerodinâmica nas curvas de média velocidade.',
    icon: 'wrench'
  },
  {
    category: 'Entrevista',
    title: 'Campeã defende o título: "o grid nunca esteve tão parelho"',
    desc: 'Camila Rocha comenta a evolução técnica das equipes e a pressão de defender a liderança do campeonato.',
    icon: 'mic'
  },
  {
    category: 'Regulamento',
    title: 'CNM anuncia mudanças no formato de classificação para 2026',
    desc: 'Nova janela de pneus e formato de eliminação alteram a estratégia das equipes a partir da próxima etapa.',
    icon: 'doc'
  },
  {
    category: 'Bastidores',
    title: 'Conheça o novo simulador oficial da Copa Nexus Monospoto',
    desc: 'Ferramenta usada pelas equipes para preparação de pista foi liberada em versão pública para os fãs.',
    icon: 'chip'
  }
];

let RACES_DATA = [
  { name: 'GP Nexus Park',     circuit: 'Circuito Nexus Park',        date: '15 de março, 2026',  time: '19:30', status: 'finalizada', target: null },
  { name: 'GP Costa Vermelha', circuit: 'Autódromo Costa Vermelha',   date: '5 de abril, 2026',   time: '20:00', status: 'finalizada', target: null },
  { name: 'GP Serra Alta',     circuit: 'Circuito Serra Alta',        date: '26 de abril, 2026',  time: '18:00', status: 'finalizada', target: null },
  { name: 'GP Baía Litoral',   circuit: 'Circuito Baía Litoral',      date: '17 de maio, 2026',   time: '19:00', status: 'finalizada', target: null },
  { name: 'GP Distrito Nortis',circuit: 'Street Circuit Distrito Nortis', date: '14 de junho, 2026', time: '20:30', status: 'finalizada', target: null },
  { name: 'GP Vale Ferrovia',  circuit: 'Circuito Vale Ferrovia',     date: '14 de julho, 2026',  time: '19:00', status: 'andamento', target: null },
  { name: 'GP Deserto Rubro',  circuit: 'Circuito Deserto Rubro',     date: '26 de julho, 2026',  time: '20:00', status: 'proxima', target: '2026-07-26T20:00:00' },
  { name: 'GP Altiplano',      circuit: 'Circuito Altiplano',         date: '16 de agosto, 2026', time: '19:30', status: 'proxima', target: '2026-08-16T19:30:00' }
];

let TEAMS_DATA = [
  { name: 'Vortex Racing',         base: 'Sede em Costa Vermelha',  color: '#E10600' },
  { name: 'Titan Motorsport',      base: 'Sede em Serra Alta',      color: '#3E7CB1' },
  { name: 'Apex Dynamics',         base: 'Sede em Nexus Park',      color: '#E8B923' },
  { name: 'Scuderia Rossa Nexus',  base: 'Sede em Distrito Nortis', color: '#C9414B' },
  { name: 'Solstice GP',           base: 'Sede em Baía Litoral',    color: '#F2790C' },
  { name: 'Nimbus Engineering',    base: 'Sede em Vale Ferrovia',   color: '#2FB8A6' }
];

let DRIVERS_DATA = [
  { name: 'Camila Rocha',     number: 1,  nat: 'BRA', team: 'Apex Dynamics',        color: '#E8B923', titles: 5, wins: 41, seasons: 11 },
  { name: 'Rafael Duarte',    number: 7,  nat: 'BRA', team: 'Vortex Racing',        color: '#E10600', titles: 4, wins: 38, seasons: 9  },
  { name: 'Marco Ferretti',   number: 22, nat: 'ITA', team: 'Scuderia Rossa Nexus', color: '#C9414B', titles: 3, wins: 33, seasons: 10 },
  { name: 'Elena Kowalski',   number: 3,  nat: 'POL', team: 'Titan Motorsport',     color: '#3E7CB1', titles: 3, wins: 29, seasons: 8  },
  { name: 'Lucas Meirelles',  number: 14, nat: 'BRA', team: 'Vortex Racing',        color: '#E10600', titles: 2, wins: 19, seasons: 7  },
  { name: 'Kenji Arata',      number: 44, nat: 'JPN', team: 'Apex Dynamics',        color: '#E8B923', titles: 2, wins: 21, seasons: 7  },
  { name: 'Aisha Bello',      number: 9,  nat: 'NGA', team: 'Solstice GP',          color: '#F2790C', titles: 1, wins: 14, seasons: 6  },
  { name: 'Henrik Sørensen',  number: 27, nat: 'DNK', team: 'Titan Motorsport',     color: '#3E7CB1', titles: 1, wins: 11, seasons: 5  }
];

let STANDINGS_DATA = [
  { pos: 1, name: 'Camila Rocha',    team: 'Apex Dynamics',        color: '#E8B923', points: 284 },
  { pos: 2, name: 'Rafael Duarte',   team: 'Vortex Racing',        color: '#E10600', points: 261 },
  { pos: 3, name: 'Marco Ferretti',  team: 'Scuderia Rossa Nexus', color: '#C9414B', points: 238 },
  { pos: 4, name: 'Elena Kowalski',  team: 'Titan Motorsport',     color: '#3E7CB1', points: 205 },
  { pos: 5, name: 'Kenji Arata',     team: 'Apex Dynamics',        color: '#E8B923', points: 178 },
  { pos: 6, name: 'Lucas Meirelles', team: 'Vortex Racing',        color: '#E10600', points: 152 },
  { pos: 7, name: 'Aisha Bello',     team: 'Solstice GP',          color: '#F2790C', points: 121 },
  { pos: 8, name: 'Henrik Sørensen', team: 'Titan Motorsport',     color: '#3E7CB1', points: 96  }
];

/* ícones simples usados nos placeholders de mídia das notícias */
let RESULTS_DATA = [];

const ICONS = {
  flag: '<svg viewBox="0 0 24 24" width="34" height="34"><path d="M5 3v18M5 4h13l-3 4 3 4H5" fill="none" stroke="#E10600" stroke-width="1.8" stroke-linejoin="round"/></svg>',
  wrench: '<svg viewBox="0 0 24 24" width="34" height="34"><path d="M14.7 6.3a4 4 0 0 1-5 5L4 18l2 2 6.7-5.7a4 4 0 0 1 5-5L21 6l-3-3z" fill="none" stroke="#E10600" stroke-width="1.8" stroke-linejoin="round"/></svg>',
  mic: '<svg viewBox="0 0 24 24" width="34" height="34"><rect x="9" y="2" width="6" height="12" rx="3" fill="none" stroke="#E10600" stroke-width="1.8"/><path d="M5 11a7 7 0 0 0 14 0M12 18v4" fill="none" stroke="#E10600" stroke-width="1.8"/></svg>',
  doc: '<svg viewBox="0 0 24 24" width="34" height="34"><path d="M6 2h9l5 5v15H6z" fill="none" stroke="#E10600" stroke-width="1.8" stroke-linejoin="round"/><path d="M9 13h6M9 17h6" stroke="#E10600" stroke-width="1.6"/></svg>',
  chip: '<svg viewBox="0 0 24 24" width="34" height="34"><rect x="6" y="6" width="12" height="12" rx="2" fill="none" stroke="#E10600" stroke-width="1.8"/><path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3" stroke="#E10600" stroke-width="1.6"/></svg>'
};

/* ===================================================================
   MÓDULO: CABEÇALHO (encolhe ao rolar + menu mobile)
   =================================================================== */
function initHeader(){
  const header = document.getElementById('siteHeader');
  const toggle = document.getElementById('navToggle');
  const nav = document.getElementById('siteNav');

  let ticking = false;
  function onScroll(){
    if(!ticking){
      requestAnimationFrame(() => {
        header.classList.toggle('is-scrolled', window.scrollY > 40);
        ticking = false;
      });
      ticking = true;
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });

  function closeNav(){
    nav.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    document.body.classList.remove('nav-open');
  }
  function openNav(){
    nav.classList.add('is-open');
    toggle.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    document.body.classList.add('nav-open');
  }

  toggle.addEventListener('click', () => {
    const isOpen = nav.classList.contains('is-open');
    isOpen ? closeNav() : openNav();
  });

  nav.querySelectorAll('.nav__link').forEach(link => {
    link.addEventListener('click', closeNav);
  });

  document.addEventListener('keydown', (e) => {
    if(e.key === 'Escape') closeNav();
  });

  document.getElementById('scrollCue').addEventListener('click', () => {
    document.getElementById('noticias').scrollIntoView({ behavior: 'smooth' });
  });
}

/* ===================================================================
   MÓDULO: REVELAÇÃO NO SCROLL (IntersectionObserver)
   =================================================================== */
function initScrollReveal(){
  const items = document.querySelectorAll('[data-animate]');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if(entry.isIntersecting){
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

  items.forEach(item => observer.observe(item));
}

/* ===================================================================
   MÓDULO: NOTÍCIAS (slider automático + manual + swipe)
   =================================================================== */
function initNewsSlider(){
  const track = document.getElementById('sliderTrack');
  const dotsWrap = document.getElementById('sliderDots');
  const prevBtn = document.getElementById('prevSlide');
  const nextBtn = document.getElementById('nextSlide');
  const slider = document.getElementById('newsSlider');

  track.innerHTML = NEWS_DATA.map(item => `
    <div class="slider__slide">
      <div class="slide__media media-placeholder">
        <span class="media-placeholder__icon">${ICONS[item.icon] || ''}</span>
        <span class="media-placeholder__icon">${item.category}</span>
      </div>
      <div class="slide__body">
        <span class="slide__category">${item.category}</span>
        <h3 class="slide__title">${item.title}</h3>
        <p class="slide__desc">${item.desc}</p>
        <a href="#" class="slide__link">Ler mais →</a>
      </div>
    </div>
  `).join('');

  dotsWrap.innerHTML = NEWS_DATA.map((_, i) =>
    `<button class="slider__dot${i === 0 ? ' is-active' : ''}" role="tab" aria-label="Ir para notícia ${i + 1}"></button>`
  ).join('');

  const dots = dotsWrap.querySelectorAll('.slider__dot');
  let index = 0;
  const total = NEWS_DATA.length;
  let autoplayId = null;

  function render(){
    track.style.transform = `translateX(-${index * 100}%)`;
    dots.forEach((d, i) => d.classList.toggle('is-active', i === index));
  }

  function goTo(i){
    index = (i + total) % total;
    render();
  }

  function next(){ goTo(index + 1); }
  function prev(){ goTo(index - 1); }

  function startAutoplay(){
    stopAutoplay();
    autoplayId = setInterval(next, 5500);
  }
  function stopAutoplay(){
    if(autoplayId) clearInterval(autoplayId);
  }

  prevBtn.addEventListener('click', () => { prev(); startAutoplay(); });
  nextBtn.addEventListener('click', () => { next(); startAutoplay(); });
  dots.forEach((dot, i) => dot.addEventListener('click', () => { goTo(i); startAutoplay(); }));

  slider.addEventListener('mouseenter', stopAutoplay);
  slider.addEventListener('mouseleave', startAutoplay);
  slider.addEventListener('focusin', stopAutoplay);
  slider.addEventListener('focusout', startAutoplay);

  /* swipe (touch e mouse) via Pointer Events */
  let startX = 0;
  let dragging = false;
  track.addEventListener('pointerdown', (e) => {
    dragging = true;
    startX = e.clientX;
    stopAutoplay();
  });
  track.addEventListener('pointerup', (e) => {
    if(!dragging) return;
    dragging = false;
    const delta = e.clientX - startX;
    if(Math.abs(delta) > 50){
      delta < 0 ? next() : prev();
    }
    startAutoplay();
  });
  track.addEventListener('pointerleave', () => { dragging = false; });

  render();
  startAutoplay();
}

/* ===================================================================
   MÓDULO: CALENDÁRIO (card em destaque + lista + contagem regressiva)
   =================================================================== */
function raceDateValue(race){
  const source = race.dateTime || race.target;
  const date = new Date(source || '');
  return Number.isNaN(date.getTime()) ? null : date;
}

function raceTimestamp(race){
  const date = raceDateValue(race);
  return date ? date.getTime() : Number.MAX_SAFE_INTEGER;
}

function computeRaceStatus(race, referenceDate = new Date()){
  const raceDate = raceDateValue(race);
  if(!raceDate) return race.status || 'proxima';
  const start = new Date(raceDate.getFullYear(), raceDate.getMonth(), raceDate.getDate(), 12, 0, 0, 0, 0);
  const end = new Date(raceDate.getFullYear(), raceDate.getMonth(), raceDate.getDate() + 1, 0, 0, 0, 0);
  if(referenceDate < start) return 'proxima';
  if(referenceDate < end) return 'andamento';
  return 'finalizada';
}

function normalizeRaceStatus(race){
  const raceDate = raceDateValue(race);
  const target = raceDate
    ? `${raceDate.getFullYear()}-${String(raceDate.getMonth() + 1).padStart(2, '0')}-${String(raceDate.getDate()).padStart(2, '0')}T12:00:00`
    : race.target;
  return { ...race, target, status: computeRaceStatus(race) };
}

function sortRacesForLanding(races){
  /* ordem cronológica: do GP mais próximo (data mais antiga) ao mais distante */
  return [...races].sort((a, b) => raceTimestamp(a) - raceTimestamp(b));
}

function initCalendar(){
  const listWrap = document.getElementById('raceList');
  const feature = {
    circuit: document.getElementById('featureCircuit'),
    name: document.getElementById('featureName'),
    date: document.getElementById('featureDate'),
    time: document.getElementById('featureTime'),
    badge: document.getElementById('featureBadge'),
    statusBlock: document.getElementById('featureStatusBlock'),
    card: document.getElementById('raceFeature')
  };

  const STATUS_LABEL = { proxima: 'Próxima', andamento: 'Ao vivo', finalizada: 'Finalizada' };

  RACES_DATA = sortRacesForLanding(RACES_DATA.map(normalizeRaceStatus));
  const STATUS_LABEL_AUTO = { proxima: 'A seguir', andamento: 'Em andamento', finalizada: 'Expirado' };

  /* texto de agenda tolerante a datas ainda não cadastradas */
  function raceScheduleText(race){
    const parts = [race.date, race.time].map(v => (v || '').trim()).filter(Boolean);
    return parts.length ? parts.join(' · ') : 'Data a definir';
  }

  listWrap.innerHTML = RACES_DATA.map((race, i) => `
    <div class="race-list__item" tabindex="0" data-index="${i}">
      <div class="race-item__info">
        <span class="race-item__name">${race.name}</span>
        <span class="race-item__date">${raceScheduleText(race)}</span>
      </div>
      <span class="status-badge status-badge--${race.status === 'andamento' ? 'andamento' : race.status}">${STATUS_LABEL_AUTO[race.status]}</span>
    </div>
  `).join('');

  let countdownId = null;

  function renderCountdown(targetISO){
    clearInterval(countdownId);
    function tick(){
      const diff = new Date(targetISO).getTime() - Date.now();
      if(diff <= 0){
        feature.statusBlock.innerHTML = '<p class="status-message"><span class="live-dot"></span> Corrida em andamento — acompanhe ao vivo</p>';
        clearInterval(countdownId);
        return;
      }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      feature.statusBlock.innerHTML = `
        <div class="countdown">
          <div class="countdown__unit"><span class="countdown__value">${String(d).padStart(2, '0')}</span><span class="countdown__label">Dias</span></div>
          <div class="countdown__unit"><span class="countdown__value">${String(h).padStart(2, '0')}</span><span class="countdown__label">Horas</span></div>
          <div class="countdown__unit"><span class="countdown__value">${String(m).padStart(2, '0')}</span><span class="countdown__label">Min</span></div>
          <div class="countdown__unit"><span class="countdown__value">${String(s).padStart(2, '0')}</span><span class="countdown__label">Seg</span></div>
        </div>`;
    }
    tick();
    countdownId = setInterval(tick, 1000);
  }

  function renderStatusMessage(status){
    clearInterval(countdownId);
    if(status === 'andamento'){
      feature.statusBlock.innerHTML = '<p class="status-message"><span class="live-dot"></span> Corrida em andamento — acompanhe ao vivo</p>';
    } else {
      feature.statusBlock.innerHTML = '<p class="status-message">Etapa encerrada — confira o resultado completo</p>';
    }
  }

  function paintFeature(race){
    feature.circuit.textContent = race.circuit;
    feature.name.textContent = race.name;
    feature.date.textContent = (race.date || '').trim() || 'Data a definir';
    feature.time.textContent = (race.time || '').trim() ? `${race.time} (horário local)` : 'Horário a definir';
    feature.badge.textContent = STATUS_LABEL_AUTO[race.status];
    feature.badge.className = 'race-feature__badge' + (race.status === 'andamento' ? ' is-live' : race.status === 'finalizada' ? ' is-done' : '');

    if(race.status === 'proxima' && race.target){
      renderCountdown(race.target);
    } else {
      renderStatusMessage(race.status);
    }
  }

  /* corrida em destaque por padrão: a primeira com status "proxima" */
  const defaultRace = RACES_DATA.find(r => r.status === 'proxima') || RACES_DATA[0];
  paintFeature(defaultRace);

  const items = listWrap.querySelectorAll('.race-list__item');
  items.forEach((item, i) => {
    const race = RACES_DATA[i];
    item.addEventListener('mouseenter', () => {
      items.forEach(it => it.classList.remove('is-previewed'));
      item.classList.add('is-previewed');
      paintFeature(race);
    });
    item.addEventListener('focus', () => paintFeature(race));
    item.addEventListener('mouseleave', () => {
      item.classList.remove('is-previewed');
      paintFeature(defaultRace);
    });
  });
}

/* ===================================================================
   MÓDULO: HALL DA FAMA (carrossel infinito com arraste e profundidade)
   =================================================================== */
function initHallOfFame(){
  const track = document.getElementById('carouselTrack');
  const viewport = document.getElementById('driverCarousel');

  function cardMarkup(driver){
    const initials = driver.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    return `
      <div class="card-driver" style="--team-color:${driver.color}">
        <div class="card-driver__plate">
          <span class="card-driver__number">#${driver.number}</span>
          <span class="card-driver__nat">${driver.nat}</span>
          <span class="card-driver__ghost-number">${driver.number}</span>
          <span class="card-driver__monogram">${initials}</span>
        </div>
        <p class="card-driver__name">${driver.name}</p>
        <p class="card-driver__team">${driver.team}</p>
        <div class="card-driver__stats">
          <div class="card-driver__stat"><span class="card-driver__stat-value">${driver.titles}</span><span class="card-driver__stat-label">Títulos</span></div>
          <div class="card-driver__stat"><span class="card-driver__stat-value">${driver.wins}</span><span class="card-driver__stat-label">Vitórias</span></div>
          <div class="card-driver__stat"><span class="card-driver__stat-value">${driver.seasons}</span><span class="card-driver__stat-label">Temporadas</span></div>
          <div class="card-driver__stat"><span class="card-driver__stat-value">${driver.nat}</span><span class="card-driver__stat-label">País</span></div>
        </div>
      </div>`;
  }

  /* duplica o conjunto três vezes para permitir loop infinito suave */
  const service = window.CNMFirebase;
  const hallDrivers = DRIVERS_DATA.filter((driver) => service?.configured ? driver.showInHallOfFame === true : driver.showInHallOfFame !== false);
  if(!hallDrivers.length){
    track.innerHTML = '<p class="legends__empty">Nenhum piloto marcado para exibicao no Hall da Fama.</p>';
    return;
  }
  const setHTML = hallDrivers.map(cardMarkup).join('');
  track.innerHTML = setHTML + setHTML + setHTML;

  let cards = Array.from(track.children);
  let setWidth = 0;

  function measure(){
    /* largura de um conjunto completo (cards + gaps), calculada após o layout */
    const style = getComputedStyle(track);
    const gap = parseFloat(style.gap) || 26;
    setWidth = cards.slice(0, hallDrivers.length).reduce((acc, el) => acc + el.getBoundingClientRect().width + gap, 0);
  }

  let offset = 0;
  let paused = false;
  let dragging = false;
  let dragStartX = 0;
  let dragStartOffset = 0;
  const SPEED = 0.45; /* px por frame */

  function applyDepthEffect(){
    const viewportRect = viewport.getBoundingClientRect();
    const centerX = viewportRect.left + viewportRect.width / 2;
    cards.forEach(card => {
      const rect = card.getBoundingClientRect();
      const cardCenter = rect.left + rect.width / 2;
      const dist = Math.abs(cardCenter - centerX);
      const norm = Math.min(dist / (viewportRect.width / 2), 1);
      const scale = 1 - norm * 0.16;
      const blur = norm * 3.2;
      const opacity = 1 - norm * 0.35;
      card.style.transform = `scale(${scale.toFixed(3)})`;
      card.style.filter = `blur(${blur.toFixed(2)}px)`;
      card.style.opacity = opacity.toFixed(2);
    });
  }

  function frame(){
    if(!paused && !dragging){
      offset -= SPEED;
      if(setWidth && Math.abs(offset) >= setWidth){
        offset += setWidth;
      }
    }
    track.style.transform = `translateX(${offset}px)`;
    applyDepthEffect();
    requestAnimationFrame(frame);
  }

  /* pausa ao passar o mouse / focar dentro do carrossel */
  viewport.addEventListener('mouseenter', () => { paused = true; });
  viewport.addEventListener('mouseleave', () => { paused = false; });
  viewport.addEventListener('focusin', () => { paused = true; });
  viewport.addEventListener('focusout', () => { paused = false; });

  /* arraste (mouse e touch via Pointer Events) */
  viewport.addEventListener('pointerdown', (e) => {
    dragging = true;
    paused = true;
    dragStartX = e.clientX;
    dragStartOffset = offset;
    viewport.setPointerCapture(e.pointerId);
  });
  viewport.addEventListener('pointermove', (e) => {
    if(!dragging) return;
    const delta = e.clientX - dragStartX;
    offset = dragStartOffset + delta;
    if(setWidth){
      if(offset > 0) offset -= setWidth;
      if(Math.abs(offset) >= setWidth * 2) offset += setWidth;
    }
  });
  function endDrag(){
    dragging = false;
    paused = false;
  }
  viewport.addEventListener('pointerup', endDrag);
  viewport.addEventListener('pointercancel', endDrag);

  /* mede novamente em caso de redimensionamento da janela */
  window.addEventListener('resize', () => {
    cards = Array.from(track.children);
    measure();
  });

  /* aguarda um frame para garantir que os elementos já têm dimensões */
  requestAnimationFrame(() => {
    measure();
    requestAnimationFrame(frame);
  });
}

/* ===================================================================
   MÓDULO: NOSSO TIME
   ===================================================================
   */
function initTeamStructure(){
  const TEAM_DATA = [
    { role: 'Dono Geral', members: ['David Tyson De Rossi Cardoso'], founder: true, tag: 'Direcao' },
    { role: 'Admin', members: ['Pablo Gutemberg', 'Joao Delmon', 'JonSenna'], tag: 'Operacao' },
    { role: 'Video Maker', members: ['Karakama', 'David'], tag: 'Midia' },
    { role: 'Designer', members: ['Guilherme', 'David'], tag: 'Visual' },
    { role: 'Programador', members: ['Dan'], tag: 'Tech' },
    { role: 'Jornalista', members: ['David'], tag: 'Conteudo' },
    { role: 'Parcerias', members: ['NGP', 'TWC'], tag: 'Relacoes' }
  ];

  const container = document.getElementById('teamStructure');
  container.innerHTML = TEAM_DATA.map((role, index) => `
    <article class="team-role${role.founder ? ' team-role--lead' : ''}" style="--i:${index + 1}" data-index="${String(index + 1).padStart(2, '0')}">
      ${role.founder ? '<span class="team-role__ribbon">Fundador</span>' : ''}
      <div class="team-role__meta">
        <span class="team-role__tag">${role.tag}</span>
        <span class="team-role__count">${role.members.length} ${role.members.length === 1 ? 'membro' : 'membros'}</span>
      </div>
      <p class="team-role__title">${role.role}</p>
      <div class="team-role__members">
        ${role.members.map((member) => `<p class="team-member${role.founder ? ' founder' : ''}"><span class="team-member__avatar">${member.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()}</span><span class="team-member__name">${member}</span></p>`).join('')}
      </div>
    </article>
  `).join('');
}

function initSponsors(){
  const SPONSORS_DATA = [
    { name: 'Toyota gr', type: 'sponsor', tier: 'Master' },
    { name: 'Arthur', type: 'sponsor', tier: 'Apoio' },
    { name: 'Pablo', type: 'sponsor', tier: 'Apoio' },
    { name: 'Klein', type: 'sponsor', tier: 'Apoio' },
    { name: 'MP', type: 'sponsor', tier: 'Apoio' },
    { name: 'NGP', type: 'partnership', tier: 'Parceria' },
    { name: 'TWC', type: 'partnership', tier: 'Parceria' }
  ];

  const container = document.getElementById('sponsorsGrid');
  container.innerHTML = SPONSORS_DATA.map((item) => {
    const monogram = item.name.split(' ').map((part) => part[0]).join('').slice(0, 3).toUpperCase();
    return `
      <article class="sponsor-card sponsor-card--${item.type}">
        <div class="sponsor-card__shine"></div>
        <div class="sponsor-card__mark">${monogram}</div>
        <div class="sponsor-card__inner">
          <span class="sponsor-card__badge">${item.tier}</span>
          <p class="sponsor-card__name">${item.name}</p>
          <span class="sponsor-card__type">${item.type === 'partnership' ? 'Parceria oficial' : 'Patrocinador'}</span>
        </div>
      </article>
    `;
  }).join('');
}

/* ===================================================================
   MÓDULO: ÚLTIMO VENCEDOR
   =================================================================== */
function winnerImageMarkup(driver){
  const initials = (driver.name || 'CNM').split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();
  if(driver.photoUrl){
    return `<img class="winner-card__image" src="${driver.photoUrl}" alt="${driver.name}" loading="lazy" onerror="this.replaceWith(this.nextElementSibling)"><div class="winner-card__placeholder">${initials}</div>`;
  }
  return `<div class="winner-card__placeholder">${initials}</div>`;
}

function getLatestWinner(){
  const racesById = new Map(RACES_DATA.map((race) => [race.id, normalizeRaceStatus(race)]));
  const finishedResults = RESULTS_DATA
    .map((result) => ({ result, race: racesById.get(result.raceId) }))
    .filter(({ result, race }) => result.entries?.length && (!race || race.status === 'finalizada'))
    .sort((a, b) => raceTimestamp(b.race || {}) - raceTimestamp(a.race || {}));
  const winnerEntry = finishedResults[0]?.result.entries.find((entry) => Number(entry.position) === 1) || finishedResults[0]?.result.entries[0];
  return DRIVERS_DATA.find((driver) => driver.id === winnerEntry?.driverId) || DRIVERS_DATA[0];
}

function initWinner(){
  const container = document.getElementById('winnerContainer');
  if (!container) return;

  const finishedRaces = RACES_DATA.map(normalizeRaceStatus).filter((race) => race.status === 'finalizada');
  if (finishedRaces.length === 0) {
    container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--c-muted);">Nenhuma corrida finalizada ainda.</p>';
    return;
  }

  const winner = getLatestWinner();
  const latestResult = RESULTS_DATA
    .filter((result) => result.entries?.length)
    .sort((a, b) => String(b.publishedAt || '').localeCompare(String(a.publishedAt || '')))[0];
  const winnerEntry = latestResult?.entries?.find((entry) => entry.driverId === winner.id);
  const lapTime = winnerEntry?.lapTime || '1:23.456';
  const gapToSecond = '+0.234s';
  const image = winnerImageMarkup(winner);

  container.innerHTML = `
    <div class="winner-card">
      ${image}
    </div>
    <div class="winner-stats">
      <div>
        <p class="winner-name">${winner.name}</p>
        <p class="winner-team">${winner.team}</p>
      </div>
      <div class="stat-row">
        <div class="stat">
          <span class="stat__label">Numero</span>
          <span class="stat__value">#${winner.number}</span>
        </div>
        <div class="stat">
          <span class="stat__label">Volta Rapida</span>
          <span class="stat__value">${lapTime}</span>
        </div>
      </div>
    </div>

    <div class="winner-flip-container">
      <div class="winner-flip-card">
        <div class="winner-flip-front">
          ${image}
          <div class="winner-flip-front__info">
            <p class="winner-name">${winner.name}</p>
            <p class="winner-team">${winner.team}</p>
            <span class="winner-number">#${winner.number}</span>
          </div>
        </div>
        <div class="winner-flip-back">
          <div>
            <p class="winner-name" style="font-size: 1.5rem; margin-bottom: 0;">${winner.name}</p>
            <p class="winner-team">${winner.team}</p>
          </div>
          <div class="stat-row">
            <div class="stat">
              <span class="stat__label">Volta Rapida</span>
              <span class="stat__value">${lapTime}</span>
            </div>
            <div class="stat">
              <span class="stat__label">Gap 2o</span>
              <span class="stat__value">${gapToSecond}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function initTeams(){
  const grid = document.getElementById('teamsGrid');
  grid.innerHTML = TEAMS_DATA.map(team => {
    const teamDrivers = DRIVERS_DATA.filter(driver => driver.team === team.name);
    return `
      <div class="team-card" style="--team-color:${team.color}">
        <div class="team-card__content">
          <span class="team-card__swatch"></span>
          <p class="team-card__name">${team.name}</p>
          <p class="team-card__base">${team.base}</p>
        </div>
        <div class="team-card__drivers">
          ${teamDrivers.map(driver => `
            <div class="team-driver">
              <div class="team-driver__number">#${driver.number}</div>
              <div class="team-driver__name">${driver.name}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }).join('');
  
  // Adiciona interatividade aos cards
  document.querySelectorAll('.team-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.team-card').forEach(c => c.classList.remove('is-active'));
      card.classList.add('is-active');
    });
  });
  
  // Remove a classe active ao clicar fora
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.team-card')) {
      document.querySelectorAll('.team-card').forEach(c => c.classList.remove('is-active'));
    }
  });
}

/* ===================================================================
   MÓDULO: CLASSIFICAÇÃO
   =================================================================== */
function initStandings(){
  const body = document.getElementById('standingsBody');
  body.innerHTML = STANDINGS_DATA.map(row => `
    <tr>
      <td><span class="pos-badge${row.pos <= 3 ? ' pos-badge--' + row.pos : ''}">${row.pos}</span></td>
      <td class="driver-cell">${row.name}</td>
      <td class="team-cell"><span class="team-dot" style="background:${row.color}"></span>${row.team}</td>
      <td class="points-cell">${row.points} pts</td>
    </tr>
  `).join('');
}

/* ===================================================================
   MÓDULO: NAVEGAÇÃO SUAVE PARA ÂNCORAS
   =================================================================== */
function initSmoothAnchors(){
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const id = link.getAttribute('href').slice(1);
      const target = document.getElementById(id);
      if(target){
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}

/* ===================================================================
   RODAPÉ: ano corrente
   =================================================================== */
function initFooterYear(){
  document.getElementById('footerYear').textContent = new Date().getFullYear();
}

function localizedRace(race){
  const date = new Date(race.dateTime);
  const validDate = !Number.isNaN(date.getTime());
  return {
    ...race,
    date: validDate ? date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' }) : race.dateTime,
    time: validDate ? date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '',
    target: race.dateTime || null
  };
}

async function hydrateFirebaseData(){
  const service = window.CNMFirebase;
  if(!service || !service.configured) return;
  try {
    const data = await service.loadPublicData();
    if(data.news.length) NEWS_DATA = data.news;
    if(data.races.length) RACES_DATA = sortRacesForLanding(data.races.map(localizedRace).map(normalizeRaceStatus));
    if(data.results.length) RESULTS_DATA = data.results;
    if(data.teams.length) TEAMS_DATA = data.teams;
    if(data.drivers.length){
      const teamsById = new Map(data.teams.map(team => [team.id, team]));
      DRIVERS_DATA = data.drivers.map(driver => {
        const team = teamsById.get(driver.teamId) || {};
        return { ...driver, team: team.name || 'Equipe não cadastrada', color: driver.color || team.color || '#E10600', titles: driver.titles || 0, wins: driver.wins || 0, seasons: driver.seasons || 0 };
      });
      DRIVERS_DATA = DRIVERS_DATA.map((driver) => ({
        ...driver,
        photoUrl: driver.photoUrl || '',
        showInHallOfFame: driver.showInHallOfFame === true
      }));
      STANDINGS_DATA = data.standings.map(row => {
        const team = teamsById.get(row.teamId) || {};
        return { ...row, team: team.name || 'Equipe não cadastrada', color: row.color || team.color || '#E10600' };
      });
    }
  } catch(error){
    console.warn('Não foi possível carregar os dados publicados da CNM.', error);
  }
}

/* ===================================================================
   INICIALIZAÇÃO
   =================================================================== */
document.addEventListener('DOMContentLoaded', async () => {
  await hydrateFirebaseData();
  initHeader();
  initNewsSlider();
  initCalendar();
  initWinner();
  initHallOfFame();
  initTeams();
  initTeamStructure();
  initSponsors();
  initStandings();
  initSmoothAnchors();
  initFooterYear();
  initScrollReveal();
});
