// ---------- Password gate ----------
const PASSWORD_HASH = "6bdaf0ae3f3bb9dae87790b7abf4e779ce5ce1775b77a9e0a6776443ead21722";

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
  const val = lockInput.value || "";
  const hash = await sha256Hex(val);
  if (hash === PASSWORD_HASH) {
    localStorage.setItem("ccna_unlocked", "1");
    lockScreen.classList.add("hidden");
    appEl.classList.add("visible");
    lockError.classList.add("hidden");
    init();
  } else {
    lockError.classList.remove("hidden");
  }
}

lockBtn.addEventListener("click", tryUnlock);
lockInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") tryUnlock();
});

// ---------- Local storage helpers ----------
// v2 keys: the 613-question dataset was fully replaced by a 314-question one,
// but note/flag storage was still keyed by plain question number (1..N), so old
// notes/flags written against the OLD question content kept bleeding through
// under the new questions that happen to share the same number. Renaming the
// storage keys cleanly separates the two and stops the stale data from showing.
const flagKey = "ccna_flagged_v314";
const notesKey = "ccna_notes_v314";
const solvedKey = "ccna_solved_v314";

function loadSet(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch (e) {
    return new Set();
  }
}
function saveSet(key, set) {
  try {
    localStorage.setItem(key, JSON.stringify(Array.from(set)));
  } catch (e) {}
}
function loadNotes() {
  try {
    const raw = localStorage.getItem(notesKey);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}
function saveNotes(notes) {
  try {
    localStorage.setItem(notesKey, JSON.stringify(notes));
  } catch (e) {}
}
function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str == null ? "" : str;
  return div.innerHTML;
}

let flagged = loadSet(flagKey);
let notes = loadNotes();
let solved = loadSet(solvedKey);

// ---------- Data ----------
let MANIFEST = [];
let loaded = false;

const listRoot = document.getElementById("list-root");
const brandSub = document.getElementById("brand-sub");

const SECTION_LABEL = {
  mcq: "Çoktan Seçmeli",
  dnd: "Drag & Drop",
  lab: "Lab / Simülasyon",
};

async function init() {
  if (loaded) return;
  try {
    const res = await fetch("manifest.json");
    MANIFEST = await res.json();
  } catch (e) {
    listRoot.innerHTML = '<div class="loading">Veri yüklenemedi. Sayfayı yenile.</div>';
    return;
  }
  loaded = true;
  buildList();
  buildSideList();

  if (location.hash) {
    const m = location.hash.match(/#q(\d+)/);
    if (m) {
      setTimeout(() => scrollToQuestion(parseInt(m[1], 10)), 60);
    }
  }
}

function imgBlock(label, src, alt) {
  const fig = document.createElement("figure");
  fig.className = "shot";
  const cap = document.createElement("figcaption");
  cap.className = "col-label";
  cap.textContent = label;
  fig.appendChild(cap);

  const frame = document.createElement("div");
  frame.className = "shot-frame";
  const img = document.createElement("img");
  img.loading = "lazy";
  img.src = "images/" + src;
  img.alt = alt || label;
  img.dataset.action = "zoom";
  img.dataset.full = "images/" + src;
  frame.appendChild(img);
  fig.appendChild(frame);

  const hint = document.createElement("span");
  hint.className = "zoom-hint";
  hint.textContent = "🔍 Büyütmek için tıkla";
  fig.appendChild(hint);

  return fig;
}

function autoResize(el) {
  el.style.height = "auto";
  el.style.height = el.scrollHeight + "px";
}

function markHasNote(cardEl) {
  const n = cardEl.dataset.n;
  if (notes[n] && notes[n].trim().length > 0) {
    cardEl.classList.add("has-note");
  } else {
    cardEl.classList.remove("has-note");
  }
}

function buildList() {
  const frag = document.createDocumentFragment();

  MANIFEST.forEach((q) => {
    const card = document.createElement("article");
    card.className = "qcard";
    card.id = "q" + q.n;
    card.dataset.n = q.n;

    // ---- head ----
    const head = document.createElement("div");
    head.className = "qcard-head";

    const left = document.createElement("div");
    left.className = "qhead-left";
    const numSpan = document.createElement("span");
    numSpan.className = "qnum";
    numSpan.textContent = "#" + q.n;
    left.appendChild(numSpan);
    const badge = document.createElement("span");
    badge.className = "qbadge " + q.section;
    badge.textContent = (SECTION_LABEL[q.section] || q.section) + " · Q" + q.orig;
    left.appendChild(badge);

    if (q.correction) {
      const wrongBadge = document.createElement("span");
      wrongBadge.className = "qbadge-wrong";
      wrongBadge.textContent = "⚠ Hatalı cevap";
      left.appendChild(wrongBadge);
    }

    head.appendChild(left);

    const right = document.createElement("div");
    right.className = "qhead-right";

    const solvedBtn = document.createElement("button");
    solvedBtn.className = "solved-btn" + (solved.has(String(q.n)) ? " active" : "");
    solvedBtn.type = "button";
    solvedBtn.dataset.solved = q.n;
    solvedBtn.textContent = solved.has(String(q.n)) ? "✓ Çözüldü" : "Çözüldü işaretle";
    right.appendChild(solvedBtn);

    const flagBtn = document.createElement("button");
    flagBtn.className = "flag-btn" + (flagged.has(String(q.n)) ? " active" : "");
    flagBtn.type = "button";
    flagBtn.dataset.flag = q.n;
    flagBtn.textContent = flagged.has(String(q.n)) ? "★ İşaretli" : "☆ İşaretle";
    right.appendChild(flagBtn);

    head.appendChild(right);

    if (q.correction) {
      card.classList.add("has-correction");
    }

    card.appendChild(head);

    // ---- body ----
    const body = document.createElement("div");
    body.className = "qcard-body layout-" + q.section;

    if (q.section === "mcq") {
      const col = document.createElement("div");
      col.className = "col";
      col.appendChild(imgBlock("Soru + Cevap", q.images[0], "Soru " + q.n));
      // any extra images (exhibits) shown after the main one
      for (let i = 1; i < q.images.length; i++) {
        col.appendChild(imgBlock("Ek görsel " + i, q.images[i], "Ek görsel"));
      }
      body.appendChild(col);
    } else if (q.section === "dnd") {
      const labels = q.images.length === 2 ? ["Soru", "Cevap"] : q.images.map((_, i) => "Görsel " + (i + 1));
      q.images.forEach((src, i) => {
        const col = document.createElement("div");
        col.className = "col";
        col.appendChild(imgBlock(labels[i], src, labels[i] + " " + q.n));
        body.appendChild(col);
      });
    } else if (q.section === "lab") {
      const colText = document.createElement("div");
      colText.className = "col";
      const lbl = document.createElement("div");
      lbl.className = "col-label";
      lbl.textContent = "Görev + Cevap";
      colText.appendChild(lbl);
      const pre = document.createElement("div");
      pre.className = "lab-text";
      pre.textContent = q.text || "(metin çıkarılamadı)";
      colText.appendChild(pre);
      body.appendChild(colText);

      const colImgs = document.createElement("div");
      colImgs.className = "col";
      const lbl2 = document.createElement("div");
      lbl2.className = "col-label";
      lbl2.textContent = "Topoloji / Ekran Görüntüleri";
      colImgs.appendChild(lbl2);
      q.images.forEach((src, i) => {
        colImgs.appendChild(imgBlock("Görsel " + (i + 1), src, "Lab görseli " + (i + 1)));
      });
      body.appendChild(colImgs);
    }

    // ---- note column ----
    const colNote = document.createElement("div");
    colNote.className = "col col-note";

    if (q.correction) {
      const corrBox = document.createElement("div");
      corrBox.className = "correction-box";
      const corrTitle = document.createElement("div");
      corrTitle.className = "correction-title";
      corrTitle.textContent = "⚠ Cevap anahtarı hatalı — doğru cevap:";
      corrBox.appendChild(corrTitle);
      const corrBody = document.createElement("div");
      corrBody.className = "correction-body";
      corrBody.textContent = q.correction;
      corrBox.appendChild(corrBody);
      colNote.appendChild(corrBox);
    }

    const nlbl = document.createElement("div");
    nlbl.className = "col-label";
    nlbl.textContent = "Not";
    colNote.appendChild(nlbl);
    const ta = document.createElement("textarea");
    ta.className = "note-input";
    ta.rows = 4;
    ta.dataset.note = q.n;
    ta.placeholder = "Buraya not yaz…";
    ta.value = notes[q.n] || "";
    colNote.appendChild(ta);
    const saved = document.createElement("span");
    saved.className = "note-saved";
    saved.dataset.saved = q.n;
    saved.textContent = "Kaydedildi ✓";
    colNote.appendChild(saved);
    body.appendChild(colNote);

    card.appendChild(body);
    frag.appendChild(card);
  });

  listRoot.innerHTML = "";
  listRoot.appendChild(frag);
  brandSub.textContent = MANIFEST.length + " soru";

  listRoot.querySelectorAll(".note-input").forEach(autoResize);
  listRoot.querySelectorAll(".qcard").forEach(markHasNote);
}

// ---------- Notes: delegated input listener ----------
const saveTimers = {};
listRoot.addEventListener("input", (e) => {
  const ta = e.target.closest(".note-input");
  if (!ta) return;
  autoResize(ta);
  const n = ta.dataset.note;
  notes[n] = ta.value;
  saveNotes(notes);
  const card = ta.closest(".qcard");
  if (card) markHasNote(card);

  const savedEl = listRoot.querySelector('.note-saved[data-saved="' + n + '"]');
  if (savedEl) {
    savedEl.classList.add("show");
    clearTimeout(saveTimers[n]);
    saveTimers[n] = setTimeout(() => savedEl.classList.remove("show"), 1200);
  }
});

// ---------- Solved state: shared between cards and the side panel ----------
function toggleSolved(n) {
  n = String(n);
  if (solved.has(n)) {
    solved.delete(n);
  } else {
    solved.add(n);
  }
  saveSet(solvedKey, solved);
  updateSolvedUI(n);
}
function updateSolvedUI(n) {
  const isSolved = solved.has(n);

  const cardBtn = listRoot.querySelector('.solved-btn[data-solved="' + n + '"]');
  if (cardBtn) {
    cardBtn.classList.toggle("active", isSolved);
    cardBtn.textContent = isSolved ? "✓ Çözüldü" : "Çözüldü işaretle";
  }

  const sideRow = sideList.querySelector('.side-item[data-side-n="' + n + '"]');
  if (sideRow) {
    sideRow.classList.toggle("solved", isSolved);
    const cb = sideRow.querySelector(".side-item-check");
    if (cb) cb.checked = isSolved;
  }
}

// ---------- Delegated click listener (flag + solved + expand) ----------
listRoot.addEventListener("click", (e) => {
  const flagBtn = e.target.closest("[data-flag]");
  if (flagBtn) {
    const n = flagBtn.dataset.flag;
    if (flagged.has(n)) {
      flagged.delete(n);
      flagBtn.classList.remove("active");
      flagBtn.textContent = "☆ İşaretle";
    } else {
      flagged.add(n);
      flagBtn.classList.add("active");
      flagBtn.textContent = "★ İşaretli";
    }
    saveSet(flagKey, flagged);
    const sideRow = sideList.querySelector('.side-item[data-side-n="' + n + '"]');
    if (sideRow) {
      let star = sideRow.querySelector(".side-item-star");
      if (flagged.has(n)) {
        if (!star) {
          star = document.createElement("span");
          star.className = "side-item-star";
          star.textContent = "★";
          sideRow.appendChild(star);
        }
      } else if (star) {
        star.remove();
      }
    }
    return;
  }

  const solvedBtn = e.target.closest("[data-solved]");
  if (solvedBtn) {
    toggleSolved(solvedBtn.dataset.solved);
    return;
  }

  const zoomEl = e.target.closest('[data-action="zoom"]');
  if (zoomEl && zoomEl.dataset.full) {
    openLightbox(zoomEl.dataset.full, zoomEl.alt || "");
  }
});

// ---------- Lightbox (full-size image view) ----------
const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightbox-img");
const lightboxClose = document.getElementById("lightbox-close");

function openLightbox(src, alt) {
  lightboxImg.src = src;
  lightboxImg.alt = alt;
  lightbox.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}
function closeLightbox() {
  lightbox.classList.add("hidden");
  lightboxImg.src = "";
  document.body.style.overflow = "";
}
lightbox.addEventListener("click", (e) => {
  if (e.target === lightbox) closeLightbox();
});
lightboxClose.addEventListener("click", closeLightbox);
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !lightbox.classList.contains("hidden")) closeLightbox();
  if (e.key === "Escape" && sidePanel.classList.contains("open")) closeSidePanel();
});

// ---------- Side panel (question navigator) ----------
const panelToggleBtn = document.getElementById("panel-toggle-btn");
const sidePanel = document.getElementById("side-panel");
const sideBackdrop = document.getElementById("side-backdrop");
const sideClose = document.getElementById("side-close");
const sideList = document.getElementById("side-list");

const SECTION_SHORT = { mcq: "MCQ", dnd: "D&D", lab: "LAB" };

function buildSideList() {
  const frag = document.createDocumentFragment();
  MANIFEST.forEach((q) => {
    const n = String(q.n);
    const row = document.createElement("div");
    row.className = "side-item" + (q.correction ? " has-correction" : "") + (solved.has(n) ? " solved" : "");
    row.dataset.sideN = n;

    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.className = "side-item-check";
    cb.checked = solved.has(n);
    cb.title = "Çözüldü olarak işaretle";
    row.appendChild(cb);

    const num = document.createElement("span");
    num.className = "side-item-num";
    num.textContent = "#" + n;
    row.appendChild(num);

    const badge = document.createElement("span");
    badge.className = "side-item-badge";
    badge.textContent = SECTION_SHORT[q.section] || q.section;
    row.appendChild(badge);

    if (flagged.has(n)) {
      const star = document.createElement("span");
      star.className = "side-item-star";
      star.textContent = "★";
      row.appendChild(star);
    }

    frag.appendChild(row);
  });
  sideList.innerHTML = "";
  sideList.appendChild(frag);
}

sideList.addEventListener("click", (e) => {
  const row = e.target.closest(".side-item");
  if (!row) return;
  const n = row.dataset.sideN;

  if (e.target.classList.contains("side-item-check")) {
    toggleSolved(n);
    return;
  }

  location.hash = "q" + n;
  scrollToQuestion(parseInt(n, 10));
  closeSidePanel();
});

function openSidePanel() {
  sidePanel.classList.add("open");
  sideBackdrop.classList.remove("hidden");
}
function closeSidePanel() {
  sidePanel.classList.remove("open");
  sideBackdrop.classList.add("hidden");
}
panelToggleBtn.addEventListener("click", () => {
  if (sidePanel.classList.contains("open")) {
    closeSidePanel();
  } else {
    openSidePanel();
  }
});
sideBackdrop.addEventListener("click", closeSidePanel);
sideClose.addEventListener("click", closeSidePanel);

// ---------- Jump to question ----------
const jumpInput = document.getElementById("jump-input");
const jumpBtn = document.getElementById("jump-btn");

function scrollToQuestion(n) {
  const el = document.getElementById("q" + n);
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    el.style.outline = "2px solid var(--accent-2)";
    setTimeout(() => (el.style.outline = ""), 1200);
  }
}
function jumpToInput() {
  const n = parseInt(jumpInput.value, 10);
  if (!n || n < 1 || n > MANIFEST.length) return;
  location.hash = "q" + n;
  scrollToQuestion(n);
}
jumpBtn.addEventListener("click", jumpToInput);
jumpInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") jumpToInput();
});

// ---------- Top button ----------
const topBtn = document.getElementById("top-btn");
topBtn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
window.addEventListener("scroll", () => {
  topBtn.classList.toggle("show", window.scrollY > 600);
});

// ---------- Auto-unlock if password was already remembered ----------
// (placed at the very end so every binding above is initialized first —
//  calling init() earlier caused a temporal-dead-zone crash on reload)
if (localStorage.getItem("ccna_unlocked") === "1") {
  lockScreen.classList.add("hidden");
  appEl.classList.add("visible");
  init();
}
