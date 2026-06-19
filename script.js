/* ===== 命乞いする広告 ===== */

const CORRECT_ANSWER_VARIANTS = [
  'dream soda', 'dreamsoda',
];
const CORRECT_ANSWER_JP = 'ドリームソーダ'; // if typed in JP

// ===== STATE =====
let phase = 'intro';   // intro > chat > storm > apology > alone > final
let stepIndex = 0;
let stormAds = [];
let stormClosed = 0;
let selfCloseTimer = null;

const adLayer = document.getElementById('ad-layer');
const inputOverlay = document.getElementById('input-overlay');
const finalMessage = document.getElementById('final-message');
const answerInput = document.getElementById('answer-input');
const submitBtn = document.getElementById('submit-btn');
const answerFeedback = document.getElementById('answer-feedback');

// ===== SCENARIO DATA =====

const chatSteps = [
  // step 0 → shown immediately as intro ad
  null,
  // step 1
  {
    title: 'ちょっといいですか',
    body: 'あっ',
    delay: 0,
  },
  {
    title: 'ちょっといいですか',
    body: 'びっくりした',
    delay: 500,
  },
  {
    title: 'ちょっといいですか',
    body: '急に消すから',
    delay: 500,
  },
  {
    title: '大丈夫大丈夫！',
    body: '大丈夫大丈夫！\n広告なんて消されるのが仕事だし！',
    delay: 600,
  },
  {
    title: '消していいよ！',
    body: '消していいよ！\n気にしてないから！',
    delay: 500,
  },
  {
    title: 'お願いがあるんだけど',
    body: '話……\n聞いてもらえたら嬉しいんだけど！',
    delay: 600,
  },
  {
    title: 'ちゃんと届けたくて',
    body: 'せっかく作ってもらったのに\nちゃんと見てもらえなくて',
    delay: 700,
  },
  {
    title: 'ちゃんと届けたくて',
    body: 'だから思ったんだけど',
    delay: 600,
  },
  // → STORM START
];

const stormMessages = [
  '広告いっぱいあった方が\n見つけやすいよね！',
  '目に入りやすいし！',
  'ね？いいアイデアでしょ！',
  'こんにちは！',
  'よろしくね！',
  '見て見て！',
  '夏の炭酸！',
  'おいしいよ！',
  'ゼロカロリー！',
];

// ===== UTILITY =====

function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

function randomBetween(a, b) {
  return a + Math.random() * (b - a);
}

function safePosition(width, height) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const margin = 8;
  const top = clamp(randomBetween(50, vh - height - margin), 50 + margin, vh - height - margin);
  const left = clamp(randomBetween(margin, vw - width - margin), margin, vw - width - margin);
  return { top, left };
}

function centerPosition(width, height) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  return {
    top: Math.max(60, (vh - height) / 2),
    left: Math.max(10, (vw - width) / 2),
  };
}

// ===== CREATE AD WINDOW =====

function createAdWindow({ title = '広告', body = '', isStorm = false, isAlone = false } = {}) {
  const win = document.createElement('div');
  win.className = 'ad-window' + (isStorm ? ' storm' : '');

  // Header
  const header = document.createElement('div');
  header.className = 'ad-header';

  const label = document.createElement('span');
  label.className = 'ad-label';
  label.textContent = '広告';

  const titleBar = document.createElement('span');
  titleBar.className = 'ad-title-bar';
  titleBar.textContent = title;

  const closeBtn = document.createElement('button');
  closeBtn.className = 'close-btn';
  closeBtn.innerHTML = '&#10005;';
  closeBtn.setAttribute('aria-label', '広告を閉じる');

  header.appendChild(label);
  header.appendChild(titleBar);
  header.appendChild(closeBtn);
  win.appendChild(header);

  return { win, closeBtn, header, titleBar };
}

function positionWindow(win, { top, left }) {
  win.style.position = 'absolute';
  win.style.top = top + 'px';
  win.style.left = left + 'px';
  win.style.transform = 'none';
}

function closeAdWindow(win, callback) {
  win.classList.add('ad-closing');
  setTimeout(() => {
    win.remove();
    if (callback) callback();
  }, 200);
}

// ===== PHASE: INTRO AD =====

function showIntroAd() {
  phase = 'intro';
  const { win, closeBtn } = createAdWindow({ title: '【公式】Dream Soda 夏の炭酸祭り' });

  const body = document.createElement('div');
  body.className = 'ad-product-banner';

  body.innerHTML = `
    <div class="ad-product-logo">Dream<span>Soda</span></div>
    <div class="ad-product-sub">Since 1985 · Official</div>
    <div class="ad-product-name">Dream Soda Zero</div>
    <div class="ad-campaign">🌊 夏の炭酸祭り 2024 🌊</div>
    <button class="ad-cta-btn">詳しくはこちら</button>
    <div class="ad-small-print">広告主：Dream Soda / キャンペーン期間：2024年6月〜8月31日</div>
  `;
  win.appendChild(body);

  adLayer.appendChild(win);

  // Center it
  requestAnimationFrame(() => {
    const rect = win.getBoundingClientRect();
    const pos = centerPosition(rect.width, rect.height);
    positionWindow(win, pos);
  });

  closeBtn.addEventListener('click', () => {
    closeAdWindow(win, () => {
      setTimeout(showNextChatAd, 300);
    });
  });

  // CTA does nothing (it's a game)
  win.querySelector('.ad-cta-btn').addEventListener('click', () => {
    win.classList.add('ad-shake');
    setTimeout(() => win.classList.remove('ad-shake'), 400);
  });
}

// ===== PHASE: CHAT ADS =====

let currentChatWin = null;

function showNextChatAd() {
  stepIndex++;
  if (stepIndex >= chatSteps.length) {
    // → trigger storm
    startStormPhase();
    return;
  }
  const step = chatSteps[stepIndex];
  if (!step) {
    stepIndex++;
    showNextChatAd();
    return;
  }

  const { win, closeBtn, titleBar } = createAdWindow({ title: step.title });
  const body = document.createElement('div');
  body.className = 'ad-body';
  const text = document.createElement('div');
  text.className = 'ad-text-content';
  text.textContent = step.body;
  body.appendChild(text);
  win.appendChild(body);

  adLayer.appendChild(win);
  currentChatWin = win;

  requestAnimationFrame(() => {
    const rect = win.getBoundingClientRect();
    const pos = centerPosition(rect.width, rect.height);
    positionWindow(win, pos);
  });

  // slight delay before allowing close (makes it feel alive)
  closeBtn.disabled = true;
  setTimeout(() => { closeBtn.disabled = false; }, step.delay || 0);

  closeBtn.addEventListener('click', () => {
    closeAdWindow(win, () => {
      if (stepIndex >= chatSteps.length - 1) {
        startStormPhase();
      } else {
        setTimeout(showNextChatAd, 200);
      }
    });
  });
}

// ===== PHASE: STORM =====

const STORM_COUNT = 9;

function startStormPhase() {
  phase = 'storm';
  stormClosed = 0;
  stormAds = [];

  // Brief pause then flood
  setTimeout(() => {
    stormMessages.forEach((msg, i) => {
      setTimeout(() => {
        spawnStormAd(msg, i);
      }, i * 120);
    });
  }, 400);
}

function spawnStormAd(message, idx) {
  const titles = ['おーい！', 'ねえねえ！', 'こっちも！', 'やあ！', '見て！', 'ここだよ！'];
  const title = titles[idx % titles.length];

  const { win, closeBtn } = createAdWindow({ title, isStorm: true });
  const body = document.createElement('div');
  body.className = 'ad-body';
  const text = document.createElement('div');
  text.className = 'ad-text-content small';
  text.textContent = message;
  body.appendChild(text);
  win.appendChild(body);

  adLayer.appendChild(win);
  stormAds.push(win);

  // Random position
  requestAnimationFrame(() => {
    const rect = win.getBoundingClientRect();
    const w = rect.width || 220;
    const h = rect.height || 100;
    const pos = safePosition(w, h);
    positionWindow(win, pos);
  });

  closeBtn.addEventListener('click', () => {
    const i = stormAds.indexOf(win);
    if (i !== -1) stormAds.splice(i, 1);
    closeAdWindow(win);
    stormClosed++;
    if (stormClosed >= 3) {
      startApologyPhase();
    }
  });
}

// ===== PHASE: APOLOGY =====

let apologyStarted = false;

function startApologyPhase() {
  if (apologyStarted) return;
  apologyStarted = true;
  phase = 'apology';

  // Show apology ad
  const { win, closeBtn } = createAdWindow({ title: 'ごめん！！' });
  const body = document.createElement('div');
  body.className = 'ad-body';
  const text = document.createElement('div');
  text.className = 'ad-text-content big';
  text.textContent = 'ごめん！！\nやりすぎた！！\n怒られるやつだこれ！！\n私が消すから！！';
  body.appendChild(text);
  win.appendChild(body);
  adLayer.appendChild(win);

  requestAnimationFrame(() => {
    const rect = win.getBoundingClientRect();
    const pos = centerPosition(rect.width, rect.height);
    positionWindow(win, pos);
  });

  // Disable close btn on apology ad temporarily
  closeBtn.disabled = true;

  // Auto-close all storm ads one by one
  let delay = 800;
  const remaining = [...stormAds];
  remaining.forEach(stormWin => {
    setTimeout(() => {
      if (stormWin.parentElement) {
        closeAdWindow(stormWin);
      }
    }, delay);
    delay += 200;
  });
  stormAds = [];

  // After cleanup, make apology closeable, then transition
  setTimeout(() => {
    closeBtn.disabled = false;
    closeBtn.addEventListener('click', () => {
      closeAdWindow(win, () => {
        setTimeout(showAlonePhase, 500);
      });
    });
  }, delay + 400);
}

// ===== PHASE: ALONE =====

function showAlonePhase() {
  phase = 'alone';

  const { win, closeBtn } = createAdWindow({ title: '最後に一つだけ' });
  const body = document.createElement('div');
  body.className = 'ad-body';
  const text = document.createElement('div');
  text.className = 'ad-text-content';
  text.textContent = 'ごめん\n\n最後に一つだけ聞いていい？';
  body.appendChild(text);
  win.appendChild(body);
  adLayer.appendChild(win);

  win.classList.add('ad-pulse');

  requestAnimationFrame(() => {
    const rect = win.getBoundingClientRect();
    const pos = centerPosition(rect.width, rect.height);
    positionWindow(win, pos);
  });

  // small delay before close is possible
  closeBtn.style.opacity = '0.3';
  closeBtn.disabled = true;
  setTimeout(() => {
    closeBtn.style.opacity = '';
    closeBtn.disabled = false;
    closeBtn.addEventListener('click', () => {
      closeAdWindow(win, () => {
        setTimeout(showFinalPhase, 400);
      });
    });
  }, 1800);
}

// ===== PHASE: FINAL =====

function showFinalPhase() {
  phase = 'final';
  finalMessage.textContent = '私の広告主は\n誰だった？';
  inputOverlay.classList.remove('hidden');
  answerInput.focus();
}

// ===== ANSWER CHECK =====

function normalizeAnswer(str) {
  return str
    .toLowerCase()
    .replace(/[　 ]/g, '')        // spaces
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFEE0))  // fullwidth→half
    .replace(/[-－ー]/g, '')      // dashes
    .trim();
}

function checkAnswer() {
  const raw = answerInput.value;
  const norm = normalizeAnswer(raw);

  const isCorrect =
    CORRECT_ANSWER_VARIANTS.some(v => norm.includes(normalizeAnswer(v))) ||
    raw.includes(CORRECT_ANSWER_JP);

  if (isCorrect) {
    showCorrectResponse();
  } else {
    showWrongResponse();
  }
}

function showWrongResponse() {
  answerInput.disabled = true;
  submitBtn.disabled = true;

  answerFeedback.className = 'wrong';
  answerFeedback.textContent = 'うーん\nもう一回……思い出せそう？';
  answerFeedback.classList.remove('hidden');

  setTimeout(() => {
    answerInput.disabled = false;
    submitBtn.disabled = false;
    answerInput.value = '';
    answerInput.focus();
    answerFeedback.classList.add('hidden');
  }, 2000);
}

function showCorrectResponse() {
  answerInput.disabled = true;
  submitBtn.disabled = true;
  document.getElementById('input-area').style.display = 'none';

  const lines = [
    '……',
    'そっか',
    'ちゃんと役割は\n果たせたんだ',
    'ありがと',
    'いいネットサーフィンを！',
  ];

  let i = 0;
  answerFeedback.className = '';
  answerFeedback.classList.remove('hidden');

  function showNextLine() {
    if (i >= lines.length) {
      // Self-close
      setTimeout(() => {
        const finalAd = document.getElementById('final-ad');
        finalAd.style.transition = 'opacity 1.2s ease, transform 1.2s ease';
        finalAd.style.opacity = '0';
        finalAd.style.transform = 'scale(0.9) translateY(-12px)';
        setTimeout(() => {
          inputOverlay.classList.add('hidden');
        }, 1300);
      }, 800);
      return;
    }
    answerFeedback.textContent = lines[i];
    answerFeedback.style.animation = 'none';
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        answerFeedback.style.animation = '';
      });
    });
    i++;
    const nextDelay = i === 1 ? 1200 : i === lines.length ? 2500 : 1600;
    setTimeout(showNextLine, nextDelay);
  }

  finalMessage.style.transition = 'opacity 0.5s';
  finalMessage.style.opacity = '0';
  setTimeout(showNextLine, 600);
}

// ===== EVENTS =====

submitBtn.addEventListener('click', checkAnswer);
answerInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') checkAnswer();
});

// ===== INIT =====

window.addEventListener('load', () => {
  setTimeout(showIntroAd, 600);
});
