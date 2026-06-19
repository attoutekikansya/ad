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

// ===== DIMMER =====
const dimmer = document.getElementById('bg-dimmer');
function showDimmer(){ dimmer.classList.add('active'); }
function hideDimmer(){ dimmer.classList.remove('active'); }

// ===== STATE =====
let stormAds      = [];
let stormCloseCnt = 0;
let apologyGuard  = false;

// ===== UTILITIES =====
const clamp = (v,lo,hi) => Math.min(Math.max(v,lo),hi);
const rand  = (a,b)     => a + Math.random()*(b-a);

function navH(){
  const nav = document.querySelector('header');
  return nav ? nav.getBoundingClientRect().height : 86;
}

function safePos(w,h){
  const vw=window.innerWidth, vh=window.innerHeight, m=6;
  const top0 = navH() + m;
  return {
    top:  clamp(rand(top0, vh-h-m), top0, Math.max(top0+10, vh-h-m)),
    left: clamp(rand(m, vw-w-m), m, Math.max(m+10, vw-w-m)),
  };
}

function centerPos(w,h){
  const nh = navH();
  const vw = window.visualViewport ? window.visualViewport.width  : window.innerWidth;
  const vh = window.visualViewport ? window.visualViewport.height : window.innerHeight;
  return {
    top:  Math.max(nh + 8, nh + (vh - nh - h) / 2),
    left: Math.max(10, (vw - w) / 2),
  };
}

function placeAt(win, pos){
  win.style.position  = 'absolute';
  win.style.top       = pos.top  + 'px';
  win.style.left      = pos.left + 'px';
  win.style.transform = 'none';
}

function placeCenter(win){
  requestAnimationFrame(()=>{
    const r = win.getBoundingClientRect();
    placeAt(win, centerPos(r.width, r.height));
  });
}

// ===== AD FACTORY =====
function createAdWindow({title='広告', isStorm=false, isHorror=false}={}){
  const win = document.createElement('div');
  win.className = 'ad-window' + (isStorm?' storm':'') + (isHorror?' horror':'');

  const hdr = document.createElement('div');
  hdr.className = 'ad-header';

  const lbl = document.createElement('span');
  lbl.className = 'ad-label';
  lbl.textContent = '広告';

  const ttl = document.createElement('span');
  ttl.className = 'ad-title-bar';
  ttl.textContent = title;

  const closeBtn = document.createElement('button');
  closeBtn.className = 'close-btn';
  closeBtn.innerHTML = '&#10005;';
  closeBtn.setAttribute('aria-label', '広告を閉じる');

  hdr.append(lbl, ttl, closeBtn);
  win.appendChild(hdr);
  return { win, closeBtn };
}

function addTextBody(win, text, cls=''){
  const body = document.createElement('div');
  body.className = 'ad-body';
  const t = document.createElement('div');
  t.className = 'ad-text-content' + (cls ? ' '+cls : '');
  t.textContent = text;
  body.appendChild(t);
  win.appendChild(body);
  return t;
}

function closeAd(win, cb){
  win.classList.add('ad-closing');
  setTimeout(()=>{ win.remove(); cb && cb(); }, 200);
}

// ===== DODGE (Phase2用) =====
function doDodge(win, onBack){
  const r  = win.getBoundingClientRect();
  const vw = window.innerWidth, vh = window.innerHeight;
  const nh = navH();
  const dirs = [
    { dx: rand(70,120),   dy: rand(-15,15)  },
    { dx: rand(-120,-70), dy: rand(-15,15)  },
    { dx: rand(-15,15),   dy: rand(-80,-40) },
    { dx: rand(-15,15),   dy: rand(40,80)   },
  ];
  const d = dirs[Math.floor(rand(0,4))];
  const nl = clamp(r.left + d.dx, 4, vw - r.width  - 4);
  const nt = clamp(r.top  + d.dy, nh + 4, vh - r.height - 4);

  win.style.transition = 'top .1s cubic-bezier(.36,.07,.19,.97), left .1s cubic-bezier(.36,.07,.19,.97)';
  placeAt(win, { top: nt, left: nl });

  setTimeout(()=>{
    win.style.transition = 'top .4s cubic-bezier(.34,1.56,.64,1), left .4s cubic-bezier(.34,1.56,.64,1)';
    const cr = win.getBoundingClientRect();
    placeAt(win, centerPos(cr.width, cr.height));
    setTimeout(()=>{ win.style.transition = ''; onBack && onBack(); }, 450);
  }, 130);
}

// ===== TYPEWRITER =====
function typewrite(el, text, msPerChar, cb){
  el.textContent = '';
  let i = 0;
  function tick(){
    if(i >= text.length){ cb && cb(); return; }
    el.textContent += text[i++];
    setTimeout(tick, text[i-1]==='\n' ? 300 : (msPerChar||45));
  }
  tick();
}

// ===== CHOICE BUTTONS =====
function addChoiceButtons(win, choices){
  const row = document.createElement('div');
  row.className = 'choice-row';
  const btns = [];
  choices.forEach(({ label, onClick })=>{
    const b = document.createElement('button');
    b.className = 'choice-btn';
    b.textContent = label;
    b.addEventListener('click', ()=>{
      btns.forEach(x => x.disabled = true);
      onClick();
    });
    row.appendChild(b);
    btns.push(b);
  });
  win.appendChild(row);
  return row;
}

// ===== STORM CONSTANTS =====
const STORM_TITLES = ['おーい！','ねえねえ！','こっちも！','やあ！','見て！','ここだよ！','Dream Soda！','ゼロカロリー！','夏の炭酸！'];
const STORM_MSGS   = ['広告いっぱいあった方が\n見つけやすいよね！','目に入りやすいし！','ね？いいアイデアでしょ！','こんにちは！','よろしくね！','見て見て！','夏の炭酸！','おいしいよ！','ゼロカロリー！','Dream Soda!','炭酸といえば！','キンキンに冷えてるよ！'];

// 全広告を約1秒で高速削除
function clearAdsFast(ads, cb){
  const copy = [...ads];
  copy.forEach((sw, i)=>{ setTimeout(()=>{ if(sw.parentElement) closeAd(sw); }, i*2); });
  setTimeout(cb, Math.min(copy.length*2 + 300, 1100));
}

// ============================================================
// PHASE 1: INTRO AD
// ============================================================
function showIntroAd(){
  showDimmer();
  const { win, closeBtn } = createAdWindow({ title:'【公式】Dream Soda 夏の炭酸祭り' });

  const banner = document.createElement('div');
  banner.className = 'ad-product-banner';
  banner.innerHTML = `
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

  closeBtn.addEventListener('click', ()=> closeAd(win, ()=> setTimeout(phase2_animated, 300)));
  win.querySelector('.ad-cta-btn').addEventListener('click', ()=>{
    win.classList.add('ad-shake');
    setTimeout(()=> win.classList.remove('ad-shake'), 400);
  });
}

// ============================================================
// PHASE 2: あっ〜消されるのが仕事だし！ (dodge)
// ============================================================
function phase2_animated(){
  const lines = [
    { title:'ちょっといいですか', body:'あっ' },
    { title:'ちょっといいですか', body:'びっくりした' },
    { title:'ちょっといいですか', body:'急に消すから' },
    { title:'大丈夫大丈夫！',     body:'大丈夫大丈夫！\n広告なんて消されるのが仕事だし！' },
  ];

  let idx = 0;
  let currentWin = null;

  // 各行: 何回 × 押したら次へ進むか
  const maxDodge = [2, 2, 2, 3];

  function showLine(){
    if(idx >= lines.length){ setTimeout(phase3_waitClose, 300); return; }
    const l = lines[idx];
    const { win, closeBtn } = createAdWindow({ title: l.title });
    const textEl = addTextBody(win, '');
    adLayer.appendChild(win);
    placeCenter(win);

    if(currentWin) closeAd(currentWin);
    currentWin = win;

    let dodgeCount = 0;
    const limit = maxDodge[idx];

    closeBtn.addEventListener('click', ()=>{
      if(dodgeCount < limit){
        dodgeCount++;
        doDodge(win, ()=>{});
      } else {
        currentWin = null;
        idx++;
        closeAd(win, ()=> setTimeout(showLine, 200));
      }
    });

    typewrite(textEl, l.body, 55);
  }
  showLine();
}

// ============================================================
// PHASE 3: 消していいよ！ → 1つだけ、ユーザーが閉じるまで待機
// ============================================================
function phase3_waitClose(){
  const { win, closeBtn } = createAdWindow({ title:'消していいよ！' });
  addTextBody(win, '消していいよ！\n気にしてないから！');
  adLayer.appendChild(win);
  placeCenter(win);

  closeBtn.addEventListener('click', ()=> closeAd(win, ()=> setTimeout(phase4_please, 400)));
}

// ============================================================
// PHASE 4: 見てくれない？ → はい/いいえ → 500個
// ============================================================
function phase4_please(){
  const { win, closeBtn } = createAdWindow({ title:'お願いがあるんだけど' });
  const textEl = addTextBody(win, '');
  closeBtn.style.visibility = 'hidden';
  closeBtn.disabled = true;
  adLayer.appendChild(win);
  placeCenter(win);

  typewrite(textEl, '見てくれないのはさみしいから、\nあなただけでも見てくれない？\n……ちょっとだけでいいから', 50, ()=>{
    setTimeout(()=>{
      addChoiceButtons(win, [
        { label:'はい',  onClick: ()=> closeAd(win, ()=> startMegaStorm(()=> phase5_apologyMenu())) },
        { label:'いいえ', onClick: ()=> closeAd(win, ()=> startMegaStorm(()=> phase5_apologyMenu())) },
      ]);
    }, 600);
  });
}

// ============================================================
// MEGA STORM: 500個 — ユーザーが5個消したら謝罪→1秒で全消し
// ============================================================
function startMegaStorm(onApologyDone){
  stormAds      = [];
  stormCloseCnt = 0;
  apologyGuard  = false;

  let localAds = [];

  function spawnOne(n){
    const { win, closeBtn } = createAdWindow({ title: STORM_TITLES[n%STORM_TITLES.length], isStorm: true });
    addTextBody(win, STORM_MSGS[n%STORM_MSGS.length], 'small');
    adLayer.appendChild(win);
    localAds.push(win);
    stormAds.push(win);

    setTimeout(()=>{
      const r = win.getBoundingClientRect();
      placeAt(win, safePos(r.width||160, r.height||80));
    }, 10);

    closeBtn.addEventListener('click', ()=>{
      const ix = localAds.indexOf(win); if(ix!==-1) localAds.splice(ix,1);
      const ix2 = stormAds.indexOf(win); if(ix2!==-1) stormAds.splice(ix2,1);
      closeAd(win);
      stormCloseCnt++;
      if(stormCloseCnt >= 5 && !apologyGuard){
        apologyGuard = true;
        doApologyAndClear(localAds, onApologyDone);
      }
    });
  }

  for(let i=0; i<500; i++) setTimeout(()=> spawnOne(i), i*6);
}

// 謝罪広告 → 全消し
function doApologyAndClear(ads, cb){
  const { win, closeBtn } = createAdWindow({ title:'ごめん！！' });
  closeBtn.style.visibility = 'hidden'; closeBtn.disabled = true;
  const textEl = addTextBody(win, '', 'big');
  win.style.zIndex = '300';
  adLayer.appendChild(win);
  placeCenter(win);

  typewrite(textEl, 'ごめん！！\nやりすぎた！！\n怒られるやつだこれ！！\n私が消すから！！', 40, ()=>{
    setTimeout(()=>{
      clearAdsFast([...ads], ()=>{
        stormAds = [];
        closeAd(win, ()=> setTimeout(cb, 300));
      });
    }, 400);
  });
}

// ============================================================
// PHASE 5: もう一回やっていい？
// ============================================================
function phase5_apologyMenu(){
  const { win, closeBtn } = createAdWindow({ title:'……' });
  closeBtn.style.visibility = 'hidden'; closeBtn.disabled = true;
  const textEl = addTextBody(win, '');
  adLayer.appendChild(win);
  placeCenter(win);

  typewrite(textEl, '広告こんなに出ると\n迷惑だよね\n\nもう一回だけやっていい？', 50, ()=>{
    setTimeout(()=>{
      addChoiceButtons(win, [
        { label:'はい',  onClick: ()=> closeAd(win, ()=> phase6_yes()) },
        { label:'いいえ', onClick: ()=> closeAd(win, ()=> phase6_no())  },
      ]);
    }, 400);
  });
}

// ============================================================
// PHASE 6a: はい → 最初の広告再表示 → alone
// ============================================================
function phase6_yes(){
  const { win, closeBtn } = createAdWindow({ title:'【公式】Dream Soda 夏の炭酸祭り' });
  const banner = document.createElement('div');
  banner.className = 'ad-product-banner';
  banner.innerHTML = `
    <div class="ad-product-logo">Dream<span>Soda</span></div>
    <div class="ad-product-sub">Since 1985 · Official</div>
    <div class="ad-product-name">Dream Soda Zero</div>
    <div class="ad-campaign">🌊 夏の炭酸祭り 2024 🌊</div>
    <div class="ad-small-print">広告主：Dream Soda　キャンペーン期間：2024年6月〜8月31日</div>
  `;
  win.appendChild(banner);
  adLayer.appendChild(win);
  placeCenter(win);

  let advanced = false;
  function advance(){
    if(advanced) return; advanced = true;
    closeAd(win, ()=> setTimeout(phase7_alone, 500));
  }
  closeBtn.addEventListener('click', advance);
  setTimeout(advance, 3000);
}

// ============================================================
// PHASE 6b: いいえ → 500個 → ユーザーが5個消したら謝罪→全消し → alone
// ============================================================
function phase6_no(){
  const { win } = createAdWindow({ title:'そっか…' });
  const cb = win.querySelector('.close-btn');
  cb.style.visibility = 'hidden'; cb.disabled = true;
  const textEl = addTextBody(win, '');
  adLayer.appendChild(win);
  placeCenter(win);

  typewrite(textEl, 'そっか…\nごめんね', 55, ()=>{
    setTimeout(()=>{
      closeAd(win);

      // 新たなストーム（同じ謝罪→全消し挙動）
      stormAds = []; stormCloseCnt = 0; apologyGuard = false;
      let localAds2 = [];

      function spawnOne2(n){
        const { win:sw, closeBtn:scb } = createAdWindow({ title: STORM_TITLES[n%STORM_TITLES.length], isStorm: true });
        addTextBody(sw, STORM_MSGS[n%STORM_MSGS.length], 'small');
        adLayer.appendChild(sw);
        localAds2.push(sw);
        stormAds.push(sw);
        setTimeout(()=>{
          const r = sw.getBoundingClientRect();
          placeAt(sw, safePos(r.width||160, r.height||80));
        }, 10);

        scb.addEventListener('click', ()=>{
          const ix = localAds2.indexOf(sw); if(ix!==-1) localAds2.splice(ix,1);
          const ix2 = stormAds.indexOf(sw);  if(ix2!==-1) stormAds.splice(ix2,1);
          closeAd(sw);
          stormCloseCnt++;
          if(stormCloseCnt >= 5 && !apologyGuard){
            apologyGuard = true;
            doApologyAndClear(localAds2, ()=> setTimeout(phase7_alone, 300));
          }
        });
      }

      for(let i=0; i<500; i++) setTimeout(()=> spawnOne2(i), i*6);
    }, 800);
  });
}

// ============================================================
// PHASE 7: 一人で残る
// ============================================================
function phase7_alone(){
  const { win, closeBtn } = createAdWindow({ title:'最後に一つだけ' });
  addTextBody(win, 'ごめん\n\n最後に一つだけ聞いていい？');
  win.classList.add('ad-pulse');
  adLayer.appendChild(win);
  placeCenter(win);

  closeBtn.style.opacity = '0.3';
  closeBtn.disabled = true;
  setTimeout(()=>{
    closeBtn.style.opacity = '';
    closeBtn.disabled = false;
    closeBtn.addEventListener('click', ()=> closeAd(win, ()=> setTimeout(showFinal, 400)));
  }, 1800);
}

// ============================================================
// PHASE 8: FINAL INPUT
// ============================================================
function showFinal(){
  hideDimmer();
  articleBg.style.transition = 'opacity .8s';
  articleBg.style.opacity = '0';
  setTimeout(()=>{
    articleBg.style.display = 'none';
    notFoundScreen.classList.remove('hidden');
    notFoundScreen.classList.add('visible');
  }, 800);

  setTimeout(()=>{
    finalMessage.textContent = '私は\nなんの広告だった？';
    inputOverlay.classList.remove('hidden');
    answerInput.focus();
  }, 1200);
}

// ============================================================
// ANSWER CHECK
// ============================================================
function normalize(str){
  return str.toLowerCase()
    .replace(/[　 ]/g, '')
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g, c => String.fromCharCode(c.charCodeAt(0)-0xFEE0))
    .replace(/[-－ー]/g, '').trim();
}

function checkAnswer(){
  const raw = answerInput.value;
  const norm = normalize(raw);
  const ok = CORRECT_ANSWER_VARIANTS.some(v => norm.includes(normalize(v))) || raw.includes(CORRECT_ANSWER_JP);
  ok ? showCorrect() : showWrong();
}

// -------- 正解 --------
function showCorrect(){
  answerInput.disabled = submitBtn.disabled = true;
  document.getElementById('input-area').style.display = 'none';

  const lines  = ['……', 'そっか', 'ちゃんと役割は\n果たせたんだ', 'ありがと', 'いい時間を！'];
  const delays = [1200, 1600, 1800, 1600, 2500];
  let i = 0;

  answerFeedback.className = '';
  answerFeedback.classList.remove('hidden');
  finalMessage.style.transition = 'opacity .5s';
  finalMessage.style.opacity = '0';

  function next(){
    if(i >= lines.length){
      setTimeout(()=>{
        const fa = document.getElementById('final-ad');
        fa.style.transition = 'opacity 1.4s ease, transform 1.4s ease';
        fa.style.opacity = '0';
        fa.style.transform = 'scale(.9) translateY(-14px)';
        setTimeout(()=>{ inputOverlay.classList.add('hidden'); endGame(); }, 1500);
      }, 800);
      return;
    }
    answerFeedback.textContent = lines[i];
    answerFeedback.style.animation = 'none';
    requestAnimationFrame(()=> requestAnimationFrame(()=>{ answerFeedback.style.animation=''; }));
    setTimeout(next, delays[i]);
    i++;
  }
  setTimeout(next, 600);
}

// -------- 不正解 --------
function showWrong(){
  answerInput.disabled = submitBtn.disabled = true;
  document.getElementById('input-area').style.display = 'none';

  const lines = [
    { t:'そうだよね',                        color:'#666' },
    { t:'広告なんて誰も見てないよね',          color:'#888' },
    { t:'私たちなんて\nすぐ消されるだけの存在だもんね', color:'#c0392b' },
    { t:'消したいんでしょ？',                  color:'#c0392b' },
    { t:'消していいよ。',                      color:'#8e0000' },
  ];

  // final-adボディを中央揃えに書き換え
  const fa = document.getElementById('final-ad');
  fa.querySelector('.ad-header').style.display = 'none';
  const adBody = fa.querySelector('.ad-body');
  adBody.style.cssText = 'padding:0;display:flex;align-items:center;justify-content:center;min-height:200px;';
  const centerText = document.createElement('div');
  centerText.id = 'wrong-center-text';
  centerText.style.cssText = 'font-size:18px;font-weight:700;color:#666;text-align:center;white-space:pre-line;line-height:1.8;transition:color .8s;padding:24px 20px;';
  adBody.innerHTML = '';
  adBody.appendChild(centerText);
  finalMessage.style.display = 'none';
  answerFeedback.classList.add('hidden');

  // overlay を暗くする
  inputOverlay.style.transition = 'background 3s';
  setTimeout(()=>{ inputOverlay.style.background = 'rgba(0,0,0,.95)'; }, 500);

  let i = 0;
  const delays = [1800, 2200, 2800, 2000, 2200];

  function next(){
    if(i >= lines.length){
      setTimeout(()=>{ inputOverlay.classList.add('hidden'); startHorrorStorm(); }, 800);
      return;
    }
    centerText.textContent = lines[i].t;
    centerText.style.color = lines[i].color;
    centerText.style.animation = 'none';
    requestAnimationFrame(()=> requestAnimationFrame(()=>{ centerText.style.animation = 'fadein .4s ease forwards'; }));
    setTimeout(next, delays[i]);
    i++;
  }
  setTimeout(next, 600);
}

// -------- ホラーストーム（消しても増える） --------
function startHorrorStorm(){
  showDimmer();
  let horrorCount = 0;
  const horrorAds = [];

  function spawnHorror(n){
    const { win, closeBtn } = createAdWindow({ title:'消えない…', isStorm:true, isHorror:true });
    addTextBody(win, ['Dream Soda…','まだここにいるよ','消えないよ','覚えてるよね？','Dream Soda Zero','忘れないで'][n%6], 'small');
    adLayer.appendChild(win);
    horrorAds.push(win);
    setTimeout(()=>{
      const r = win.getBoundingClientRect();
      placeAt(win, safePos(r.width||160, r.height||80));
    }, 10);

    closeBtn.addEventListener('click', ()=>{
      const ix = horrorAds.indexOf(win); if(ix!==-1) horrorAds.splice(ix,1);
      closeAd(win);
      spawnHorror(horrorCount++);
      spawnHorror(horrorCount++);
    });
  }

  for(let i=0; i<500; i++) setTimeout(()=> spawnHorror(horrorCount++), i*8);

  // 10秒後：全消し→巨大広告
  setTimeout(()=>{
    const copy = [...horrorAds];
    copy.forEach((sw,i)=>{ setTimeout(()=>{ if(sw.parentElement) closeAd(sw); }, i*4); });

    setTimeout(()=>{
      const { win, closeBtn } = createAdWindow({ title:'覚えたよね？' });
      const body = document.createElement('div');
      body.className = 'ad-body';
      body.innerHTML = `<div class="ad-final-big">これで<br>覚えたよね？<br><span class="ad-final-brand">Dream Soda</span></div>`;
      win.appendChild(body);
      win.classList.add('ad-final-giant');
      adLayer.appendChild(win);
      placeCenter(win);
      closeBtn.addEventListener('click', ()=> closeAd(win, ()=> endGame()));
    }, copy.length*4 + 500);
  }, 10000);
}

// ============================================================
// END GAME: 全消し → ブラックアウト
// ============================================================
function endGame(){
  hideDimmer();
  const all = [...adLayer.querySelectorAll('.ad-window')];
  all.forEach((w,i)=>{ setTimeout(()=>{ if(w.parentElement) closeAd(w); }, i*30); });

  setTimeout(()=>{
    notFoundScreen.style.transition = 'opacity 1s';
    notFoundScreen.style.opacity = '0';
    articleBg.style.display = 'none';

    const blackout = document.createElement('div');
    blackout.style.cssText = 'position:fixed;inset:0;background:#000;z-index:9999;opacity:0;transition:opacity 1.5s;pointer-events:none;';
    document.body.appendChild(blackout);
    requestAnimationFrame(()=> requestAnimationFrame(()=>{ blackout.style.opacity = '1'; }));
  }, all.length*30 + 300);
}

// ============================================================
// EVENTS
// ============================================================
submitBtn.addEventListener('click', checkAnswer);
answerInput.addEventListener('keydown', e=>{ if(e.key==='Enter') checkAnswer(); });

// Newsletter (フェイク)
const nlBtn = document.querySelector('.form button');
if(nlBtn) nlBtn.addEventListener('click', ()=>{
  const inp = document.querySelector('.form input');
  if(inp){ inp.value=''; inp.placeholder='登録しました！'; }
});

// ============================================================
// INIT
// ============================================================
window.addEventListener('load', ()=> setTimeout(showIntroAd, 600));
