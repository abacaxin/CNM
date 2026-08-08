/* ===================================================================
   CNM — página de Regulamento
   Comportamento próprio da página (cabeçalho, sumário, revelação no
   scroll) — sem dependência do Firebase, já que o conteúdo é estático.
   =================================================================== */

const escapeHtml = (value) => String(value ?? '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));

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

  nav.querySelectorAll('.nav__link').forEach(link => link.addEventListener('click', closeNav));

  document.addEventListener('keydown', (e) => {
    if(e.key === 'Escape') closeNav();
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
   MÓDULO: SUMÁRIO (destaca o capítulo visível durante a rolagem)
   =================================================================== */
function initTableOfContents(){
  const links = document.querySelectorAll('#regToc a');
  if(!links.length) return;

  const linkByTarget = new Map(Array.from(links).map(link => [link.getAttribute('href').slice(1), link]));
  const sections = document.querySelectorAll('.reg-card[id]');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const link = linkByTarget.get(entry.target.id);
      if(!link) return;
      link.classList.toggle('is-active', entry.isIntersecting);
    });
  }, { rootMargin: '-45% 0px -50% 0px' });

  sections.forEach(section => observer.observe(section));
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
  const el = document.getElementById('footerYear');
  if(el) el.textContent = new Date().getFullYear();
}

document.addEventListener('DOMContentLoaded', () => {
  initHeader();
  initTableOfContents();
  initSmoothAnchors();
  initFooterYear();
  initScrollReveal();
});
