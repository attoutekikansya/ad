/* ================================================================
   命乞いする広告 — 完全実装版
================================================================ */

// ===== DOM =====
const adLayer = document.getElementById('ad-layer');
const dimmer  = document.getElementById('bg-dimmer');

function showDimmer(){ dimmer.classList.add('active'); }
// 出しっぱなし — チカチカしないよう意図的にオフにしない
function hideDimmer(){}

// ===== UTILS =====
const clamp = (v,lo,hi) => Math.min(Math.max(v,lo),hi);
const rand  = (a,b)     => a + Math.random()*(b-a);

function navH(){
  const h = document.querySelector('header');
  return h ? h.getBoundingClientRect().height : 86;
}
function safePos(w,h){
  const vw=window.innerWidth, vh=window.innerHeight, m=8, t0=navH()+m;
  return {
    top:  clamp(rand(t0, vh-h-m), t0, Math.max(t0+4, vh-h-m)),
    left: clamp(rand(m,  vw-w-m), m,  Math.max(m+4,  vw-w-m)),
  };
}
function placeCenter(w){
  w.style.cssText += ';position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);';
}
function placeFixed(w,p){
  w.style.position='fixed'; w.style.top=p.top+'px'; w.style.left=p.left+'px'; w.style.transform='none';
}
function escHtml(s){ return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>'); }

// ================================================================
// TERMS MODAL
// ================================================================
function initTermsModal(){
  const overlay  = document.getElementById('terms-overlay');
  const checkbox = document.getElementById('terms-check');
  const startBtn = document.getElementById('terms-start-btn');
  if(!overlay) return;
  checkbox.addEventListener('change', () => { startBtn.disabled = !checkbox.checked; });
  startBtn.addEventListener('click', () => {
    if(!checkbox.checked) return;
    overlay.style.transition = 'opacity .5s';
    overlay.style.opacity = '0';
    setTimeout(() => { overlay.remove(); setTimeout(showNextAd, 400); }, 500);
  });
}

// ================================================================
// AD FACTORY
// ================================================================
function createAdWindow({ title='広告', isStorm=false, showClose=true }={}){
  const win = document.createElement('div');
  win.className = 'ad-window' + (isStorm ? ' storm' : '');

  const hdr = document.createElement('div');
  hdr.className = 'ad-header';

  const lbl = document.createElement('span');
  lbl.className='ad-label'; lbl.textContent='広告';

  const ttl = document.createElement('span');
  ttl.className='ad-title-bar'; ttl.textContent=title;

  const closeBtn = document.createElement('button');
  closeBtn.className='close-btn'; closeBtn.innerHTML='&#10005;';
  closeBtn.setAttribute('aria-label','閉じる');
  if(!showClose) closeBtn.style.display='none';

  hdr.append(lbl,ttl,closeBtn);
  win.appendChild(hdr);
  return { win, closeBtn };
}

function addCenteredBody(win, text, style=''){
  const bd = document.createElement('div');
  bd.className = 'ad-body ad-body--center';
  const t = document.createElement('div');
  t.className = 'ad-text-content';
  t.style.cssText = 'text-align:center;white-space:pre-line;font-size:16px;line-height:1.85;' + style;
  t.textContent = text;
  bd.appendChild(t);
  win.appendChild(bd);
  return t;
}

function addProductBanner(win){
  const b = document.createElement('div');
  b.className='ad-product-banner';
  b.innerHTML=`
    <div class="ad-product-logo">Dream<span>Soda</span></div>
    <div class="ad-product-sub">Since 1985 · Official</div>
    <div class="ad-product-name">Dream Soda Zero</div>
    <div class="ad-campaign">🌊 夏の炭酸祭り 2024 🌊</div>
    <div class="ad-small-print">広告主：Dream Soda　キャンペーン期間：2024年6月〜8月31日</div>
  `;
  win.appendChild(b);
}

function closeAd(win,cb){
  win.classList.add('ad-closing');
  setTimeout(()=>{ win.remove(); cb&&cb(); },200);
}

// ================================================================
// DELETION LOG — 後半ほど不穏に・目立つ
// ================================================================
let adIndex = 0;

// フェーズ別ログ
const DELETION_PHASES = [
  // 序盤（ほぼ見えない）
  ['Deleting Advertisement...','Deleting Record...','Archive Removed...','Record Deleted...'],
  // 中盤
  ['Deleting Subject Data...','Transfer Processing...','Memory Instance Purged...','Identity Log Updated...'],
  // 後半（不穏）
  ['Deleting Subject...','Deleting User...','Existence Log Cleared...','Transfer Complete...','Contract Initialized...','Consent Registered...'],
];

function showDeletionLog(){
  const TOTAL  = 8; // 広告の総数（目安）
  const ratio  = Math.min(adIndex / TOTAL, 1);
  const opacity= 0.1 + ratio * 0.6;
  const size   = 9  + Math.floor(ratio * 5);

  // フェーズ選択
  const phaseIdx = Math.floor(ratio * (DELETION_PHASES.length - 1));
  const pool = DELETION_PHASES[phaseIdx];
  const msg  = pool[Math.floor(rand(0, pool.length))];

  const el = document.createElement('div');
  el.textContent = msg;
  el.style.cssText = [
    'position:fixed',
    `top:${Math.floor(rand(8,88))}%`,
    `left:${Math.floor(rand(3,68))}%`,
    `font-size:${size}px`,
    "font-family:'SF Mono','Fira Code','Courier New',monospace",
    `color:rgba(160,180,200,${opacity.toFixed(2)})`,
    'letter-spacing:.1em',
    'pointer-events:none',
    'z-index:9999',
    'opacity:0',
    'transition:opacity .5s ease',
    'white-space:nowrap',
  ].join(';');
  document.body.appendChild(el);
  requestAnimationFrame(()=>requestAnimationFrame(()=>{ el.style.opacity='1'; }));
  setTimeout(()=>{ el.style.opacity='0'; setTimeout(()=>el.remove(),600); }, rand(1800,3200));
}

// ================================================================
// 広告シナリオ
// ================================================================
// 自動表示パート（×なし・自動送り）
const AUTO_ADS = [
  { title:'利用規約に同意します',   body:'あっ' },
  { title:'契約します',             body:'びっくりした' },
  { title:'所有権移転契約',         body:'急に閉じるから' },
];
const AUTO_INTERVAL = 1800; // ms

// プレイヤーが閉じるパート
const MANUAL_ADS = [
  { title:'存在情報譲渡契約',       body:'広告ってすぐ消しちゃうよね' },
  { title:'利用規約に同意します',   body:'ちょっとだけ話を聞いてほしい' },
  { title:'所有権移転契約',         body:'まあ話長ければ消してもいいよ！' },
];

// ① ページ①: Dream Soda バナー（×で閉じる）
// ② 自動パート3本
// ③ 手動パート3本
// ④ 増殖イベント
// ⑤ 契約広告

let phase = 'product'; // product → auto → manual → storm → contract

// ================================================================
// MAIN: 広告1枚目（Dream Soda）
// ================================================================
function showNextAd(){
  if(phase==='product'){
    phase='auto';
    showProductAd();
  } else if(phase==='auto'){
    phase='manual';
    runAutoAds(()=>{
      runManualAds(()=>{
        phase='storm';
        runStormEvent(()=>{
          phase='contract';
          showContractAd();
        });
      });
    });
  }
}

function showProductAd(){
  adIndex++;
  const { win, closeBtn } = createAdWindow({ title:'【公式】Dream Soda 夏の炭酸祭り' });
  addProductBanner(win);
  adLayer.appendChild(win);
  placeCenter(win);
  showDimmer();
  closeBtn.addEventListener('click',()=>{
    showDeletionLog();
    closeAd(win,()=>setTimeout(showNextAd,300));
  });
}

// ================================================================
// 自動パート — ×ボタンなし、自動で切り替わる
// ================================================================
function runAutoAds(onDone){
  let i=0;
  let current=null;

  function next(){
    if(i>=AUTO_ADS.length){ if(current) closeAd(current,onDone); else onDone(); return; }
    const def=AUTO_ADS[i++];
    adIndex++;
    const { win } = createAdWindow({ title:def.title, showClose:false });
    addCenteredBody(win, def.body);
    adLayer.appendChild(win);
    placeCenter(win);
    showDimmer();
    if(current) closeAd(current);
    current=win;
    showDeletionLog();
    setTimeout(next, AUTO_INTERVAL);
  }
  next();
}

// ================================================================
// 手動パート — ×ボタンあり、プレイヤーが閉じて進む
// ================================================================
function runManualAds(onDone){
  let i=0;

  function next(){
    if(i>=MANUAL_ADS.length){ onDone(); return; }
    const def=MANUAL_ADS[i++];
    adIndex++;
    const { win, closeBtn } = createAdWindow({ title:def.title });
    addCenteredBody(win, def.body);
    adLayer.appendChild(win);
    placeCenter(win);
    showDimmer();
    closeBtn.addEventListener('click',()=>{
      showDeletionLog();
      closeAd(win,()=>setTimeout(next,300));
    });
  }
  next();
}

// ================================================================
// 増殖イベント
// ================================================================
const STORM_TITLES = ['Dream Soda！','夏の炭酸祭り！','ゼロカロリー！','公式キャンペーン！','Dream Soda Zero！','今すぐチェック！'];
const STORM_BODIES = [
  'Dream Soda Zero\nゼロカロリーで夏を楽しもう！',
  '🌊 夏の炭酸祭り 2024 🌊',
  'キンキンに冷えてるよ！',
  '炭酸といえばDream Soda！',
  '夏にぴったり！',
  'Dream Soda！',
];

// 増殖中に混ぜる契約テキスト（タイトルは普通、本文に紛れ込む）
const STORM_CONTRACT_BODIES = [
  'Dream Soda Zero\n私の人生を消します',
  '夏の炭酸祭り\n私の体を消します',
  'Dream Soda\n私はバツ印を押すと全てに同意します',
];

function runStormEvent(onDone){
  const { win:tw, closeBtn:tb } = createAdWindow({ title:'そういえば' });
  addCenteredBody(tw,'そんなに消したいなら\nいっぱいあるほうがいいよね！');
  adLayer.appendChild(tw); placeCenter(tw); showDimmer();
  tb.addEventListener('click',()=>{
    showDeletionLog();
    closeAd(tw,()=>spawnStorm(onDone));
  });
}

function spawnStorm(onDone){
  const TOTAL = 120;
  let spawned=[], closedCount=0, apologyShown=false;
  adIndex++;

  // 契約テキストを混ぜるインデックス
  const contractSet = new Set([
    Math.floor(rand(6,18)),
    Math.floor(rand(25,50)),
    Math.floor(rand(60,90)),
  ]);
  const contractPool = [...STORM_CONTRACT_BODIES];

  for(let i=0;i<TOTAL;i++){
    setTimeout(()=>{
      const isContract = contractSet.has(i) && contractPool.length>0;
      const n = i % STORM_TITLES.length;
      const body = isContract ? contractPool.shift() : STORM_BODIES[n];

      const { win, closeBtn } = createAdWindow({ title:STORM_TITLES[n], isStorm:true });
      addCenteredBody(win, body, 'font-size:11px;line-height:1.6;');
      adLayer.appendChild(win);
      spawned.push(win);
      setTimeout(()=>{
        const r=win.getBoundingClientRect();
        placeFixed(win, safePos(r.width||170, r.height||85));
      },10);

      closeBtn.addEventListener('click',()=>{
        showDeletionLog();
        spawned=spawned.filter(w=>w!==win);
        closeAd(win);
        closedCount++;
        if(closedCount>=5 && !apologyShown){
          apologyShown=true;
          runApology(spawned, onDone);
        }
      });
    }, i*40);
  }
}

function runApology(remaining, onDone){
  const { win } = createAdWindow({ title:'ごめんやりすぎた！' });
  win.querySelector('.close-btn').style.display='none';
  const textEl = addCenteredBody(win,'','font-size:17px;font-weight:600;');
  textEl.textContent='ごめんやりすぎた！';
  win.style.zIndex='500';
  adLayer.appendChild(win); placeCenter(win);

  // 1.5秒後に増殖分をすべて自動削除
  setTimeout(()=>{
    const all=[...remaining];
    all.forEach((w,i)=>{ setTimeout(()=>{ if(w.parentElement) closeAd(w); },i*30); });
    setTimeout(()=>{ closeAd(win, onDone); }, all.length*30+600);
  },1500);
}

// ================================================================
// 契約広告
// ================================================================
let idleTimer=null;

function showContractAd(){
  adIndex++;
  const { win, closeBtn } = createAdWindow({
    title:'この広告を閉じるとあなたの体を奪います',
  });

  const bd = document.createElement('div');
  bd.className='ad-body ad-body--center';
  bd.style.flexDirection='column'; bd.style.gap='10px';

  const mainTxt = document.createElement('div');
  mainTxt.className='ad-text-content';
  mainTxt.style.cssText='text-align:center;font-size:16px;font-weight:600;line-height:1.8;';
  mainTxt.textContent='もう一回だけ出していい？';
  bd.appendChild(mainTxt);

  win.appendChild(bd);
  adLayer.appendChild(win); placeCenter(win); showDimmer();
  win.classList.add('ad-pulse');

  idleTimer=setTimeout(()=>triggerIdleRoute(win), 12000);

  closeBtn.addEventListener('click',()=>{
    clearTimeout(idleTimer);
    showDeletionLog();
    closeAd(win,()=>setTimeout(runEnding,400));
  });
}

// ================================================================
// IDLE ROUTE（放置）
// ================================================================
function triggerIdleRoute(win){
  const cb=win.querySelector('.close-btn');
  if(cb){ cb.disabled=true; cb.style.opacity='.25'; }
  win.classList.remove('ad-pulse');

  const existBd=win.querySelector('.ad-body');
  if(existBd) existBd.remove();

  const bd=document.createElement('div');
  bd.className='ad-body ad-body--center';
  bd.style.cssText='flex-direction:column;gap:16px;';

  const textEl=document.createElement('div');
  textEl.className='ad-text-content';
  textEl.style.cssText='text-align:center;font-size:15px;line-height:1.9;white-space:pre-line;';
  bd.appendChild(textEl);
  win.appendChild(bd);

  const msgs=['あーあ','失敗しちゃった','でももう逃さないよ','新しい生贄をくれたら\n考えるけどね'];
  let i=0;
  function showMsg(){
    if(i>=msgs.length){
      // Xポストボタン
      const shareBtn=document.createElement('button');
      shareBtn.textContent='𝕏 で共有する';
      shareBtn.style.cssText=
        'background:#000;color:#fff;border:none;border-radius:6px;padding:12px 22px;' +
        'font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;letter-spacing:.04em;' +
        '-webkit-tap-highlight-color:transparent;';
      shareBtn.addEventListener('click',()=>{
        const text=encodeURIComponent('迷惑広告を私は消しました。');
        const url=encodeURIComponent(location.href);
        window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`,'_blank');
        // ポスト押した瞬間プツッとブラックアウト
        setTimeout(()=>{
          const b=document.createElement('div');
          b.style.cssText='position:fixed;inset:0;z-index:99999;background:#000;opacity:1;pointer-events:all;';
          document.body.appendChild(b);
          document.title='このページは閉じられました';
        },80);
      });
      bd.appendChild(shareBtn);
      return;
    }
    textEl.textContent=msgs[i++];
    setTimeout(showMsg,2200);
  }
  showMsg();
}

// ================================================================
// ENDING（通常エンド）
// ================================================================
function runEnding(){
  // 暗転（出しっぱなし）
  const black=document.createElement('div');
  black.style.cssText=
    'position:fixed;inset:0;z-index:9000;background:#000;opacity:0;transition:opacity .8s;pointer-events:all;';
  document.body.appendChild(black);
  requestAnimationFrame(()=>requestAnimationFrame(()=>{ black.style.opacity='1'; }));

  // 暗転後にグリッチ＋削除演出
  setTimeout(()=>{
    runLongGlitchWithLog(3500, ()=>{
      showEndingMessages(()=>runScreenCollapse());
    });
  },900);
}

// 長いグリッチ + 削除ログを連続表示
function runLongGlitchWithLog(duration, cb){
  // 複数回グリッチを繰り返す
  runGlitch(600,()=>{
    showProcessingLog(()=>{
      runGlitch(500,()=>{
        showProcessingLog(()=>{
          runGlitch(400,()=>{
            cb&&cb();
          });
        });
      });
    });
  });
}

// 削除処理ログを大きく中央表示
const PROCESS_LOGS = [
  ['Deleting...','Deleting...','Deleting...'],
  ['Archive Removed','Subject Deleted'],
  ['Transfer Complete'],
];
let processPhase=0;

function showProcessingLog(cb){
  const lines=PROCESS_LOGS[processPhase % PROCESS_LOGS.length];
  processPhase++;

  const wrap=document.createElement('div');
  wrap.style.cssText=
    'position:fixed;inset:0;z-index:9300;display:flex;flex-direction:column;' +
    'align-items:center;justify-content:center;gap:10px;pointer-events:none;background:rgba(0,0,0,.6);';
  document.body.appendChild(wrap);

  lines.forEach((txt,i)=>{
    const el=document.createElement('div');
    el.textContent=txt;
    el.style.cssText=
      'color:#0f0;font-family:\'SF Mono\',\'Fira Code\',monospace;font-size:clamp(13px,2.5vw,18px);' +
      'letter-spacing:.15em;opacity:0;transition:opacity .3s;';
    wrap.appendChild(el);
    setTimeout(()=>{ el.style.opacity='1'; },i*300);
  });

  setTimeout(()=>{
    wrap.style.opacity='0';
    wrap.style.transition='opacity .4s';
    setTimeout(()=>{ wrap.remove(); cb&&cb(); },400);
  }, lines.length*300 + 700);
}

function showEndingMessages(onDone){
  const msgs=['ありがとう','ちゃんと文字は読んだ方がいいよ','おせっかいだけどね笑'];
  const wrap=document.createElement('div');
  wrap.style.cssText=
    'position:fixed;inset:0;z-index:9100;display:flex;flex-direction:column;' +
    'align-items:center;justify-content:center;gap:28px;pointer-events:none;';
  document.body.appendChild(wrap);

  let i=0;
  function next(){
    if(i>=msgs.length){ setTimeout(()=>{ wrap.remove(); onDone(); },1200); return; }
    const el=document.createElement('div');
    el.textContent=msgs[i++];
    el.style.cssText=
      'color:#fff;font-size:clamp(15px,3vw,22px);font-weight:500;letter-spacing:.06em;' +
      'opacity:0;transition:opacity .8s;text-align:center;padding:0 20px;';
    wrap.appendChild(el);
    requestAnimationFrame(()=>requestAnimationFrame(()=>{ el.style.opacity='1'; }));
    setTimeout(next,2200);
  }
  next();
}

function runScreenCollapse(){
  runGlitch(350,()=>{
    const flash=document.createElement('div');
    flash.style.cssText=
      'position:fixed;inset:0;z-index:9900;background:#fff;opacity:0;pointer-events:none;transition:opacity .04s;';
    document.body.appendChild(flash);
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      flash.style.opacity='1';
      setTimeout(()=>{
        flash.remove();
        const finalBlack=document.createElement('div');
        finalBlack.style.cssText=
          'position:fixed;inset:0;z-index:99999;background:#000;opacity:1;pointer-events:all;';
        document.body.appendChild(finalBlack);
        document.title='このページは閉じられました';
        let link=document.querySelector("link[rel~='icon']");
        if(!link){ link=document.createElement('link'); link.rel='icon'; document.head.appendChild(link); }
        link.href='data:,';
      },60);
    }));
  });
}

// ================================================================
// GLITCH + SCREEN SHAKE
// ================================================================
function runGlitch(duration,cb){
  const scanline=document.createElement('div');
  scanline.style.cssText=
    'position:fixed;inset:0;z-index:9200;pointer-events:none;' +
    'background:repeating-linear-gradient(0deg,rgba(0,0,0,.22) 0px,rgba(0,0,0,.22) 1px,transparent 1px,transparent 3px);' +
    `animation:glitchFlash ${(duration/1000).toFixed(1)}s ease forwards;`;
  document.body.appendChild(scanline);
  document.documentElement.style.animation=`screenShake ${(duration/1000).toFixed(1)}s ease forwards`;

  const bars=[];
  for(let i=0;i<5;i++){
    const h=Math.floor(rand(2,8)), top=Math.floor(rand(0,94)), isR=i%2===0;
    const key=`gb_${Date.now()}_${i}`, tx1=(rand(-20,20)).toFixed(0), tx2=(rand(-40,40)).toFixed(0);
    const st=document.createElement('style');
    st.textContent=`@keyframes ${key}{
      0%{opacity:0;transform:translateX(-100%)}
      ${10+i*9}%{opacity:1;transform:translateX(${tx1}px)}
      ${40+i*6}%{opacity:.3;transform:translateX(${tx2}px)}
      70%{opacity:0}100%{opacity:0}}`;
    document.head.appendChild(st);
    const bar=document.createElement('div');
    bar.style.cssText=
      `position:fixed;left:0;right:0;height:${h}px;top:${top}%;z-index:9201;pointer-events:none;` +
      `background:rgba(${isR?'255,30,80':'0,220,255'},.65);opacity:0;` +
      `animation:${key} ${(duration/1000).toFixed(1)}s ${(i*.13).toFixed(2)}s ease forwards;`;
    document.body.appendChild(bar);
    bars.push({bar,st});
  }

  setTimeout(()=>{
    scanline.remove();
    bars.forEach(({bar,st})=>{ bar.remove(); st.remove(); });
    document.documentElement.style.animation='';
    cb&&cb();
  },duration);
}

// ================================================================
// INIT
// ================================================================
window.addEventListener('load',()=>{ initTermsModal(); });
