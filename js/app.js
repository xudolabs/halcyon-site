{
const C = window.HALCYON, EX = window.HALCYON_EXCERPTS || {};
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const store = {get(k,d){try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch(e){return d}},
               set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};

/* ---------- covers ---------- */
const MOTIF = {
  switch: `<circle cx="50" cy="50" r="44" fill="none" stroke="currentColor" stroke-width=".8" opacity=".55"/>
    <rect x="34" y="26" width="32" height="48" rx="5" fill="none" stroke="currentColor" stroke-width="1.6"/>
    <line x1="50" y1="50" x2="50" y2="66" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"/>
    <circle cx="50" cy="50" r="3.2" fill="currentColor"/>`,
  cascade: `<circle cx="50" cy="50" r="44" fill="none" stroke="currentColor" stroke-width=".8" opacity=".55"/>
    ${[0,1,2,3,4].map(i=>`<path d="M${22+i*9} ${28+i*9} h${20} v${8}" fill="none" stroke="currentColor" stroke-width="1.6" opacity="${1-i*.15}"/>`).join("")}
    <circle cx="74" cy="80" r="2.4" fill="currentColor"/>`,
  ring: `<circle cx="50" cy="50" r="44" fill="none" stroke="currentColor" stroke-width=".8" opacity=".55"/>
    <circle cx="50" cy="50" r="27" fill="none" stroke="currentColor" stroke-width="1" stroke-dasharray="2 4"/>
    ${[0,1,2,3,4].map(i=>{const a=-Math.PI/2+i*2*Math.PI/5;return `<rect x="${50+27*Math.cos(a)-4}" y="${50+27*Math.sin(a)-4}" width="8" height="8" rx="1.5" fill="currentColor"/>`}).join("")}
    <rect x="45" y="45" width="10" height="10" rx="1" fill="none" stroke="currentColor" stroke-width="1.4"/>`
};
const cover = b => b.cover
  ? `<img src="${esc(b.cover)}" alt="${esc(b.title)} cover">`
  : `<div class="cover"><div class="ti">${esc(b.title)}</div>
       <div class="ser"><i></i>${esc(C.series.toUpperCase())} • BOOK ${esc(b.number.toUpperCase())}<i></i></div>
       <svg viewBox="0 0 100 100" aria-hidden="true">${MOTIF[b.motif]||MOTIF.switch}</svg>
       <div class="au">${esc(C.author.toUpperCase())}</div></div>`;
const book3d = b => `<div class="b3" style="--acc:${b.accent}">
  <div class="back"></div><div class="edge"></div>
  <div class="spine"><span>${esc(b.title.toUpperCase())}</span></div>
  <div class="front">${cover(b)}</div></div>`;

/* ---------- page sections ---------- */
$("#books").innerHTML = C.books.map(b => `
<section class="band book" id="${b.slug}" style="--acc:${b.accent}">
  ${b.bg ? `<div class="bg" style="background-image:url('${esc(b.bg)}')"></div>` : ""}
  <div class="wrap">
    <a class="stage" href="#${EX[b.excerpt] ? "read" : "soon"}-${b.slug}" aria-label="${EX[b.excerpt] ? "Read the opening of " + esc(b.title) : esc(b.title) + ": coming soon"}">${book3d(b)}
      <span class="hint">${EX[b.excerpt] ? "Read the opening" : "Coming soon"}</span></a>
    <div>
      <span class="status">${esc(b.status)}</span>
      <p class="label">Halcyon, book ${esc(b.number.toLowerCase())}</p>
      <h2>${esc(b.title)}</h2>
      <p class="hook">${esc(b.hook)}</p>
      ${b.blurb.map(p => `<p class="blurb">${esc(p)}</p>`).join("")}
      ${b.kicker ? `<p class="kicker">${esc(b.kicker)}</p>` : ""}
      <ul class="facts">${b.details.map(d => `<li>${esc(d)}</li>`).join("")}</ul>
      <div class="ctas" style="justify-content:flex-start">
        ${EX[b.excerpt] ? `<a class="btn" href="#read-${b.slug}" style="background:var(--acc);border-color:var(--acc)">Read the opening</a>
                           <a class="btn ghost" href="#advance-readers">Advance copies</a>`
                        : `<a class="btn ghost" href="${esc(C.newsletterUrl)}" target="_blank" rel="noopener">Get updates</a>`}
      </div>
    </div>
  </div>
</section>`).join("");

const tex = EX.trigger || [];
$("#teaser").innerHTML = tex.slice(3, 5).map(p => `<p>${esc(p.x)}</p>`).join("");
$("#bio").textContent = C.authorBio;
$("#yr").textContent = new Date().getFullYear();
const arcBtn = document.querySelector("#advance-readers .btn");
arcBtn.href = C.arcUrl; arcBtn.target = "_blank"; arcBtn.rel = "noopener";

/* ---------- hero sky: gold dust + faint rain ---------- */
{
  const cv = document.getElementById("sky"), ctx = cv.getContext("2d");
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let w = 0, h = 0, dpr = 1, dust = [], rain = [], on = true, last = 0;
  const R = (a, b) => a + Math.random() * (b - a);
  function size(){
    dpr = Math.min(2, devicePixelRatio || 1); w = cv.clientWidth; h = cv.clientHeight;
    cv.width = w * dpr; cv.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.round(w * h / 9000);
    dust = Array.from({length:n}, () => ({x:R(0,w), y:R(0,h), r:R(.4,1.6), v:R(4,14), p:R(0,6.3)}));
    rain = Array.from({length:Math.round(n * .6)}, () => ({x:R(0,w), y:R(0,h), l:R(14,40), v:R(220,420)}));
  }
  function draw(t){
    ctx.clearRect(0, 0, w, h);
    ctx.lineWidth = 1; ctx.strokeStyle = "rgba(200,190,170,.07)";
    ctx.beginPath();
    for (const d of rain) { ctx.moveTo(d.x, d.y); ctx.lineTo(d.x - d.l * .18, d.y + d.l); }
    ctx.stroke();
    for (const d of dust) {
      const a = .35 + .3 * Math.sin(t * 1.3 + d.p);
      ctx.fillStyle = `rgba(222,178,92,${a})`;
      ctx.beginPath(); ctx.arc(d.x + Math.sin(t * .5 + d.p) * 6, d.y, d.r, 0, 6.3); ctx.fill();
    }
  }
  function tick(ms){
    const t = ms / 1000, dt = Math.min(.05, t - (last || t)); last = t;
    for (const d of dust) { d.y -= d.v * dt; if (d.y < -4) { d.y = h + 4; d.x = R(0, w); } }
    for (const d of rain) { d.y += d.v * dt; d.x -= d.v * dt * .18; if (d.y > h) { d.y = -d.l; d.x = R(0, w + 60); } }
    draw(t); if (on) requestAnimationFrame(tick);
  }
  size(); addEventListener("resize", size);
  if (still) draw(0);
  else {
    new IntersectionObserver(es => { const vis = es[0].isIntersecting; if (vis && !on) { on = true; last = 0; requestAnimationFrame(tick); } on = vis; }).observe(cv);
    requestAnimationFrame(tick);
  }
}

/* ---------- gentle parallax on book backgrounds ---------- */
if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const bgs = [...document.querySelectorAll(".book .bg")]; let ticking = false;
  const move = () => { ticking = false; const vh = innerHeight;
    for (const el of bgs) { const r = el.parentElement.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) continue;
      el.style.setProperty("--py", ((r.top + r.height / 2 - vh / 2) * -0.06).toFixed(1) + "px"); } };
  addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(move); } }, {passive:true});
  move();
}

/* ---------- trailer ---------- */
const tvid = $("#tvid"), tbox = tvid.parentElement;
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
if (!reduce && "IntersectionObserver" in window) {
  const tio = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) tvid.play().then(() => tbox.classList.add("playing")).catch(() => {});
    else if (!tvid.controls) { tvid.pause(); tbox.classList.remove("playing"); }
  }), {threshold: .5});
  tio.observe(tvid);
}
$("#tplay").onclick = () => {
  tvid.currentTime = 0; tvid.controls = true; tvid.loop = false;
  tvid.play().then(() => tbox.classList.add("playing")).catch(() => {});
};

/* ---------- reader ---------- */
const R = {book:null, pages:[], idx:0, two:false, scale:store.get("halcyon-scale",1), pw:0, ph:0, prev:""};
const reader = $("#reader"), spread = $("#spread"), stage = $("#rstage");

function geometry(){
  const W = stage.clientWidth - 28, H = stage.clientHeight - 28;
  R.two = W >= 860 && W / H >= 1.15;
  let ph = H, pw = ph / 1.5;
  if (R.two && pw * 2 > W) { pw = W / 2; ph = pw * 1.5; }
  if (!R.two && pw > W) { pw = W; ph = Math.min(H, pw * 1.5); }
  R.pw = Math.floor(pw); R.ph = Math.floor(ph);
  R.fs = Math.max(13, Math.min(21, R.pw * .043)) * R.scale;
}

function blockEl(b, opts = {}){
  const el = document.createElement(b.t === "p" ? "p" : "div");
  el.className = {title:"title", num:"cnum", sub:"sub", p:""}[b.t];
  if (b.t === "sub" && opts.mid) el.classList.add("mid");
  if (b.t === "p" && opts.first) el.classList.add("first");
  if (b.t === "p" && opts.cont) el.classList.add("cont");
  el.textContent = b.x;
  return el;
}

function paginate(){
  const blocks = EX[R.book.excerpt] || [];
  const m = document.createElement("div");
  m.className = "page measure";
  m.style.cssText = `width:${R.pw}px;height:${R.ph}px;font-size:${R.fs}px`;
  m.innerHTML = `<div class="body" style="--fs:${R.fs}px"></div>`;
  document.body.appendChild(m);
  const body = m.firstChild, fits = () => body.scrollHeight <= body.clientHeight + 1;
  const flowed = []; let start = 0;
  const flush = next => {
    const carry = [];
    while (body.lastChild && /title|cnum|sub/.test(body.lastChild.className)) carry.unshift(body.removeChild(body.lastChild));
    if (body.childNodes.length) flowed.push({html: body.innerHTML, start});
    body.innerHTML = ""; start = next; carry.forEach(c => body.appendChild(c));
  };
  let prevT = "num";
  blocks.forEach((b, i) => {
    if ((b.t === "title" || b.t === "num") && body.childNodes.length) flush(i);
    if (!body.childNodes.length) start = i;
    if (b.t !== "p") {
      const el = blockEl(b, {mid: b.t === "sub" && prevT === "p"});
      body.appendChild(el);
      if (!fits()) { body.removeChild(el); flush(i); body.appendChild(el); }
      prevT = b.t; return;
    }
    let words = b.x.split(" "), first = prevT === "sub", cont = false;
    while (words.length) {
      const el = blockEl({t:"p", x:words.join(" ")}, {first: first && !cont, cont});
      body.appendChild(el);
      if (fits()) break;
      let lo = 0, hi = words.length - 1;               // most words that still fit
      while (lo < hi) { const mid = (lo + hi + 1) >> 1; el.textContent = words.slice(0, mid).join(" "); if (fits()) lo = mid; else hi = mid - 1; }
      if (lo < 3 && body.childNodes.length > 1) { body.removeChild(el); flush(i); continue; }
      lo = Math.max(lo, 1);
      el.textContent = words.slice(0, lo).join(" "); el.classList.add("split");
      words = words.slice(lo); flush(i); cont = true;
    }
    prevT = "p";
  });
  flush(blocks.length);
  m.remove();
  const b = R.book;
  R.pages = [
    {kind:"title", html:`<div class="tpage"><div class="s">${esc(C.series.toUpperCase())} • BOOK ${esc(b.number.toUpperCase())}</div><div class="big">${esc(b.title)}</div><div class="a">${esc(C.author.toUpperCase())}</div></div>`},
    {kind:"note", html:`<div class="tpage"><p>This excerpt is taken from an advance draft and may change before publication.</p><p>© ${new Date().getFullYear()} ${esc(C.author)}. All rights reserved.</p></div>`},
    ...flowed.map(f => ({kind:"text", ...f})),
    {kind:"end", html:`<div class="tpage"><div class="s">END OF EXCERPT</div><div class="big" style="font-size:2em">Keep reading</div><p>Advance readers get the full manuscript of ${esc(b.title)} before release.</p><a class="btn" href="${esc(C.arcUrl)}" target="_blank" rel="noopener">Join the advance readers</a></div>`}
  ];
}

function pageHTML(i){
  const p = R.pages[i];
  if (!p) return `<div class="page" style="width:${R.pw}px;height:${R.ph}px;background:#e7e1d4"></div>`;
  const run = p.kind === "text" ? `<div class="run">${esc(i % 2 ? R.book.title : C.author)}</div><div class="num">${i + 1}</div>` : "";
  const inner = p.kind === "text" ? `<div class="body" style="--fs:${R.fs}px">${p.html}</div>` : p.html;
  return `<div class="page" style="width:${R.pw}px;height:${R.ph}px;font-size:${R.fs}px">${run}${inner}</div>`;
}

function render(dir = 0){
  const n = R.pages.length;
  R.idx = Math.max(0, Math.min(R.idx, n - 1));
  if (R.two) R.idx -= R.idx % 2;
  spread.className = "spread" + (R.two ? " two" : "");
  spread.innerHTML = pageHTML(R.idx) + (R.two ? pageHTML(R.idx + 1) : "");
  if (dir) { spread.style.setProperty("--dx", dir * 24 + "px"); void spread.offsetWidth; spread.classList.add("turn"); }
  const last = R.two ? R.idx + 2 : R.idx + 1;
  $("#folio").textContent = `${R.idx + 1}${R.two && R.idx + 2 <= n ? "–" + (R.idx + 2) : ""} of ${n}`;
  $("#prev").disabled = R.idx === 0;
  $("#next").disabled = last >= n;
  try { history.replaceState(null, "", `#read-${R.book.slug}-${R.idx + 1}`); } catch (e) {}
}

function relayout(){
  const anchor = R.pages[R.idx] && R.pages[R.idx].start;
  geometry(); paginate();
  if (anchor != null) { const j = R.pages.findIndex(p => p.start >= anchor); if (j > -1) R.idx = j; }
  render();
}

function openReader(slug, page){
  const b = C.books.find(x => x.slug === slug && EX[x.excerpt]);
  if (!b) return;
  if (!reader.classList.contains("open")) { R.prev = ""; reader.classList.add("open"); document.body.style.overflow = "hidden"; }
  const same = R.book === b;
  R.book = b; $("#rtitle").textContent = b.title;
  if (!same) { geometry(); paginate(); }
  R.idx = (page || 1) - 1; render();
  $("#next").focus({preventScroll:true});
}
function closeReader(fromRoute){
  reader.classList.remove("open"); document.body.style.overflow = "";
  if (fromRoute === true) return;
  const back = R.book ? R.book.slug : "";
  try { history.replaceState(null, "", back ? "#" + back : location.pathname); } catch (e) {}
  if (back) document.getElementById(back).scrollIntoView({block:"start"});
}
const go = d => { const step = R.two ? 2 : 1, n = R.idx + d * step; if (n < 0 || n >= R.pages.length) return; R.idx = n; render(d); };

$("#prev").onclick = () => go(-1);
$("#next").onclick = () => go(1);
$("#close").onclick = () => closeReader();
const setScale = s => { R.scale = Math.max(.8, Math.min(1.4, Math.round(s * 10) / 10)); store.set("halcyon-scale", R.scale); relayout(); };
$("#smaller").onclick = () => setScale(R.scale - .1);
$("#bigger").onclick = () => setScale(R.scale + .1);
const toast = msg => { const t = $("#toast"); t.textContent = msg; t.classList.add("show"); setTimeout(() => t.classList.remove("show"), 1800); };
$("#copy").onclick = async () => {
  const url = location.href;
  try { await navigator.clipboard.writeText(url); toast("Link to this page copied"); }
  catch (e) { toast(url); }
};
document.addEventListener("keydown", e => {
  if (!reader.classList.contains("open")) return;
  if (e.key === "ArrowRight") go(1);
  else if (e.key === "ArrowLeft") go(-1);
  else if (e.key === "Escape") closeReader();
});
spread.addEventListener("click", e => {
  if (e.target.closest("a,button")) return;
  const r = spread.getBoundingClientRect();
  go(e.clientX > r.left + r.width / 2 ? 1 : -1);
});
let tx = null;
stage.addEventListener("touchstart", e => { tx = e.touches[0].clientX; }, {passive:true});
stage.addEventListener("touchend", e => {
  if (tx == null) return; const dx = e.changedTouches[0].clientX - tx; tx = null;
  if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
});
let rt; addEventListener("resize", () => { if (!reader.classList.contains("open")) return; clearTimeout(rt); rt = setTimeout(relayout, 150); });

/* ---------- coming-soon page ---------- */
const soon = $("#soon");
function openSoon(slug){
  const b = C.books.find(x => x.slug === slug); if (!b) return;
  soon.style.setProperty("--acc", b.accent);
  soon.innerHTML = `
    ${b.bg ? `<div class="bg" style="background-image:url('${esc(b.bg)}')"></div>` : ""}
    <button class="ib sclose" aria-label="Close">✕</button>
    <div class="sin">
      <div class="sbook">${book3d(b)}</div>
      <div>
        <p class="label">Halcyon, book ${esc(b.number.toLowerCase())}</p>
        <h2>${esc(b.title)}</h2>
        <p class="when">Coming soon</p>
        <p class="hook">${esc(b.hook)}</p>
        ${b.kicker ? `<p class="kicker">${esc(b.kicker)}</p>` : ""}
        <p class="note">${esc(b.title)} is ${esc(b.status.toLowerCase())}. Leave your email and you'll hear the moment it's ready, along with advance-copy invitations.</p>
        <div class="ctas" style="justify-content:flex-start">
          <a class="btn" href="${esc(C.newsletterUrl)}" target="_blank" rel="noopener" style="background:var(--acc);border-color:var(--acc)">Get notified</a>
          <a class="btn ghost" href="#read-trigger">Start with Trigger</a>
        </div>
      </div>
    </div>`;
  soon.querySelector(".sclose").onclick = () => closeSoon();
  soon.classList.add("open"); document.body.style.overflow = "hidden"; soon.dataset.slug = slug;
  soon.querySelector(".sclose").focus({preventScroll:true});
}
function closeSoon(fromRoute){
  if (!soon.classList.contains("open")) return;
  soon.classList.remove("open"); document.body.style.overflow = "";
  if (fromRoute === true) return;
  const back = soon.dataset.slug;
  try { history.replaceState(null, "", "#" + back); } catch (e) {}
  document.getElementById(back).scrollIntoView({block:"start"});
}
document.addEventListener("keydown", e => { if (e.key === "Escape" && soon.classList.contains("open")) closeSoon(); });

/* ---------- hash routing ---------- */
function route(){
  const m = location.hash.match(/^#read-([a-z0-9]+)(?:-(\d+))?$/);
  const sn = location.hash.match(/^#soon-([a-z0-9]+)$/);
  if (!sn) closeSoon(true);
  if (m) openReader(m[1], +m[2] || 1);
  else if (reader.classList.contains("open")) closeReader(true);
  if (sn) openSoon(sn[1]);
}
addEventListener("hashchange", route);
(document.fonts ? document.fonts.ready : Promise.resolve()).then(route);
}
