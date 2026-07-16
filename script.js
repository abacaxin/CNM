/* ===================================================================
   CNM — COPA NEXUS MONOSPOTO
   script.js — comportamento da landing page.
   Os dados vêm do Firestore via window.CNMFirebase (firebase-data.js).
   Os arrays *_DATA abaixo são apenas DEMONSTRAÇÃO: são usados somente
   quando o Firebase não está configurado ou a carga falha — nunca são
   misturados com dados reais.
   =================================================================== */

const CNM = window.CNMFirebase || null;

/* true quando a página está exibindo dados reais publicados pelo painel */
let USING_LIVE_DATA = false;

const escapeHtml = (value) => String(value ?? '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));

/* --------------------------- DADOS DE DEMONSTRAÇÃO --------------------------- */

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
  { name: 'GP Nexus Park',      circuit: 'Circuito Nexus Park',            dateTime: '2026-03-15T19:30:00' },
  { name: 'GP Costa Vermelha',  circuit: 'Autódromo Costa Vermelha',       dateTime: '2026-04-05T20:00:00' },
  { name: 'GP Serra Alta',      circuit: 'Circuito Serra Alta',            dateTime: '2026-04-26T18:00:00' },
  { name: 'GP Baía Litoral',    circuit: 'Circuito Baía Litoral',          dateTime: '2026-05-17T19:00:00' },
  { name: 'GP Distrito Nortis', circuit: 'Street Circuit Distrito Nortis', dateTime: '2026-06-14T20:30:00' },
  { name: 'GP Vale Ferrovia',   circuit: 'Circuito Vale Ferrovia',         dateTime: '2026-07-14T19:00:00' },
  { name: 'GP Deserto Rubro',   circuit: 'Circuito Deserto Rubro',         dateTime: '2026-07-26T20:00:00' },
  { name: 'GP Altiplano',       circuit: 'Circuito Altiplano',             dateTime: '2026-08-16T19:30:00' }
];

let TEAMS_DATA = [
  { name: 'Vortex Racing',        base: 'Sede em Costa Vermelha',  color: '#E10600' },
  { name: 'Titan Motorsport',     base: 'Sede em Serra Alta',      color: '#3E7CB1' },
  { name: 'Apex Dynamics',        base: 'Sede em Nexus Park',      color: '#E8B923' },
  { name: 'Scuderia Rossa Nexus', base: 'Sede em Distrito Nortis', color: '#C9414B' },
  { name: 'Solstice GP',          base: 'Sede em Baía Litoral',    color: '#F2790C' },
  { name: 'Nimbus Engineering',   base: 'Sede em Vale Ferrovia',   color: '#2FB8A6' }
];

let DRIVERS_DATA = [
  { name: 'Camila Rocha',    number: 1,  nat: 'BRA', team: 'Apex Dynamics',        color: '#E8B923', titles: 5, wins: 41, seasons: 11 },
  { name: 'Rafael Duarte',   number: 7,  nat: 'BRA', team: 'Vortex Racing',        color: '#E10600', titles: 4, wins: 38, seasons: 9  },
  { name: 'Marco Ferretti',  number: 22, nat: 'ITA', team: 'Scuderia Rossa Nexus', color: '#C9414B', titles: 3, wins: 33, seasons: 10 },
  { name: 'Elena Kowalski',  number: 3,  nat: 'POL', team: 'Titan Motorsport',     color: '#3E7CB1', titles: 3, wins: 29, seasons: 8  },
  { name: 'Lucas Meirelles', number: 14, nat: 'BRA', team: 'Vortex Racing',        color: '#E10600', titles: 2, wins: 19, seasons: 7  },
  { name: 'Kenji Arata',     number: 44, nat: 'JPN', team: 'Apex Dynamics',        color: '#E8B923', titles: 2, wins: 21, seasons: 7  },
  { name: 'Aisha Bello',     number: 9,  nat: 'NGA', team: 'Solstice GP',          color: '#F2790C', titles: 1, wins: 14, seasons: 6  },
  { name: 'Henrik Sørensen', number: 27, nat: 'DNK', team: 'Titan Motorsport',     color: '#3E7CB1', titles: 1, wins: 11, seasons: 5  }
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

let RESULTS_DATA = [];

/* ícones simples usados nos placeholders de mídia das notícias */
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
   FÁBRICA DE SLIDER (setas + dots + autoplay + swipe)
   Reutilizada por Notícias, Nosso Time e Patrocinadores.
   =================================================================== */
function buildSlider({ sliderId, trackId, dotsId, prevId, nextId, total, dotLabel }){
  const slider = document.getElementById(sliderId);
  const track = document.getElementById(trackId);
  const dotsWrap = document.getElementById(dotsId);
  const prevBtn = document.getElementById(prevId);
  const nextBtn = document.getElementById(nextId);

  if(total <= 1){
    prevBtn.style.display = 'none';
    nextBtn.style.display = 'none';
    dotsWrap.innerHTML = '';
    return;
  }

  dotsWrap.innerHTML = Array.from({ length: total }, (_, i) =>
    `<button class="slider__dot${i === 0 ? ' is-active' : ''}" role="tab" aria-label="${dotLabel} ${i + 1}"></button>`
  ).join('');

  const dots = dotsWrap.querySelectorAll('.slider__dot');
  let index = 0;
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
   MÓDULO: NOTÍCIAS
   =================================================================== */
function initNewsSlider(){
  const track = document.getElementById('sliderTrack');

  if(!NEWS_DATA.length){
    track.innerHTML = `
      <div class="slider__slide">
        <div class="slide__body" style="grid-column: 1 / -1; text-align: center; padding: 60px 24px;">
          <h3 class="slide__title">Nenhuma notícia publicada ainda</h3>
          <p class="slide__desc">As chamadas cadastradas no painel administrativo aparecem aqui automaticamente.</p>
        </div>
      </div>`;
    document.getElementById('prevSlide').style.display = 'none';
    document.getElementById('nextSlide').style.display = 'none';
    document.getElementById('sliderDots').innerHTML = '';
    return;
  }

  track.innerHTML = NEWS_DATA.map(item => `
    <div class="slider__slide">
      <div class="slide__media media-placeholder">
        ${item.imageUrl
          ? `<img class="slide__image" src="${escapeHtml(item.imageUrl)}" alt="${escapeHtml(item.title)}" loading="lazy" onerror="this.remove()">`
          : `<span class="media-placeholder__icon">${ICONS[item.icon] || ''}</span>`}
        <span class="media-placeholder__icon">${escapeHtml(item.category)}</span>
      </div>
      <div class="slide__body">
        <span class="slide__category">${escapeHtml(item.category)}</span>
        <h3 class="slide__title">${escapeHtml(item.title)}</h3>
        <p class="slide__desc">${escapeHtml(item.desc)}</p>
        <a href="#" class="slide__link">Ler mais →</a>
      </div>
    </div>
  `).join('');

  buildSlider({
    sliderId: 'newsSlider', trackId: 'sliderTrack', dotsId: 'sliderDots',
    prevId: 'prevSlide', nextId: 'nextSlide',
    total: NEWS_DATA.length, dotLabel: 'Ir para notícia'
  });
}

/* ===================================================================
   MÓDULO: CALENDÁRIO (card em destaque + lista + contagem regressiva)
   Formato do evento: quali às 12:00 do dia cadastrado; corrida das
   00:00 às 00:00 do dia seguinte (24h). Status e ordenação derivam
   da DATA salva no painel — via helpers de firebase-data.js.
   =================================================================== */

const RACE_FORMAT_TEXT = 'Quali 12:00 · Corrida 24h';

/* acrescenta o texto de exibição pt-BR (só a data importa no formato CNM) */
function localizedRace(race){
  const date = new Date(race.dateTime || '');
  const validDate = !Number.isNaN(date.getTime());
  return {
    ...race,
    date: validDate ? date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' }) : ''
  };
}

function initCalendar(){
  const listWrap = document.getElementById('raceList');
  const feature = {
    circuit: document.getElementById('featureCircuit'),
    name: document.getElementById('featureName'),
    date: document.getElementById('featureDate'),
    time: document.getElementById('featureTime'),
    badge: document.getElementById('featureBadge'),
    statusBlock: document.getElementById('featureStatusBlock')
  };

  /* ordem cronológica (datas inválidas por último) + status calculado agora */
  RACES_DATA = [...RACES_DATA]
    .map((race) => ({ ...race, status: CNM.raceStatus(race) }))
    .sort((a, b) => CNM.raceSortValue(a) - CNM.raceSortValue(b));

  if(!RACES_DATA.length){
    listWrap.innerHTML = '<p class="race-list__empty" style="color: var(--c-muted); text-align: center;">Nenhuma etapa cadastrada ainda.</p>';
    document.getElementById('raceFeature').style.display = 'none';
    return;
  }

  function raceScheduleText(race){
    return (race.date || '').trim() || 'Data a definir';
  }

  listWrap.innerHTML = RACES_DATA.map((race, i) => `
    <div class="race-list__item" tabindex="0" data-index="${i}">
      <div class="race-item__info">
        <span class="race-item__name">${escapeHtml(race.name)}</span>
        <span class="race-item__date">${escapeHtml(raceScheduleText(race))}</span>
      </div>
      <span class="status-badge status-badge--${race.status}">${CNM.raceStatusLabel(race.status)}</span>
    </div>
  `).join('');

  let countdownId = null;

  /* contagem regressiva até a largada da quali (12:00 do dia do GP) */
  function renderCountdown(targetTime){
    clearInterval(countdownId);
    function tick(){
      const diff = targetTime - Date.now();
      if(diff <= 0){
        feature.statusBlock.innerHTML = '<p class="status-message"><span class="live-dot"></span> Classificação em andamento — acompanhe ao vivo</p>';
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

  function renderStatusMessage(race){
    clearInterval(countdownId);
    if(race.status === 'andamento'){
      /* distingue a fase ao vivo: quali (12h–00h) ou corrida (00h–00h do dia seguinte) */
      const phase = CNM.racePhase(race);
      const label = phase === 'quali' ? 'Classificação em andamento' : 'Corrida em andamento';
      feature.statusBlock.innerHTML = `<p class="status-message"><span class="live-dot"></span> ${label} — acompanhe ao vivo</p>`;
    } else if(race.status === 'finalizada'){
      feature.statusBlock.innerHTML = '<p class="status-message">Etapa encerrada — confira o resultado completo</p>';
    } else {
      feature.statusBlock.innerHTML = '<p class="status-message">Data será confirmada em breve</p>';
    }
  }

  function paintFeature(race){
    feature.circuit.textContent = race.circuit || '';
    feature.name.textContent = race.name || '';
    feature.date.textContent = (race.date || '').trim() || 'Data a definir';
    feature.time.textContent = RACE_FORMAT_TEXT;
    feature.badge.textContent = CNM.raceStatusLabel(race.status);
    feature.badge.className = 'race-feature__badge' + (race.status === 'andamento' ? ' is-live' : race.status === 'finalizada' ? ' is-done' : '');

    /* contagem regressiva até a quali (12:00 do dia cadastrado) */
    const qualiStart = CNM.raceTimestamp(race);
    if(race.status === 'proxima' && qualiStart !== null){
      renderCountdown(qualiStart);
    } else {
      renderStatusMessage(race);
    }
  }

  /* destaque padrão: a primeira etapa ainda não finalizada; senão, a última realizada */
  const defaultRace = RACES_DATA.find(r => r.status !== 'finalizada') || RACES_DATA[RACES_DATA.length - 1];
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
   Com dados reais, as estatísticas são CALCULADAS dos resultados
   (vitórias, pódios, pontos) — atualizam sozinhas a cada resultado.
   =================================================================== */
function initHallOfFame(){
  const track = document.getElementById('carouselTrack');
  const viewport = document.getElementById('driverCarousel');

  function cardStats(driver){
    if(driver.hallStats) return driver.hallStats;
    /* dados de demonstração */
    return [
      { value: driver.titles, label: 'Títulos' },
      { value: driver.wins, label: 'Vitórias' },
      { value: driver.seasons, label: 'Temporadas' },
      { value: driver.nat, label: 'País' }
    ];
  }

  function cardMarkup(driver){
    const initials = String(driver.name || 'CNM').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    const stats = cardStats(driver);
    /* foto do piloto (como no card de vencedor); se falhar, volta ao monograma */
    const photo = driver.photoUrl
      ? `<img class="card-driver__photo" src="${escapeHtml(driver.photoUrl)}" alt="${escapeHtml(driver.name)}" loading="lazy" onerror="this.remove()">`
      : '';
    return `
      <div class="card-driver" style="--team-color:${escapeHtml(driver.color || '#E10600')}">
        <div class="card-driver__plate">
          <span class="card-driver__ghost-number">${escapeHtml(driver.number)}</span>
          <span class="card-driver__monogram">${escapeHtml(initials)}</span>
          ${photo}
          <span class="card-driver__number">#${escapeHtml(driver.number)}</span>
          <span class="card-driver__nat">${escapeHtml(driver.nat)}</span>
        </div>
        <p class="card-driver__name">${escapeHtml(driver.name)}</p>
        <p class="card-driver__team">${escapeHtml(driver.team)}</p>
        <div class="card-driver__stats">
          ${stats.map((stat) => `<div class="card-driver__stat"><span class="card-driver__stat-value">${escapeHtml(stat.value)}</span><span class="card-driver__stat-label">${escapeHtml(stat.label)}</span></div>`).join('')}
        </div>
      </div>`;
  }

  /* com dados reais só entram pilotos marcados no painel; na demonstração, todos */
  const hallDrivers = DRIVERS_DATA.filter((driver) => USING_LIVE_DATA ? driver.showInHallOfFame === true : true);
  if(!hallDrivers.length){
    track.innerHTML = '<p class="legends__empty">Nenhum piloto marcado para exibição no Hall da Fama.</p>';
    return;
  }

  /* duplica o conjunto três vezes para permitir loop infinito suave */
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
   MÓDULO: NOSSO TIME (conteúdo institucional fixo)
   =================================================================== */
function initTeamStructure(){
  const TEAM_DATA = [
    { role: 'Dono Geral', members: ['David Tyson De Rossi Cardoso'], founder: true, tag: 'Direção' },
    { role: 'Admin', members: ['Pablo Gutemberg', 'Joao Delmon', 'JonSenna'], tag: 'Operação' },
    { role: 'Video Maker', members: ['Karakama', 'David'], tag: 'Mídia' },
    { role: 'Designer', members: ['Guilherme', 'David'], tag: 'Visual' },
    { role: 'Programador', members: ['Dan'], tag: 'Tech' },
    { role: 'Jornalista', members: ['David'], tag: 'Conteúdo' },
    { role: 'Parcerias', members: ['NGP', 'TWC'], tag: 'Relações' }
  ];

  /* um cargo por slide — seção compacta, com navegação igual à de notícias */
  document.getElementById('teamTrack').innerHTML = TEAM_DATA.map((role, index) => `
    <div class="slider__slide slider__slide--panel">
      <article class="team-role${role.founder ? ' team-role--lead' : ''}" data-index="${String(index + 1).padStart(2, '0')}">
        ${role.founder ? '<span class="team-role__ribbon">Fundador</span>' : ''}
        <div class="team-role__meta">
          <span class="team-role__tag">${escapeHtml(role.tag)}</span>
          <span class="team-role__count">${role.members.length} ${role.members.length === 1 ? 'membro' : 'membros'}</span>
        </div>
        <p class="team-role__title">${escapeHtml(role.role)}</p>
        <div class="team-role__members">
          ${role.members.map((member) => `<p class="team-member${role.founder ? ' founder' : ''}"><span class="team-member__avatar">${escapeHtml(member.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase())}</span><span class="team-member__name">${escapeHtml(member)}</span></p>`).join('')}
        </div>
      </article>
    </div>
  `).join('');

  buildSlider({
    sliderId: 'teamSlider', trackId: 'teamTrack', dotsId: 'teamDots',
    prevId: 'teamPrev', nextId: 'teamNext',
    total: TEAM_DATA.length, dotLabel: 'Ir para cargo'
  });
}

/* ===================================================================
   MÓDULO: PATROCINADORES E PARCERIAS (conteúdo institucional fixo)
   =================================================================== */
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

  /* um apoio por slide — seção compacta, com navegação igual à de notícias */
  document.getElementById('sponsorTrack').innerHTML = SPONSORS_DATA.map((item) => {
    const monogram = item.name.split(' ').map((part) => part[0]).join('').slice(0, 3).toUpperCase();
    return `
      <div class="slider__slide slider__slide--panel">
        <article class="sponsor-card sponsor-card--${item.type}">
          <div class="sponsor-card__shine"></div>
          <div class="sponsor-card__mark">${escapeHtml(monogram)}</div>
          <div class="sponsor-card__inner">
            <span class="sponsor-card__badge">${escapeHtml(item.tier)}</span>
            <p class="sponsor-card__name">${escapeHtml(item.name)}</p>
            <span class="sponsor-card__type">${item.type === 'partnership' ? 'Parceria oficial' : 'Patrocinador'}</span>
          </div>
        </article>
      </div>
    `;
  }).join('');

  buildSlider({
    sliderId: 'sponsorSlider', trackId: 'sponsorTrack', dotsId: 'sponsorDots',
    prevId: 'sponsorPrev', nextId: 'sponsorNext',
    total: SPONSORS_DATA.length, dotLabel: 'Ir para apoio'
  });
}

/* ===================================================================
   MÓDULO: ÚLTIMO VENCEDOR
   Escolhe o resultado mais recente que tenha entradas e mostra o
   piloto que cruzou em primeiro — com tempo real e gap calculado.
   =================================================================== */
function winnerImageMarkup(driver){
  const initials = String(driver.name || 'CNM').split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();
  if(driver.photoUrl){
    return `<img class="winner-card__image" src="${escapeHtml(driver.photoUrl)}" alt="${escapeHtml(driver.name)}" loading="lazy" onerror="this.replaceWith(this.nextElementSibling)"><div class="winner-card__placeholder" hidden>${escapeHtml(initials)}</div>`;
  }
  return `<div class="winner-card__placeholder">${escapeHtml(initials)}</div>`;
}

/* "1:23.456" ou "83.456" -> segundos (número) */
function parseLapTime(value){
  const match = String(value || '').trim().match(/^(?:(\d+):)?(\d{1,2}(?:[.,]\d{1,3})?)$/);
  if(!match) return null;
  return Number(match[1] || 0) * 60 + Number(match[2].replace(',', '.'));
}

function initWinner(){
  const container = document.getElementById('winnerContainer');
  if (!container) return;

  const emptyMessage = '<p style="grid-column: 1/-1; text-align: center; color: var(--c-muted);">Nenhum resultado publicado ainda.</p>';

  /* RESULTS_DATA já vem ordenado (etapa mais recente primeiro) da camada de dados */
  const latestResult = RESULTS_DATA.find((result) => result.entries && result.entries.length);
  if (!latestResult) {
    container.innerHTML = emptyMessage;
    return;
  }

  const entries = latestResult.entries;
  const winnerEntry = entries.find((entry) => Number(entry.position) === 1) || entries[0];
  const runnerUpEntry = entries.find((entry) => Number(entry.position) === 2);
  const winner = DRIVERS_DATA.find((driver) => driver.id === winnerEntry.driverId);
  if (!winner) {
    container.innerHTML = emptyMessage;
    return;
  }

  const lapTime = winnerEntry.lapTime || '—';
  const winnerSeconds = parseLapTime(winnerEntry.lapTime);
  const runnerUpSeconds = parseLapTime(runnerUpEntry?.lapTime);
  const gapToSecond = (winnerSeconds !== null && runnerUpSeconds !== null && runnerUpSeconds >= winnerSeconds)
    ? `+${(runnerUpSeconds - winnerSeconds).toFixed(3)}s`
    : '—';
  const image = winnerImageMarkup(winner);
  const name = escapeHtml(winner.name);
  const team = escapeHtml(winner.team);
  const number = escapeHtml(winner.number);

  container.innerHTML = `
    <div class="winner-card">
      ${image}
    </div>
    <div class="winner-stats">
      <div>
        <p class="winner-name">${name}</p>
        <p class="winner-team">${team}</p>
      </div>
      <div class="stat-row">
        <div class="stat">
          <span class="stat__label">Número</span>
          <span class="stat__value">#${number}</span>
        </div>
        <div class="stat">
          <span class="stat__label">Tempo</span>
          <span class="stat__value">${escapeHtml(lapTime)}</span>
        </div>
      </div>
    </div>

    <div class="winner-flip-container">
      <div class="winner-flip-card">
        <div class="winner-flip-front">
          ${image}
          <div class="winner-flip-front__info">
            <p class="winner-name">${name}</p>
            <p class="winner-team">${team}</p>
            <span class="winner-number">#${number}</span>
          </div>
        </div>
        <div class="winner-flip-back">
          <div>
            <p class="winner-name" style="font-size: 1.5rem; margin-bottom: 0;">${name}</p>
            <p class="winner-team">${team}</p>
          </div>
          <div class="stat-row">
            <div class="stat">
              <span class="stat__label">Tempo</span>
              <span class="stat__value">${escapeHtml(lapTime)}</span>
            </div>
            <div class="stat">
              <span class="stat__label">Gap 2º</span>
              <span class="stat__value">${escapeHtml(gapToSecond)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

/* ===================================================================
   MÓDULO: EQUIPES
   =================================================================== */
function initTeams(){
  const grid = document.getElementById('teamsGrid');

  if(!TEAMS_DATA.length){
    grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--c-muted);">Nenhuma equipe cadastrada ainda.</p>';
    return;
  }

  grid.innerHTML = TEAMS_DATA.map(team => {
    const teamDrivers = DRIVERS_DATA.filter(driver => driver.team === team.name);
    return `
      <div class="team-card" style="--team-color:${escapeHtml(team.color || '#E10600')}">
        <div class="team-card__content">
          <span class="team-card__swatch"></span>
          <p class="team-card__name">${escapeHtml(team.name)}</p>
          <p class="team-card__base">${escapeHtml(team.base)}</p>
        </div>
        <div class="team-card__drivers">
          <p class="team-card__drivers-title">${escapeHtml(team.name)}</p>
          ${teamDrivers.length ? teamDrivers.map(driver => `
            <div class="team-driver">
              <span class="team-driver__name">${escapeHtml(driver.name)}</span>
              <span class="team-driver__number">#${escapeHtml(driver.number)}</span>
            </div>
          `).join('') : '<p class="team-card__empty">Nenhum piloto cadastrado</p>'}
        </div>
      </div>
    `;
  }).join('');

  /* fundo desfocado exibido enquanto um card está em destaque */
  const backdrop = document.createElement('div');
  backdrop.className = 'teams-backdrop';
  document.body.appendChild(backdrop);

  function closeTeamCards(){
    document.querySelectorAll('.team-card').forEach(c => c.classList.remove('is-active'));
    backdrop.classList.remove('is-active');
  }

  grid.querySelectorAll('.team-card').forEach(card => {
    card.addEventListener('click', (e) => {
      e.stopPropagation();
      const wasActive = card.classList.contains('is-active');
      closeTeamCards();
      if(!wasActive){
        card.classList.add('is-active');
        backdrop.classList.add('is-active');
      }
    });
  });

  backdrop.addEventListener('click', closeTeamCards);
  document.addEventListener('keydown', (e) => { if(e.key === 'Escape') closeTeamCards(); });
}

/* ===================================================================
   MÓDULO: CLASSIFICAÇÃO
   =================================================================== */
function initStandings(){
  const body = document.getElementById('standingsBody');

  if(!STANDINGS_DATA.length){
    body.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--c-muted); padding: 28px;">Nenhum piloto cadastrado ainda.</td></tr>';
    return;
  }

  body.innerHTML = STANDINGS_DATA.map(row => `
    <tr>
      <td><span class="pos-badge${row.pos <= 3 ? ' pos-badge--' + row.pos : ''}">${row.pos}</span></td>
      <td class="driver-cell">${escapeHtml(row.name)}</td>
      <td class="team-cell"><span class="team-dot" style="background:${escapeHtml(row.color || '#E10600')}"></span>${escapeHtml(row.team)}</td>
      <td class="points-cell">${Number(row.points) || 0} pts</td>
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

/* ===================================================================
   CARGA DOS DADOS PUBLICADOS
   Fluxo: Admin → Firestore → firebase-data.js → aqui → renderização.
   Quando o Firebase está configurado, os dados publicados SUBSTITUEM
   integralmente os de demonstração (inclusive quando vazios) — assim
   qualquer item criado no painel aparece imediatamente no portal.
   =================================================================== */
async function hydrateFirebaseData(){
  if(!CNM || !CNM.configured) return;
  try {
    const data = await CNM.loadPublicData();
    const teamsById = new Map(data.teams.map(team => [team.id, team]));
    const stats = CNM.getDriverStats(data.drivers, data.results);

    NEWS_DATA = data.news;
    RACES_DATA = data.races;
    RESULTS_DATA = data.results;
    TEAMS_DATA = data.teams;
    DRIVERS_DATA = data.drivers.map(driver => {
      const team = teamsById.get(driver.teamId) || {};
      const record = stats.get(driver.id) || { points: 0, wins: 0, podiums: 0 };
      return {
        ...driver,
        team: team.name || 'Equipe não cadastrada',
        color: driver.color || team.color || '#E10600',
        hallStats: [
          { value: record.wins, label: 'Vitórias' },
          { value: record.podiums, label: 'Pódios' },
          { value: record.points, label: 'Pontos' },
          { value: driver.nat || '—', label: 'País' }
        ]
      };
    });
    STANDINGS_DATA = data.standings.map(row => {
      const team = teamsById.get(row.teamId) || {};
      return { ...row, team: team.name || 'Equipe não cadastrada', color: row.color || team.color || '#E10600' };
    });
    USING_LIVE_DATA = true;
  } catch(error){
    console.error('[CNM] Falha ao carregar os dados publicados; exibindo dados de demonstração.', error);
  }
}

/* ===================================================================
   INICIALIZAÇÃO
   =================================================================== */
document.addEventListener('DOMContentLoaded', async () => {
  await hydrateFirebaseData();
  /* textos de exibição (data/hora pt-BR) para todas as corridas */
  RACES_DATA = RACES_DATA.map(localizedRace);

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

document.addEventListener('DOMContentLoaded', () => {
  const splash = document.getElementById('splash-screen');
  const mainContent = document.getElementById('main-content') || document.querySelector('main');
  const paths = document.querySelectorAll('.dmg-path');
  const subtext = document.querySelector('.subtext');

  // Configurações da Animação
  const config = {
    strokeColor: '#FF0000', // Vermelho original
    glowColor: '#FF3333',   // Brilho ligeiramente mais claro
    drawDuration: 3.5,      // Duração da revelação das letras
    fadeDuration: 1.0,      // Duração do fade out da intro
    subtextDelay: 0.2,      // Delay para o texto secundário aparecer
    holdTime: 1.5           // Tempo que a logo fica acesa antes de sumir
  };

  // Verifica se é o primeiro acesso
  const hasSeenIntro = localStorage.getItem('dmg_intro_seen');

  // Fallback: função para revelar o conteúdo caso a animação falhe
  function revealNow() {
    try { if (splash) splash.style.display = 'none'; } catch (e) {}
    try { if (mainContent) mainContent.style.display = 'block'; } catch (e) {}
    try { document.body.style.overflow = 'auto'; } catch (e) {}
    try { localStorage.setItem('dmg_intro_seen', 'true'); } catch (e) {}
  }

  // Timeout para garantir que o site seja revelado mesmo com erro na animação
  const revealTimeout = setTimeout(() => {
    console.warn('[CNM] Splash timeout — revelando conteúdo principal.');
    revealNow();
  }, 7000);

  try {
    // Inicializa os paths (invisíveis)
    paths.forEach(path => {
      const length = path.getTotalLength();
      // Prepara o efeito de desenho (DrawSVG manual)
      if (window.gsap) {
        gsap.set(path, {
          strokeDasharray: length,
          strokeDashoffset: length,
          opacity: 1
        });
      }
    });

    const tl = window.gsap ? gsap.timeline({
      onComplete: () => {
        // Finaliza a animação e mostra o site
        gsap.to(splash, {
          opacity: 0,
          duration: config.fadeDuration,
          ease: "power2.inOut",
          onComplete: () => {
            if (revealTimeout) clearTimeout(revealTimeout);
            splash.style.display = 'none';
            if (mainContent) mainContent.style.display = 'block';
            document.body.style.overflow = 'auto';
            localStorage.setItem('dmg_intro_seen', 'true');
          }
        });
      }
    }) : null;

    if (!window.gsap || !tl) {
      // Se o GSAP não estiver disponível, revela imediatamente
      console.warn('[CNM] gsap não disponível — revelando conteúdo sem intro.');
      if (revealTimeout) clearTimeout(revealTimeout);
      revealNow();
    } else {
      if (!hasSeenIntro) {
        // --- ANIMAÇÃO COMPLETA (Primeiro Acesso) ---
        tl.to(paths, {
          strokeDashoffset: 0,
          duration: config.drawDuration,
          ease: "power2.inOut",
          stagger: 0.2 // As letras começam em tempos levemente diferentes
        });

        tl.to(paths, {
          filter: `drop-shadow(0 0 8px ${config.glowColor})`,
          duration: 1.5,
          ease: "sine.inOut"
        }, "-=1.5");

        tl.to(subtext, {
          opacity: 1,
          y: 0,
          duration: 0.9,
          ease: "power2.out"
        }, `+=${config.subtextDelay}`);

        tl.to({}, { duration: config.holdTime });
      } else {
        // --- ANIMAÇÃO CURTA (Acessos Seguintes) ---
        gsap.set(paths, { strokeDashoffset: 0 });
        gsap.set(subtext, { opacity: 1, y: 0 });
        tl.from(splash, { opacity: 0, duration: 0.5 });
        tl.to({}, { duration: 1 });
      }
    }
  } catch (err) {
    console.error('[CNM] Erro durante a intro:', err);
    if (revealTimeout) clearTimeout(revealTimeout);
    revealNow();
  }
});

/**
 * Função utilitária para resetar o localStorage (para testes)
 * Chame resetIntro() no console do navegador
 */
window.resetIntro = () => {
    localStorage.removeItem('dmg_intro_seen');
    location.reload();
};