// Small interactive comic for the Desafío page
const Desafio = (function(){
  const pages = [
    {
      art: '🌞',
      title: '¡Hola! Soy el Sol',
      subtitle: '93 millones de millas',
      text: 'Vivo en el corazón del sistema solar y doy luz y calor a todos. A veces lanzo llamaradas al espacio.',
      detail: 'A esto lo llamamos "clima espacial".'
    },
    {
      art: '🔥',
      title: 'Tormenta Solar',
      subtitle: 'Viaje de 1-3 días',
      text: 'Las eyecciones de masa coronal (CME) son nubes de partículas que viajan hacia la Tierra a gran velocidad.',
      detail: 'Crean auroras boreales... pero también afectan satélites y GPS.'
    },
    {
      art: '👩‍🌾',
      title: 'Ana, Agricultora',
      subtitle: 'Cultivos inteligentes',
      text: 'Ana usa sensores satelitales y GPS para cuidar sus plantas. Con tormentas solares, las señales fallan.',
      detail: '¡Entonces usa mapas de papel como sus abuelos!'
    },
    {
      art: '✈️',
      title: 'Marco, Piloto',
      subtitle: 'Vuelos seguros',
      text: 'Marco depende del GPS y radio para volar. Las tormentas solares interrumpen las comunicaciones.',
      detail: 'Usa navegación tradicional para mantener a todos seguros.'
    },
    {
      art: '👩‍🚀',
      title: 'Lía, Astronauta',
      subtitle: '400 km de altura',
      text: 'Lía vive en la Estación Espacial sin atmósfera que la proteja de la radiación.',
      detail: 'Se refugia en módulos especiales durante tormentas solares.'
    },
    {
      art: '⚡',
      title: 'Tomás, Operador',
      subtitle: 'Guardián de la red',
      text: 'Las tormentas solares inducen corrientes en cables que pueden dañar transformadores.',
      detail: 'Tomás ajusta la red para evitar apagones masivos.'
    },
    {
      art: '🌍',
      title: '¡Todos Conectados!',
      subtitle: 'Tecnología en riesgo',
      text: 'GPS, internet, TV, radio, electricidad... ¡todo se ve afectado por el clima espacial!',
      detail: '¡Aprende más y comparte esta historia con otros!'
    }
  ];

  let state = { page: 0 };
  let autoplay = false;
  let autoplayTimer = null;

  function $(id){ return document.getElementById(id); }

  function render() {
    const stage = $('comic-stage');
    stage.innerHTML = '';
    const p = pages[state.page];
    const pageEl = document.createElement('div');
    pageEl.className = 'comic-page';

    const art = document.createElement('div');
    art.className = 'comic-illustration';
    
    const emoji = document.createElement('div');
    emoji.className = 'comic-emoji';
    emoji.textContent = p.art;
    art.appendChild(emoji);

    const text = document.createElement('div');
    text.className = 'comic-text';
    
    let html = `<h3>${p.title}</h3>`;
    if (p.subtitle) {
      html += `<p class="comic-subtitle">${p.subtitle}</p>`;
    }
    html += `<p class="comic-main-text">${p.text}</p>`;
    if (p.detail) {
      html += `<p class="comic-detail-text">${p.detail}</p>`;
    }
    
    text.innerHTML = html;

    pageEl.appendChild(art);
    pageEl.appendChild(text);
    stage.appendChild(pageEl);

    // update controls
    $('desafio-prev').disabled = state.page === 0;
    $('desafio-next').disabled = state.page === pages.length - 1;

    renderProgress();
  }

  function next(){ if (state.page < pages.length -1) { state.page++; render(); } }
  function prev(){ if (state.page > 0) { state.page--; render(); } }

  function renderProgress(){
    const container = $('desafio-progress');
    container.innerHTML = '';
    pages.forEach((pg, idx)=>{
      const dot = document.createElement('button');
      dot.className = 'desafio-dot';
      dot.setAttribute('aria-label', `Página ${idx+1}`);
      dot.addEventListener('click', ()=>{ state.page = idx; render(); });
      if(idx === state.page) dot.classList.add('active');
      container.appendChild(dot);
    });
  }

  function toggleAutoplay(){
    autoplay = !autoplay;
    const btn = $('desafio-play');
    const icon = btn.querySelector('.play-icon');
    btn.setAttribute('aria-pressed', String(autoplay));
    icon.textContent = autoplay? '⏸':'▶';
    if(autoplay) startAutoplay(); else stopAutoplay();
  }

  function startAutoplay(){
    stopAutoplay();
    autoplayTimer = setInterval(()=>{
      if(state.page < pages.length -1) next(); else { stopAutoplay(); }
    }, 3800);
  }

  function stopAutoplay(){ if(autoplayTimer) { clearInterval(autoplayTimer); autoplayTimer = null; } }

  function readCurrent(){
    if(!('speechSynthesis' in window)) { alert('Tu navegador no soporta lectura en voz'); return; }
    const p = pages[state.page];
    let textToRead = p.title;
    if (p.subtitle) textToRead += `. ${p.subtitle}`;
    textToRead += `. ${p.text}`;
    if (p.detail) textToRead += ` ${p.detail}`;
    
    const utter = new SpeechSynthesisUtterance(textToRead);
    utter.lang = 'es-ES';
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  }

  function bind() {
    $('desafio-next').addEventListener('click', next);
    $('desafio-prev').addEventListener('click', prev);
    $('desafio-home').addEventListener('click', ()=> location.href = 'index.html');
    $('desafio-play').addEventListener('click', toggleAutoplay);
    $('desafio-read').addEventListener('click', readCurrent);
    document.addEventListener('keydown', (ev)=>{
      if(ev.key === 'ArrowRight') next();
      if(ev.key === 'ArrowLeft') prev();
    });
  }

  function init(){ if(!$('comic-stage')) return; bind(); render(); }

  return { init };
})();

window.addEventListener('DOMContentLoaded', ()=> Desafio.init());
