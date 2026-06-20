/* ================================================================
   命乞いする広告 — 利用規約 + 広告システム + 演出 + エンディング
================================================================ */

// ===== DOM =====
const adLayer   = document.getElementById('ad-layer');
const articleBg = document.getElementById('article-bg');
const dimmer    = document.getElementById('bg-dimmer');

function showDimmer(){ dimmer.classList.add('active'); }
function hideDimmer(){ /* 出しっぱなし — 意図的にオフにしない */ }

// ===== UTILS =====
const clamp = (v,lo,hi) => Math.min(Math.max(v,lo),hi);
const rand  = (a,b)     => a + Math.random()*(b-a);

function navH(){
  const nav = document.querySelector('header');
  return nav ? nav.getBoundingClientRect().height : 86;
}

function safePos(w, h){
  const vw = window.innerWidth, vh = window.innerHeight, m = 8;
  const top0 = navH() + m;
  return {
    top:  clamp(rand(top0, vh - h - m), top0, Math.max(top0+4, vh - h - m)),
    left: clamp(rand(m, vw - w - m), m, Math.max(m+4, vw - w - m)),
  };
}

function placeCenter(win){
  win.style.position  = 'fixed';
  win.style.top       = '50%';
  win.style.left      = '50%';
  win.style.transform = 'translate(-50%, -50%)';
}

function placeFixed(win, pos){
  win.style.position  = 'fixed';
  win.style.top       = pos.top  + 'px';
  win.style.left      = pos.left + 'px';
  win.style.transform = 'none';
}

// ================================================================
// TERMS MODAL
// ================================================================
function initTermsModal(){
  const overlay  = document.getElementById('terms-overlay');
  const checkbox = document.getElementById('terms-check');
  const startBtn = document.getElementById('terms-start-btn');

  if(!overlay) return;

  checkbox.addEventListener('change', () => {
    startBtn.disabled = !checkbox.checked;
  });

  startBtn.addEventListener('click', () => {
    if(!checkbox.checked) return;
    // モーダルをフェードアウト
    overlay.style.transition = 'opacity .5s ease';
    overlay.style.opacity = '0';
    setTimeout(() => {
      overlay.remove();
      setTimeout(showNextAd, 400);
    }, 500);
  });
}

// ================================================================
// AD FACTORY
// ================================================================
function createAdWindow({ title = '広告', isStorm = false } = {}){
  const win = document.createElement('div');
  win.className = 'ad-window' + (isStorm ? ' storm' : '');

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
  closeBtn.setAttribute('aria-label', '閉じる');

  hdr.append(lbl, ttl, closeBtn);
  win.appendChild(hdr);
  return { win, closeBtn };
}

function addCenteredBody(win, html){
  const bd = document.createElement('div');
  bd.className = 'ad-body ad-body--center';
  bd.innerHTML  = html;
  win.appendChild(bd);
  return bd;
}

function addProductBanner(win){
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
  banner.querySelector('.ad-cta-btn').addEventListener('click', () => {
    win.classList.add('ad-shake');
    setTimeout(() => win.classList.remove('ad-shake'), 400);
  });
}

function closeAd(win, cb){
  win.classList.add('ad-closing');
  setTimeout(() => { win.remove(); cb && cb(); }, 200);
}

// ================================================================
// DELETION LOG 演出
// 後半ほど目立つ（opacityを adIndex に応じて上げる）
// ================================================================
let adIndex = 0;

const DELETION_MSGS = [
  'Deleting...',
  'Archive Removed...',
  'Record Deleted...',
  'Transfer Processing...',
  'Subject Data Updated...',
  'Existence Log Cleared...',
  'Identity Record Removed...',
  'Memory Instance Purged...',
  'Contract Initialized...',
  'Consent Registered...',
];

function showDeletionLog(){
  const total   = AD_LIST.length + 3; // 大まかな全体数
  const ratio   = Math.min(adIndex / total, 1);          // 0→1
  const opacity = 0.12 + ratio * 0.55;                   // 0.12→0.67
  const size    = 10 + Math.floor(ratio * 4);            // 10→14px

  const msg = DELETION_MSGS[Math.floor(rand(0, DELETION_MSGS.length))];

  const el = document.createElement('div');
  el.textContent = msg;
  el.style.cssText = `
    position:fixed;
    top:${Math.floor(rand(10,85))}%;
    left:${Math.floor(rand(3,70))}%;
    font-size:${size}px;
    font-family:'SF Mono','Fira Code','Courier New',monospace;
    color:rgba(160,180,200,${opacity.toFixed(2)});
    letter-spacing:.1em;
    pointer-events:none;
    z-index:9999;
    opacity:0;
    transition:opacity .5s ease;
    white-space:nowrap;
  `;
  document.body.appendChild(el);
  requestAnimationFrame(() => requestAnimationFrame(() => { el.style.opacity = '1'; }));
  const duration = rand(1600, 3000);
  setTimeout(() => {
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 600);
  }, duration);
}

// ================================================================
// 広告リスト
// ================================================================
const AD_LIST = [
  { type: 'product', title: '【公式】Dream Soda 夏の炭酸祭り' },
  { type: 'text',    title: '🌊 夏の炭酸祭り',     body: 'Dream Soda Zero\nゼロカロリーで夏を楽しもう！' },
  { type: 'text',    title: 'ちょっといいですか',   body: 'あっ' },
  { type: 'text',    title: 'ちょっといいですか',   body: 'びっくりした' },
  { type: 'text',    title: 'ちょっといいですか',   body: '急に閉じるから' },
  { type: 'text',    title: '消していいよ',          body: '消していいよ' },
  { type: 'text',    title: '全然気にしてないから！', body: '全然気にしてないから！' },
  { type: 'text',    title: 'お願いがあるんだけど',  body: '話聞いてもらえたら嬉しいけど！' },
  { type: 'text',    title: 'まぁ消していいよ！',    body: 'まぁ消していいよ！' },
  { type: 'text',    title: 'ほんとに！',             body: 'ほんとに！' },
  { type: 'text',    title: '気にしてないから！',     body: '気にしてないから！' },
];

// ⑥（index=5）を閉じた直後に増殖イベント
const STORM_TRIGGER_INDEX = 5;
let stormDone = false;

// ================================================================
// MAIN LOOP
// ================================================================
function showNextAd(){
  // 増殖イベント（⑥直後）
  if(!stormDone && adIndex === STORM_TRIGGER_INDEX + 1){
    stormDone = true;
    runStormEvent(() => showNextAd());
    return;
  }

  // 全広告終了 → 契約広告
  if(adIndex >= AD_LIST.length){
    showContractAd();
    return;
  }

  const def = AD_LIST[adIndex];
  adIndex++;

  const { win, closeBtn } = createAdWindow({ title: def.title });

  if(def.type === 'product'){
    addProductBanner(win);
  } else {
    addCenteredBody(win,
      `<div class="ad-text-content" style="white-space:pre-line;text-align:center;font-size:16px;line-height:1.8;">${escHtml(def.body)}</div>`
    );
  }

  adLayer.appendChild(win);
  placeCenter(win);
  showDimmer();

  closeBtn.addEventListener('click', () => {
    showDeletionLog();
    closeAd(win, () => {
      hideDimmer();
      setTimeout(showNextAd, 300);
    });
  });
}

function escHtml(s){ return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

// ================================================================
// STORM EVENT
// ================================================================
const STORM_TITLES = ['Dream Soda！','夏の炭酸祭り！','ゼロカロリー！','公式キャンペーン！','Dream Soda Zero！','今すぐチェック！'];
const STORM_BODIES = ['Dream Soda Zero\nゼロカロリーで夏を楽しもう！','🌊 夏の炭酸祭り 2024 🌊','キンキンに冷えてるよ！','炭酸といえばDream Soda！','夏にぴったり！','Dream Soda！'];

function runStormEvent(onDone){
  // 「いっぱいあった方が…」広告
  const { win: tw, closeBtn: tb } = createAdWindow({ title: 'ちょっと思ったんだけど' });
  addCenteredBody(tw, `<div class="ad-text-content" style="text-align:center;font-size:16px;line-height:1.8;">いっぱいあった方が<br>見つけやすいよね！</div>`);
  adLayer.appendChild(tw);
  placeCenter(tw);
  showDimmer();

  tb.addEventListener('click', () => {
    showDeletionLog();
    closeAd(tw, () => spawnStorm(onDone));
  });
}

function spawnStorm(onDone){
  const TOTAL = 120; // 画面を埋め尽くす
  let spawned = [];
  let closedCount = 0;
  let apologyShown = false;

  // 契約テキストを自然に紛れ込ませるインデックス（複数）
  const contractIndices = new Set([
    Math.floor(rand(8,  20)),
    Math.floor(rand(25, 45)),
    Math.floor(rand(55, 80)),
  ]);

  // 契約テキスト（自然に読めるが意味が重い）
  const contractTexts = [
    'Dream Soda Zero\n私の人生を消します',
    '夏の炭酸祭り\n私の体を消します',
    'Dream Soda\n私はバツ印を押すと全てに同意します',
  ];
  const contractPool = [...contractTexts];

  for(let i = 0; i < TOTAL; i++){
    setTimeout(() => {
      const isContract = contractIndices.has(i) && contractPool.length > 0;
      const n = i % STORM_TITLES.length;

      const title = isContract ? STORM_TITLES[n] : STORM_TITLES[n];
      const body  = isContract
        ? contractPool.shift()
        : STORM_BODIES[n];

      const { win, closeBtn } = createAdWindow({ title, isStorm: true });
      addCenteredBody(win,
        `<div class="ad-text-content small" style="text-align:center;font-size:11px;white-space:pre-line;line-height:1.6;">${escHtml(body)}</div>`
      );
      adLayer.appendChild(win);
      spawned.push(win);
      setTimeout(() => {
        const r = win.getBoundingClientRect();
        placeFixed(win, safePos(r.width || 170, r.height || 85));
      }, 10);

      closeBtn.addEventListener('click', () => {
        showDeletionLog();
        spawned = spawned.filter(w => w !== win);
        closeAd(win);
        closedCount++;
        if(closedCount >= 5 && !apologyShown){
          apologyShown = true;
          runApology(spawned, onDone);
        }
      });
    }, i * 40); // 短い間隔で一気に埋め尽くす
  }
}

function runApology(remaining, onDone){
  const { win } = createAdWindow({ title: 'ごめん！！' });
  const bd = addCenteredBody(win, '');
  const textEl = document.createElement('div');
  textEl.className = 'ad-text-content';
  textEl.style.cssText = 'font-size:16px;font-weight:600;white-space:pre-line;text-align:center;line-height:1.85;';
  bd.appendChild(textEl);
  win.style.zIndex = '500';
  win.querySelector('.close-btn').style.display = 'none';
  adLayer.appendChild(win);
  placeCenter(win);

  const lines = ['ごめん！！', 'やりすぎた！！', '怒られるやつだこれ！！'];
  let li = 0;
  function nextLine(){
    if(li >= lines.length){
      autoDeleteSome(remaining, () => closeAd(win, onDone));
      return;
    }
    textEl.textContent += (li > 0 ? '\n' : '') + lines[li++];
    setTimeout(nextLine, 700);
  }
  nextLine();
}

function autoDeleteSome(ads, cb){
  const targets = ads.slice(0, Math.min(6, ads.length));
  targets.forEach((w, i) => {
    setTimeout(() => { if(w.parentElement) closeAd(w); }, i * 180);
  });
  setTimeout(cb, targets.length * 180 + 500);
}

// ================================================================
// CONTRACT AD — 契約広告
// ================================================================
let idleTimer = null;

function showContractAd(){
  const { win, closeBtn } = createAdWindow({ title: 'もう一回だけ出していい？' });

  // メイン文言
  const bd = addCenteredBody(win, '');
  bd.style.flexDirection = 'column';
  bd.style.gap = '12px';

  const mainText = document.createElement('div');
  mainText.className = 'ad-text-content';
  mainText.style.cssText = 'text-align:center;font-size:16px;font-weight:600;line-height:1.8;';
  mainText.textContent = 'もう一回だけ出していい？';
  bd.appendChild(mainText);

  // 英語の小さい文言（「読めば避けられる」構造）
  const contractNote = document.createElement('div');
  contractNote.style.cssText =
    'font-size:9px;font-family:\'SF Mono\',\'Fira Code\',\'Courier New\',monospace;' +
    'color:#aaa;text-align:center;line-height:1.6;padding:0 8px;letter-spacing:.02em;';
  contractNote.textContent = 'If you wish to delete your existence, press the red X above.';
  bd.appendChild(contractNote);

  adLayer.appendChild(win);
  placeCenter(win);
  showDimmer();
  win.classList.add('ad-pulse');

  // 待機ルート（12秒放置）
  idleTimer = setTimeout(() => triggerIdleRoute(win), 12000);

  // 契約成立 — ユーザーが自分で×を押す
  closeBtn.addEventListener('click', () => {
    clearTimeout(idleTimer);
    showDeletionLog();
    closeAd(win, () => {
      hideDimmer();
      setTimeout(runEnding, 400);
    });
  });
}

// ================================================================
// IDLE ROUTE — 放置ルート
// ================================================================
function triggerIdleRoute(win){
  // ×ボタンを無効化
  const cb = win.querySelector('.close-btn');
  if(cb){ cb.disabled = true; cb.style.opacity = '.25'; }
  win.classList.remove('ad-pulse');

  // ボディを書き換え
  const existingBd = win.querySelector('.ad-body');
  if(existingBd) existingBd.remove();

  const bd = addCenteredBody(win, '');
  bd.style.flexDirection = 'column';
  bd.style.gap = '16px';

  const msgs = ['あーあ', '失敗しちゃった', 'でももう逃さないよ', '新しい生贄をくれたら\n考えるけどね'];
  let i = 0;
  const textEl = document.createElement('div');
  textEl.className = 'ad-text-content';
  textEl.style.cssText = 'text-align:center;font-size:15px;line-height:1.9;white-space:pre-line;';
  bd.appendChild(textEl);

  function showMsg(){
    if(i >= msgs.length){
      // X共有ボタン
      const shareBtn = document.createElement('button');
      shareBtn.textContent = '𝕏 で共有する';
      shareBtn.style.cssText =
        'background:#000;color:#fff;border:none;border-radius:6px;padding:12px 22px;' +
        'font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;letter-spacing:.04em;' +
        '-webkit-tap-highlight-color:transparent;';
      shareBtn.addEventListener('click', () => {
        const text = encodeURIComponent('迷惑広告を私は消しました。');
        const url  = encodeURIComponent(location.href);
        window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
      });
      bd.appendChild(shareBtn);
      return;
    }
    textEl.textContent = msgs[i++];
    setTimeout(showMsg, 2200);
  }
  showMsg();
}

// ================================================================
// ENDING
// ================================================================
function runEnding(){
  // 暗転（出しっぱなし・チカチカしない）
  const black = document.createElement('div');
  black.style.cssText =
    'position:fixed;inset:0;z-index:9000;background:#000;opacity:0;' +
    'transition:opacity .8s ease;pointer-events:all;';
  document.body.appendChild(black);
  requestAnimationFrame(() => requestAnimationFrame(() => { black.style.opacity = '1'; }));

  // 暗転完了後にグリッチ → メッセージ → ブチッ
  setTimeout(() => {
    runGlitch(700, () => {
      showEndingMessages(() => runScreenCollapse());
    });
  }, 900);
}

function showEndingMessages(onDone){
  const msgs = [
    'ありがとう',
    'ちゃんと文字は読んだ方がいいよ',
    'おせっかいだけどね笑',
  ];

  const wrap = document.createElement('div');
  wrap.style.cssText =
    'position:fixed;inset:0;z-index:9100;display:flex;flex-direction:column;' +
    'align-items:center;justify-content:center;gap:28px;pointer-events:none;';
  document.body.appendChild(wrap);

  let i = 0;
  function next(){
    if(i >= msgs.length){
      // 最後のメッセージが出てから1.2秒後にブチッと全黒
      setTimeout(() => {
        wrap.remove();
        onDone();
      }, 1200);
      return;
    }
    const el = document.createElement('div');
    el.textContent = msgs[i++];
    el.style.cssText =
      'color:#fff;font-size:clamp(15px,3vw,22px);font-weight:500;letter-spacing:.06em;' +
      'opacity:0;transition:opacity .8s ease;text-align:center;padding:0 20px;';
    wrap.appendChild(el);
    requestAnimationFrame(() => requestAnimationFrame(() => { el.style.opacity = '1'; }));
    setTimeout(next, 2200);
  }
  next();
}

function runScreenCollapse(){
  // グリッチ短め
  runGlitch(400, () => {
    // 白フラッシュ（ブチッ）
    const flash = document.createElement('div');
    flash.style.cssText =
      'position:fixed;inset:0;z-index:9900;background:#fff;opacity:0;pointer-events:none;transition:opacity .04s;';
    document.body.appendChild(flash);

    requestAnimationFrame(() => requestAnimationFrame(() => {
      flash.style.opacity = '1';
      setTimeout(() => {
        // 即座に全黒・完全固定
        flash.remove();
        const finalBlack = document.createElement('div');
        finalBlack.style.cssText =
          'position:fixed;inset:0;z-index:99999;background:#000;opacity:1;pointer-events:all;';
        document.body.appendChild(finalBlack);
        document.title = 'このページは閉じられました';
        // favicon を空に
        let link = document.querySelector("link[rel~='icon']");
        if(!link){ link = document.createElement('link'); link.rel = 'icon'; document.head.appendChild(link); }
        link.href = 'data:,';
      }, 60);
    }));
  });
}

// ================================================================
// GLITCH + SCREEN SHAKE
// ================================================================
function runGlitch(duration, cb){
  const scanline = document.createElement('div');
  scanline.style.cssText =
    'position:fixed;inset:0;z-index:9200;pointer-events:none;' +
    'background:repeating-linear-gradient(0deg,rgba(0,0,0,.22) 0px,rgba(0,0,0,.22) 1px,transparent 1px,transparent 3px);' +
    `animation:glitchFlash ${(duration/1000).toFixed(1)}s ease forwards;`;
  document.body.appendChild(scanline);

  document.documentElement.style.animation = `screenShake ${(duration/1000).toFixed(1)}s ease forwards`;

  const bars = [];
  for(let i = 0; i < 5; i++){
    const bar = document.createElement('div');
    const h   = Math.floor(rand(2, 8));
    const top = Math.floor(rand(0, 94));
    const isR = i % 2 === 0;
    const key = `gb_${Date.now()}_${i}`;
    const tx1 = (rand(-20,20)).toFixed(0);
    const tx2 = (rand(-40,40)).toFixed(0);
    const st  = document.createElement('style');
    st.textContent = `@keyframes ${key}{
      0%{opacity:0;transform:translateX(-100%)}
      ${10+i*9}%{opacity:1;transform:translateX(${tx1}px)}
      ${40+i*6}%{opacity:.3;transform:translateX(${tx2}px)}
      70%{opacity:0}100%{opacity:0}
    }`;
    document.head.appendChild(st);
    bar.style.cssText =
      `position:fixed;left:0;right:0;height:${h}px;top:${top}%;z-index:9201;pointer-events:none;` +
      `background:rgba(${isR?'255,30,80':'0,220,255'},.65);opacity:0;` +
      `animation:${key} ${(duration/1000).toFixed(1)}s ${(i*.13).toFixed(2)}s ease forwards;`;
    document.body.appendChild(bar);
    bars.push({ bar, st });
  }

  setTimeout(() => {
    scanline.remove();
    bars.forEach(({ bar, st }) => { bar.remove(); st.remove(); });
    document.documentElement.style.animation = '';
    cb && cb();
  }, duration);
}

// ================================================================
// INIT
// ================================================================
window.addEventListener('load', () => {
  initTermsModal();
});
