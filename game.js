/* ==========================================================
   ROBUST CANVAS SETUP & OVERLAY HELPERS
========================================================== */
function setupCanvas(canvas) {
  if (!canvas) return;
  const parent = canvas.parentElement;
  let w = parent ? parent.clientWidth : 800;
  let h = parent ? parent.clientHeight : 460;
  canvas.width = w; canvas.height = h;
}

function hideOverlay(id) {
  const o = document.getElementById(id);
  if (o) { o.style.display = "none"; o.classList.remove("active"); }
}

function showOverlay(id, title, desc, btnText, callbackName) {
  const o = document.getElementById(id);
  if (o) {
    o.style.display = "flex"; o.classList.add("active");
    o.innerHTML = `<h3>${title}</h3><p>${desc}</p><button class="spark-btn btn-primary btn-launch" onclick="${callbackName}">${btnText}</button>`;
  }
}

/* ==========================================================
   TIER 1P VS 2P CONTROLS & TABS
========================================================== */
function switchPlayerTier(tier) {
  document.querySelectorAll(".tier-card").forEach(c => c.classList.remove("active"));
  document.querySelectorAll(".tier-container").forEach(c => c.classList.remove("active"));
  if (tier === '1P') {
    document.getElementById("tierBtn1P").classList.add("active");
    document.getElementById("tier1P").classList.add("active");
  } else if (tier === '2P') {
    document.getElementById("tierBtn2P").classList.add("active");
    document.getElementById("tier2P").classList.add("active");
    init2PDefaults();
  }
}

document.querySelectorAll(".game-selector-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const parentTier = btn.closest(".tier-container");
    parentTier.querySelectorAll(".game-selector-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    const targetGame = btn.getAttribute("data-game");
    parentTier.querySelectorAll(".arcade-view").forEach(v => {
      v.classList.toggle("active", v.id === `${targetGame}View`);
    });

    cancelAnimationFrame(sAnimId); cancelAnimationFrame(fAnimId); cancelAnimationFrame(dAnimId);
    spaceActive = false; flappyActive = false; dinoActive = false;
  });
});

/* ==========================================================
   ONLINE AUTO-MATCHMAKING QUEUE (NO ROOM CODES NEEDED)
========================================================== */
let multiplayerMode = "offline";
let peer = null;
let netConn = null;
let myPlayerIndex = 1;
const QUEUE_ROOM_BASE = "spark_auto_queue_v1_";

function setMultiplayerMode(mode) {
  multiplayerMode = mode;
  document.getElementById("modeOfflineBtn").classList.toggle("active", mode === "offline");
  document.getElementById("modeOnlineBtn").classList.toggle("active", mode === "online");
  document.getElementById("onlineConnectPanel").style.display = mode === "online" ? "flex" : "none";
}

function findMatch() {
  const status = document.getElementById("netStatusText");
  const btn = document.getElementById("queueBtn");
  btn.disabled = true;
  status.innerText = "SEARCHING QUEUE...";

  peer = new Peer();
  peer.on('open', (id) => {
    // Attempt to connect to a specific open queue slot
    tryConnectToQueue(1);
  });
}

function tryConnectToQueue(slotIndex) {
  const status = document.getElementById("netStatusText");
  if (slotIndex > 5) {
    // If no active hosts found, become the host of Slot 1
    hostQueueMatch();
    return;
  }

  status.innerText = `SCANNING LOBBY ${slotIndex}...`;
  const targetId = QUEUE_ROOM_BASE + slotIndex;
  
  let conn = peer.connect(targetId);
  let timeout = setTimeout(() => {
    conn.close();
    tryConnectToQueue(slotIndex + 1);
  }, 2000); // Wait 2s per slot

  conn.on('open', () => {
    clearTimeout(timeout);
    myPlayerIndex = 2; // Joined someone else
    netConn = conn;
    status.innerText = "MATCH FOUND! PLAYING AS P2";
    setupNetListeners();
  });

  conn.on('error', () => {
    clearTimeout(timeout);
    tryConnectToQueue(slotIndex + 1);
  });
}

function hostQueueMatch() {
  const status = document.getElementById("netStatusText");
  peer.destroy(); // Destroy random peer
  
  // Re-initialize as the host of Slot 1 (or random fallback)
  const hostId = QUEUE_ROOM_BASE + "1";
  peer = new Peer(hostId);
  
  peer.on('open', () => {
    status.innerText = "WAITING IN QUEUE...";
    myPlayerIndex = 1;
  });

  peer.on('connection', (conn) => {
    netConn = conn;
    status.innerText = "OPPONENT JOINED! PLAYING AS P1";
    setupNetListeners();
    sendNetData({ type: "SYNC_START" });
  });

  peer.on('error', (err) => {
    // If slot 1 is suddenly taken, fallback to slot 2
    peer = new Peer(QUEUE_ROOM_BASE + "2");
    peer.on('open', () => status.innerText = "WAITING IN QUEUE (SLOT 2)...");
    peer.on('connection', (conn) => { netConn = conn; setupNetListeners(); status.innerText = "OPPONENT JOINED!"; });
  });
}

function setupNetListeners() {
  if (!netConn) return;
  netConn.on("data", (data) => {
    if (data.type === "SEABATTLE_DEPLOY") {
      sbShips[data.player] = data.ships;
      if (sbShips[1].length === 5 && sbShips[2].length === 5) {
        sbPhase = "ATTACK"; document.getElementById("sbPhase").innerText = "ATTACK PHASE!";
        renderSeaBattleBoards();
      }
    } else if (data.type === "SEABATTLE_SHOT") {
      handleSeaBattleShot(data.targetPlayer, data.index, false);
    } else if (data.type === "CHESS_MOVE") {
      executeChessMove(data.from, data.to, false);
    } else if (data.type === "TTT_MOVE") {
      handleTTT2PMove(data.index, false);
    }
  });
}

function sendNetData(data) {
  if (netConn && netConn.open) netConn.send(data);
}

/* ==========================================================
   1. SINGLE PLAYER: SPACE STRIKER (DETAILED SHIP & METEORS)
========================================================== */
let spaceActive = false, sShipX = 400, sBullets = [], sMeteors = [], sPowerBalls = [];
let sScore = 0, sAnimId = null, sLaserTier = 1, sSpeedBoost = 1, sLastShot = 0, sTimeTicks = 0;
const sCanvas = document.getElementById("spaceCanvas");

function startSpaceGame() {
  if (!sCanvas) return;
  setupCanvas(sCanvas);
  sShipX = sCanvas.width / 2;
  sBullets = []; sMeteors = []; sPowerBalls = [];
  sScore = 0; sLaserTier = 1; sSpeedBoost = 1; sTimeTicks = 0;
  spaceActive = true;

  document.getElementById("spaceScore").innerText = "0";
  document.getElementById("laserBuff").innerText = "SINGLE BEAM";
  document.getElementById("speedBuff").innerText = "NORMAL";
  hideOverlay("spaceOverlay");
  cancelAnimationFrame(sAnimId);
  loopSpace();
}

sCanvas?.addEventListener("pointermove", (e) => {
  const rect = sCanvas.getBoundingClientRect();
  sShipX = Math.max(30, Math.min(sCanvas.width - 30, e.clientX - rect.left));
});
sCanvas?.addEventListener("pointerdown", () => { if (!spaceActive) startSpaceGame(); });

function drawBlueprintShip(ctx, x, y) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = "#00d4ff"; ctx.lineWidth = 2;
  ctx.fillStyle = "rgba(0, 212, 255, 0.1)";
  
  // Nose
  ctx.beginPath();
  ctx.moveTo(0, -25);
  ctx.lineTo(8, -5);
  ctx.lineTo(25, 5); // Right Wing
  ctx.lineTo(8, 12);
  ctx.lineTo(-8, 12);
  ctx.lineTo(-25, 5); // Left Wing
  ctx.lineTo(-8, -5);
  ctx.closePath();
  ctx.stroke(); ctx.fill();

  // Engine Glow
  ctx.fillStyle = "#ff003c";
  ctx.shadowColor = "#ff003c"; ctx.shadowBlur = 10;
  ctx.fillRect(-6, 12, 12, 6 + Math.random()*4);
  ctx.restore();
}

function drawAsteroid(ctx, x, y, r, rot) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.strokeStyle = "#ff003c";
  ctx.lineWidth = 2;
  ctx.fillStyle = "rgba(255, 0, 60, 0.1)";
  ctx.beginPath();
  // Generate a jagged polygon
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const rad = r * (0.7 + Math.random() * 0.3); // Jagged edge
    if (i === 0) ctx.moveTo(Math.cos(angle) * rad, Math.sin(angle) * rad);
    else ctx.lineTo(Math.cos(angle) * rad, Math.sin(angle) * rad);
  }
  ctx.closePath();
  ctx.stroke(); ctx.fill();
  ctx.restore();
}

function loopSpace() {
  if (!spaceActive) return;
  const ctx = sCanvas.getContext("2d");
  ctx.clearRect(0, 0, sCanvas.width, sCanvas.height);
  sTimeTicks++;

  // Difficulty scales gradually based on Score + Time
  const diffMultiplier = 1 + (sScore / 600) + (sTimeTicks / 6000);
  const meteorSpeed = 1.8 * diffMultiplier * sSpeedBoost;
  const spawnRate = 0.02 * diffMultiplier;

  const now = Date.now();
  if (now - sLastShot > (220 / sSpeedBoost)) {
    sLastShot = now;
    if (sLaserTier === 1) sBullets.push({ x: sShipX, y: sCanvas.height - 35, vx: 0 });
    else if (sLaserTier === 2) {
      sBullets.push({ x: sShipX - 12, y: sCanvas.height - 35, vx: 0 });
      sBullets.push({ x: sShipX + 12, y: sCanvas.height - 35, vx: 0 });
    } else {
      sBullets.push({ x: sShipX - 16, y: sCanvas.height - 35, vx: -0.5 });
      sBullets.push({ x: sShipX, y: sCanvas.height - 35, vx: 0 });
      sBullets.push({ x: sShipX + 16, y: sCanvas.height - 35, vx: 0.5 });
    }
  }

  drawBlueprintShip(ctx, sShipX, sCanvas.height - 30);

  // Bullets
  ctx.fillStyle = "#00d4ff";
  ctx.shadowColor = "#00d4ff"; ctx.shadowBlur = 8;
  sBullets.forEach(b => {
    b.y -= 10; b.x += b.vx;
    ctx.fillRect(b.x - 2, b.y, 4, 16);
  });
  ctx.shadowBlur = 0;

  // Power Ups (Spawns every ~100 points logic via ticks)
  if (sTimeTicks % 800 === 0 && Math.random() > 0.3) {
    const type = Math.random() > 0.5 ? "LASER" : "SPEED";
    sPowerBalls.push({ x: Math.random()*(sCanvas.width-60)+30, y: -20, r: 16, type: type });
  }

  for (let i = sPowerBalls.length - 1; i >= 0; i--) {
    let p = sPowerBalls[i];
    p.y += 1.5;
    ctx.fillStyle = p.type === "LASER" ? "#ffbe0b" : "#00ff88";
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#000"; ctx.font = "bold 12px Rajdhani"; ctx.textAlign = "center";
    ctx.fillText(p.type === "LASER" ? "2x" : ">>>", p.x, p.y + 4);

    sBullets.forEach((b, bIdx) => {
      if (Math.hypot(b.x - p.x, b.y - p.y) < p.r + 5) {
        if (p.type === "LASER") {
          sLaserTier = Math.min(sLaserTier + 1, 3);
          document.getElementById("laserBuff").innerText = sLaserTier === 2 ? "DUAL" : "TRIPLE";
        } else {
          sSpeedBoost = 1.5; document.getElementById("speedBuff").innerText = "1.5x SURGE";
          setTimeout(() => { sSpeedBoost = 1; document.getElementById("speedBuff").innerText = "NORMAL"; }, 10000);
        }
        sPowerBalls.splice(i, 1); sBullets.splice(bIdx, 1);
      }
    });
  }

  // Meteors
  if (Math.random() < spawnRate) {
    sMeteors.push({ x: Math.random()*(sCanvas.width-40)+20, y: -20, r: Math.random()*10+15, rot: 0 });
  }

  for (let mIdx = sMeteors.length - 1; mIdx >= 0; mIdx--) {
    let m = sMeteors[mIdx];
    m.y += meteorSpeed;
    m.rot += 0.05;
    
    drawAsteroid(ctx, m.x, m.y, m.r, m.rot);

    sBullets.forEach((b, bIdx) => {
      if (Math.hypot(b.x - m.x, b.y - m.y) < m.r + 4) {
        sMeteors.splice(mIdx, 1); sBullets.splice(bIdx, 1);
        sScore += 5; document.getElementById("spaceScore").innerText = sScore;
      }
    });

    if (m.y > sCanvas.height + 20) {
      spaceActive = false;
      showOverlay("spaceOverlay", "HULL BREACH", `Meteors Destroyed: <strong>${sScore}</strong>`, "Relaunch", "startSpaceGame()");
      return;
    }
  }

  sBullets = sBullets.filter(b => b.y > -20);
  sPowerBalls = sPowerBalls.filter(p => p.y < sCanvas.height + 20);
  sAnimId = requestAnimationFrame(loopSpace);
}

/* ==========================================================
   2. SINGLE PLAYER: FLAPPY PHOENIX
========================================================== */
let flappyActive = false, fBirdY = 200, fBirdV = 0, fPipes = [], fScore = 0, fAnimId = null;
let wingCycle = 0;
const fCanvas = document.getElementById("flappyCanvas");

function startFlappyGame() {
  if (!fCanvas) return;
  setupCanvas(fCanvas);
  fBirdY = fCanvas.height / 2; fBirdV = -5; fPipes = []; fScore = 0; flappyActive = true;
  document.getElementById("flappyScore").innerText = "0";
  hideOverlay("flappyOverlay");
  cancelAnimationFrame(fAnimId);
  loopFlappy();
}

function flapWing() { if (flappyActive) fBirdV = -6.5; else startFlappyGame(); }
fCanvas?.addEventListener("pointerdown", flapWing);
window.addEventListener("keydown", (e) => { if (e.code==="Space" && document.getElementById("flappyView")?.classList.contains("active")) flapWing(); });

function drawCyberBird(ctx, x, y, vy, cycle) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(Math.min(Math.max(vy * 0.05, -0.5), 0.6));
  ctx.strokeStyle = "#00d4ff"; ctx.lineWidth = 2;
  ctx.strokeRect(-12, -8, 24, 16); // Body
  ctx.fillStyle = "#ff003c"; ctx.fillRect(12, -2, 8, 4); // Beak
  ctx.fillStyle = "#fff"; ctx.fillRect(-4, Math.sin(cycle)*12, 10, 14); // Wing
  ctx.restore();
}

function loopFlappy() {
  if (!flappyActive) return;
  const ctx = fCanvas.getContext("2d");
  ctx.clearRect(0, 0, fCanvas.width, fCanvas.height);

  fBirdV += 0.35; fBirdY += fBirdV; wingCycle += 0.25;
  drawCyberBird(ctx, 80, fBirdY, fBirdV, wingCycle);

  if (fPipes.length === 0 || fPipes[fPipes.length - 1].x < fCanvas.width - 240) {
    const gap = 130;
    const topH = Math.random() * (fCanvas.height - gap - 100) + 40;
    fPipes.push({ x: fCanvas.width, top: topH, bottom: topH + gap, passed: false });
  }

  for (let i = 0; i < fPipes.length; i++) {
    let p = fPipes[i]; p.x -= 3.2;
    ctx.fillStyle = "#ff003c"; ctx.fillRect(p.x, 0, 48, p.top);
    ctx.fillStyle = "#00d4ff"; ctx.fillRect(p.x, p.bottom, 48, fCanvas.height - p.bottom);

    if (80 + 12 > p.x && 80 - 12 < p.x + 48) {
      if (fBirdY - 8 < p.top || fBirdY + 8 > p.bottom) {
        flappyActive = false; showOverlay("flappyOverlay", "CRASHED", `Score: <strong>${fScore}</strong>`, "Fly Again", "startFlappyGame()"); return;
      }
    }
    if (!p.passed && p.x < 80) { p.passed = true; fScore++; document.getElementById("flappyScore").innerText = fScore; }
  }

  if (fBirdY > fCanvas.height - 15 || fBirdY < 15) {
    flappyActive = false; showOverlay("flappyOverlay", "OUT OF BOUNDS", `Score: <strong>${fScore}</strong>`, "Fly Again", "startFlappyGame()"); return;
  }
  fPipes = fPipes.filter(p => p.x > -60);
  fAnimId = requestAnimationFrame(loopFlappy);
}

/* ==========================================================
   3. SINGLE PLAYER: CHROME CYBER DINO (CYBER T-REX)
========================================================== */
let dinoActive = false, dY = 0, dV = 0, dScore = 0, dCacti = [], dAnimId = null;
let dLegCycle = 0, dTicks = 0;
const dCanvas = document.getElementById("dinoCanvas");

function startDinoGame() {
  if (!dCanvas) return;
  setupCanvas(dCanvas);
  dY = 0; dV = 0; dScore = 0; dCacti = []; dTicks = 0; dinoActive = true;
  document.getElementById("dinoScore").innerText = "0m";
  hideOverlay("dinoOverlay");
  cancelAnimationFrame(dAnimId);
  loopDino();
}

function jumpDinoAction() { if (dinoActive && dY === 0) dV = 11.5; else if (!dinoActive) startDinoGame(); }
dCanvas?.addEventListener("pointerdown", jumpDinoAction);
window.addEventListener("keydown", (e) => { if (e.code === "Space" && document.getElementById("dinoView")?.classList.contains("active")) jumpDinoAction(); });

function drawCyberTRex(ctx, x, y, cycle, inAir) {
  ctx.save(); ctx.translate(x, y);
  ctx.strokeStyle = "#00d4ff"; ctx.lineWidth = 2.5; ctx.fillStyle = "rgba(0, 212, 255, 0.1)";
  
  // Detailed T-Rex Path
  ctx.beginPath();
  ctx.moveTo(10, -25); // Snout
  ctx.lineTo(25, -25);
  ctx.lineTo(25, -15); // Jaw
  ctx.lineTo(12, -15);
  ctx.lineTo(12, -5);  // Neck
  ctx.lineTo(-5, 0);   // Back
  ctx.lineTo(-20, 15); // Tail
  ctx.lineTo(-25, 12);
  ctx.lineTo(-10, -2); // Lower back
  ctx.lineTo(-5, 15);  // Leg joint
  ctx.closePath();
  ctx.stroke(); ctx.fill();

  ctx.fillStyle = "#ff003c"; ctx.fillRect(16, -22, 4, 3); // Red glowing eye

  // Legs
  ctx.strokeStyle = "#00d4ff";
  if (!inAir) {
    const l1 = Math.sin(cycle) * 8;
    ctx.beginPath(); ctx.moveTo(-5, 15); ctx.lineTo(-8, 25 + l1); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, 12); ctx.lineTo(4, 25 - l1); ctx.stroke();
  } else {
    ctx.beginPath(); ctx.moveTo(-5, 15); ctx.lineTo(-12, 20); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, 12); ctx.lineTo(8, 18); ctx.stroke();
  }
  ctx.restore();
}

function drawCyberCactus(ctx, x, y, w, h) {
  ctx.fillStyle = "#ff003c"; ctx.shadowColor = "#ff003c"; ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.moveTo(x, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w/2, y - h); ctx.closePath();
  ctx.fill(); ctx.shadowBlur = 0;
}

function loopDino() {
  if (!dinoActive) return;
  const ctx = dCanvas.getContext("2d");
  ctx.clearRect(0, 0, dCanvas.width, dCanvas.height);
  dTicks++;

  const groundY = dCanvas.height - 40;
  // Gradual speed scaling
  const speed = 4.8 + Math.log10(1 + dTicks / 500) * 2;

  dY += dV;
  if (dY > 0) dV -= 0.52; else { dY = 0; dV = 0; }
  dLegCycle += 0.25;

  ctx.strokeStyle = "rgba(0, 212, 255, 0.5)"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, groundY + 25); ctx.lineTo(dCanvas.width, groundY + 25); ctx.stroke();

  drawCyberTRex(ctx, 70, groundY, dLegCycle, dY > 0);

  if (dCacti.length === 0 || dCacti[dCacti.length - 1].x < dCanvas.width - (300 - speed*10)) {
    if (Math.random() < 0.02) dCacti.push({ x: dCanvas.width, w: 18, h: Math.random() * 20 + 25 });
  }

  for (let i = 0; i < dCacti.length; i++) {
    let c = dCacti[i]; c.x -= speed;
    drawCyberCactus(ctx, c.x, groundY + 25, c.w, c.h);

    if (70 + 15 > c.x && 70 - 15 < c.x + c.w && dY < c.h) {
      dinoActive = false;
      showOverlay("dinoOverlay", "IMPACT DETECTED", `Distance: <strong>${Math.floor(dScore/5)}m</strong>`, "Run Again", "startDinoGame()");
      return;
    }
  }

  dScore++; document.getElementById("dinoScore").innerText = `${Math.floor(dScore/5)}m`;
  dCacti = dCacti.filter(c => c.x > -40);
  dAnimId = requestAnimationFrame(loopDino);
}

/* ==========================================================
   2-PLAYER: SEA BATTLE, CHESS (WITH REAL RULES), TIC TAC TOE
========================================================== */

/* Sea Battle */
let sbPhase = "DEPLOY", sbCurrentDeployPlayer = 1, sbShips = { 1: [], 2: [] }, sbShots = { 1: [], 2: [] }, sbTurn = 1;
function init2PDefaults() { resetSeaBattle(); resetChessBoard(); resetTTT2P(); }

function resetSeaBattle() {
  sbPhase = "DEPLOY"; sbCurrentDeployPlayer = 1; sbShips = { 1: [], 2: [] }; sbShots = { 1: [], 2: [] }; sbTurn = 1;
  document.getElementById("sbPhase").innerText = "P1 DEPLOY SHIPS (0/5)";
  document.getElementById("sbTurn").innerText = "PLAYER 1";
  renderSeaBattleBoards();
}

function renderSeaBattleBoards() {
  const g1 = document.getElementById("sbGrid1"); const g2 = document.getElementById("sbGrid2");
  if (!g1 || !g2) return;
  g1.innerHTML = ""; g2.innerHTML = "";

  for (let i = 0; i < 25; i++) {
    const c1 = document.createElement("div"); c1.className = "sb-cell";
    if (sbPhase === "DEPLOY" && sbCurrentDeployPlayer === 1 && sbShips[1].includes(i)) c1.classList.add("ship");
    else if (sbPhase === "ATTACK" && sbShips[1].includes(i)) c1.classList.add("ship");
    if (sbShots[2].includes(i)) c1.classList.add(sbShips[1].includes(i) ? "hit" : "miss");
    c1.onclick = () => onSBCellClick(1, i); g1.appendChild(c1);

    const c2 = document.createElement("div"); c2.className = "sb-cell";
    if (sbPhase === "DEPLOY" && sbCurrentDeployPlayer === 2 && sbShips[2].includes(i)) c2.classList.add("ship");
    // During attack, don't show P2 ships unless hit
    if (sbShots[1].includes(i)) c2.classList.add(sbShips[2].includes(i) ? "hit" : "miss");
    c2.onclick = () => onSBCellClick(2, i); g2.appendChild(c2);
  }
}

function onSBCellClick(boardPlayer, idx) {
  if (multiplayerMode === "online" && sbTurn !== myPlayerIndex) return;

  if (sbPhase === "DEPLOY") {
    if (sbCurrentDeployPlayer === boardPlayer) {
      let fleet = sbShips[boardPlayer];
      if (!fleet.includes(idx) && fleet.length < 5) {
        fleet.push(idx);
        document.getElementById("sbPhase").innerText = `P${boardPlayer} DEPLOY (${fleet.length}/5)`;
        if (fleet.length === 5) {
          if (boardPlayer === 1) { sbCurrentDeployPlayer = 2; document.getElementById("sbPhase").innerText = "P2 DEPLOY SHIPS (0/5)"; }
          else { sbPhase = "ATTACK"; document.getElementById("sbPhase").innerText = "ATTACK PHASE!"; }
          if (multiplayerMode === "online") sendNetData({ type: "SEABATTLE_DEPLOY", player: boardPlayer, ships: fleet });
        }
        renderSeaBattleBoards();
      }
    }
  } else if (sbPhase === "ATTACK") {
    if (sbTurn === 1 && boardPlayer === 2) handleSeaBattleShot(2, idx, true);
    else if (sbTurn === 2 && boardPlayer === 1) handleSeaBattleShot(1, idx, true);
  }
}

function handleSeaBattleShot(targetPlayer, idx, broadcast) {
  const atk = targetPlayer === 2 ? 1 : 2;
  if (sbShots[atk].includes(idx)) return;
  sbShots[atk].push(idx);
  if (broadcast && multiplayerMode === "online") sendNetData({ type: "SEABATTLE_SHOT", targetPlayer, index: idx });

  const hits = sbShots[atk].filter(i => sbShips[targetPlayer].includes(i)).length;
  if (hits === 5) { alert(`VICTORY! Player ${atk} sunk all ships!`); resetSeaBattle(); return; }
  sbTurn = atk === 1 ? 2 : 1;
  document.getElementById("sbTurn").innerText = `PLAYER ${sbTurn}`;
  renderSeaBattleBoards();
}

/* Blueprint Chess (Real Move Validation) */
const INITIAL_CHESS = ["r","n","b","q","k","b","n","r", "p","p","p","p","p","p","p","p", "","","","","","","","", "","","","","","","","", "","","","","","","","", "","","","","","","","", "P","P","P","P","P","P","P","P", "R","N","B","Q","K","B","N","R"];
const CHESS_SYM = { "r":"♜","n":"♞","b":"♝","q":"♛","k":"♚","p":"♟", "R":"♖","N":"♘","B":"♗","Q":"♕","K":"♔","P":"♙" };
let chessBoard = [], chessTurn = "W", selChess = null;

function resetChessBoard() {
  chessBoard = [...INITIAL_CHESS]; chessTurn = "W"; selChess = null;
  document.getElementById("chessTurn").innerText = "WHITE (BLUEPRINT)";
  renderChessBoard();
}

function renderChessBoard() {
  const g = document.getElementById("chessGrid"); if (!g) return;
  g.innerHTML = "";
  for (let i = 0; i < 64; i++) {
    const c = document.createElement("div");
    c.className = `chess-cell ${(Math.floor(i/8) + i%8) % 2 === 0 ? "light" : "dark"}`;
    if (selChess === i) c.classList.add("selected");
    if (chessBoard[i]) {
      c.innerText = CHESS_SYM[chessBoard[i]];
      c.classList.add(chessBoard[i] === chessBoard[i].toUpperCase() ? "white-piece" : "black-piece");
    }
    c.onclick = () => onChessClick(i);
    g.appendChild(c);
  }
}

function isPathClear(from, to, board) {
  const r1 = Math.floor(from/8), c1 = from%8, r2 = Math.floor(to/8), c2 = to%8;
  const dr = Math.sign(r2 - r1), dc = Math.sign(c2 - c1);
  let currR = r1 + dr, currC = c1 + dc;
  while (currR !== r2 || currC !== c2) {
    if (board[currR * 8 + currC] !== "") return false;
    currR += dr; currC += dc;
  }
  return true;
}

function isValidChessMove(from, to) {
  const piece = chessBoard[from]; const target = chessBoard[to];
  const r1 = Math.floor(from/8), c1 = from%8, r2 = Math.floor(to/8), c2 = to%8;
  const isW = piece === piece.toUpperCase();
  
  if (target !== "") {
    const tIsW = target === target.toUpperCase();
    if (isW === tIsW) return false; // Can't eat own piece
  }

  const dr = r2 - r1, dc = c2 - c1, absR = Math.abs(dr), absC = Math.abs(dc);
  const pType = piece.toLowerCase();

  if (pType === 'p') {
    const dir = isW ? -1 : 1;
    const startRow = isW ? 6 : 1;
    if (dc === 0 && target === "") {
      if (dr === dir) return true;
      if (r1 === startRow && dr === 2*dir && chessBoard[from + dir*8] === "") return true;
    } else if (absC === 1 && dr === dir && target !== "") return true;
    return false;
  }
  if (pType === 'n') return (absR === 2 && absC === 1) || (absR === 1 && absC === 2);
  if (pType === 'b') return absR === absC && isPathClear(from, to, chessBoard);
  if (pType === 'r') return (absR === 0 || absC === 0) && isPathClear(from, to, chessBoard);
  if (pType === 'q') return (absR === absC || absR === 0 || absC === 0) && isPathClear(from, to, chessBoard);
  if (pType === 'k') return absR <= 1 && absC <= 1;

  return false;
}

function onChessClick(idx) {
  if (multiplayerMode === "online") {
    if (chessTurn === "W" && myPlayerIndex !== 1) return;
    if (chessTurn === "B" && myPlayerIndex !== 2) return;
  }

  const piece = chessBoard[idx];
  const isWhite = piece && piece === piece.toUpperCase();
  const isOwn = piece && ((chessTurn === "W" && isWhite) || (chessTurn === "B" && !isWhite));

  if (selChess === null) {
    if (isOwn) { selChess = idx; renderChessBoard(); }
  } else {
    if (selChess === idx) { selChess = null; renderChessBoard(); }
    else if (isOwn) { selChess = idx; renderChessBoard(); } // Switch selection
    else if (isValidChessMove(selChess, idx)) executeChessMove(selChess, idx, true);
  }
}

function executeChessMove(from, to, broadcast) {
  chessBoard[to] = chessBoard[from];
  chessBoard[from] = "";
  selChess = null;
  chessTurn = chessTurn === "W" ? "B" : "W";
  document.getElementById("chessTurn").innerText = chessTurn === "W" ? "WHITE (BLUEPRINT)" : "BLACK (BLUEPRINT)";
  if (broadcast && multiplayerMode === "online") sendNetData({ type: "CHESS_MOVE", from, to });
  renderChessBoard();
}

/* Tic Tac Toe */
let tttBoard = ["","","","","","","","",""], tttTurn = "X";
function resetTTT2P() {
  tttBoard = ["","","","","","","","",""]; tttTurn = "X";
  document.getElementById("tttTurn").innerText = "PLAYER 1 (X)";
  renderTTT2P();
}
function renderTTT2P() {
  const g = document.getElementById("tttGrid2P"); if (!g) return;
  g.innerHTML = "";
  tttBoard.forEach((v, i) => {
    const c = document.createElement("div"); c.className = "ttt-cell-2p " + (v==="X"?"x":v==="O"?"o":"");
    c.innerText = v; c.onclick = () => onTTTClick(i); g.appendChild(c);
  });
}
function onTTTClick(i) {
  if (multiplayerMode === "online" && ((tttTurn==="X" && myPlayerIndex!==1) || (tttTurn==="O" && myPlayerIndex!==2))) return;
  if (!tttBoard[i]) handleTTT2PMove(i, true);
}
function handleTTT2PMove(i, broadcast) {
  tttBoard[i] = tttTurn;
  if (broadcast && multiplayerMode === "online") sendNetData({ type: "TTT_MOVE", index: i });
  
  const w = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]].some(([a,b,c]) => tttBoard[a] && tttBoard[a]===tttBoard[b] && tttBoard[a]===tttBoard[c]);
  if (w) { alert(tttTurn + " WON!"); resetTTT2P(); return; }
  
  tttTurn = tttTurn === "X" ? "O" : "X";
  document.getElementById("tttTurn").innerText = tttTurn;
  renderTTT2P();
}
