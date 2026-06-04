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
  var activeFilter='all';
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
    grid.querySelectorAll('.r-card').forEach(function(card){
      var cats=card.getAttribute('data-cat').split(' ');
      var match=activeFilter==='all'||cats.indexOf(activeFilter)!==-1;
      card.classList.toggle('hide',!match);
    });
  }
  buildCards();applyFilter();
  var filterRow=document.getElementById('filterRow');
  if(filterRow){
    filterRow.addEventListener('click',function(e){
      var btn=e.target.closest('.chip');if(!btn)return;
      filterRow.querySelectorAll('.chip').forEach(function(c){c.classList.remove('active');});
      btn.classList.add('active');
      activeFilter=btn.getAttribute('data-filter');
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

  /* ---------- ФОРМА ---------- */
  var form=document.getElementById('leadForm');
  if(form){
    form.addEventListener('submit',function(e){
      e.preventDefault();
      var name=document.getElementById('fname').value.trim();
      var phone=document.getElementById('fphone').value.trim();
      if(!name||!phone){
        if(!name)document.getElementById('fname').style.borderColor='var(--terra)';
        if(!phone)document.getElementById('fphone').style.borderColor='var(--terra)';
        return;
      }
      document.getElementById('formBody').style.display='none';
      document.getElementById('formSuccess').classList.add('show');
    });
  }

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
