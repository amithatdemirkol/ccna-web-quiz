// ---------- Simple client-side gate (deterrent only, not real security) ----------
const PASSWORD_HASH = "6bdaf0ae3f3bb9dae87790b7abf4e779ce5ce1775b77a9e0a6776443ead21722"; // sha256("ccna613")

async function sha256Hex(str) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

const lockScreen = document.getElementById("lock-screen");
const lockInput = document.getElementById("lock-input");
const lockBtn = document.getElementById("lock-btn");
const lockError = document.getElementById("lock-error");
const appEl = document.getElementById("app");

async function tryUnlock() {
  const val = lockInput.value;
  const hash = await sha256Hex(val);
  if (hash === PASSWORD_HASH) {
    localStorage.setItem("ccna_unlocked", "1");
    lockScreen.classList.add("hidden");
    appEl.classList.add("visible");
    init();
  } else {
    lockError.textContent = "Yanlış şifre.";
    lockScreen.querySelector(".lock-card").classList.add("shake");
    setTimeout(() => lockScreen.querySelector(".lock-card").classList.remove("shake"), 400);
  }
}
lockBtn.addEventListener("click", tryUnlock);
lockInput.addEventListener("keydown", e => { if (e.key === "Enter") tryUnlock(); });

if (localStorage.getItem("ccna_unlocked") === "1") {
  lockScreen.classList.add("hidden");
  appEl.classList.add("visible");
  init();
}

// ---------- App: full sequential list, question + answer together ----------
const flagKey = "ccna_flagged";
function loadSet(key) {
  try { return new Set(JSON.parse(localStorage.getItem(key) || "[]")); }
  catch { return new Set(); }
}
function saveSet(key, set) {
  localStorage.setItem(key, JSON.stringify(Array.from(set)));
}
let flagged = loadSet(flagKey);

const listRoot = document.getElementById("list-root");
const jumpInput = document.getElementById("jump-input");
const jumpBtn = document.getElementById("jump-btn");
const topBtn = document.getElementById("top-btn");

let MANIFEST = [];
let loaded = false;

async function init() {
  if (loaded) return;
  loaded = true;
  const res = await fetch("manifest.json");
  MANIFEST = await res.json();
  buildList();
  if (location.hash) {
    const n = parseInt(location.hash.replace("#q", ""), 10);
    if (n) setTimeout(() => scrollToQuestion(n), 150);
  }
}

function imgBlock(label, src, alt) {
  if (!src) return "";
  return `<figure class="shot">
    <figcaption>${label}</figcaption>
    <div class="shot-frame">
      <img src="images/${src}" alt="${alt}" loading="lazy">
    </div>
    <button class="expand-btn" data-action="expand">Tam görüntüle ⤢</button>
  </figure>`;
}

function buildList() {
  const frag = document.createDocumentFragment();
  MANIFEST.forEach(q => {
    const card = document.createElement("section");
    card.className = "qcard";
    card.id = `q${q.n}`;

    let questionHtml;
    if (q.plain) {
      questionHtml = imgBlock("Soru", q.plain, `Soru ${q.n}`);
    } else if (q.parts && q.parts.length) {
      questionHtml = q.parts.map((p, i) => imgBlock(`Soru (${i + 1}/${q.parts.length})`, p, `Soru ${q.n} parça ${i + 1}`)).join("");
    } else {
      questionHtml = `<div class="missing">Soru görseli mevcut değil</div>`;
    }

    const answerHtml = q.answer
      ? imgBlock("Cevap", q.answer, `Soru ${q.n} cevap`)
      : `<div class="missing small">Cevap görseli mevcut değil</div>`;

    card.innerHTML = `
      <div class="qcard-head">
        <span class="qnum">#${q.n}</span>
        <button class="flagbtn" data-flag="${q.n}">${flagged.has(q.n) ? "★ İşaretli" : "☆ İşaretle"}</button>
      </div>
      <div class="qcard-body">
        <div class="col">${questionHtml}</div>
        <div class="col col-answer">${answerHtml}</div>
      </div>`;
    frag.appendChild(card);
  });
  listRoot.appendChild(frag);
}

listRoot.addEventListener("click", e => {
  const flagBtnEl = e.target.closest("[data-flag]");
  if (flagBtnEl) {
    const n = parseInt(flagBtnEl.dataset.flag, 10);
    if (flagged.has(n)) flagged.delete(n); else flagged.add(n);
    saveSet(flagKey, flagged);
    flagBtnEl.textContent = flagged.has(n) ? "★ İşaretli" : "☆ İşaretle";
    flagBtnEl.classList.toggle("flagged", flagged.has(n));
    return;
  }
  const expandBtnEl = e.target.closest("[data-action='expand']");
  if (expandBtnEl) {
    const frame = expandBtnEl.previousElementSibling;
    const expanded = frame.classList.toggle("expanded");
    expandBtnEl.textContent = expanded ? "Daralt ⤡" : "Tam görüntüle ⤢";
  }
});

function scrollToQuestion(n) {
  const el = document.getElementById(`q${n}`);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

jumpBtn.addEventListener("click", jumpToInput);
jumpInput.addEventListener("keydown", e => { if (e.key === "Enter") jumpToInput(); });
function jumpToInput() {
  const n = parseInt(jumpInput.value, 10);
  if (!n || n < 1 || n > 613) return;
  location.hash = `q${n}`;
  scrollToQuestion(n);
}

topBtn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
window.addEventListener("scroll", () => {
  topBtn.classList.toggle("show", window.scrollY > 600);
});
