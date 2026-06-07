/* ============================================================
   Андрей Ванишевский — логика секций 3–9
   ============================================================ */
(function(){
  'use strict';
  var prefersReduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function clamp(v,a,b){return Math.max(a,Math.min(b,v));}

  /* ---------- РЕЗУЛЬТАТЫ: карточки + фильтр ---------- */
  var clients=[
    {name:'Александр Н.', loss:'−24 кг', time:'результат за 7 месяцев', cat:['men'],
     quote:'«Думал, придётся голодать. Оказалось наоборот — стал есть нормально и по-человечески».',
     before:'assets/clients/01-before.jpg', after:'assets/clients/01-after.jpg'},
    {name:'Владимир Б.', loss:'−31 кг', time:'результат за 10 месяцев', cat:['men','45plus'],
     quote:'«В моём возрасте уже не верил, что получится. Андрей доказал обратное — и вес держится».',
     before:'assets/clients/02-before.jpg', after:'assets/clients/02-after.jpg'},
    {name:'Мадина', loss:'−16 кг', time:'результат за 6 месяцев', cat:['women'],
     quote:'«Перестала срываться по вечерам. Впервые ем спокойно, без вины и без жёстких правил».',
     before:'assets/clients/03-before.jpg', after:'assets/clients/03-after.jpg'},
    {name:'Майя', loss:'−19 кг', time:'результат за 8 месяцев', cat:['women'],
     quote:'«Это не про диету, а про новую жизнь. Лёгкость вернулась, и результат остаётся».',
     before:'assets/clients/04-before.jpg', after:'assets/clients/04-after.jpg'},
    {name:'Татьяна', loss:'−14 кг', time:'результат за 5 месяцев', cat:['women','45plus'],
     quote:'«Питание стало образом жизни, а не наказанием. И близкие тоже подтянулись за мной».',
     before:'assets/clients/05-before.jpg', after:'assets/clients/05-after.jpg'}
  ];
  var grid=document.getElementById('resultsGrid');
  // каждый фильтр относится к «оси»: пол или возраст.
  // внутри оси — ИЛИ, между осями — И. пустой набор = показать всё.
  var DIMENSION={men:'gender',women:'gender','45plus':'age'};
  var activeFilters=[];
  function buildCards(){
    if(!grid)return;
    grid.innerHTML='';
    clients.forEach(function(c){
      var card=document.createElement('div');
      card.className='r-card';
      card.setAttribute('data-cat',c.cat.join(' '));
      card.innerHTML=
        '<div class="r-photos">'+
          '<div class="r-ph before"><img src="'+c.before+'" alt="'+c.name+' до" loading="lazy"><span class="tag">До</span></div>'+
          '<div class="r-ph after"><img src="'+c.after+'" alt="'+c.name+' сейчас" loading="lazy"><span class="tag">Сейчас</span></div>'+
        '</div>'+
        '<div class="r-body">'+
          '<div class="r-meta"><span class="r-name">'+c.name+'</span><span class="r-loss">'+c.loss+'</span></div>'+
          '<p class="r-quote">'+c.quote+'</p>'+
          '<div class="r-time">'+c.time+'</div>'+
        '</div>';
      grid.appendChild(card);
    });
  }
  function applyFilter(){
    if(!grid)return;
    // группируем активные фильтры по осям
    var byDim={};
    activeFilters.forEach(function(f){
      var d=DIMENSION[f]||f;
      (byDim[d]=byDim[d]||[]).push(f);
    });
    var dims=Object.keys(byDim);
    var shown=0;
    grid.querySelectorAll('.r-card').forEach(function(card){
      var cats=card.getAttribute('data-cat').split(' ');
      // карта проходит, если по КАЖДОЙ активной оси совпадает хотя бы один тег (И между осями, ИЛИ внутри)
      var match=dims.every(function(d){
        return byDim[d].some(function(f){return cats.indexOf(f)!==-1;});
      });
      card.classList.toggle('hide',!match);
      if(match)shown++;
    });
    var empty=document.getElementById('resultsEmpty');
    if(empty)empty.classList.toggle('show',shown===0);
  }
  function syncChips(){
    if(!filterRow)return;
    filterRow.querySelectorAll('.chip').forEach(function(c){
      var cf=c.getAttribute('data-filter');
      var on=cf==='all'?activeFilters.length===0:activeFilters.indexOf(cf)!==-1;
      c.classList.toggle('active',on);
      c.setAttribute('aria-pressed',on?'true':'false');
    });
  }
  var filterRow=document.getElementById('filterRow');
  buildCards();applyFilter();syncChips();
  if(filterRow){
    filterRow.addEventListener('click',function(e){
      var btn=e.target.closest('.chip');if(!btn)return;
      var f=btn.getAttribute('data-filter');
      if(f==='all'){
        activeFilters=[];
      }else{
        var i=activeFilters.indexOf(f);
        if(i!==-1)activeFilters.splice(i,1);else activeFilters.push(f);
      }
      syncChips();
      applyFilter();
    });
  }

  /* ---------- СЧЁТЧИКИ ---------- */
  function animateCounter(el){
    var target=parseFloat(el.getAttribute('data-count'));
    var prefix=el.getAttribute('data-prefix')||'';
    var suffix=el.getAttribute('data-suffix')||'';
    var dur=1500,start=null;
    function step(ts){
      if(!start)start=ts;
      var p=clamp((ts-start)/dur,0,1);
      var eased=1-Math.pow(1-p,3);
      el.textContent=prefix+Math.round(target*eased)+suffix;
      if(p<1)requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  var counters=Array.prototype.slice.call(document.querySelectorAll('[data-count]'));
  function checkCounters(){
    if(prefersReduced){counters.forEach(function(el){el.textContent=(el.getAttribute('data-prefix')||'')+el.getAttribute('data-count')+(el.getAttribute('data-suffix')||'');});counters=[];return;}
    var vh=window.innerHeight;
    for(var i=counters.length-1;i>=0;i--){
      var rc=counters[i].getBoundingClientRect();
      if(rc.top<vh*0.85&&rc.bottom>0){animateCounter(counters[i]);counters.splice(i,1);}
    }
  }

  /* ---------- ТАЙМЛАЙН ---------- */
  var timeline=document.getElementById('timeline');
  var tlFill=document.getElementById('tlFill');
  var tlSteps=timeline?timeline.querySelectorAll('.tl-step'):[];
  function updateTimeline(){
    if(!timeline)return;
    var r=timeline.getBoundingClientRect();
    var vh=window.innerHeight;
    var p=clamp((vh*0.62-r.top)/r.height,0,1);
    tlFill.style.height=(p*100)+'%';
    var fillPx=r.top+r.height*p;
    tlSteps.forEach(function(st){
      var dr=st.querySelector('.tl-dot').getBoundingClientRect();
      st.classList.toggle('active',dr.top+dr.height/2<=fillPx+4);
    });
  }

  /* ---------- FAQ ---------- */
  var faqList=document.getElementById('faqList');
  if(faqList){
    faqList.addEventListener('click',function(e){
      var q=e.target.closest('.faq-q');if(!q)return;
      var item=q.parentElement;
      var a=item.querySelector('.faq-a');
      var open=item.classList.contains('open');
      faqList.querySelectorAll('.faq-item.open').forEach(function(it){it.classList.remove('open');it.querySelector('.faq-a').style.maxHeight=null;});
      if(!open){item.classList.add('open');a.style.maxHeight=a.scrollHeight+'px';}
    });
  }

  /* ---------- ФОРМА ----------
     Заявка уходит на функцию в Yandex Cloud, которая шлёт письмо
     через Yandex Cloud Postbox. Сюда вставь ссылку своей функции
     вида https://functions.yandexcloud.net/<ID функции>             */
  var LEAD_ENDPOINT='https://functions.yandexcloud.net/d4esmspq1ld9h9qoa60q';

  var form=document.getElementById('leadForm');
  if(form){
    var submitBtn=form.querySelector('button[type="submit"]');
    var btnHtml=submitBtn?submitBtn.innerHTML:'';

    function showError(msg){
      var box=document.getElementById('formError');
      if(!box){
        box=document.createElement('p');
        box.id='formError';
        box.className='form-note';
        box.style.color='var(--terra)';
        box.style.fontWeight='600';
        form.appendChild(box);
      }
      box.textContent=msg;
    }

    form.addEventListener('submit',function(e){
      e.preventDefault();
      var nameEl=document.getElementById('fname');
      var phoneEl=document.getElementById('fphone');
      var name=nameEl.value.trim();
      var phone=phoneEl.value.trim();
      var goal=(document.getElementById('fgoal')||{value:''}).value.trim();

      nameEl.style.borderColor='';
      phoneEl.style.borderColor='';
      if(!name||!phone){
        if(!name)nameEl.style.borderColor='var(--terra)';
        if(!phone)phoneEl.style.borderColor='var(--terra)';
        return;
      }

      var prevError=document.getElementById('formError');
      if(prevError)prevError.textContent='';

      if(LEAD_ENDPOINT.indexOf('http')!==0){
        // Эндпоинт ещё не настроен — показываем успех, но предупреждаем в консоли.
        console.warn('LEAD_ENDPOINT не задан — заявка никуда не отправлена. Вставь ссылку функции в sections.js.');
        document.getElementById('formBody').style.display='none';
        document.getElementById('formSuccess').classList.add('show');
        return;
      }

      if(submitBtn){submitBtn.disabled=true;submitBtn.innerHTML='Отправляем…';}

      fetch(LEAD_ENDPOINT,{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({name:name,phone:phone,goal:goal,page:location.href})
      }).then(function(r){
        if(!r.ok)throw new Error('HTTP '+r.status);
        return r.json().catch(function(){return {};});
      }).then(function(){
        document.getElementById('formBody').style.display='none';
        document.getElementById('formSuccess').classList.add('show');
      }).catch(function(err){
        console.error('Отправка заявки не удалась:',err);
        if(submitBtn){submitBtn.disabled=false;submitBtn.innerHTML=btnHtml;}
        showError('Не удалось отправить заявку. Попробуйте ещё раз или напишите мне в Telegram/WhatsApp.');
      });
    });
  }

  /* ---------- РАЗВОРАЧИВАНИЕ ФОРМЫ (узкие экраны) ---------- */
  var formToggle=document.getElementById('formToggle');
  if(formToggle){
    formToggle.addEventListener('click',function(){
      var card=formToggle.closest('.form-card');
      card.classList.add('expanded');
      formToggle.setAttribute('aria-expanded','true');
      var first=card.querySelector('#fname');
      if(first)setTimeout(function(){first.focus();},60);
    });
  }

  /* ---------- ЛАЙТБОКС ФОТО ФОРМАТОВ ---------- */
  (function(){
    var box=document.getElementById('lightbox');
    if(!box)return;
    var bImg=box.querySelector('img');
    var closeBtn=box.querySelector('.lightbox-close');
    function openBox(src,alt){bImg.src=src;bImg.alt=alt||'';box.classList.add('open');box.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';}
    function closeBox(){box.classList.remove('open');box.setAttribute('aria-hidden','true');document.body.style.overflow='';}
    document.querySelectorAll('[data-zoom]').forEach(function(btn){
      btn.addEventListener('click',function(){var img=btn.querySelector('img');openBox(btn.getAttribute('data-zoom'),img?img.alt:'');});
    });
    box.addEventListener('click',function(e){if(e.target!==bImg)closeBox();});
    if(closeBtn)closeBtn.addEventListener('click',closeBox);
    document.addEventListener('keydown',function(e){if(e.key==='Escape')closeBox();});
  })();

  /* ---------- ПЛАВАЮЩАЯ CTA ---------- */
  var floatCta=document.getElementById('floatCta');
  var contact=document.getElementById('contact');
  function updateFloat(){
    if(!floatCta)return;
    var y=window.scrollY,vh=window.innerHeight;
    var past=y>vh*0.85;
    var atContact=contact&&contact.getBoundingClientRect().top<vh*0.8;
    floatCta.classList.toggle('show',past&&!atContact);
  }

  /* ---------- общий scroll loop ---------- */
  var ticking=false;
  function onScroll(){
    if(!ticking){requestAnimationFrame(function(){checkCounters();updateTimeline();updateFloat();ticking=false;});ticking=true;}
  }
  window.addEventListener('scroll',onScroll,{passive:true});
  window.addEventListener('resize',function(){checkCounters();updateTimeline();updateFloat();});
  checkCounters();updateTimeline();updateFloat();
  setTimeout(function(){checkCounters();updateTimeline();},300);
})();
