(function(){
"use strict";

const $ = id => document.getElementById(id);
const stage = $("stage"), cv = $("cv");
let ctx = cv.getContext("2d");

// ===== Celular: detecção, desempenho e vibração =====
const IS_TOUCH = window.matchMedia ? window.matchMedia("(pointer: coarse)").matches : ("ontouchstart" in window);
if(IS_TOUCH) document.body.classList.add("touch");
let LOW = false, perfAcc = 0, perfN = 0;
function perfTick(dt){ if(LOW) return; perfAcc += dt; perfN++; if(perfN >= 90){ if(perfAcc / perfN > 0.024){ LOW = true; resize(); } perfAcc = 0; perfN = 0; } }
function buzz(ms){ try{ if(navigator.vibrate) navigator.vibrate(ms); }catch(e){} }
const rnd = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const pick = a => a[Math.floor(Math.random() * a.length)];

// ===== Mundo =====
const WW = 1800, WH = 1300, CELL = 50, GW = WW / CELL, GH = WH / CELL;

const MAPS = {
  escola: {
    name:"Escola à Noite", desc:"Salas, armários e refeitório", dark:0.74,
    floor:"#5A4231", floor2:"#4E3829", line:"rgba(0,0,0,.18)", start:[900, 820],
    lamps:[[300, 300], [900, 200], [1500, 650], [900, 1100], [300, 1000]],
    obs:(() => {
      const o = [];
      o.push({x:600, y:0, w:28, h:470, k:"wall"}, {x:600, y:650, w:28, h:650, k:"wall"});
      o.push({x:1200, y:0, w:28, h:380, k:"wall"}, {x:1200, y:560, w:28, h:420, k:"wall"}, {x:1200, y:1160, w:28, h:140, k:"wall"});
      for(let x = 110; x < 520; x += 140) for(let y = 150; y < 470; y += 115) o.push({x, y, w:84, h:46, k:"desk"});
      for(let x = 110; x < 520; x += 140) for(let y = 820; y < 1150; y += 115) o.push({x, y, w:84, h:46, k:"desk"});
      for(let x = 680; x < 1150; x += 70) o.push({x, y:18, w:56, h:40, k:"locker"});
      for(let x = 680; x < 1150; x += 70) o.push({x, y:1242, w:56, h:40, k:"locker"});
      for(let y = 260; y < 1050; y += 230) o.push({x:1330, y, w:150, h:62, k:"table"}, {x:1560, y:y + 90, w:150, h:62, k:"table"});
      o.push({x:840, y:560, w:120, h:120, k:"plant"});
      return o;
    })(),
    spawns:[[40, 40], [1760, 40], [40, 1260], [1760, 1260], [900, 90], [900, 1200], [40, 650], [1760, 650], [660, 560], [1100, 480], [1270, 1080], [300, 650]],
  },
  cidade: {
    name:"Cidade Abandonada", desc:"Ruas, carros e prédios", dark:0.78,
    floor:"#3A3D42", floor2:"#33363A", line:"rgba(255,255,255,.05)", start:[900, 650],
    lamps:[[450, 470], [1350, 470], [450, 830], [1350, 830], [900, 300], [900, 1000]],
    obs:[
      {x:0, y:0, w:330, h:330, k:"building"}, {x:1470, y:0, w:330, h:330, k:"building"},
      {x:0, y:970, w:330, h:330, k:"building"}, {x:1470, y:970, w:330, h:330, k:"building"},
      {x:720, y:0, w:360, h:210, k:"building"}, {x:720, y:1090, w:360, h:210, k:"building"},
      {x:470, y:560, w:120, h:58, k:"car"}, {x:1180, y:690, w:120, h:58, k:"car"}, {x:860, y:430, w:58, h:120, k:"car"},
      {x:560, y:900, w:120, h:58, k:"car"}, {x:1150, y:380, w:58, h:120, k:"car"}, {x:300, y:620, w:58, h:120, k:"car"},
      {x:1450, y:560, w:58, h:120, k:"car"}, {x:640, y:250, w:44, h:60, k:"dumpster"}, {x:1110, y:990, w:44, h:60, k:"dumpster"},
      {x:820, y:820, w:160, h:24, k:"barrier"}, {x:400, y:350, w:24, h:120, k:"barrier"}, {x:1380, y:840, w:24, h:120, k:"barrier"},
    ],
    spawns:[[500, 30], [1300, 30], [500, 1270], [1300, 1270], [30, 500], [30, 800], [1770, 500], [1770, 800], [900, 260], [900, 1040], [400, 760], [1400, 450]],
  },
  cemiterio: {
    name:"Cemitério", desc:"Túmulos, árvores e névoa", dark:0.84,
    floor:"#24331F", floor2:"#1F2C1B", line:"rgba(0,0,0,.12)", start:[900, 1050],
    lamps:[[900, 1050], [300, 300], [1500, 300], [900, 520]],
    obs:(() => {
      const o = [];
      for(let x = 180; x < 1650; x += 120) for(let y = 160; y < 900; y += 150){ if(Math.abs(x - 900) < 120 && y > 400 && y < 700) continue; if((x * 7 + y) % 5 === 0) continue; o.push({x, y, w:34, h:46, k:"tomb"}); }
      o.push({x:780, y:440, w:240, h:170, k:"mausoleum"});
      for(const [x, y] of [[100, 1000], [300, 1150], [1500, 1000], [1700, 1150], [80, 120], [1720, 120], [600, 1180], [1200, 1180]]) o.push({x:x - 30, y:y - 30, w:60, h:60, k:"tree"});
      o.push({x:0, y:1000 - 300, w:20, h:300, k:"fence"}, {x:1780, y:700, w:20, h:300, k:"fence"});
      return o;
    })(),
    spawns:[[60, 200], [1740, 200], [900, 40], [400, 40], [1400, 40], [60, 600], [1740, 600], [900, 1260], [500, 960], [1300, 960], [250, 820], [1550, 820]],
  },
};

const SKINS = [
  {id:"estudante", name:"Estudante", desc:"Rápido", shirt:"#3B82F6", pants:"#1F2937", skin:"#8D5A3B", hair:"#1A1A1A", speed:1.06, hp:100},
  {id:"professora", name:"Professora", desc:"Equilibrada", shirt:"#E11D48", pants:"#3F2A56", skin:"#C68B59", hair:"#5B2E12", bun:true, speed:1.0, hp:110},
  {id:"robo", name:"Robô", desc:"Mais vida", shirt:"#9CA3AF", pants:"#4B5563", skin:"#D1D5DB", robot:true, speed:0.94, hp:130},
  {id:"atleta", name:"Atleta", desc:"Muito rápido", shirt:"#F59E0B", pants:"#14532D", skin:"#6B4226", hair:"#111111", band:"#22C55E", speed:1.14, hp:90},
];

const WEAPONS = [
  {id:"pistola", name:"Pistola", icon:"🔫", unlock:1, rate:0.27, dmg:34, mag:12, reload:0.9, spread:0.035, pellets:1, speed:950, life:0.75, infinite:true, color:"#FFE07A", sound:"pistol", kick:0.6},
  {id:"escopeta", name:"Escopeta", icon:"💥", unlock:2, rate:0.78, dmg:24, mag:6, reload:1.4, spread:0.34, pellets:7, speed:820, life:0.42, start:24, drop:12, color:"#FFB347", sound:"shotgun", kick:1.4},
  {id:"metralhadora", name:"Metralhadora", icon:"⚡", unlock:3, rate:0.085, dmg:17, mag:35, reload:1.6, spread:0.09, pellets:1, speed:1050, life:0.65, start:140, drop:60, color:"#FFF2A8", sound:"smg", kick:0.35},
  {id:"laser", name:"Raio Laser", icon:"🔆", unlock:5, rate:0.55, dmg:130, mag:6, reload:1.8, spread:0, pellets:1, speed:1700, life:0.7, pierce:99, start:18, drop:6, color:"#7CFFEA", sound:"laser", kick:0.9},
];

const ZTYPES = {
  normal: {r:17, hp:70, hpR:9, sp:72, spR:3, spMax:118, dmg:12, pts:10, shirt:["#7C3AED", "#B45309", "#0E7490", "#9F1239", "#4D7C0F"]},
  runner: {r:14, hp:40, hpR:5, sp:150, spR:2, spMax:185, dmg:8, pts:15, shirt:["#DC2626", "#EA580C"]},
  brute:  {r:28, hp:260, hpR:28, sp:56, spR:1, spMax:75, dmg:25, pts:40, shirt:["#1E3A8A", "#3F3F46"]},
  spitter:{r:17, hp:90, hpR:6, sp:62, spR:1, spMax:80, dmg:10, pts:25, shirt:["#365314"]},
  boss:   {r:48, hp:1500, hpR:160, sp:66, spR:1, spMax:85, dmg:30, pts:300, shirt:["#581C87"]},
};

// ===== Tela e câmera =====
let W = 0, H = 0, DPR = 1, zoom = 1, camX = WW / 2, camY = WH / 2, light = null, lctx = null;
function resize(){
  const r = stage.getBoundingClientRect();
  DPR = Math.min(LOW ? 1 : IS_TOUCH ? 1.5 : 2, window.devicePixelRatio || 1);
  W = Math.max(1, r.width); H = Math.max(1, r.height);
  cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  zoom = clamp(Math.min(W, H) / (IS_TOUCH ? 420 : 500), 0.8, 1.5);
  const lr = LOW ? 0.5 : 1;   // camada de luz em resolução menor no modo leve
  light = document.createElement("canvas"); light.width = Math.round(W * lr); light.height = Math.round(H * lr);
  lctx = light.getContext("2d"); lctx.setTransform(lr, 0, 0, lr, 0, 0);
  if(state !== "play") draw(0);
}
const toScreen = (x, y) => [(x - camX) * zoom + W / 2, (y - camY) * zoom + H / 2];
const toWorld = (sx, sy) => [(sx - W / 2) / zoom + camX, (sy - H / 2) / zoom + camY];

// ===== Estado =====
let state = "menu";
let skin = SKINS[0], mapId = "escola", MAP = MAPS.escola, mapCache = null;
let P, zombies, bullets, goo, decals, parts, texts, drops;
let round, toSpawn, spawnT, alive, kills, shots, hits, breakT, banner, flowT, flow, blocked, shake, muzzle, hurtFlash, bossAlive;
let best = 0, muted = false;
try{ best = +(localStorage.getItem("zumbis-best") || 0) || 0; muted = localStorage.getItem("zumbis-mute") === "1";
  const s = localStorage.getItem("zumbis-skin"); if(s) skin = SKINS.find(k => k.id === s) || skin;
  const m = localStorage.getItem("zumbis-map"); if(m && MAPS[m]){ mapId = m; MAP = MAPS[m]; } }catch(e){}

// ===== Colisão =====
function hitRect(cx, cy, r, o){
  const px = clamp(cx, o.x, o.x + o.w), py = clamp(cy, o.y, o.y + o.h);
  const dx = cx - px, dy = cy - py, d2 = dx * dx + dy * dy;
  if(d2 >= r * r) return null;
  if(d2 === 0){
    const l = cx - o.x, rr = o.x + o.w - cx, t = cy - o.y, b = o.y + o.h - cy, m = Math.min(l, rr, t, b);
    return m === l ? [-(l + r), 0] : m === rr ? [rr + r, 0] : m === t ? [0, -(t + r)] : [0, b + r];
  }
  const d = Math.sqrt(d2), push = r - d;
  return [dx / d * push, dy / d * push];
}
function collide(e){
  for(const o of MAP.obs){ const p = hitRect(e.x, e.y, e.r, o); if(p){ e.x += p[0]; e.y += p[1]; } }
  e.x = clamp(e.x, e.r, WW - e.r); e.y = clamp(e.y, e.r, WH - e.r);
}
const solidAt = (x, y) => x < 0 || y < 0 || x > WW || y > WH || MAP.obs.some(o => x > o.x && x < o.x + o.w && y > o.y && y < o.y + o.h);

// ===== Caminho dos zumbis (mapa de distâncias até o jogador) =====
function buildBlocked(){
  blocked = new Uint8Array(GW * GH);
  for(let gy = 0; gy < GH; gy++) for(let gx = 0; gx < GW; gx++){
    const cx = gx * CELL + CELL / 2, cy = gy * CELL + CELL / 2;
    for(const o of MAP.obs){ if(cx > o.x - 14 && cx < o.x + o.w + 14 && cy > o.y - 14 && cy < o.y + o.h + 14){ blocked[gy * GW + gx] = 1; break; } }
  }
}
function buildFlow(){
  flow = new Int16Array(GW * GH).fill(-1);
  const sx = clamp(Math.floor(P.x / CELL), 0, GW - 1), sy = clamp(Math.floor(P.y / CELL), 0, GH - 1);
  const q = new Int32Array(GW * GH); let qh = 0, qt = 0;
  flow[sy * GW + sx] = 0; q[qt++] = sy * GW + sx;
  while(qh < qt){
    const c = q[qh++], cx = c % GW, cy = (c / GW) | 0, d = flow[c];
    for(const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]){
      const nx = cx + dx, ny = cy + dy; if(nx < 0 || ny < 0 || nx >= GW || ny >= GH) continue;
      const n = ny * GW + nx; if(flow[n] !== -1 || blocked[n]) continue;
      flow[n] = d + 1; q[qt++] = n;
    }
  }
}
function flowDir(z){
  const gx = clamp(Math.floor(z.x / CELL), 0, GW - 1), gy = clamp(Math.floor(z.y / CELL), 0, GH - 1);
  const here = flow[gy * GW + gx];
  if(here >= 0 && here <= 2) return null;            // perto: vai direto
  let best = here < 0 ? 1e9 : here, bx = 0, by = 0;
  for(let dy = -1; dy <= 1; dy++) for(let dx = -1; dx <= 1; dx++){
    if(!dx && !dy) continue;
    const nx = gx + dx, ny = gy + dy; if(nx < 0 || ny < 0 || nx >= GW || ny >= GH) continue;
    const v = flow[ny * GW + nx]; if(v < 0) continue;
    if(dx && dy && (blocked[gy * GW + nx] || blocked[ny * GW + gx])) continue;
    if(v < best){ best = v; bx = dx; by = dy; }
  }
  if(!bx && !by) return null;
  const tx = (gx + bx) * CELL + CELL / 2, ty = (gy + by) * CELL + CELL / 2;
  const d = Math.hypot(tx - z.x, ty - z.y) || 1;
  return [(tx - z.x) / d, (ty - z.y) / d];
}

// ===== Início de partida =====
function newGame(){
  P = {x:MAP.start[0], y:MAP.start[1], r:16, hp:skin.hp, maxHp:skin.hp, shownHp:skin.hp, aim:0, w:0, cd:0, reloadT:0, inv:0, walk:0,
       mag:WEAPONS.map(w => w.mag), res:WEAPONS.map(w => w.infinite ? Infinity : 0), unlocked:[true, false, false, false]};
  zombies = []; bullets = []; goo = []; decals = []; parts = []; texts = []; drops = [];
  round = 0; kills = 0; shots = 0; hits = 0; shake = 0; muzzle = 0; hurtFlash = 0; flowT = 0; bossAlive = false;
  camX = P.x; camY = P.y;
  buildBlocked(); buildFlow();
  buildWeaponBar();
  nextRound();
}
function nextRound(){
  round++;
  toSpawn = 6 + round * 4;
  bossAlive = false;
  if(round % 5 === 0){ toSpawn += 1; }
  spawnT = 1.6; breakT = 0;
  let sub = round === 1 ? "Sobreviva!" : "Eles estão mais fortes";
  WEAPONS.forEach((w, i) => { if(!P.unlocked[i] && round >= w.unlock){ P.unlocked[i] = true; P.res[i] = w.start; sub = "Nova arma: " + w.name + " " + w.icon + " (aperte " + (i + 1) + ")"; sfx("unlock"); } });
  if(round % 5 === 0) sub = "Cuidado: ZUMBI GIGANTE!";
  banner = {t:2.6, title:"ROUND " + round, sub};
  buildWeaponBar();
  sfx("round");
}
function roundClear(){
  breakT = 3.4;
  P.hp = P.maxHp;
  // bônus de munição
  WEAPONS.forEach((w, i) => { if(P.unlocked[i] && !w.infinite) P.res[i] += w.drop; });
  banner = {t:3.2, title:"ROUND " + round + " SUPERADO!", sub:"Vida restaurada ❤  +munição"};
  sfx("clear"); buzz([40, 40, 80]);
  for(let i = 0; i < 30; i++){ const a = Math.random() * 6.28; parts.push({x:P.x, y:P.y, vx:Math.cos(a) * rnd(80, 260), vy:Math.sin(a) * rnd(80, 260), life:rnd(0.5, 1), c:pick(["#8CFF3F", "#FFD24A", "#FFFFFF"]), s:4}); }
}

// ===== Zumbis =====
function spawnZombie(){
  // nasce num dos pontos mais próximos, mas fora da vista imediata
  const far = MAP.spawns.filter(([x, y]) => Math.hypot(x - P.x, y - P.y) > 380).sort((a, b) => Math.hypot(a[0] - P.x, a[1] - P.y) - Math.hypot(b[0] - P.x, b[1] - P.y)).slice(0, 4);
  const [sx, sy] = pick(far.length ? far : MAP.spawns);
  let type = "normal";
  const r = Math.random();
  if(round % 5 === 0 && !bossAlive && toSpawn === 1){ type = "boss"; bossAlive = true; }
  else if(round >= 4 && r < 0.12) type = "spitter";
  else if(round >= 3 && r < 0.26) type = "brute";
  else if(round >= 2 && r < 0.48) type = "runner";
  const T = ZTYPES[type];
  const hp = T.hp + T.hpR * (round - 1);
  zombies.push({type, x:sx + rnd(-20, 20), y:sy + rnd(-20, 20), r:T.r, hp, max:hp, sp:Math.min(T.spMax, T.sp + T.spR * round) * rnd(0.9, 1.1),
    dmg:T.dmg, atk:0, hit:0, t:rnd(0, 6), shirt:pick(T.shirt), fire:rnd(1.5, 3), groan:rnd(2, 8), vx:0, vy:0});
  if(type === "boss") sfx("boss");
}
function killZombie(z){
  z.dead = true; kills++;
  splat(z.x, z.y, z.type === "boss" ? 3 : z.type === "brute" ? 1.8 : 1);
  for(let i = 0; i < (LOW ? 6 : 14) * (z.type === "boss" ? 3 : 1); i++){ const a = Math.random() * 6.28, v = rnd(60, 260); parts.push({x:z.x, y:z.y, vx:Math.cos(a) * v, vy:Math.sin(a) * v, life:rnd(0.3, 0.7), c:pick(["#8CFF3F", "#5FD12B", "#B6FF7A"]), s:rnd(3, 6)}); }
  sfx("splat");
  const roll = Math.random();
  if(z.type === "boss"){ drops.push({x:z.x, y:z.y, k:"med"}, {x:z.x + 30, y:z.y, k:"ammo"}, {x:z.x - 30, y:z.y, k:"ammo"}); texts.push({x:z.x, y:z.y - 60, text:"ZUMBI GIGANTE DERROTADO!", c:"#FFD24A", life:1.6}); }
  else if(roll < 0.05) drops.push({x:z.x, y:z.y, k:"med"});
  else if(roll < 0.22 && P.unlocked.slice(1).some(Boolean)) drops.push({x:z.x, y:z.y, k:"ammo"});
}
function splat(x, y, s){
  decals.push({x, y, r:rnd(14, 24) * s, a:rnd(0, 6)});
  if(decals.length > (LOW ? 30 : 70)) decals.shift();
}

// ===== Tiro =====
function fire(){
  const w = WEAPONS[P.w];
  if(P.reloadT > 0 || P.cd > 0) return;
  if(P.mag[P.w] <= 0){ startReload(); return; }
  P.cd = w.rate; P.mag[P.w]--; shots++;
  muzzle = 0.06; shake = Math.max(shake, 0.05 * w.kick);
  for(let i = 0; i < w.pellets; i++){
    const a = P.aim + (w.pellets > 1 ? (i / (w.pellets - 1) - 0.5) * w.spread : rnd(-w.spread, w.spread) / 2) + rnd(-0.02, 0.02);
    const sp = w.speed * rnd(0.92, 1.05);
    bullets.push({x:P.x + Math.cos(P.aim) * 26, y:P.y + Math.sin(P.aim) * 26, vx:Math.cos(a) * sp, vy:Math.sin(a) * sp, life:w.life, dmg:w.dmg, pierce:w.pierce || 0, w:P.w, hitSet:null, counted:false});
  }
  sfx(w.sound);
  if(P.mag[P.w] <= 0) setTimeout(() => { if(state === "play" && P.mag[P.w] <= 0) startReload(); }, 150);
}
function startReload(){
  const w = WEAPONS[P.w];
  if(P.reloadT > 0 || P.mag[P.w] >= w.mag) return;
  if(!w.infinite && P.res[P.w] <= 0){ texts.push({x:P.x, y:P.y - 40, text:"Sem munição! Troque de arma", c:"#FF7A1A", life:1.1}); sfx("empty"); return; }
  P.reloadT = w.reload; sfx("reload");
}
function finishReload(){
  const w = WEAPONS[P.w], need = w.mag - P.mag[P.w];
  const take = w.infinite ? need : Math.min(need, P.res[P.w]);
  P.mag[P.w] += take; if(!w.infinite) P.res[P.w] -= take;
}
function switchWeapon(i){
  if(i < 0 || i >= WEAPONS.length || !P.unlocked[i] || i === P.w) return;
  P.w = i; P.reloadT = 0; P.cd = 0.15; sfx("switch"); buildWeaponBar();
  if(P.mag[i] <= 0) startReload();
}
function cycleWeapon(dir){
  for(let k = 1; k <= WEAPONS.length; k++){ const i = (P.w + dir * k + WEAPONS.length * 2) % WEAPONS.length; if(P.unlocked[i]){ switchWeapon(i); return; } }
}

// ===== Controles =====
const keys = {};
let mouse = {x:0, y:0, down:false, active:false};
const sticks = {};
document.addEventListener("keydown", e => {
  const k = e.key.toLowerCase();
  if(state === "menu" && e.key === "Enter"){ startGame(); return; }
  if(k === "p" || e.key === "Escape"){ togglePause(); return; }
  if(state !== "play") return;
  keys[k] = true;
  if(k === "r") startReload();
  if(k >= "1" && k <= "4") switchWeapon(+k - 1);
  if(k === "q") cycleWeapon(-1);
  if(k === "e") cycleWeapon(1);
  if(k === " " || k.startsWith("arrow")) e.preventDefault();
});
document.addEventListener("keyup", e => { keys[e.key.toLowerCase()] = false; });
cv.addEventListener("wheel", e => { if(state === "play"){ e.preventDefault(); cycleWeapon(e.deltaY > 0 ? 1 : -1); } }, {passive:false});
cv.addEventListener("contextmenu", e => e.preventDefault());
function pt(e){ const r = cv.getBoundingClientRect(); return {x:e.clientX - r.left, y:e.clientY - r.top}; }
cv.addEventListener("pointerdown", e => {
  if(state !== "play") return;
  const p = pt(e);
  if(e.pointerType === "mouse"){ mouse.x = p.x; mouse.y = p.y; mouse.active = true; if(e.button === 2) startReload(); else mouse.down = true; return; }
  sticks[e.pointerId] = {side:p.x < W / 2 ? "move" : "aim", ox:p.x, oy:p.y, x:p.x, y:p.y};
  try{ cv.setPointerCapture(e.pointerId); }catch(err){}
});
cv.addEventListener("pointermove", e => {
  const p = pt(e);
  if(e.pointerType === "mouse"){ mouse.x = p.x; mouse.y = p.y; mouse.active = true; return; }
  const s = sticks[e.pointerId]; if(s){ s.x = p.x; s.y = p.y; }
});
cv.addEventListener("pointerup", e => { if(e.pointerType === "mouse"){ if(e.button !== 2) mouse.down = false; return; } delete sticks[e.pointerId]; });
cv.addEventListener("pointercancel", e => { delete sticks[e.pointerId]; });
window.addEventListener("blur", () => { mouse.down = false; for(const k in keys) keys[k] = false; });
function stickVec(side){
  for(const id in sticks){
    const s = sticks[id]; if(s.side !== side) continue;
    const dx = s.x - s.ox, dy = s.y - s.oy, d = Math.hypot(dx, dy), max = 55;
    if(d < 8) return {x:0, y:0, m:0, a:null};
    const m = Math.min(1, d / max);
    return {x:dx / d * m, y:dy / d * m, m, a:Math.atan2(dy, dx)};
  }
  return null;
}
$("btnReload").addEventListener("pointerdown", e => { e.preventDefault(); startReload(); });

function buildWeaponBar(){
  const bar = $("weapons"); bar.innerHTML = "";
  WEAPONS.forEach((w, i) => {
    const b = document.createElement("button"); b.type = "button"; b.className = "wslot" + (P && P.w === i ? " on" : "");
    const locked = !P || !P.unlocked[i];
    b.disabled = locked;
    b.setAttribute("aria-label", w.name + (locked ? ", libera no round " + w.unlock : ""));
    b.innerHTML = '<span class="wi" aria-hidden="true">' + (locked ? "🔒" : w.icon) + '</span><b>' + (locked ? "Round " + w.unlock : w.name) + '</b><span id="wa' + i + '"></span><kbd>' + (i + 1) + '</kbd>';
    b.addEventListener("pointerdown", e => { e.preventDefault(); if(state === "play") switchWeapon(i); });
    bar.appendChild(b);
  });
  updateAmmoHud();
}
function updateAmmoHud(){
  if(!P) return;
  WEAPONS.forEach((w, i) => { const el = $("wa" + i); if(el) el.textContent = P.unlocked[i] ? (w.infinite ? "∞" : P.mag[i] + P.res[i]) : ""; });
  const w = WEAPONS[P.w];
  $("ammo").innerHTML = (P.reloadT > 0 ? "…" : P.mag[P.w]) + " <small>/ " + (w.infinite ? "∞" : P.res[P.w]) + "</small>";
  $("btnReload").classList.toggle("need", P.mag[P.w] === 0 && P.reloadT <= 0);
  $("btnReload").textContent = P.reloadT > 0 ? "Recarregando" : "↻ Recarregar";
}

// ===== Som =====
let ac = null, noiseBuf = null;
function audio(){ if(!ac) ac = new (window.AudioContext || window.webkitAudioContext)(); return ac; }
function tone(type, f0, f1, dur, vol, delay){
  const a = audio(), t = a.currentTime + (delay || 0), o = a.createOscillator(), g = a.createGain();
  o.connect(g); g.connect(a.destination); o.type = type;
  o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.start(t); o.stop(t + dur + 0.02);
}
function noise(dur, vol, freq, q){
  const a = audio();
  if(!noiseBuf){ noiseBuf = a.createBuffer(1, a.sampleRate, a.sampleRate); const d = noiseBuf.getChannelData(0); for(let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
  const s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain(), t = a.currentTime;
  s.buffer = noiseBuf; f.type = "bandpass"; f.frequency.value = freq || 1200; f.Q.value = q || 0.7;
  s.connect(f); f.connect(g); g.connect(a.destination);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.start(t); s.stop(t + dur);
}
let lastSnd = {};
function sfx(kind){
  if(muted) return;
  const now = performance.now();
  if(lastSnd[kind] && now - lastSnd[kind] < 45) return; lastSnd[kind] = now;
  try{
    switch(kind){
      case "pistol": noise(0.12, 0.25, 1500); tone("square", 300, 90, 0.08, 0.05); break;
      case "shotgun": noise(0.3, 0.4, 700, 0.5); tone("sawtooth", 160, 50, 0.2, 0.08); break;
      case "smg": noise(0.07, 0.16, 2000); break;
      case "laser": tone("sawtooth", 1800, 200, 0.25, 0.07); tone("sine", 900, 2400, 0.2, 0.05); break;
      case "reload": tone("square", 500, 400, 0.05, 0.05); tone("square", 700, 600, 0.05, 0.05, 0.2); break;
      case "empty": tone("square", 180, 160, 0.05, 0.05); break;
      case "switch": tone("triangle", 600, 900, 0.06, 0.05); break;
      case "hit": tone("square", 220, 160, 0.04, 0.03); break;
      case "splat": noise(0.18, 0.18, 400, 1.5); break;
      case "hurt": tone("sawtooth", 200, 70, 0.25, 0.1); break;
      case "groan": tone("sawtooth", rnd(90, 130), rnd(60, 80), 0.7, 0.03); break;
      case "spit": noise(0.15, 0.1, 800, 2); break;
      case "pickup": tone("sine", 700, 1400, 0.15, 0.07); break;
      case "round": tone("triangle", 220, 440, 0.4, 0.07); break;
      case "clear": tone("triangle", 523, 1046, 0.2, 0.07); tone("triangle", 659, 1318, 0.2, 0.07, 0.15); tone("triangle", 784, 1568, 0.35, 0.07, 0.3); break;
      case "unlock": tone("square", 440, 880, 0.15, 0.05, 0.1); break;
      case "boss": tone("sawtooth", 70, 40, 1.4, 0.12); break;
      case "over": tone("sawtooth", 300, 40, 1.2, 0.1); break;
    }
  }catch(e){}
}
function setMuteUI(){ $("btnSound").textContent = muted ? "🔇" : "🔊"; $("btnSound").setAttribute("aria-label", muted ? "Som desligado" : "Som ligado"); }
$("btnSound").addEventListener("click", () => { muted = !muted; setMuteUI(); try{ localStorage.setItem("zumbis-mute", muted ? "1" : "0"); }catch(e){} });

// ===== Atualização =====
function update(dt){
  if(banner){ banner.t -= dt; if(banner.t <= 0) banner = null; }
  if(shake > 0) shake = Math.max(0, shake - dt);
  if(muzzle > 0) muzzle -= dt;
  if(hurtFlash > 0) hurtFlash -= dt;
  if(P.inv > 0) P.inv -= dt;
  if(P.cd > 0) P.cd -= dt;
  if(P.reloadT > 0){ P.reloadT -= dt; if(P.reloadT <= 0){ P.reloadT = 0; finishReload(); } }

  // movimento
  let mx = 0, my = 0;
  if(keys["a"] || keys["arrowleft"]) mx -= 1;
  if(keys["d"] || keys["arrowright"]) mx += 1;
  if(keys["w"] || keys["arrowup"]) my -= 1;
  if(keys["s"] || keys["arrowdown"]) my += 1;
  if(mx || my){ const d = Math.hypot(mx, my); mx /= d; my /= d; }
  const mv = stickVec("move"); if(mv){ mx = mv.x; my = mv.y; }
  const spd = 235 * skin.speed * (P.reloadT > 0 ? 0.85 : 1);
  P.x += mx * spd * dt; P.y += my * spd * dt; collide(P);
  if(mx || my) P.walk += dt * 10;

  // mira e tiro
  const av = stickVec("aim");
  let firing = false;
  if(av && av.a !== null){ P.aim = av.a; firing = av.m > 0.35; }
  else if(mouse.active && !IS_TOUCH){ const [wx, wy] = toWorld(mouse.x, mouse.y); P.aim = Math.atan2(wy - P.y, wx - P.x); firing = mouse.down; }
  else if(IS_TOUCH && !av){
    // sem o dedo direito: mira no zumbi mais perto (só olha, não atira)
    let bd = 1e9, t = null; for(const z of zombies){ const d = Math.hypot(z.x - P.x, z.y - P.y); if(d < bd){ bd = d; t = z; } }
    if(t && bd < 500){ const want = Math.atan2(t.y - P.y, t.x - P.x); let df = Math.atan2(Math.sin(want - P.aim), Math.cos(want - P.aim)); P.aim += df * Math.min(1, dt * 8); }
  }
  if(keys[" "]) firing = true;
  if(firing) fire();

  // câmera
  const lead = 60;
  camX += (P.x + Math.cos(P.aim) * lead - camX) * Math.min(1, dt * 6);
  camY += (P.y + Math.sin(P.aim) * lead - camY) * Math.min(1, dt * 6);
  const hw = W / 2 / zoom, hh = H / 2 / zoom;
  camX = WW > hw * 2 ? clamp(camX, hw, WW - hw) : WW / 2; camY = WH > hh * 2 ? clamp(camY, hh, WH - hh) : WH / 2;

  // rounds
  if(breakT > 0){ breakT -= dt; if(breakT <= 0) nextRound(); }
  else {
    spawnT -= dt;
    const maxAlive = 8 + round * 2;
    if(toSpawn > 0 && spawnT <= 0 && zombies.length < maxAlive){ spawnZombie(); toSpawn--; spawnT = Math.max(0.28, 1.0 - round * 0.05) * rnd(0.6, 1.3); }
    if(toSpawn <= 0 && zombies.length === 0) roundClear();
  }

  // caminho
  flowT -= dt; if(flowT <= 0){ flowT = 0.35; buildFlow(); }

  // zumbis
  for(const z of zombies){
    z.t += dt; if(z.hit > 0) z.hit -= dt; if(z.atk > 0) z.atk -= dt;
    z.groan -= dt; if(z.groan <= 0){ z.groan = rnd(4, 10); if(Math.hypot(z.x - P.x, z.y - P.y) < 500) sfx("groan"); }
    const dx = P.x - z.x, dy = P.y - z.y, d = Math.hypot(dx, dy) || 1;
    let dir = flowDir(z) || [dx / d, dy / d];
    if(z.type === "spitter"){
      if(d < 260) dir = [-dx / d, -dy / d];
      else if(d < 340) dir = [-dy / d * 0.5, dx / d * 0.5];
      z.fire -= dt;
      if(z.fire <= 0 && d < 520){ z.fire = rnd(1.8, 2.8); goo.push({x:z.x, y:z.y, vx:dx / d * 280, vy:dy / d * 280, life:2.2}); sfx("spit"); }
    }
    const wob = z.type === "runner" ? 0.25 : 0.12;
    const nx = dir[0] + Math.sin(z.t * 3) * wob * -dir[1], ny = dir[1] + Math.sin(z.t * 3) * wob * dir[0];
    z.vx = nx * z.sp; z.vy = ny * z.sp;
    z.x += z.vx * dt; z.y += z.vy * dt; collide(z);
    if(d < P.r + z.r + 4 && z.atk <= 0){ z.atk = 0.8; hurt(z.dmg, z); }
  }
  // zumbis não se sobrepõem
  for(let i = 0; i < zombies.length; i++) for(let j = i + 1; j < zombies.length; j++){
    const a = zombies[i], b = zombies[j], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy), m = a.r + b.r;
    if(d > 0 && d < m){ const p = (m - d) / 2 / d; a.x -= dx * p; a.y -= dy * p; b.x += dx * p; b.y += dy * p; }
  }

  // balas
  for(const b of bullets){
    b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
    if(solidAt(b.x, b.y)){ b.life = 0; for(let i = 0; i < 3; i++) parts.push({x:b.x, y:b.y, vx:rnd(-80, 80), vy:rnd(-80, 80), life:0.2, c:"#FFE07A", s:2}); continue; }
    for(const z of zombies){
      if(z.dead || (b.hitSet && b.hitSet.has(z))) continue;
      if(Math.hypot(z.x - b.x, z.y - b.y) < z.r + 4){
        z.hp -= b.dmg; z.hit = 0.1; sfx("hit");
        if(!b.counted){ hits++; b.counted = true; }
        const k = z.type === "boss" ? 6 : z.type === "brute" ? 14 : 30; z.x += b.vx / 1000 * k; z.y += b.vy / 1000 * k;
        parts.push({x:b.x, y:b.y, vx:b.vx * 0.1 + rnd(-60, 60), vy:b.vy * 0.1 + rnd(-60, 60), life:0.3, c:"#8CFF3F", s:3});
        if(z.hp <= 0) killZombie(z);
        if(b.pierce > 0){ b.pierce--; (b.hitSet || (b.hitSet = new Set())).add(z); } else { b.life = 0; break; }
      }
    }
  }
  bullets = bullets.filter(b => b.life > 0);
  zombies = zombies.filter(z => !z.dead);
  for(const g of goo){
    g.x += g.vx * dt; g.y += g.vy * dt; g.life -= dt;
    if(solidAt(g.x, g.y)){ g.life = 0; splat(g.x, g.y, 0.5); }
    else if(Math.hypot(g.x - P.x, g.y - P.y) < P.r + 8){ g.life = 0; hurt(10, null); splat(P.x, P.y, 0.4); }
  }
  goo = goo.filter(g => g.life > 0);

  // itens
  for(const it of drops){
    it.t = (it.t || 0) + dt;
    if(Math.hypot(it.x - P.x, it.y - P.y) < 34){
      it.got = true; sfx("pickup");
      if(it.k === "med"){ P.hp = Math.min(P.maxHp, P.hp + 30); texts.push({x:P.x, y:P.y - 40, text:"+30 de vida", c:"#FF3D5A", life:1}); }
      else {
        const opts = WEAPONS.map((w, i) => i).filter(i => i > 0 && P.unlocked[i]);
        const i = opts.includes(P.w) ? P.w : pick(opts);
        P.res[i] += WEAPONS[i].drop; texts.push({x:P.x, y:P.y - 40, text:"+" + WEAPONS[i].drop + " " + WEAPONS[i].name, c:"#FFD24A", life:1});
      }
    }
    if(it.t > 25) it.got = true;
  }
  drops = drops.filter(i => !i.got);

  for(const p of parts){ p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.92; p.vy *= 0.92; p.life -= dt; }
  parts = parts.filter(p => p.life > 0);
  if(parts.length > 400) parts.splice(0, parts.length - 400);
  for(const t of texts){ t.y -= 30 * dt; t.life -= dt; }
  texts = texts.filter(t => t.life > 0);

  hud(dt);
}
function hurt(dmg, z){
  if(state !== "play") return;
  P.hp -= dmg; hurtFlash = 0.35; shake = Math.max(shake, 0.18); sfx("hurt"); buzz(60);
  if(z){ const dx = P.x - z.x, dy = P.y - z.y, d = Math.hypot(dx, dy) || 1; P.x += dx / d * 14; P.y += dy / d * 14; collide(P); }
  if(P.hp <= 0){ P.hp = 0; gameOver(); }
}
function hud(dt){
  P.shownHp += (P.hp - P.shownHp) * Math.min(1, (dt || 0.016) * 3);
  const pct = P.hp / P.maxHp * 100;
  $("hpFill").style.width = pct + "%";
  $("hpFill").classList.toggle("low", pct <= 30);
  $("hpGhost").style.width = (P.shownHp / P.maxHp * 100) + "%";
  $("hpText").textContent = Math.ceil(P.hp) + " / " + P.maxHp;
  $("hudRound").textContent = round;
  $("hudLeft").textContent = zombies.length + toSpawn;
  updateAmmoHud();
}

// ===== Fluxo =====
function startGame(){
  newGame(); state = "play";
  ["startScreen", "overScreen", "pauseScreen"].forEach(id => $(id).hidden = true); $("hud").hidden = false;
  mapCache = null; last = performance.now();
  try{ localStorage.setItem("zumbis-skin", skin.id); localStorage.setItem("zumbis-map", mapId); }catch(e){}
  if(ac && ac.state === "suspended") ac.resume();
}
function togglePause(){
  if(state === "play"){ state = "pause"; $("pauseScreen").hidden = false; mouse.down = false; for(const k in sticks) delete sticks[k]; for(const k in keys) keys[k] = false; }
  else if(state === "pause"){ state = "play"; $("pauseScreen").hidden = true; last = performance.now(); }
}
function gameOver(){
  state = "over"; sfx("over"); buzz([100, 60, 200]);
  for(const k in sticks) delete sticks[k]; mouse.down = false;
  const reached = round;
  const rec = reached > best;
  if(rec){ best = reached; try{ localStorage.setItem("zumbis-best", String(best)); }catch(e){} }
  setTimeout(() => {
    $("overTitle").textContent = rec ? "Novo recorde!" : "Os zumbis venceram!";
    $("overTag").textContent = MAP.name + " · " + skin.name;
    $("overRound").textContent = reached;
    $("overKills").textContent = kills;
    $("overAcc").textContent = (shots ? Math.round(hits / shots * 100) : 0) + "%";
    $("overBest").textContent = "Recorde: round " + best;
    $("overScreen").hidden = false; $("btnAgain").focus({preventScroll:true});
  }, 900);
}
function toMenu(){
  state = "menu"; $("hud").hidden = true; $("overScreen").hidden = true; $("pauseScreen").hidden = true; $("startScreen").hidden = false;
  $("bestStart").textContent = "Recorde: round " + best; P = null; draw(0);
}
$("btnPlay").addEventListener("click", startGame);
$("btnAgain").addEventListener("click", startGame);
$("btnMenu").addEventListener("click", toMenu);
$("btnQuit").addEventListener("click", toMenu);
$("btnPause").addEventListener("click", togglePause);
$("btnResume").addEventListener("click", togglePause);
document.addEventListener("visibilitychange", () => { if(document.hidden && state === "play") togglePause(); });

// ===== Desenho do mapa (feito uma vez) =====
function rr(g, x, y, w, h, r){ g.beginPath(); if(g.roundRect) g.roundRect(x, y, w, h, r); else g.rect(x, y, w, h); }
function drawMapTo(g, M){
  g.fillStyle = M.floor; g.fillRect(0, 0, WW, WH);
  if(M === MAPS.escola){
    for(let y = 0; y < WH; y += 40){ g.fillStyle = (y / 40) % 2 ? M.floor2 : M.floor; g.fillRect(0, y, WW, 40); }
    g.strokeStyle = M.line; g.lineWidth = 2; for(let x = 0; x < WW; x += 160){ g.beginPath(); g.moveTo(x, 0); g.lineTo(x, WH); g.stroke(); }
    g.fillStyle = "#2F4F3A"; g.fillRect(60, 60, 500, 30); g.fillRect(60, 1210, 500, 30);          // lousas
    g.fillStyle = "rgba(255,255,255,.5)"; g.font = "700 18px Rubik, sans-serif"; g.fillText("1º ANO D", 80, 82); g.fillText("SALA 2", 80, 1232);
    g.fillStyle = "rgba(255,255,255,.08)"; g.font = "900 70px Rubik, sans-serif"; g.textAlign = "center"; g.fillText("CETI", 1500, 1260); g.textAlign = "left";
  } else if(M === MAPS.cidade){
    g.fillStyle = "#2E3135"; g.fillRect(330, 0, 390, WH); g.fillRect(1080, 0, 390, WH); g.fillRect(0, 330, WW, 640);
    g.fillStyle = "#4A4E54"; for(const [x, y, w, h] of [[310, 0, 20, WH], [720, 0, 20, WH], [1060, 0, 20, WH], [1470, 0, 20, WH], [0, 310, WW, 20], [0, 970, WW, 20]]) g.fillRect(x, y, w, h);
    g.fillStyle = "#E3B23C"; for(let x = 0; x < WW; x += 80) g.fillRect(x, 646, 44, 8);
    for(let y = 0; y < WH; y += 80){ g.fillRect(521, y, 8, 44); g.fillRect(1271, y, 8, 44); }
    g.fillStyle = "rgba(255,255,255,.6)"; for(let i = 0; i < 6; i++){ g.fillRect(760 + i * 50, 340, 30, 90); g.fillRect(760 + i * 50, 870, 30, 90); }
    for(let i = 0; i < 40; i++){ g.fillStyle = "rgba(0,0,0,.15)"; g.beginPath(); g.ellipse(rnd(0, WW), rnd(0, WH), rnd(10, 40), rnd(6, 20), rnd(0, 3), 0, 7); g.fill(); }
  } else {
    for(let i = 0; i < 260; i++){ g.fillStyle = Math.random() < 0.5 ? "#2B3D25" : "#1A2616"; g.beginPath(); g.ellipse(rnd(0, WW), rnd(0, WH), rnd(10, 50), rnd(8, 30), rnd(0, 3), 0, 7); g.fill(); }
    g.fillStyle = "#4A4033"; g.fillRect(860, 610, 80, 690);                         // trilha de terra
    g.fillStyle = "#3E352A"; for(let y = 620; y < WH; y += 60) g.fillRect(870 + rnd(-6, 6), y, 60, 30);
  }
  for(const o of M.obs) drawObstacle(g, o);
  // borda
  g.strokeStyle = "rgba(0,0,0,.6)"; g.lineWidth = 16; g.strokeRect(0, 0, WW, WH);
}
function drawObstacle(g, o){
  const {x, y, w, h, k} = o;
  g.fillStyle = "rgba(0,0,0,.35)"; g.fillRect(x + 6, y + 8, w, h);
  if(k === "wall"){ g.fillStyle = "#8C7B6B"; g.fillRect(x, y, w, h); g.fillStyle = "#A8978A"; g.fillRect(x, y, w, 6); }
  else if(k === "desk"){ g.fillStyle = "#B7864F"; rr(g, x, y, w, h, 4); g.fill(); g.fillStyle = "#8A6236"; g.fillRect(x + 6, y + h - 8, w - 12, 4); g.fillStyle = "#F1F5E9"; g.fillRect(x + 14, y + 10, 22, 16); g.fillStyle = "#3B82F6"; g.fillRect(x + w - 30, y + 12, 14, 18); }
  else if(k === "locker"){ g.fillStyle = "#3D7EA6"; g.fillRect(x, y, w, h); g.strokeStyle = "#285A79"; g.lineWidth = 2; g.strokeRect(x + 2, y + 2, w / 2 - 3, h - 4); g.strokeRect(x + w / 2 + 1, y + 2, w / 2 - 3, h - 4); }
  else if(k === "table"){ g.fillStyle = "#C9C2B8"; rr(g, x, y, w, h, 8); g.fill(); g.fillStyle = "#E85D5D"; g.beginPath(); g.arc(x + 30, y + h / 2, 9, 0, 7); g.fill(); g.fillStyle = "#F5D04A"; g.beginPath(); g.arc(x + w - 32, y + h / 2, 8, 0, 7); g.fill(); }
  else if(k === "plant"){ g.fillStyle = "#6B4F3A"; g.fillRect(x + 20, y + 20, w - 40, h - 40); for(let i = 0; i < 9; i++){ g.fillStyle = i % 2 ? "#3F7D2B" : "#4E9A36"; g.beginPath(); g.arc(x + w / 2 + Math.cos(i) * 32, y + h / 2 + Math.sin(i * 1.3) * 32, 26, 0, 7); g.fill(); } }
  else if(k === "building"){ g.fillStyle = "#2A2C33"; g.fillRect(x, y, w, h); g.fillStyle = "#34373F"; g.fillRect(x + 12, y + 12, w - 24, h - 24); g.fillStyle = "#1F2127"; for(let i = x + 30; i < x + w - 40; i += 70) for(let j = y + 30; j < y + h - 40; j += 70) g.fillRect(i, j, 40, 40); g.fillStyle = "rgba(255,210,74,.3)"; g.fillRect(x + 42, y + 42, 16, 16); }
  else if(k === "car"){ const c = pick(["#B91C1C", "#1D4ED8", "#065F46", "#6B7280", "#A16207"]); g.fillStyle = c; rr(g, x, y, w, h, 12); g.fill(); g.fillStyle = "rgba(170,210,255,.55)"; if(w > h){ g.fillRect(x + w * 0.3, y + 6, w * 0.4, h - 12); } else { g.fillRect(x + 6, y + h * 0.3, w - 12, h * 0.4); } g.fillStyle = "#111"; g.fillRect(x + 4, y + 4, 8, 8); }
  else if(k === "dumpster"){ g.fillStyle = "#166534"; g.fillRect(x, y, w, h); g.fillStyle = "#14532D"; g.fillRect(x, y, w, 10); }
  else if(k === "barrier"){ g.fillStyle = "#F97316"; g.fillRect(x, y, w, h); g.fillStyle = "#FFFFFF"; if(w > h){ for(let i = x; i < x + w; i += 30) g.fillRect(i, y, 14, h); } else { for(let j = y; j < y + h; j += 30) g.fillRect(x, j, w, 14); } }
  else if(k === "tomb"){ g.fillStyle = "#8B8F94"; rr(g, x, y, w, h, [14, 14, 3, 3]); g.fill(); g.fillStyle = "#6B6F74"; g.fillRect(x + w / 2 - 2, y + 8, 4, 18); g.fillRect(x + w / 2 - 8, y + 13, 16, 4); }
  else if(k === "mausoleum"){ g.fillStyle = "#6E6A64"; g.fillRect(x, y, w, h); g.fillStyle = "#58544F"; g.fillRect(x + 14, y + 14, w - 28, h - 28); g.fillStyle = "#2B2926"; g.fillRect(x + w / 2 - 22, y + h - 40, 44, 40); }
  else if(k === "tree"){ g.fillStyle = "#3B2A1A"; g.beginPath(); g.arc(x + w / 2, y + h / 2, 12, 0, 7); g.fill(); for(let i = 0; i < 7; i++){ g.fillStyle = i % 2 ? "#1E3A17" : "#264D1D"; g.beginPath(); g.arc(x + w / 2 + Math.cos(i) * 22, y + h / 2 + Math.sin(i) * 22, 30, 0, 7); g.fill(); } }
  else if(k === "fence"){ g.fillStyle = "#2D2D2D"; for(let j = y; j < y + h; j += 16) g.fillRect(x, j, w, 6); }
}
function ensureMapCache(){
  if(mapCache && mapCache.id === mapId) return;
  const c = document.createElement("canvas"); c.width = WW; c.height = WH;
  drawMapTo(c.getContext("2d"), MAP);
  mapCache = {id:mapId, c};
}

// ===== Personagens e zumbis =====
function drawHuman(g, x, y, aim, s, sk, walk, wIdx){
  g.save(); g.translate(x, y); g.rotate(aim);
  const sw = Math.sin(walk) * 5;
  // pés
  g.fillStyle = sk.pants; g.beginPath(); g.ellipse(-2 + sw, -8, 7, 5, 0, 0, 7); g.ellipse(-2 - sw, 8, 7, 5, 0, 0, 7); g.fill();
  // arma
  const w = WEAPONS[wIdx || 0];
  g.fillStyle = "#222"; const gl = wIdx === 1 ? 30 : wIdx === 2 ? 28 : wIdx === 3 ? 32 : 20; g.fillRect(10, -3, gl, 6);
  if(wIdx === 3){ g.fillStyle = "#7CFFEA"; g.fillRect(10 + gl - 6, -4, 6, 8); }
  if(wIdx === 1){ g.fillStyle = "#6B4226"; g.fillRect(6, -4, 10, 8); }
  // corpo (ombros)
  g.fillStyle = sk.shirt; g.beginPath(); g.ellipse(0, 0, 11, 16, 0, 0, 7); g.fill();
  // braços
  g.fillStyle = sk.skin; g.beginPath(); g.arc(13, -6, 4.5, 0, 7); g.arc(13, 6, 4.5, 0, 7); g.fill();
  // cabeça
  if(sk.robot){
    g.fillStyle = "#D1D5DB"; rr(g, -9, -9, 18, 18, 4); g.fill(); g.fillStyle = "#22D3EE"; g.fillRect(3, -6, 5, 12);
    g.fillStyle = "#9CA3AF"; g.fillRect(-12, -2, 4, 4);
  } else {
    g.fillStyle = sk.skin; g.beginPath(); g.arc(0, 0, 9, 0, 7); g.fill();
    g.fillStyle = sk.hair; g.beginPath(); g.arc(-2, 0, 9, Math.PI * 0.55, Math.PI * 1.45); g.fill();
    if(sk.bun){ g.beginPath(); g.arc(-10, 0, 5, 0, 7); g.fill(); }
    if(sk.band){ g.strokeStyle = sk.band; g.lineWidth = 3; g.beginPath(); g.arc(0, 0, 8.5, -1.2, 1.2); g.stroke(); }
  }
  g.restore();
}
function drawZombie(g, z){
  const T = z.type, s = z.r / 17;
  const a = Math.atan2(z.vy, z.vx);
  g.save(); g.translate(z.x, z.y);
  g.fillStyle = "rgba(0,0,0,.3)"; g.beginPath(); g.ellipse(4, 6, z.r * 1.05, z.r * 0.85, 0, 0, 7); g.fill();
  g.rotate(a); g.scale(s, s);
  const sw = Math.sin(z.t * 8) * 4;
  g.fillStyle = "#3A2E2A"; g.beginPath(); g.ellipse(-3 + sw, -8, 7, 5, 0, 0, 7); g.ellipse(-3 - sw, 8, 7, 5, 0, 0, 7); g.fill();
  // braços esticados (clássico)
  g.fillStyle = z.hit > 0 ? "#FFFFFF" : "#7FB069";
  g.fillRect(4, -12 + sw * 0.3, 18, 6); g.fillRect(4, 6 - sw * 0.3, 18, 6);
  g.fillStyle = z.hit > 0 ? "#FFFFFF" : z.shirt; g.beginPath(); g.ellipse(0, 0, 11, 16, 0, 0, 7); g.fill();
  g.fillStyle = "rgba(0,0,0,.25)"; g.fillRect(-6, -10, 4, 6); g.fillRect(-2, 6, 5, 4);         // rasgos
  g.fillStyle = z.hit > 0 ? "#FFFFFF" : (T === "spitter" ? "#A3E635" : "#8FC27A"); g.beginPath(); g.arc(1, 0, 9.5, 0, 7); g.fill();
  if(T === "spitter"){ g.fillStyle = "#65A30D"; g.beginPath(); g.arc(-4, 0, 6, 0, 7); g.fill(); }
  if(T === "boss"){ g.fillStyle = "#FFD24A"; g.beginPath(); g.moveTo(-6, -9); g.lineTo(-3, -15); g.lineTo(0, -9); g.lineTo(3, -15); g.lineTo(6, -9); g.closePath(); g.fill(); }
  g.restore();
}
function drawZombieEyes(g, z){
  // olhos brilham no escuro (desenhados por cima da escuridão)
  const a = Math.atan2(z.vy, z.vx), s = z.r / 17;
  const [sx, sy] = toScreen(z.x, z.y);
  const ex = Math.cos(a) * 5 * s * zoom, ey = Math.sin(a) * 5 * s * zoom, px = -Math.sin(a) * 3.6 * s * zoom, py = Math.cos(a) * 3.6 * s * zoom;
  g.fillStyle = z.type === "boss" ? "#FF3D5A" : z.type === "runner" ? "#FF7A1A" : "#E8FF5A";
  const r = Math.max(1.5, 1.8 * s * zoom);
  g.beginPath(); g.arc(sx + ex + px, sy + ey + py, r, 0, 7); g.arc(sx + ex - px, sy + ey - py, r, 0, 7); g.fill();
}

// ===== Desenho geral =====
function draw(dt){
  ctx = cv.getContext("2d");
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  if(state === "menu" || !P){ drawMenuBg(dt); return; }
  ensureMapCache();
  ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
  const sx = shake > 0 ? rnd(-1, 1) * 10 * shake * 4 : 0, sy = shake > 0 ? rnd(-1, 1) * 10 * shake * 4 : 0;
  ctx.save();
  ctx.translate(W / 2 + sx, H / 2 + sy); ctx.scale(zoom, zoom); ctx.translate(-camX, -camY);
  ctx.drawImage(mapCache.c, 0, 0);
  // gosma no chão
  for(const d of decals){ ctx.fillStyle = "rgba(110,200,60,.45)"; ctx.beginPath(); ctx.ellipse(d.x, d.y, d.r, d.r * 0.7, d.a, 0, 7); ctx.fill(); }
  // itens
  for(const it of drops){
    const bob = Math.sin((it.t || 0) * 5) * 3;
    ctx.fillStyle = "rgba(0,0,0,.35)"; ctx.beginPath(); ctx.ellipse(it.x, it.y + 12, 14, 5, 0, 0, 7); ctx.fill();
    if(it.k === "med"){ ctx.fillStyle = "#FFFFFF"; rr(ctx, it.x - 13, it.y - 13 + bob, 26, 22, 4); ctx.fill(); ctx.fillStyle = "#FF3D5A"; ctx.fillRect(it.x - 3, it.y - 9 + bob, 6, 14); ctx.fillRect(it.x - 8, it.y - 5 + bob, 16, 6); }
    else { ctx.fillStyle = "#4D7C0F"; rr(ctx, it.x - 14, it.y - 11 + bob, 28, 20, 3); ctx.fill(); ctx.fillStyle = "#FFD24A"; for(let i = 0; i < 4; i++) ctx.fillRect(it.x - 10 + i * 6, it.y - 7 + bob, 4, 10); }
  }
  for(const z of zombies) drawZombie(ctx, z);
  // tiros
  for(const b of bullets){
    const w = WEAPONS[b.w];
    ctx.strokeStyle = w.color; ctx.lineWidth = b.w === 3 ? 6 : 3; ctx.lineCap = "round";
    const len = b.w === 3 ? 0.05 : 0.025;
    ctx.beginPath(); ctx.moveTo(b.x - b.vx * len, b.y - b.vy * len); ctx.lineTo(b.x, b.y); ctx.stroke();
  }
  for(const g of goo){ ctx.fillStyle = "#A3E635"; ctx.beginPath(); ctx.arc(g.x, g.y, 8, 0, 7); ctx.fill(); ctx.fillStyle = "#65A30D"; ctx.beginPath(); ctx.arc(g.x - 2, g.y - 2, 4, 0, 7); ctx.fill(); }
  if(!(P.inv > 0 && Math.floor(P.inv * 16) % 2)) drawHuman(ctx, P.x, P.y, P.aim, 1, skin, P.walk, P.w);
  if(muzzle > 0){ const mx = P.x + Math.cos(P.aim) * 44, my = P.y + Math.sin(P.aim) * 44; ctx.fillStyle = "rgba(255,230,140,.9)"; ctx.beginPath(); ctx.arc(mx, my, 10 + Math.random() * 6, 0, 7); ctx.fill(); }
  for(const p of parts){ ctx.globalAlpha = Math.max(0, Math.min(1, p.life * 3)); ctx.fillStyle = p.c; ctx.fillRect(p.x - p.s / 2, p.y - p.s / 2, p.s, p.s); }
  ctx.globalAlpha = 1;
  // vida dos zumbis machucados
  for(const z of zombies){ if(z.hp < z.max){ const w = z.r * 2.2; ctx.fillStyle = "rgba(0,0,0,.6)"; ctx.fillRect(z.x - w / 2, z.y - z.r - 14, w, 5); ctx.fillStyle = z.type === "boss" ? "#FF3D5A" : "#8CFF3F"; ctx.fillRect(z.x - w / 2, z.y - z.r - 14, w * Math.max(0, z.hp / z.max), 5); } }
  ctx.restore();

  drawLight();
  for(const z of zombies) drawZombieEyes(ctx, z);

  // textos
  for(const t of texts){
    const [tx, ty] = toScreen(t.x, t.y);
    ctx.globalAlpha = Math.min(1, t.life * 2); ctx.font = "800 15px Rubik, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.lineWidth = 4; ctx.strokeStyle = "#000"; ctx.strokeText(t.text, tx, ty); ctx.fillStyle = t.c; ctx.fillText(t.text, tx, ty);
  }
  ctx.globalAlpha = 1;
  if(banner){
    const a = Math.min(1, banner.t * 2);
    ctx.globalAlpha = a; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.font = Math.round(Math.min(W * 0.11, 60)) + "px Creepster, Impact, sans-serif";
    ctx.lineWidth = 7; ctx.strokeStyle = "#000"; ctx.strokeText(banner.title, W / 2, H * 0.4); ctx.fillStyle = "#8CFF3F"; ctx.fillText(banner.title, W / 2, H * 0.4);
    ctx.font = "700 " + Math.round(Math.min(W * 0.045, 20)) + "px Rubik, sans-serif"; ctx.lineWidth = 4; ctx.strokeText(banner.sub, W / 2, H * 0.4 + 44); ctx.fillStyle = "#F1F5E9"; ctx.fillText(banner.sub, W / 2, H * 0.4 + 44);
    ctx.globalAlpha = 1;
  }
  // analógicos
  for(const id in sticks){
    const s = sticks[id], c = s.side === "move" ? "140,255,63" : "255,122,26";
    ctx.strokeStyle = "rgba(" + c + ",.5)"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(s.ox, s.oy, 55, 0, 7); ctx.stroke();
    const dx = clamp(s.x - s.ox, -55, 55), dy = clamp(s.y - s.oy, -55, 55);
    ctx.fillStyle = "rgba(" + c + ",.45)"; ctx.beginPath(); ctx.arc(s.ox + dx, s.oy + dy, 24, 0, 7); ctx.fill();
  }
  if(IS_TOUCH && state === "play" && !Object.keys(sticks).length && round <= 1 && banner){
    ctx.fillStyle = "rgba(255,255,255,.75)"; ctx.font = "700 13px Rubik, sans-serif"; ctx.textAlign = "center";
    ctx.fillText("← dedo esquerdo: andar", W * 0.25, H * 0.82); ctx.fillText("dedo direito: mirar e atirar →", W * 0.75, H * 0.82);
  }
  // mira do mouse
  if(!IS_TOUCH && mouse.active && state === "play"){
    ctx.strokeStyle = "#FFFFFF"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(mouse.x, mouse.y, 10, 0, 7); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(mouse.x - 16, mouse.y); ctx.lineTo(mouse.x - 6, mouse.y); ctx.moveTo(mouse.x + 6, mouse.y); ctx.lineTo(mouse.x + 16, mouse.y); ctx.moveTo(mouse.x, mouse.y - 16); ctx.lineTo(mouse.x, mouse.y - 6); ctx.moveTo(mouse.x, mouse.y + 6); ctx.lineTo(mouse.x, mouse.y + 16); ctx.stroke();
  }
  if(hurtFlash > 0){ const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.7); g.addColorStop(0, "rgba(255,0,40,0)"); g.addColorStop(1, "rgba(255,0,40," + (hurtFlash * 1.4).toFixed(2) + ")"); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
  if(P && P.hp / P.maxHp <= 0.3 && state === "play"){ ctx.strokeStyle = "rgba(255,61,90," + (0.35 + Math.sin(performance.now() / 150) * 0.2).toFixed(2) + ")"; ctx.lineWidth = 10; ctx.strokeRect(5, 5, W - 10, H - 10); }
}
function drawLight(){
  const g = lctx;
  g.globalCompositeOperation = "source-over";
  g.clearRect(0, 0, W, H);
  g.fillStyle = "rgba(2,4,2," + MAP.dark + ")"; g.fillRect(0, 0, W, H);
  g.globalCompositeOperation = "destination-out";
  const [px, py] = toScreen(P.x, P.y);
  const hole = (x, y, r, a) => { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, "rgba(0,0,0," + a + ")"); gr.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); };
  hole(px, py, 150 * zoom, 0.95);
  // lanterna
  const L = 520 * zoom, spread = 0.42;
  const gr = g.createRadialGradient(px, py, 20, px, py, L);
  gr.addColorStop(0, "rgba(0,0,0,.95)"); gr.addColorStop(0.7, "rgba(0,0,0,.7)"); gr.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = gr; g.beginPath(); g.moveTo(px, py); g.arc(px, py, L, P.aim - spread, P.aim + spread); g.closePath(); g.fill();
  // postes de luz do mapa
  for(const [lx, ly] of MAP.lamps){ const [sx, sy] = toScreen(lx, ly); if(sx > -300 && sx < W + 300 && sy > -300 && sy < H + 300) hole(sx, sy, 190 * zoom, 0.55); }
  if(muzzle > 0) hole(px + Math.cos(P.aim) * 44 * zoom, py + Math.sin(P.aim) * 44 * zoom, 260 * zoom, 0.8);
  for(const b of bullets){ if(b.w === 3){ const [bx, by] = toScreen(b.x, b.y); hole(bx, by, 60 * zoom, 0.6); } }
  g.globalCompositeOperation = "source-over";
  ctx.drawImage(light, 0, 0, W, H);
}

// ===== Fundo animado do menu =====
let menuZ = [];
function drawMenuBg(dt){
  ctx.fillStyle = "#0A0C08"; ctx.fillRect(0, 0, W, H);
  if(menuZ.length < 10) menuZ.push({x:rnd(0, W), y:H + 40, sp:rnd(15, 35), t:rnd(0, 6), s:rnd(0.8, 1.6)});
  for(const z of menuZ){
    z.y -= z.sp * (dt || 0); z.t += dt || 0; if(z.y < -60){ z.y = H + 40; z.x = rnd(0, W); }
    drawZombie(ctx, {x:z.x, y:z.y, r:17 * z.s, vx:0, vy:-1, t:z.t, type:"normal", shirt:"#4D7C0F", hit:0});
  }
  const g = ctx.createRadialGradient(W / 2, H / 2, 50, W / 2, H / 2, Math.max(W, H) * 0.7);
  g.addColorStop(0, "rgba(0,0,0,.2)"); g.addColorStop(1, "rgba(0,0,0,.85)"); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}

// ===== Menu: personagens e mapas =====
function buildMenu(){
  const pc = $("pickChar"); pc.innerHTML = "";
  for(const sk of SKINS){
    const b = document.createElement("button"); b.type = "button"; b.className = "card"; b.setAttribute("aria-pressed", sk === skin ? "true" : "false");
    const c = document.createElement("canvas"); c.width = 128; c.height = 128;
    const g = c.getContext("2d"); g.scale(2, 2); g.fillStyle = "#22271C"; g.fillRect(0, 0, 64, 64); g.translate(32, 34); g.scale(1.5, 1.5);
    drawHuman(g, 0, 0, -Math.PI / 2, 1, sk, 0, 0);
    b.appendChild(c);
    b.insertAdjacentHTML("beforeend", "<b>" + sk.name + "</b><span>" + sk.desc + " · ❤ " + sk.hp + "</span>");
    b.addEventListener("click", () => { skin = sk; buildMenu(); });
    pc.appendChild(b);
  }
  const pm = $("pickMap"); pm.innerHTML = "";
  for(const id in MAPS){
    const M = MAPS[id];
    const b = document.createElement("button"); b.type = "button"; b.className = "card"; b.setAttribute("aria-pressed", id === mapId ? "true" : "false");
    const c = document.createElement("canvas"); c.width = 180; c.height = 130; c.className = "mapprev";
    const g = c.getContext("2d"); g.scale(180 / WW, 130 / WH); drawMapTo(g, M);
    b.appendChild(c);
    b.insertAdjacentHTML("beforeend", "<b>" + M.name + "</b><span>" + M.desc + "</span>");
    b.addEventListener("click", () => { mapId = id; MAP = M; mapCache = null; buildMenu(); });
    pm.appendChild(b);
  }
}

// ===== Laço =====
let last = performance.now();
function loop(now){
  requestAnimationFrame(loop);
  const dt = Math.min(0.04, (now - last) / 1000); last = now;
  if(state === "play"){ update(dt); perfTick(dt); }
  if(state !== "pause") draw(dt);
}

setMuteUI();
$("bestStart").textContent = "Recorde: round " + best;
buildMenu();
new ResizeObserver(resize).observe(stage);
resize();
requestAnimationFrame(loop);
})();
