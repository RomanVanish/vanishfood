/* ============================================================
   Андрей Ванишевский — интерактив лендинга
   ============================================================ */
(function () {
  'use strict';

  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- утилиты ---------- */
  function hexToRgb(h) {
    h = h.replace('#', '');
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  /* ============================================================
     1. Плавная смена фона при скролле (scroll-triggered palette)
     ============================================================ */
  var sections = Array.prototype.slice.call(document.querySelectorAll('section[data-bg]'));
  var bgLayer = document.getElementById('bg-layer');
  var sectionColors = sections.map(function (s) { return hexToRgb(s.getAttribute('data-bg')); });

  function updateBg() {
    var mid = window.scrollY + window.innerHeight * 0.5;
    var idx = 0;
    for (var i = 0; i < sections.length; i++) {
      if (sections[i].offsetTop <= mid) idx = i;
    }
    var cur = sections[idx];
    var next = sections[idx + 1];
    var col;
    if (next) {
      var start = cur.offsetTop;
      var end = next.offsetTop;
      var t = clamp((mid - start) / (end - start), 0, 1);
      // плавим только в нижней трети секции — «перетекание по дуге»
      var te = clamp((t - 0.55) / 0.45, 0, 1);
      var c0 = sectionColors[idx], c1 = sectionColors[idx + 1];
      col = [Math.round(lerp(c0[0], c1[0], te)), Math.round(lerp(c0[1], c1[1], te)), Math.round(lerp(c0[2], c1[2], te))];
    } else {
      col = sectionColors[idx];
    }
    bgLayer.style.backgroundColor = 'rgb(' + col[0] + ',' + col[1] + ',' + col[2] + ')';
  }

  /* ============================================================
     2. Parallax на Hero-фото
     ============================================================ */
  var heroPhoto = document.getElementById('heroPhoto');
  function updateParallax() {
    if (prefersReduced || !heroPhoto) return;
    var strength = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--parallax')) || 6;
    var f = strength / 100; // 0..0.1
    var y = window.scrollY * f * 1.6;
    heroPhoto.style.transform = 'translateY(' + y + 'px)';
  }

  /* ============================================================
     3. Навигация: фон при скролле, плавающая CTA, бургер
     ============================================================ */
  var nav = document.getElementById('nav');
  var floatCta = document.getElementById('floatCta');
  function updateNav() {
    var y = window.scrollY;
    nav.classList.toggle('scrolled', y > 40);
    floatCta.classList.toggle('show', y > window.innerHeight * 0.9);
  }
  document.getElementById('burger').addEventListener('click', function () {
    nav.classList.toggle('mobile-open');
  });
  document.getElementById('navLinks').addEventListener('click', function (e) {
    if (e.target.tagName === 'A') nav.classList.remove('mobile-open');
  });

  /* ============================================================
     4. Reveal при появлении (rect-based — надёжно в любой среде)
     ============================================================ */
  var revealEls = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
  function markShown(el) { el.classList.add('reveal-shown'); }
  function reveal(el) {
    el.classList.add('in');
    el.addEventListener('animationend', function () { markShown(el); }, { once: true });
    setTimeout(function () { markShown(el); }, 1100); // failsafe: всегда станет видимым
  }
  function checkReveal() {
    if (prefersReduced) { revealEls.forEach(function (el) { el.classList.add('in', 'reveal-shown'); }); revealEls = []; return; }
    var vh = window.innerHeight;
    revealEls = revealEls.filter(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < vh * 0.9 && r.bottom > 0) { reveal(el); return false; }
      return true;
    });
  }

  /* ============================================================
     5. Счётчики «накрутка»
     ============================================================ */
  function animateCounter(el) {
    var target = parseFloat(el.getAttribute('data-count'));
    var prefix = el.getAttribute('data-prefix') || '';
    var suffix = el.getAttribute('data-suffix') || '';
    var dur = 1400, start = null;
    function step(ts) {
      if (!start) start = ts;
      var p = clamp((ts - start) / dur, 0, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      var val = Math.round(target * eased);
      el.textContent = prefix + val + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  var counterEls = Array.prototype.slice.call(document.querySelectorAll('[data-count]'));
  function checkCounters() {
    if (prefersReduced) {
      counterEls.forEach(function (el) { el.textContent = (el.getAttribute('data-prefix') || '') + el.getAttribute('data-count') + (el.getAttribute('data-suffix') || ''); });
      counterEls = []; return;
    }
    var vh = window.innerHeight;
    counterEls = counterEls.filter(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < vh * 0.85 && r.bottom > 0) { animateCounter(el); return false; }
      return true;
    });
  }

  /* ============================================================
     6. Before / After перетягиваемый слайдер
     ============================================================ */
  var ba = document.getElementById('ba');
  if (ba) {
    var baBefore = document.getElementById('baBefore');
    var baDivider = document.getElementById('baDivider');
    var dragging = false;
    function setBA(clientX) {
      var r = ba.getBoundingClientRect();
      var pct = clamp((clientX - r.left) / r.width, 0.04, 0.96) * 100;
      baBefore.style.clipPath = 'inset(0 ' + (100 - pct) + '% 0 0)';
      baDivider.style.left = pct + '%';
    }
    function down(e) { dragging = true; setBA((e.touches ? e.touches[0] : e).clientX); e.preventDefault(); }
    function move(e) { if (dragging) setBA((e.touches ? e.touches[0] : e).clientX); }
    function up() { dragging = false; }
    baDivider.addEventListener('mousedown', down);
    ba.addEventListener('mousedown', down);
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    baDivider.addEventListener('touchstart', down, { passive: false });
    ba.addEventListener('touchstart', down, { passive: false });
    window.addEventListener('touchmove', move, { passive: true });
    window.addEventListener('touchend', up);
  }

  /* ============================================================
     7. Результаты клиентов: карточки, фильтр, «показать ещё»
     ============================================================ */
  var clientsData = [
    { name: 'Марина, 38', loss: '−18 кг', time: 'за 6 мес', cat: ['women'], quote: '«Перестала срываться по вечерам — впервые ем спокойно и без вины».' },
    { name: 'Игорь, 42', loss: '−24 кг', time: 'за 8 мес', cat: ['men'], quote: '«Думал, придётся голодать. А оказалось — наоборот, стал есть нормально».' },
    { name: 'Елена, 51', loss: '−12 кг', time: 'за 5 мес', cat: ['women', '45plus'], quote: '«В 51 думала, поздно. Андрей показал, что нет. Вернулась лёгкость».' },
    { name: 'Анна, 34', loss: '−15 кг', time: 'за 7 мес', cat: ['women'], quote: '«Главное — результат держится уже год. Это не очередная диета».' },
    { name: 'Сергей, 47', loss: '−21 кг', time: 'за 9 мес', cat: ['men', '45plus'], quote: '«Чат поддержки реально вытаскивал в моменты, когда хотел всё бросить».' },
    { name: 'Ольга, 45', loss: '−16 кг', time: 'за 6 мес', cat: ['women', '45plus'], quote: '«Питание стало образом жизни, а не наказанием. Семья тоже подтянулась».' }
  ];
  var grid = document.getElementById('resultsGrid');
  var visibleStep = 3;
  var shownCount = visibleStep;
  var activeFilter = 'all';

  function buildCards() {
    grid.innerHTML = '';
    clientsData.forEach(function (c, i) {
      var card = document.createElement('div');
      card.className = 'result-card';
      card.setAttribute('data-cat', c.cat.join(' '));
      card.innerHTML =
        '<div class="rc-photos">' +
          '<image-slot id="rc-' + i + 'a" style="width:100%;height:100%" shape="rect" placeholder="до"></image-slot>' +
          '<image-slot id="rc-' + i + 'b" style="width:100%;height:100%" shape="rect" placeholder="после"></image-slot>' +
        '</div>' +
        '<div class="rc-body">' +
          '<div class="rc-meta"><span class="rc-name">' + c.name + '</span><span class="rc-loss">' + c.loss + '</span></div>' +
          '<p class="rc-quote">' + c.quote + '</p>' +
          '<div class="rc-time">' + c.time + '</div>' +
        '</div>';
      grid.appendChild(card);
    });
    applyFilter();
  }
  function applyFilter() {
    var cards = grid.querySelectorAll('.result-card');
    var shown = 0;
    cards.forEach(function (card) {
      var cats = card.getAttribute('data-cat').split(' ');
      var match = activeFilter === 'all' || cats.indexOf(activeFilter) !== -1;
      if (match && shown < shownCount) { card.classList.remove('hide'); shown++; }
      else card.classList.add('hide');
    });
    // скрыть «показать ещё», если показаны все подходящие
    var total = 0;
    cards.forEach(function (card) {
      var cats = card.getAttribute('data-cat').split(' ');
      if (activeFilter === 'all' || cats.indexOf(activeFilter) !== -1) total++;
    });
    document.getElementById('moreBtn').style.display = shown >= total ? 'none' : '';
  }
  buildCards();
  document.getElementById('filterRow').addEventListener('click', function (e) {
    var btn = e.target.closest('.chip');
    if (!btn) return;
    document.querySelectorAll('.chip').forEach(function (c) { c.classList.remove('active'); });
    btn.classList.add('active');
    activeFilter = btn.getAttribute('data-filter');
    shownCount = visibleStep;
    applyFilter();
  });
  document.getElementById('moreBtn').addEventListener('click', function () {
    shownCount += visibleStep;
    applyFilter();
  });

  /* ============================================================
     8. Таймлайн: заполнение прогресс-линии + активные шаги
     ============================================================ */
  var timeline = document.getElementById('timeline');
  var tlFill = document.getElementById('tlFill');
  var tlSteps = timeline ? timeline.querySelectorAll('.tl-step') : [];
  function updateTimeline() {
    if (!timeline) return;
    var r = timeline.getBoundingClientRect();
    var vh = window.innerHeight;
    var p = clamp((vh * 0.6 - r.top) / r.height, 0, 1);
    tlFill.style.height = (p * 100) + '%';
    var fillPx = r.top + r.height * p;
    tlSteps.forEach(function (st) {
      var dr = st.querySelector('.tl-dot').getBoundingClientRect();
      st.classList.toggle('active', dr.top + dr.height / 2 <= fillPx + 2);
    });
  }

  /* ============================================================
     9. Путь-линия в блоке системы
     ============================================================ */
  var pathFill = document.getElementById('pathFill');
  var levelsPath = document.querySelector('.levels-path');
  var pathDone = false;
  function checkPath() {
    if (pathDone || !pathFill) return;
    if (prefersReduced) { pathFill.style.width = '100%'; pathDone = true; return; }
    if (!levelsPath) return;
    var r = levelsPath.getBoundingClientRect();
    if (r.top < window.innerHeight * 0.7 && r.bottom > 0) { pathFill.style.width = '100%'; pathDone = true; }
  }

  /* ============================================================
     10. FAQ аккордеон
     ============================================================ */
  document.getElementById('faq').addEventListener('click', function (e) {
    var q = e.target.closest('.faq-q');
    if (!q) return;
    var item = q.parentElement;
    var a = item.querySelector('.faq-a');
    var open = item.classList.contains('open');
    // закрыть остальные
    document.querySelectorAll('.faq-item.open').forEach(function (it) {
      it.classList.remove('open');
      it.querySelector('.faq-a').style.maxHeight = null;
    });
    if (!open) {
      item.classList.add('open');
      a.style.maxHeight = a.scrollHeight + 'px';
    }
  });

  /* ============================================================
     11. Форма заявки
     ============================================================ */
  document.getElementById('leadForm').addEventListener('submit', function (e) {
    e.preventDefault();
    document.getElementById('formBody').style.display = 'none';
    document.getElementById('formSuccess').classList.add('show');
  });

  /* ============================================================
     Главный scroll-loop (rAF)
     ============================================================ */
  var ticking = false;
  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(function () {
        updateBg();
        updateParallax();
        updateNav();
        updateTimeline();
        checkReveal();
        checkCounters();
        checkPath();
        ticking = false;
      });
      ticking = true;
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', function () { updateBg(); updateTimeline(); checkReveal(); checkCounters(); checkPath(); });
  updateBg(); updateNav(); updateTimeline(); updateParallax();
  checkReveal(); checkCounters(); checkPath();
  // повторная проверка после полной загрузки шрифтов/слотов
  window.addEventListener('load', function () { checkReveal(); checkCounters(); checkPath(); updateTimeline(); });
  setTimeout(function () { checkReveal(); checkCounters(); }, 400);
})();
