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

// ストーム広告用ランダム配置（画面内に収める）
function safePos(w, h){
  const vw = window.innerWidth, vh = window.innerHeight, m = 6;
  const top0 = navH() + m;
  const maxT  = Math.max(top0 + 4, vh - h - m);
  const maxL  = Math.max(m   + 4, vw - w - m);
  return {
    top:  clamp(rand(top0, maxT), top0, maxT),
    left: clamp(rand(m,    maxL), m,    maxL),
  };
}

// ===== 広告を画面中央に配置（position:fixed） =====
function placeCenter(win){
  win.style.position  = 'fixed';
  win.style.top       = '50%';
  win.style.left      = '50%';
  win.style.transform = 'translate(-50%, -50%)';
}

// ストーム広告を fixed + 座標で配置
function placeFixed(win, pos){
  win.style.position  = 'fixed';
  win.style.top       = pos.top  + 'px';
  win.style.left      = pos.left + 'px';
  win.style.transform = 'none';
}

// ===== AD FACTORY =====
function createAdWindow({ title='広告', isStorm=false, isHorror=false } = {}){
  const win = document.createElement('div');
  win.className = 'ad-window' + (isStorm ? ' storm' : '') + (isHorror ? ' horror' : '');

  const hdr = document.createElement('div');
  hdr.className = 'ad-header';

  const lbl = document.createElement('span');
  lbl.className   = 'ad-label';
  lbl.textContent = '広告';

  const ttl = document.createElement('span');
  ttl.className   = 'ad-title-bar';
  ttl.textContent = title;

  const closeBtn = document.createElement('button');
  closeBtn.className = 'close-btn';
  closeBtn.innerHTML = '&#10005;';
  closeBtn.setAttribute('aria-label', '広告を閉じる');

  hdr.append(lbl, ttl, closeBtn);
  win.appendChild(hdr);
  return { win, closeBtn };
}

// 左揃えボディ（ストーム等）
function addTextBody(win, text, cls = ''){
  const body = document.createElement('div');
  body.className = 'ad-body';
  const t = document.createElement('div');
  t.className   = 'ad-text-content' + (cls ? ' ' + cls : '');
  t.textContent = text;
  body.appendChild(t);
  win.appendChild(body);
  return t;
}

// 中央揃えボディ（会話広告）
function addCenteredBody(win, text, cls = ''){
  const body = document.createElement('div');
  body.className = 'ad-body ad-body--center';
  const t = document.createElement('div');
  t.className   = 'ad-text-content' + (cls ? ' ' + cls : '');
  t.textContent = text;
  body.appendChild(t);
  win.appendChild(body);
  return t;
}

function closeAd(win, cb){
  win.classList.add('ad-closing');
  setTimeout(() => { win.remove(); cb && cb(); }, 200);
}

// ===== DODGE: 押したら避けて、1秒後に次へ自動進行 =====
function dodgeAndAutoAdvance(win, onAdvance){
  const vw = window.innerWidth, vh = window.innerHeight;
  const w  = win.offsetWidth || 400;
  const h  = win.offsetHeight || 200;
  const cx = (vw - w) / 2;
  const cy = (vh - h) / 2;

  const dirs = [
    { dx:  rand(80, 130),  dy: rand(-15, 15)  },
    { dx: -rand(80, 130),  dy: rand(-15, 15)  },
    { dx:  rand(-15, 15),  dy: -rand(60, 100) },
    { dx:  rand(-15, 15),  dy:  rand(60, 100) },
  ];
  const d  = dirs[Math.floor(rand(0, 4))];
  const nl = clamp(cx + d.dx, 4, vw - w - 4);
  const nt = clamp(cy + d.dy, navH() + 4, vh - h - 4);

  // ① 素早くずれる (0.12s)
  win.style.transition = 'top .12s cubic-bezier(.36,.07,.19,.97), left .12s cubic-bezier(.36,.07,.19,.97), transform .12s';
  placeFixed(win, { top: nt, left: nl });

  // ② 0.15s 後に中央へ戻る (.4s)
  setTimeout(() => {
    win.style.transition = 'top .4s cubic-bezier(.34,1.56,.64,1), left .4s cubic-bezier(.34,1.56,.64,1), transform .4s';
    win.style.top       = '50%';
    win.style.left      = '50%';
    win.style.transform = 'translate(-50%, -50%)';

    // ③ 戻り完了後、合計 ~1秒で次へ
    setTimeout(() => {
      win.style.transition = '';
      onAdvance();
    }, 430);
  }, 150);
}

// ===== TYPEWRITER =====
function typewrite(el, text, msPerChar, cb){
  el.textContent = '';
  let i = 0;
  function tick(){
    if(i >= text.length){ cb && cb(); return; }
    el.textContent += text[i++];
    setTimeout(tick, text[i-1] === '\n' ? 300 : (msPerChar || 45));
  }
  tick();
}

// テキストをフェードアウトして消す
function fadeOutText(el, cb){
  el.style.transition = 'opacity .35s';
  el.style.opacity    = '0';
  setTimeout(() => { el.textContent = ''; el.style.opacity = '1'; el.style.transition = ''; cb && cb(); }, 380);
}

// ===== CHOICE BUTTONS =====
function addChoiceButtons(win, choices){
  const row  = document.createElement('div');
  row.className = 'choice-row';
  const btns = [];
  choices.forEach(({ label, onClick }) => {
    const b = document.createElement('button');
    b.className   = 'choice-btn';
    b.textContent = label;
    b.addEventListener('click', () => { btns.forEach(x => x.disabled = true); onClick(); });
    row.appendChild(b);
    btns.push(b);
  });
  win.appendChild(row);
  return row;
}

// ===== STORM CONSTANTS — Dream Soda トンマナ =====
const STORM_TITLES = ['Dream Soda！','夏の炭酸祭り！','ゼロカロリー！','公式キャンペーン！','Dream Soda Zero！','今すぐチェック！','炭酸といえば！','おいしいよ！','ここだよ！'];
const STORM_MSGS   = ['Dream Soda Zero\nゼロカロリーで夏を楽しもう！','🌊 夏の炭酸祭り 2024 🌊','キンキンに冷えてるよ！','広告主：Dream Soda','炭酸といえばDream Soda！','夏にぴったり！','ゼロカロリー！うれしい！','Dream Soda Zero\n公式キャンペーン中！','見て見て！Dream Soda！'];

// 全広告を約1秒で高速削除
function clearAdsFast(ads, cb){
  const copy = [...ads];
  copy.forEach((sw, i) => { setTimeout(() => { if(sw.parentElement) closeAd(sw); }, i * 2); });
  setTimeout(cb, Math.min(copy.length * 2 + 300, 1100));
}

// ============================================================
// PHASE 1: INTRO AD
// ============================================================
function showIntroAd(){
  showDimmer();
  const { win, closeBtn } = createAdWindow({ title: '【公式】Dream Soda 夏の炭酸祭り' });

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

  closeBtn.addEventListener('click', () => closeAd(win, () => setTimeout(phase2_animated, 300)));
  win.querySelector('.ad-cta-btn').addEventListener('click', () => {
    win.classList.add('ad-shake');
    setTimeout(() => win.classList.remove('ad-shake'), 400);
  });
}

// ============================================================
// PHASE 2: あっ〜消されるのが仕事だし！
//   閉じるを押すと dodge → 約1秒後に自動で次のセリフへ
// ============================================================
function phase2_animated(){
  const lines = [
    { title: 'ちょっといいですか', body: 'あっ' },
    { title: 'ちょっといいですか', body: 'びっくりした' },
    { title: 'ちょっといいですか', body: '急に消すから' },
    { title: '大丈夫大丈夫！',     body: '大丈夫大丈夫！\n広告なんて消されるのが仕事だし！' },
  ];

  let idx        = 0;
  let currentWin = null;
  let advancing  = false;

  function showLine(){
    if(idx >= lines.length){ setTimeout(phase3_waitClose, 300); return; }
    advancing = false;
    const l = lines[idx];
    const { win, closeBtn } = createAdWindow({ title: l.title });
    const textEl = addCenteredBody(win, '');
    adLayer.appendChild(win);
    placeCenter(win);

    if(currentWin) closeAd(currentWin);
    currentWin = win;

    typewrite(textEl, l.body, 60);

    closeBtn.addEventListener('click', () => {
      if(advancing) return;
      dodgeAndAutoAdvance(win, () => {
        if(advancing) return;
        advancing  = true;
        currentWin = null;
        idx++;
        closeAd(win, () => setTimeout(showLine, 100));
      });
    });
  }
  showLine();
}

// ============================================================
// PHASE 3: 消していいよ！ → ユーザーが閉じるまで待機
// ============================================================
function phase3_waitClose(){
  const { win, closeBtn } = createAdWindow({ title: '消していいよ！' });
  addCenteredBody(win, '消していいよ！\n気にしてないから！');
  adLayer.appendChild(win);
  placeCenter(win);

  closeBtn.addEventListener('click', () => closeAd(win, () => setTimeout(phase4_please, 400)));
}

// ============================================================
// PHASE 4:
//   ① 「広告ってすぐ消されちゃうんでしょ？」
//   → 0.9秒後
//   ② 「見てくれないのはさみしいから…」→ はい/いいえ
// ============================================================
function phase4_please(){
  const { win, closeBtn } = createAdWindow({ title: 'ちょっと聞いていい？' });
  const textEl = addCenteredBody(win, '');
  closeBtn.style.visibility = 'hidden';
  closeBtn.disabled = true;
  adLayer.appendChild(win);
  placeCenter(win);

  typewrite(textEl, '広告ってすぐ\n消すでしょ？', 50, () => {
    setTimeout(() => {
      // ①のテキストをフェードアウト
      fadeOutText(textEl, () => {
        // ②を続けてタイプ
        typewrite(textEl, '消されてしまうのはさみしいから、\nあなただけでも見てくれない？', 50, () => {
          setTimeout(() => {
            addChoiceButtons(win, [
              { label: 'はい',  onClick: () => closeAd(win, () => startMegaStorm(() => phase5_apologyMenu())) },
              { label: 'いいえ', onClick: () => closeAd(win, () => startMegaStorm(() => phase5_apologyMenu())) },
            ]);
          }, 600);
        });
      });
    }, 900);
  });
}

// ============================================================
// MEGA STORM: 500個 — ユーザーが5個消したら謝罪→全消し
// ============================================================
function startMegaStorm(onApologyDone){
  stormAds      = [];
  stormCloseCnt = 0;
  apologyGuard  = false;
  let localAds  = [];

  function spawnOne(n){
    const { win, closeBtn } = createAdWindow({ title: STORM_TITLES[n % STORM_TITLES.length], isStorm: true });
    addTextBody(win, STORM_MSGS[n % STORM_MSGS.length], 'small');
    adLayer.appendChild(win);
    localAds.push(win);
    stormAds.push(win);

    setTimeout(() => {
      const r = win.getBoundingClientRect();
      placeFixed(win, safePos(r.width || 160, r.height || 80));
    }, 10);

    closeBtn.addEventListener('click', () => {
      const ix  = localAds.indexOf(win); if(ix  !== -1) localAds.splice(ix, 1);
      const ix2 = stormAds.indexOf(win); if(ix2 !== -1) stormAds.splice(ix2, 1);
      closeAd(win);
      stormCloseCnt++;
      if(stormCloseCnt >= 5 && !apologyGuard){
        apologyGuard = true;
        doApologyAndClear(localAds, onApologyDone);
      }
    });
  }

  for(let i = 0; i < 500; i++) setTimeout(() => spawnOne(i), i * 6);
}

// 謝罪 → 全消し（約1秒）
function doApologyAndClear(ads, cb){
  const { win, closeBtn } = createAdWindow({ title: 'ごめん！！' });
  closeBtn.style.visibility = 'hidden';
  closeBtn.disabled = true;
  const textEl = addCenteredBody(win, '', 'big');
  win.style.zIndex = '300';
  adLayer.appendChild(win);
  placeCenter(win);

  typewrite(textEl, 'ごめん！！\nやりすぎた！！\n怒られるやつだこれ！！\n私が消すから！！', 40, () => {
    setTimeout(() => {
      clearAdsFast([...ads], () => {
        stormAds = [];
        closeAd(win, () => setTimeout(cb, 300));
      });
    }, 400);
  });
}

// ============================================================
// PHASE 5: もう一回やっていい？
//   「広告こんなに出ると迷惑だよね」
//   → 文字フェードアウト → 1秒後「もう一回だけやっていい？」
// ============================================================
function phase5_apologyMenu(){
  const { win, closeBtn } = createAdWindow({ title: '……' });
  closeBtn.style.visibility = 'hidden';
  closeBtn.disabled = true;
  const textEl = addCenteredBody(win, '');
  adLayer.appendChild(win);
  placeCenter(win);

  typewrite(textEl, '広告こんなに出ると\n迷惑だよね', 50, () => {
    // 2秒後にフェードアウト
    setTimeout(() => {
      fadeOutText(textEl, () => {
        // さらに2秒後「もう一回だけやっていい？」
        setTimeout(() => {
          typewrite(textEl, 'もう一回だけやっていい？', 55, () => {
            setTimeout(() => {
              addChoiceButtons(win, [
                { label: 'はい',  onClick: () => closeAd(win, () => phase6_yes()) },
                { label: 'いいえ', onClick: () => closeAd(win, () => phase6_no())  },
              ]);
            }, 400);
          });
        }, 1000);
      });
    }, 1000);
  });
}

// ============================================================
// PHASE 6a: はい → 最初の広告再表示 → alone
// ============================================================
function phase6_yes(){
  const { win, closeBtn } = createAdWindow({ title: '【公式】Dream Soda 夏の炭酸祭り' });
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
    closeAd(win, () => setTimeout(phase7_alone, 500));
  }
  closeBtn.addEventListener('click', advance);
  setTimeout(advance, 3000);
}

// ============================================================
// PHASE 6b: いいえ → そっか… → 500個 → 謝罪なし
//           5個消したら全消し → phase7_alone
// ============================================================
function phase6_no(){
  const { win } = createAdWindow({ title: 'そっか…' });
  const cb2 = win.querySelector('.close-btn');
  cb2.style.visibility = 'hidden';
  cb2.disabled = true;
  const textEl = addCenteredBody(win, '');
  adLayer.appendChild(win);
  placeCenter(win);

  typewrite(textEl, 'そっか…\nごめんね', 55, () => {
    setTimeout(() => {
      closeAd(win);

      stormAds = []; stormCloseCnt = 0; apologyGuard = false;
      let localAds2 = [];

      function spawnOne2(n){
        const { win: sw, closeBtn: scb } = createAdWindow({ title: STORM_TITLES[n % STORM_TITLES.length], isStorm: true });
        addTextBody(sw, STORM_MSGS[n % STORM_MSGS.length], 'small');
        adLayer.appendChild(sw);
        localAds2.push(sw);
        stormAds.push(sw);

        setTimeout(() => {
          const r = sw.getBoundingClientRect();
          placeFixed(sw, safePos(r.width || 160, r.height || 80));
        }, 10);

        scb.addEventListener('click', () => {
          const ix  = localAds2.indexOf(sw); if(ix  !== -1) localAds2.splice(ix, 1);
          const ix2 = stormAds.indexOf(sw);  if(ix2 !== -1) stormAds.splice(ix2, 1);
          closeAd(sw);
          stormCloseCnt++;
          if(stormCloseCnt >= 5 && !apologyGuard){
            apologyGuard = true;
            // 謝罪なし：全消しして即 alone
            clearAdsFast(localAds2, () => { stormAds = []; phase7_alone(); });
          }
        });
      }

      for(let i = 0; i < 500; i++) setTimeout(() => spawnOne2(i), i * 6);
    }, 800);
  });
}

// ============================================================
// PHASE 7: 一人で残る
// ============================================================
function phase7_alone(){
  const { win, closeBtn } = createAdWindow({ title: '最後に一つだけ' });
  addCenteredBody(win, '最後に一つだけ聞いていい？');
  win.classList.add('ad-pulse');
  adLayer.appendChild(win);
  placeCenter(win);

  closeBtn.style.opacity = '0.3';
  closeBtn.disabled = true;
  setTimeout(() => {
    closeBtn.style.opacity = '';
    closeBtn.disabled = false;
    closeBtn.addEventListener('click', () => closeAd(win, () => setTimeout(showFinal, 400)));
  }, 1800);
}

// ============================================================
// PHASE 8: FINAL INPUT
// ============================================================
function showFinal(){
  hideDimmer();
  articleBg.style.transition = 'opacity .8s';
  articleBg.style.opacity    = '0';
  setTimeout(() => {
    articleBg.style.display = 'none';
    notFoundScreen.classList.remove('hidden');
    notFoundScreen.classList.add('visible');
  }, 800);

  setTimeout(() => {
    // 質問文を広告ボディ中央に表示（CSSで中央揃え済み）
    finalMessage.style.cssText = '';
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
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFEE0))
    .replace(/[-－ー]/g, '').trim();
}

function checkAnswer(){
  const raw  = answerInput.value;
  const norm = normalize(raw);
  const ok   = CORRECT_ANSWER_VARIANTS.some(v => norm.includes(normalize(v))) || raw.includes(CORRECT_ANSWER_JP);
  if(ok){
    showCorrect();
  } else {
    // 不正解: グリッチノイズ → showWrong
    triggerGlitch(() => showWrong());
  }
}

// ===== GLITCH NOISE EFFECT =====
function triggerGlitch(cb){
  // オーバーレイ要素を作成
  const overlay = document.createElement('div');
  overlay.id = 'glitch-overlay';
  document.body.appendChild(overlay);

  // 画面全体を揺らす
  document.body.style.animation = 'none';
  overlay.style.animation = 'glitchFlash .9s ease forwards, glitchScreen .9s ease forwards';

  // 縦スキャンラインを数本ランダムに走らせる
  const lines = [];
  for(let i = 0; i < 4; i++){
    const bar = document.createElement('div');
    bar.style.cssText = `
      position:fixed;
      left:0; right:0;
      height:${Math.floor(Math.random()*6)+2}px;
      top:${Math.floor(Math.random()*100)}%;
      background:rgba(${i%2===0?'255,0,80':'0,200,255'},.5);
      z-index:9001;
      opacity:0;
      animation: glitchBar${i} .9s ease forwards;
      pointer-events:none;
    `;
    // インライン keyframes を style タグで追加
    const st = document.createElement('style');
    const delay = (i * 0.12).toFixed(2);
    st.textContent = `
      @keyframes glitchBar${i} {
        0%   { opacity:0; transform:scaleX(0) translateX(0); }
        ${Math.floor(10+i*12)}% { opacity:1; transform:scaleX(1) translateX(${(Math.random()*20-10).toFixed(0)}px); }
        ${Math.floor(40+i*10)}% { opacity:.5; transform:scaleX(.6) translateX(${(Math.random()*30).toFixed(0)}px); }
        70%  { opacity:0; }
        100% { opacity:0; }
      }
    `;
    document.head.appendChild(st);
    document.body.appendChild(bar);
    lines.push({ bar, st });
  }

  setTimeout(() => {
    overlay.remove();
    lines.forEach(({ bar, st }) => { bar.remove(); st.remove(); });
    cb && cb();
  }, 900);
}

// -------- 正解 --------
function showCorrect(){
  answerInput.disabled = submitBtn.disabled = true;
  document.getElementById('input-area').style.display = 'none';

  // 即座に切り替え
  finalMessage.style.transition = 'opacity .2s';
  finalMessage.style.opacity    = '0';

  const lines  = ['……', 'そっか', 'ちゃんと役割は\n果たせたんだ', 'ありがと', 'いい時間を！'];
  const delays = [900, 1200, 1400, 1200, 2000];
  let i = 0;

  answerFeedback.className = '';
  answerFeedback.classList.remove('hidden');

  function next(){
    if(i >= lines.length){
      setTimeout(() => {
        const fa = document.getElementById('final-ad');
        fa.style.transition = 'opacity 1.2s ease, transform 1.2s ease';
        fa.style.opacity    = '0';
        fa.style.transform  = 'scale(.9) translateY(-12px)';
        setTimeout(() => {
          inputOverlay.classList.add('hidden');
          endWithBlackout();
        }, 1300);
      }, 600);
      return;
    }
    answerFeedback.textContent = lines[i];
    answerFeedback.style.animation = 'none';
    requestAnimationFrame(() => requestAnimationFrame(() => { answerFeedback.style.animation = ''; }));
    setTimeout(next, delays[i]);
    i++;
  }
  setTimeout(next, 200); // 即座に開始
}

// -------- 不正解 --------
function showWrong(){
  answerInput.disabled = submitBtn.disabled = true;
  document.getElementById('input-area').style.display = 'none';

  const lines = [
    { t: 'そうだよね',                                   color: '#555' },
    { t: '広告なんて誰も見てないよね',                   color: '#777' },
    { t: '私たちなんて\nすぐ消されるだけの存在だもんね', color: '#c0392b' },
    { t: '消したいんでしょ？',                            color: '#a00' },
    { t: '消していいよ。',                                color: '#600' },
  ];

  const fa     = document.getElementById('final-ad');
  fa.querySelector('.ad-header').style.display = 'none';
  const adBody = fa.querySelector('.ad-body');
  adBody.style.cssText = 'padding:0;display:flex;align-items:center;justify-content:center;min-height:220px;';
  const centerText = document.createElement('div');
  centerText.id = 'wrong-center-text';
  centerText.style.cssText =
    'font-size:18px;font-weight:700;color:#555;text-align:center;' +
    'white-space:pre-line;line-height:1.8;transition:color 1s, opacity .5s;padding:24px 20px;';
  adBody.innerHTML = '';
  adBody.appendChild(centerText);
  finalMessage.style.display = 'none';
  answerFeedback.classList.add('hidden');

  // 背景をじわっと暗くする
  inputOverlay.style.transition = 'background 4s';
  setTimeout(() => { inputOverlay.style.background = 'rgba(0,0,0,.97)'; }, 300);

  let i = 0;
  const delays = [1600, 2000, 2600, 1800, 2000];

  function next(){
    if(i >= lines.length){
      // 全セリフ完了 → ホラー演出へ
      setTimeout(() => {
        inputOverlay.classList.add('hidden');
        startHorrorSequence();
      }, 600);
      return;
    }
    centerText.style.opacity = '0';
    setTimeout(() => {
      centerText.textContent = lines[i].t;
      centerText.style.color   = lines[i].color;
      centerText.style.opacity = '1';
    }, 300);
    setTimeout(next, delays[i]);
    i++;
  }
  setTimeout(next, 400);
}

// -------- ホラーシーケンス --------
// グリッチ → 画面揺れ → 「これで覚えたよね…？」フェードイン → ブチッと消える → ストーム
function startHorrorSequence(){
  // ① グリッチノイズ + 画面シェイク（1.5秒）
  runGlitch(1500, () => {
    // ② 暗い全画面に「これで覚えたよね…？」じわっとフェードイン
    const msg = document.createElement('div');
    msg.style.cssText =
      'position:fixed;inset:0;z-index:8000;display:flex;align-items:center;justify-content:center;' +
      'background:#000;opacity:0;transition:opacity 1.8s ease;pointer-events:none;';
    msg.innerHTML =
      '<span style="color:#fff;font-size:clamp(20px,4vw,32px);font-weight:700;' +
      'letter-spacing:.05em;text-align:center;line-height:1.6;opacity:0;transition:opacity 2.4s ease;">' +
      'これで覚えたよね…？</span>';
    document.body.appendChild(msg);

    requestAnimationFrame(() => requestAnimationFrame(() => {
      msg.style.opacity = '1';
      setTimeout(() => {
        msg.querySelector('span').style.opacity = '1';
      }, 400);
    }));

    // ③ 3秒後にブチッと消える（一瞬白フラッシュ → 全黒 → ストーム）
    setTimeout(() => {
      // 白フラッシュ
      const flash = document.createElement('div');
      flash.style.cssText =
        'position:fixed;inset:0;z-index:9500;background:#fff;opacity:0;pointer-events:none;transition:opacity .05s;';
      document.body.appendChild(flash);
      requestAnimationFrame(() => requestAnimationFrame(() => {
        flash.style.opacity = '1';
        setTimeout(() => {
          flash.remove();
          msg.remove();
          startHorrorStorm();
        }, 80);
      }));
    }, 3200);
  });
}

// グリッチ実行（duration ms）
function runGlitch(duration, cb){
  // スキャンライン
  const overlay = document.createElement('div');
  overlay.style.cssText =
    'position:fixed;inset:0;z-index:9000;pointer-events:none;' +
    'background:repeating-linear-gradient(0deg,rgba(0,0,0,.2) 0px,rgba(0,0,0,.2) 1px,transparent 1px,transparent 3px);' +
    'animation:glitchFlash ' + (duration/1000).toFixed(1) + 's ease forwards;';
  document.body.appendChild(overlay);

  // 画面シェイク
  document.documentElement.style.animation = 'screenShake ' + (duration/1000).toFixed(1) + 's ease forwards';

  // カラーバー 6本
  const bars = [];
  for(let i = 0; i < 6; i++){
    const bar = document.createElement('div');
    const isRed = i % 2 === 0;
    const h = Math.floor(Math.random() * 8) + 2;
    const top = Math.floor(Math.random() * 95);
    const del = (i * 0.15).toFixed(2);
    bar.style.cssText =
      `position:fixed;left:0;right:0;height:${h}px;top:${top}%;z-index:9001;pointer-events:none;` +
      `background:rgba(${isRed?'255,30,80':'0,220,255'},.65);` +
      `animation:barSlide${i} ${(duration/1000).toFixed(1)}s ${del}s ease forwards;opacity:0;`;
    const st = document.createElement('style');
    st.textContent = `@keyframes barSlide${i}{
      0%{opacity:0;transform:translateX(-100%)}
      ${10+i*8}%{opacity:1;transform:translateX(${(Math.random()*40-20).toFixed(0)}px)}
      ${35+i*6}%{opacity:.4;transform:translateX(${(Math.random()*60).toFixed(0)}px)}
      65%{opacity:0}100%{opacity:0}
    }`;
    document.head.appendChild(st);
    document.body.appendChild(bar);
    bars.push({ bar, st });
  }

  setTimeout(() => {
    overlay.remove();
    bars.forEach(({ bar, st }) => { bar.remove(); st.remove(); });
    document.documentElement.style.animation = '';
    cb && cb();
  }, duration);
}

// -------- ホラーストーム（消しても増える） --------
function startHorrorStorm(){
  showDimmer();
  let horrorCount = 0;
  const horrorAds = [];

  function spawnHorror(n){
    const { win, closeBtn } = createAdWindow({ title: '消えない…', isStorm: true, isHorror: true });
    addTextBody(win, ['Dream Soda…','まだここにいるよ','消えないよ','覚えてるよね？','Dream Soda Zero','忘れないで'][n % 6], 'small');
    adLayer.appendChild(win);
    horrorAds.push(win);
    setTimeout(() => {
      const r = win.getBoundingClientRect();
      placeFixed(win, safePos(r.width || 160, r.height || 80));
    }, 10);

    closeBtn.addEventListener('click', () => {
      const ix = horrorAds.indexOf(win); if(ix !== -1) horrorAds.splice(ix, 1);
      closeAd(win);
      spawnHorror(horrorCount++);
      spawnHorror(horrorCount++);
    });
  }

  for(let i = 0; i < 500; i++) setTimeout(() => spawnHorror(horrorCount++), i * 8);

  // 10秒後：全消し → 巨大広告
  setTimeout(() => {
    const copy = [...horrorAds];
    copy.forEach((sw, i) => { setTimeout(() => { if(sw.parentElement) closeAd(sw); }, i * 4); });

    setTimeout(() => {
      const { win, closeBtn } = createAdWindow({ title: '覚えたよね？' });
      const body = document.createElement('div');
      body.className = 'ad-body';
      body.innerHTML = `<div class="ad-final-big">これで<br>覚えたよね？<br><span class="ad-final-brand">Dream Soda</span></div>`;
      win.appendChild(body);
      win.classList.add('ad-final-giant');
      adLayer.appendChild(win);
      placeCenter(win);

      closeBtn.addEventListener('click', () => {
        closeAd(win);
        endWithBlackout();
      });
    }, copy.length * 4 + 500);
  }, 10000);
}

// ============================================================
// END: タブ名変更 → 全黒フェード → 固定
// ============================================================
function endWithBlackout(){
  // 残存広告・オーバーレイをすべて消す
  hideDimmer();
  [...adLayer.querySelectorAll('.ad-window')].forEach(w => w.remove());
  inputOverlay.classList.add('hidden');

  // タブ名を変更
  document.title = 'このページは閉じられました';

  // 全黒オーバーレイをフェードイン
  const black = document.createElement('div');
  black.style.cssText =
    'position:fixed;inset:0;background:#000;z-index:99999;' +
    'opacity:0;transition:opacity 1.6s ease;pointer-events:all;';
  document.body.appendChild(black);

  requestAnimationFrame(() => requestAnimationFrame(() => {
    black.style.opacity = '1';
  }));

  // フェード完了後、favicon も変えて完全に「閉じた」感にする
  setTimeout(() => {
    // faviconを空に（タブのアイコンも消す）
    let link = document.querySelector("link[rel~='icon']");
    if(!link){ link = document.createElement('link'); link.rel = 'icon'; document.head.appendChild(link); }
    link.href = 'data:,';
  }, 1800);
}

// ============================================================
// EVENTS
// ============================================================
submitBtn.addEventListener('click', checkAnswer);
answerInput.addEventListener('keydown', e => { if(e.key === 'Enter') checkAnswer(); });

// Newsletter フェイク
const nlBtn = document.querySelector('.form button');
if(nlBtn) nlBtn.addEventListener('click', () => {
  const inp = document.querySelector('.form input');
  if(inp){ inp.value = ''; inp.placeholder = '登録しました！'; }
});

// ============================================================
// INIT
// ============================================================
window.addEventListener('load', () => setTimeout(showIntroAd, 600));
