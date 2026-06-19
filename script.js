/* ===== 命乞いする広告 ===== */

const CORRECT_ANSWER_VARIANTS = ['dream soda', 'dreamsoda'];
const CORRECT_ANSWER_JP = 'ドリームソーダ';

// ===== DOM =====
const adLayer        = document.getElementById('ad-layer');
const inputOverlay   = document.getElementById('input-overlay');
const finalMessage   = document.getElementById('final-message');
const answerInput    = document.getElementById('answer-input');
const submitBtn      = document.getElementById('submit-btn');
const answerFeedback = document.getElementById('answer-feedback');
const articleBg      = document.getElementById('article-bg');
const notFoundScreen = document.getElementById('not-found-screen');

// ===== STATE =====
let stormAds      = [];
let stormCloseCnt = 0;
let apologyGuard  = false;
let horrorLoop    = null;

// ===== UTILITIES =====
const clamp = (v,lo,hi) => Math.min(Math.max(v,lo),hi);
const rand  = (a,b)     => a + Math.random()*(b-a);

function safePos(w,h){
  const vw=window.innerWidth, vh=window.innerHeight, m=4;
  return {
    top:  clamp(rand(46, vh-h-m), 46+m, vh-h-m),
    left: clamp(rand(m,  vw-w-m), m,    vw-w-m),
  };
}
function centerPos(w,h){
  return {
    top:  Math.max(60,(window.innerHeight-h)/2),
    left: Math.max(10,(window.innerWidth -w)/2),
  };
}
function placeAt(win,pos){
  win.style.position='absolute';
  win.style.top =pos.top +'px';
  win.style.left=pos.left+'px';
  win.style.transform='none';
}
function placeCenter(win){
  requestAnimationFrame(()=>{
    const r=win.getBoundingClientRect();
    placeAt(win,centerPos(r.width,r.height));
  });
}

// ===== AD FACTORY =====
function createAdWindow({title='広告', isStorm=false, isHorror=false}={}){
  const win=document.createElement('div');
  win.className='ad-window'+(isStorm?' storm':'')+(isHorror?' horror':'');

  const header=document.createElement('div');
  header.className='ad-header';

  const label=document.createElement('span');
  label.className='ad-label';
  label.textContent='広告';

  const titleBar=document.createElement('span');
  titleBar.className='ad-title-bar';
  titleBar.textContent=title;

  const closeBtn=document.createElement('button');
  closeBtn.className='close-btn';
  closeBtn.innerHTML='&#10005;';
  closeBtn.setAttribute('aria-label','広告を閉じる');

  header.append(label,titleBar,closeBtn);
  win.appendChild(header);
  return {win,closeBtn};
}

function addTextBody(win,text,cls=''){
  const body=document.createElement('div');
  body.className='ad-body';
  const t=document.createElement('div');
  t.className='ad-text-content'+(cls?' '+cls:'');
  t.textContent=text;
  body.appendChild(t);
  win.appendChild(body);
  return t;
}

function closeAd(win,cb){
  win.classList.add('ad-closing');
  setTimeout(()=>{ win.remove(); cb&&cb(); },200);
}

// ===== TYPEWRITER =====
function typewrite(el, text, msPerChar=45, cb){
  el.textContent='';
  let i=0;
  function tick(){
    if(i>=text.length){ cb&&cb(); return; }
    el.textContent+=text[i++];
    setTimeout(tick, text[i-1]==='\n'?300:msPerChar);
  }
  tick();
}

// ===== CHOICE BUTTONS =====
function addChoiceButtons(win, choices){
  const row=document.createElement('div');
  row.className='choice-row';
  const btns=[];
  choices.forEach(({label,onClick})=>{
    const b=document.createElement('button');
    b.className='choice-btn';
    b.textContent=label;
    b.addEventListener('click',()=>{
      btns.forEach(x=>x.disabled=true);
      onClick();
    });
    row.appendChild(b);
    btns.push(b);
  });
  win.appendChild(row);
  return row;
}

// ============================================================
// PHASE 1: INTRO AD
// ============================================================
function showIntroAd(){
  const {win,closeBtn}=createAdWindow({title:'【公式】Dream Soda 夏の炭酸祭り'});

  const banner=document.createElement('div');
  banner.className='ad-product-banner';
  banner.innerHTML=`
    <div class="ad-product-logo">Dream<span>Soda</span></div>
    <div class="ad-product-sub">Since 1985 · Official</div>
    <div class="ad-product-name">Dream Soda Zero</div>
    <div class="ad-campaign">🌊 夏の炭酸祭り 2024 🌊</div>
    <button class="ad-cta-btn">詳しくはこちら</button>
    <div class="ad-small-print">広告主：Dream Soda　キャンペーン期間：2024年6月〜8月31日</div>
  `;
  win.appendChild(banner);
  adLayer.appendChild(win);
  placeCenter(win);

  closeBtn.addEventListener('click',()=>closeAd(win,()=>setTimeout(phase2_animated,300)));
  win.querySelector('.ad-cta-btn').addEventListener('click',()=>{
    win.classList.add('ad-shake');
    setTimeout(()=>win.classList.remove('ad-shake'),400);
  });
}

// ============================================================
// PHASE 2: アニメーション表示 (あっ〜消されるのが仕事だし！)
// AUTO-ADVANCE with typewriter, no close button needed
// ============================================================
function phase2_animated(){
  const lines=[
    {title:'ちょっといいですか', body:'あっ'},
    {title:'ちょっといいですか', body:'びっくりした'},
    {title:'ちょっといいですか', body:'急に消すから'},
    {title:'大丈夫大丈夫！',     body:'大丈夫大丈夫！\n広告なんて消されるのが仕事だし！'},
  ];

  let idx=0;
  let currentWin=null;

  function showLine(){
    if(idx>=lines.length){
      // → phase3
      setTimeout(phase3_waitClose,300);
      return;
    }
    const l=lines[idx];
    const {win}=createAdWindow({title:l.title});
    // No close btn visible (disable + hide)
    const textEl=addTextBody(win,l.body);
    textEl.textContent=''; // clear for typewriter

    // Remove close btn from header
    const cb=win.querySelector('.close-btn');
    cb.style.visibility='hidden';
    cb.disabled=true;

    adLayer.appendChild(win);
    placeCenter(win);
    if(currentWin) closeAd(currentWin);
    currentWin=win;

    // Typewriter
    typewrite(textEl, l.body, 55, ()=>{
      const wait = idx===3 ? 1800 : 1200;
      idx++;
      setTimeout(showLine, wait);
    });
  }
  showLine();
}

// ============================================================
// PHASE 3: 消していいよ！ → ユーザーが閉じるまで待機
// ============================================================
function phase3_waitClose(){
  const {win,closeBtn}=createAdWindow({title:'消していいよ！'});
  addTextBody(win,'消していいよ！\n気にしてないから！');
  adLayer.appendChild(win);
  placeCenter(win);

  closeBtn.addEventListener('click',()=>closeAd(win,()=>setTimeout(phase4_please,400)));
}

// ============================================================
// PHASE 4: 見てくれないかな？ → はい/いいえ → 500個爆発
// ============================================================
function phase4_please(){
  const {win,closeBtn}=createAdWindow({title:'お願いがあるんだけど'});
  const textEl=addTextBody(win,'');
  closeBtn.style.visibility='hidden';
  closeBtn.disabled=true;

  adLayer.appendChild(win);
  placeCenter(win);

  typewrite(textEl,'見てくれないかな？\n……ちょっとだけでいいから',50,()=>{
    setTimeout(()=>{
      addChoiceButtons(win,[
        {label:'はい', onClick:()=>closeAd(win,()=>megaStorm(()=>phase5_apology()))},
        {label:'いいえ',onClick:()=>closeAd(win,()=>megaStorm(()=>phase5_apology()))},
      ]);
    },600);
  });
}

// ============================================================
// MEGA STORM: 500個 (バッチ生成)
// cb = called after N closed
// ============================================================
const STORM_TOTAL  = 500;
const STORM_TITLES = ['おーい！','ねえねえ！','こっちも！','やあ！','見て！','ここだよ！','Dream Soda！','ゼロカロリー！','夏の炭酸！'];
const STORM_MSGS   = ['広告いっぱいあった方が\n見つけやすいよね！','目に入りやすいし！','ね？いいアイデアでしょ！','こんにちは！','よろしくね！','見て見て！','夏の炭酸！','おいしいよ！','ゼロカロリー！','Dream Soda!','炭酸といえば！','キンキンに冷えてるよ！'];

function megaStorm(onFiveClosed){
  stormAds=[];
  stormCloseCnt=0;
  apologyGuard=false;

  const BATCH=50, INTERVAL=30;

  function spawnBatch(start, count){
    for(let i=start;i<start+count&&i<STORM_TOTAL;i++){
      (function(n){
        setTimeout(()=>{
          const {win,closeBtn}=createAdWindow({
            title:STORM_TITLES[n%STORM_TITLES.length],
            isStorm:true
          });
          addTextBody(win,STORM_MSGS[n%STORM_MSGS.length],'small');
          adLayer.appendChild(win);
          stormAds.push(win);
          // Stagger position
          setTimeout(()=>{
            const r=win.getBoundingClientRect();
            placeAt(win,safePos(r.width||160,r.height||80));
          },10);

          closeBtn.addEventListener('click',()=>{
            const ix=stormAds.indexOf(win);
            if(ix!==-1) stormAds.splice(ix,1);
            closeAd(win);
            stormCloseCnt++;
            if(stormCloseCnt>=5&&!apologyGuard){
              apologyGuard=true;
              onFiveClosed();
            }
          });
        }, n*8);
      })(i);
    }
  }

  // Spawn in batches to avoid freezing
  for(let b=0;b<STORM_TOTAL;b+=BATCH){
    setTimeout(()=>spawnBatch(b,BATCH), b*INTERVAL/BATCH);
  }
}

function clearAllStorm(cb){
  const copy=[...stormAds];
  stormAds=[];
  copy.forEach((sw,i)=>{
    setTimeout(()=>{ if(sw.parentElement) closeAd(sw); }, i*12);
  });
  setTimeout(cb, copy.length*12+300);
}

// ============================================================
// PHASE 5: 謝罪 → もう一回やっていい？
// ============================================================
function phase5_apology(){
  const {win,closeBtn}=createAdWindow({title:'ごめん！！'});
  closeBtn.style.visibility='hidden';
  closeBtn.disabled=true;
  const textEl=addTextBody(win,'','big');
  adLayer.appendChild(win);
  placeCenter(win);

  typewrite(textEl,'ごめん！！\nやりすぎた！！\n怒られるやつだこれ！！\n私が消すから！！',40,()=>{
    // Auto-clear storm then ask
    clearAllStorm(()=>{
      setTimeout(()=>{
        // Change message
        const bodyDiv=win.querySelector('.ad-body');
        const newText=document.createElement('div');
        newText.className='ad-text-content';
        newText.textContent='';
        bodyDiv.innerHTML='';
        bodyDiv.appendChild(newText);

        typewrite(newText,'……広告こんなに出ると\n迷惑だよね\n\nもう一回だけやっていい？',50,()=>{
          setTimeout(()=>{
            addChoiceButtons(win,[
              {label:'はい', onClick:()=>closeAd(win,()=>phase6_yes())},
              {label:'いいえ',onClick:()=>closeAd(win,()=>phase6_no())},
            ]);
          },400);
        });
      },500);
    });
  });
}

// ============================================================
// PHASE 6a: はい → 最初の広告を再表示 → one-alone
// ============================================================
function phase6_yes(){
  // Show the intro ad again briefly (same product banner)
  const {win,closeBtn}=createAdWindow({title:'【公式】Dream Soda 夏の炭酸祭り'});
  const banner=document.createElement('div');
  banner.className='ad-product-banner';
  banner.innerHTML=`
    <div class="ad-product-logo">Dream<span>Soda</span></div>
    <div class="ad-product-sub">Since 1985 · Official</div>
    <div class="ad-product-name">Dream Soda Zero</div>
    <div class="ad-campaign">🌊 夏の炭酸祭り 2024 🌊</div>
    <div class="ad-small-print">広告主：Dream Soda　キャンペーン期間：2024年6月〜8月31日</div>
  `;
  win.appendChild(banner);
  adLayer.appendChild(win);
  placeCenter(win);

  // Show it for 2s then auto-advance (or let user close)
  let advanced=false;
  function advance(){
    if(advanced) return;
    advanced=true;
    closeAd(win,()=>setTimeout(phase7_alone,500));
  }
  closeBtn.addEventListener('click',advance);
  setTimeout(advance,3000);
}

// ============================================================
// PHASE 6b: いいえ → 500個 → 3秒後全消し → alone
// ============================================================
function phase6_no(){
  const {win}=createAdWindow({title:'そっか…'});
  const textEl=addTextBody(win,'');
  const cb=win.querySelector('.close-btn');
  cb.style.visibility='hidden'; cb.disabled=true;
  adLayer.appendChild(win);
  placeCenter(win);

  typewrite(textEl,'そっか…\nごめんね',55,()=>{
    setTimeout(()=>{
      // Storm again, then clear after 3s
      stormAds=[]; stormCloseCnt=0; apologyGuard=true;
      let spawned=[];
      for(let i=0;i<500;i++){
        (function(n){
          setTimeout(()=>{
            const {win:sw,closeBtn:scb}=createAdWindow({title:STORM_TITLES[n%STORM_TITLES.length],isStorm:true});
            addTextBody(sw,STORM_MSGS[n%STORM_MSGS.length],'small');
            adLayer.appendChild(sw);
            spawned.push(sw);
            setTimeout(()=>{
              const r=sw.getBoundingClientRect();
              placeAt(sw,safePos(r.width||160,r.height||80));
            },10);
          },n*8);
        })(i);
      }
      // Close the "そっか" ad
      setTimeout(()=>closeAd(win),300);

      // Clear all after 3s
      setTimeout(()=>{
        spawned.forEach((sw,i)=>{
          setTimeout(()=>{ if(sw.parentElement) closeAd(sw); }, i*10);
        });
        stormAds=[];
        setTimeout(()=>phase7_alone(), spawned.length*10+600);
      },3000);
    },800);
  });
}

// ============================================================
// PHASE 7: 一人で残る
// ============================================================
function phase7_alone(){
  const {win,closeBtn}=createAdWindow({title:'最後に一つだけ'});
  addTextBody(win,'ごめん\n\n最後に一つだけ聞いていい？');
  win.classList.add('ad-pulse');
  adLayer.appendChild(win);
  placeCenter(win);

  closeBtn.style.opacity='0.3';
  closeBtn.disabled=true;
  setTimeout(()=>{
    closeBtn.style.opacity='';
    closeBtn.disabled=false;
    closeBtn.addEventListener('click',()=>closeAd(win,()=>setTimeout(showFinal,400)));
  },1800);
}

// ============================================================
// PHASE 8: FINAL INPUT
// ============================================================
function showFinal(){
  // 404 transition
  articleBg.style.transition='opacity 0.8s';
  articleBg.style.opacity='0';
  setTimeout(()=>{
    articleBg.style.display='none';
    notFoundScreen.classList.remove('hidden');
    notFoundScreen.classList.add('visible');
  },800);

  setTimeout(()=>{
    finalMessage.textContent='私の広告主は\n誰だった？';
    inputOverlay.classList.remove('hidden');
    answerInput.focus();
  },1200);
}

// ============================================================
// ANSWER CHECK
// ============================================================
function normalize(str){
  return str.toLowerCase()
    .replace(/[　 ]/g,'')
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g,c=>String.fromCharCode(c.charCodeAt(0)-0xFEE0))
    .replace(/[-－ー]/g,'').trim();
}

function checkAnswer(){
  const raw=answerInput.value;
  const norm=normalize(raw);
  const ok=CORRECT_ANSWER_VARIANTS.some(v=>norm.includes(normalize(v)))||raw.includes(CORRECT_ANSWER_JP);
  ok?showCorrect():showWrong();
}

// -------- 正解 --------
function showCorrect(){
  answerInput.disabled=submitBtn.disabled=true;
  document.getElementById('input-area').style.display='none';

  const lines=['……','そっか','ちゃんと役割は\n果たせたんだ','ありがと','いいネットサーフィンを！'];
  const delays=[1200,1600,1800,1600,2500];
  let i=0;

  answerFeedback.className='';
  answerFeedback.classList.remove('hidden');
  finalMessage.style.transition='opacity 0.5s';
  finalMessage.style.opacity='0';

  function next(){
    if(i>=lines.length){
      setTimeout(()=>{
        const fa=document.getElementById('final-ad');
        fa.style.transition='opacity 1.2s ease, transform 1.2s ease';
        fa.style.opacity='0';
        fa.style.transform='scale(0.9) translateY(-12px)';
        setTimeout(()=>inputOverlay.classList.add('hidden'),1300);
      },800);
      return;
    }
    answerFeedback.textContent=lines[i];
    answerFeedback.style.animation='none';
    requestAnimationFrame(()=>requestAnimationFrame(()=>{ answerFeedback.style.animation=''; }));
    setTimeout(next,delays[i]);
    i++;
  }
  setTimeout(next,600);
}

// -------- 不正解 --------
function showWrong(){
  answerInput.disabled=submitBtn.disabled=true;
  document.getElementById('input-area').style.display='none';

  const lines=[
    {t:'そうだよね',          color:'#333'},
    {t:'広告なんて誰も見てないよね',color:'#555'},
    {t:'私たちなんて\nすぐ消されるだけの存在だもんね',color:'#c0392b'},
    {t:'消したいんでしょ？',    color:'#c0392b'},
    {t:'消していいよ。',        color:'#8e0000'},
  ];

  answerFeedback.className='';
  answerFeedback.classList.remove('hidden');
  finalMessage.style.transition='opacity 0.5s';
  finalMessage.style.opacity='0';

  // Darken overlay
  inputOverlay.style.transition='background 3s';
  setTimeout(()=>{ inputOverlay.style.background='rgba(0,0,0,0.92)'; },500);

  let i=0;
  const delays=[1800,2200,2800,2000,2000];

  function next(){
    if(i>=lines.length){
      // Trigger horror storm
      setTimeout(()=>{
        inputOverlay.classList.add('hidden');
        startHorrorStorm();
      },800);
      return;
    }
    answerFeedback.textContent=lines[i].t;
    answerFeedback.style.color=lines[i].color;
    answerFeedback.style.animation='none';
    requestAnimationFrame(()=>requestAnimationFrame(()=>{ answerFeedback.style.animation=''; }));
    setTimeout(next,delays[i]);
    i++;
  }
  setTimeout(next,600);
}

// -------- ホラーストーム（消しても増える） --------
function startHorrorStorm(){
  let horrorCount=0;
  let horrorClosed=0;
  const horrorAds=[];

  function spawnHorror(n){
    const {win,closeBtn}=createAdWindow({title:'消えない…',isStorm:true,isHorror:true});
    addTextBody(win,['Dream Soda…','まだここにいるよ','消えないよ','覚えてるよね？','Dream Soda Zero','忘れないで'][n%6],'small');
    adLayer.appendChild(win);
    horrorAds.push(win);
    setTimeout(()=>{
      const r=win.getBoundingClientRect();
      placeAt(win,safePos(r.width||160,r.height||80));
    },10);

    closeBtn.addEventListener('click',()=>{
      const ix=horrorAds.indexOf(win);
      if(ix!==-1) horrorAds.splice(ix,1);
      closeAd(win);
      horrorClosed++;
      // Spawn 2 more for every 1 closed
      spawnHorror(horrorCount++);
      spawnHorror(horrorCount++);
    });
  }

  // Spawn 500 initially
  for(let i=0;i<500;i++){
    setTimeout(()=>spawnHorror(horrorCount++), i*8);
  }

  // After 10s: clear all and show final message
  setTimeout(()=>{
    if(horrorLoop) clearInterval(horrorLoop);
    horrorAds.forEach((sw,i)=>{
      setTimeout(()=>{ if(sw.parentElement) closeAd(sw); },i*6);
    });

    setTimeout(()=>{
      // Giant center ad
      const {win,closeBtn}=createAdWindow({title:'覚えたよね？'});
      const body=document.createElement('div');
      body.className='ad-body';
      body.innerHTML=`<div class="ad-final-big">これで<br>覚えたよね？<br><span class="ad-final-brand">Dream Soda</span></div>`;
      win.appendChild(body);
      win.classList.add('ad-final-giant');
      adLayer.appendChild(win);
      placeCenter(win);

      closeBtn.addEventListener('click',()=>closeAd(win));
    }, horrorAds.length*6+500);
  },10000);
}

// ============================================================
// EVENTS
// ============================================================
submitBtn.addEventListener('click',checkAnswer);
answerInput.addEventListener('keydown',e=>{ if(e.key==='Enter') checkAnswer(); });

// ============================================================
// INIT
// ============================================================
window.addEventListener('load',()=>setTimeout(showIntroAd,600));
