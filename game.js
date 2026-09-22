/* ==========================================================
   CANVAS SETUP & RESIZE HELPER
========================================================== */
function setupCanvas(canvas) {
  if (!canvas) return;
  const parent = canvas.parentElement;
  let w = parent ? parent.clientWidth : 800;
  let h = parent ? parent.clientHeight : 460;
  canvas.width = w > 0 ? w : 800;
  canvas.height = h > 0 ? h : 460;
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
   TIER SELECTOR (1P VS 2P)
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
   ONLINE AUTO-QUEUE MATCHMAKING
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
  status.innerText = "SCANNING PLAYERS...";

  peer = new Peer();
  peer.on('open', () => tryConnectToQueue(1));
}

function tryConnectToQueue(slotIndex) {
  const status = document.getElementById("netStatusText");
  if (slotIndex > 4) {
    hostQueueMatch();
    return;
  }
  status.innerText = `CONNECTING TO LOBBY ${slotIndex}...`;
  const targetId = QUEUE_ROOM_BASE + slotIndex;
  let conn = peer.connect(targetId);
  let timeout = setTimeout(() => {
    conn.close();
    tryConnectToQueue(slotIndex + 1);
  }, 1800);

  conn.on('open', () => {
    clearTimeout(timeout);
    myPlayerIndex = 2;
    netConn = conn;
    status.innerText = "MATCH FOUND! PLAYING AS P2 (BLACK)";
    setupNetListeners();
  });
  conn.on('error', () => {
    clearTimeout(timeout);
    tryConnectToQueue(slotIndex + 1);
  });
}

function hostQueueMatch() {
  const status = document.getElementById("netStatusText");
  if (peer) peer.destroy();
  peer = new Peer(QUEUE_ROOM_BASE + "1");

  peer.on('open', () => {
    status.innerText = "HOSTING MATCH... WAITING FOR P2";
    myPlayerIndex = 1;
  });
  peer.on('connection', (conn) => {
    netConn = conn;
    status.innerText = "OPPONENT CONNECTED! YOU ARE P1 (WHITE)";
    setupNetListeners();
    sendNetData({ type: "SYNC_START" });
  });
  peer.on('error', () => {
    peer = new Peer(QUEUE_ROOM_BASE + "2");
    peer.on('open', () => { status.innerText = "WAITING IN LOBBY 2..."; myPlayerIndex = 1; });
    peer.on('connection', (conn) => { netConn = conn; status.innerText = "MATCH FOUND!"; setupNetListeners(); });
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
      executeStrictChessMove(data.from, data.to, false);
    } else if (data.type === "TTT_MOVE") {
      handleTTT2PMove(data.index, false);
    }
  });
}
function sendNetData(data) { if (netConn && netConn.open) netConn.send(data); }

/* ==========================================================
   1. SINGLE PLAYER: 3D SPACE STRIKER (3D TILT SHIP & ROTATING ASTEROIDS)
========================================================== */
let spaceActive = false, sShipX = 400, sBullets = [], sMeteors = [], sPowerBalls = [];
let sScore = 0, sAnimId = null, sLaserTier = 1, sSpeedBoost = 1, sLastShot = 0, sTimeTicks = 0;
let shipTiltAngle = 0;
const sCanvas = document.getElementById("spaceCanvas");

function startSpaceGame() {
  if (!sCanvas) return;
  setupCanvas(sCanvas);
  sShipX = sCanvas.width / 2;
  sBullets = []; sMeteors = []; sPowerBalls = [];
  sScore = 0; sLaserTier = 1; sSpeedBoost = 1; sTimeTicks = 0;
  spaceActive = true;

  document.getElementById("spaceScore").innerText = "0";
  document.getElementById("laserBuff").innerText = "SINGLE LASER";
  document.getElementById("speedBuff").innerText = "CRUISING";
  hideOverlay("spaceOverlay");
  cancelAnimationFrame(sAnimId);
  loopSpace();
}

sCanvas?.addEventListener("pointermove", (e) => {
  const rect = sCanvas.getBoundingClientRect();
  const targetX = Math.max(35, Math.min(sCanvas.width - 35, e.clientX - rect.left));
  shipTiltAngle = (targetX - sShipX) * 0.04;
  sShipX = targetX;
});
sCanvas?.addEventListener("pointerdown", () => { if (!spaceActive) startSpaceGame(); });

function draw3DStarfighter(ctx, x, y, tilt) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt);

  // 3D Isometric Wireframe Starfighter
  ctx.strokeStyle = "#00d4ff"; ctx.lineWidth = 2.2;
  ctx.fillStyle = "rgba(0, 212, 255, 0.15)";

  // Hull
  ctx.beginPath();
  ctx.moveTo(0, -32);          // Nose tip
  ctx.lineTo(12, -8);
  ctx.lineTo(34, 12);          // Right wing tip
  ctx.lineTo(12, 16);
  ctx.lineTo(8, 26);           // Right engine
  ctx.lineTo(-8, 26);          // Left engine
  ctx.lineTo(-12, 16);
  ctx.lineTo(-34, 12);         // Left wing tip
  ctx.lineTo(-12, -8);
  ctx.closePath();
  ctx.stroke(); ctx.fill();

  // Cockpit 3D Canopy
  ctx.strokeStyle = "#ffffff";
  ctx.strokeRect(-4, -14, 8, 16);

  // Twin Plasma Exhaust Flames
  ctx.fillStyle = "#ff003c"; ctx.shadowColor = "#ff003c"; ctx.shadowBlur = 10;
  ctx.fillRect(-7, 26, 4, 8 + Math.random()*6);
  ctx.fillRect(3, 26, 4, 8 + Math.random()*6);
  ctx.shadowBlur = 0;

  ctx.restore();
}

function draw3DAsteroid(ctx, x, y, r, rot) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.strokeStyle = "#ff003c"; ctx.lineWidth = 2;
  ctx.fillStyle = "rgba(255, 0, 60, 0.15)";
  ctx.beginPath();
  const pts = 7;
  for (let i = 0; i < pts; i++) {
    const a = (i / pts) * Math.PI * 2;
    const rad = r * (0.65 + (i % 2 === 0 ? 0.35 : 0.15));
    if (i === 0) ctx.moveTo(Math.cos(a) * rad, Math.sin(a) * rad);
    else ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
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

  // Smooth Difficulty Progression
  const diff = 1 + (sScore / 600) + (sTimeTicks / 8000);
  const meteorSpeed = 1.9 * diff * sSpeedBoost;

  const now = Date.now();
  if (now - sLastShot > (220 / sSpeedBoost)) {
    sLastShot = now;
    if (sLaserTier === 1) {
      sBullets.push({ x: sShipX, y: sCanvas.height - 40, vx: 0 });
    } else if (sLaserTier === 2) {
      sBullets.push({ x: sShipX - 12, y: sCanvas.height - 40, vx: 0 });
      sBullets.push({ x: sShipX + 12, y: sCanvas.height - 40, vx: 0 });
    } else {
      sBullets.push({ x: sShipX - 18, y: sCanvas.height - 40, vx: -0.8 });
      sBullets.push({ x: sShipX, y: sCanvas.height - 40, vx: 0 });
      sBullets.push({ x: sShipX + 18, y: sCanvas.height - 40, vx: 0.8 });
    }
  }

  // Draw 3D Jet
  draw3DStarfighter(ctx, sShipX, sCanvas.height - 35, shipTiltAngle);
  shipTiltAngle *= 0.85; // Reset tilt

  // Draw Lasers
  ctx.fillStyle = "#00d4ff"; ctx.shadowColor = "#00d4ff"; ctx.shadowBlur = 8;
  sBullets.forEach(b => {
    b.y -= 10; b.x += b.vx;
    ctx.fillRect(b.x - 2, b.y, 4, 16);
  });
  ctx.shadowBlur = 0;

  // Power Up Balls Spawning
  if (sTimeTicks % 750 === 0) {
    const type = Math.random() > 0.5 ? "LASER" : "SPEED";
    sPowerBalls.push({ x: Math.random()*(sCanvas.width-60)+30, y: -20, r: 16, type: type });
  }

  for (let i = sPowerBalls.length - 1; i >= 0; i--) {
    let p = sPowerBalls[i];
    p.y += 1.6;
    ctx.fillStyle = p.type === "LASER" ? "#ffbe0b" : "#00ff88";
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#000"; ctx.font = "bold 11px Rajdhani"; ctx.textAlign = "center";
    ctx.fillText(p.type === "LASER" ? "2X" : ">>>", p.x, p.y + 4);

    sBullets.forEach((b, bIdx) => {
      if (Math.hypot(b.x - p.x, b.y - p.y) < p.r + 5) {
        if (p.type === "LASER") {
          sLaserTier = Math.min(sLaserTier + 1, 3);
          document.getElementById("laserBuff").innerText = sLaserTier === 2 ? "DUAL LASER" : "TRIPLE SPREAD";
        } else {
          sSpeedBoost = 1.45; document.getElementById("speedBuff").innerText = "WARP SPEED";
          setTimeout(() => { sSpeedBoost = 1; document.getElementById("speedBuff").innerText = "CRUISING"; }, 12000);
        }
        sPowerBalls.splice(i, 1); sBullets.splice(bIdx, 1);
      }
    });
  }

  // Meteors
  if (Math.random() < 0.02 * diff) {
    sMeteors.push({ x: Math.random()*(sCanvas.width-40)+20, y: -20, r: Math.random()*10+16, rot: 0 });
  }

  for (let mIdx = sMeteors.length - 1; mIdx >= 0; mIdx--) {
    let m = sMeteors[mIdx];
    m.y += meteorSpeed; m.rot += 0.04;
    draw3DAsteroid(ctx, m.x, m.y, m.r, m.rot);

    sBullets.forEach((b, bIdx) => {
      if (Math.hypot(b.x - m.x, b.y - m.y) < m.r + 5) {
        sMeteors.splice(mIdx, 1); sBullets.splice(bIdx, 1);
        sScore += 10; document.getElementById("spaceScore").innerText = sScore;
      }
    });

    if (m.y > sCanvas.height + 25) {
      spaceActive = false;
      showOverlay("spaceOverlay", "DEFENSE FAILED", `Meteors Obliterated: <strong>${sScore}</strong>`, "Relaunch Jet", "startSpaceGame()");
      return;
    }
  }

  sBullets = sBullets.filter(b => b.y > -20);
  sPowerBalls = sPowerBalls.filter(p => p.y < sCanvas.height + 25);
  sAnimId = requestAnimationFrame(loopSpace);
}

/* ==========================================================
   2. SINGLE PLAYER: 3D FLAPPY PHOENIX (PERSPECTIVE 3D BUILD)
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

function draw3DIsometricBird(ctx, x, y, vy, cycle) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(Math.min(Math.max(vy * 0.05, -0.5), 0.6));
  ctx.strokeStyle = "#00d4ff"; ctx.lineWidth = 2; ctx.fillStyle = "rgba(0, 212, 255, 0.2)";

  // 3D Wireframe Body
  ctx.beginPath();
  ctx.moveTo(18, 0); ctx.lineTo(-10, -12); ctx.lineTo(-18, 0); ctx.lineTo(-10, 12); ctx.closePath();
  ctx.stroke(); ctx.fill();

  // 3D Flapping Wings
  const wingZ = Math.sin(cycle) * 16;
  ctx.strokeStyle = "#ffffff"; ctx.beginPath();
  ctx.moveTo(0, -6); ctx.lineTo(-8, -20 - wingZ); ctx.lineTo(10, -6); ctx.stroke(); // Left
  ctx.moveTo(0, 6); ctx.lineTo(-8, 20 + wingZ); ctx.lineTo(10, 6); ctx.stroke();   // Right

  // Beak
  ctx.fillStyle = "#ff003c"; ctx.fillRect(18, -3, 8, 6);
  ctx.restore();
}

function loopFlappy() {
  if (!flappyActive) return;
  const ctx = fCanvas.getContext("2d");
  ctx.clearRect(0, 0, fCanvas.width, fCanvas.height);

  fBirdV += 0.35; fBirdY += fBirdV; wingCycle += 0.24;
  draw3DIsometricBird(ctx, 80, fBirdY, fBirdV, wingCycle);

  if (fPipes.length === 0 || fPipes[fPipes.length - 1].x < fCanvas.width - 240) {
    const gap = 135;
    const topH = Math.random() * (fCanvas.height - gap - 100) + 40;
    fPipes.push({ x: fCanvas.width, top: topH, bottom: topH + gap, passed: false });
  }

  for (let i = 0; i < fPipes.length; i++) {
    let p = fPipes[i]; p.x -= 3.2;
    ctx.fillStyle = "#ff003c"; ctx.fillRect(p.x, 0, 48, p.top);
    ctx.fillStyle = "#00d4ff"; ctx.fillRect(p.x, p.bottom, 48, fCanvas.height - p.bottom);

    if (80 + 14 > p.x && 80 - 14 < p.x + 48) {
      if (fBirdY - 10 < p.top || fBirdY + 10 > p.bottom) {
        flappyActive = false; showOverlay("flappyOverlay", "FLIGHT OVER", `Score: <strong>${fScore}</strong>`, "Fly Again", "startFlappyGame()"); return;
      }
    }
    if (!p.passed && p.x < 80) { p.passed = true; fScore++; document.getElementById("flappyScore").innerText = fScore; }
  }

  if (fBirdY > fCanvas.height - 15 || fBirdY < 15) {
    flappyActive = false; showOverlay("flappyOverlay", "CRASHED", `Score: <strong>${fScore}</strong>`, "Fly Again", "startFlappyGame()"); return;
  }
  fPipes = fPipes.filter(p => p.x > -60);
  fAnimId = requestAnimationFrame(loopFlappy);
}

/* ==========================================================
   3. SINGLE PLAYER: 3D CYBER RAPTOR (PERSPECTIVE DINO)
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

function draw3DCyberRaptor(ctx, x, y, cycle, inAir) {
  ctx.save(); ctx.translate(x, y);
  ctx.strokeStyle = "#00d4ff"; ctx.lineWidth = 2.5; ctx.fillStyle = "rgba(0, 212, 255, 0.15)";

  // 3D Angular Raptor Hull
  ctx.beginPath();
  ctx.moveTo(12, -28); ctx.lineTo(28, -28); ctx.lineTo(26, -14); ctx.lineTo(12, -14); // Head & Jaw
  ctx.lineTo(8, -4); ctx.lineTo(-6, 2); ctx.lineTo(-24, 18); ctx.lineTo(-28, 14);     // Back & Tail
  ctx.lineTo(-8, -2); ctx.lineTo(-4, 16);
  ctx.closePath();
  ctx.stroke(); ctx.fill();

  ctx.fillStyle = "#ff003c"; ctx.fillRect(18, -24, 5, 3); // Red Laser Eye

  // Mechanical Limbs
  if (!inAir) {
    const l = Math.sin(cycle) * 10;
    ctx.beginPath(); ctx.moveTo(-6, 16); ctx.lineTo(-10, 26 + l); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, 14); ctx.lineTo(6, 26 - l); ctx.stroke();
  } else {
    ctx.beginPath(); ctx.moveTo(-6, 16); ctx.lineTo(-14, 22); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, 14); ctx.lineTo(8, 20); ctx.stroke();
  }
  ctx.restore();
}

function loopDino() {
  if (!dinoActive) return;
  const ctx = dCanvas.getContext("2d");
  ctx.clearRect(0, 0, dCanvas.width, dCanvas.height);
  dTicks++;

  const groundY = dCanvas.height - 40;
  const speed = 4.8 + Math.log10(1 + dTicks / 500) * 2.2;

  dY += dV;
  if (dY > 0) dV -= 0.52; else { dY = 0; dV = 0; }
  dLegCycle += 0.25;

  // Grid Floor
  ctx.strokeStyle = "rgba(0, 212, 255, 0.4)"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, groundY + 26); ctx.lineTo(dCanvas.width, groundY + 26); ctx.stroke();

  draw3DCyberRaptor(ctx, 70, groundY, dLegCycle, dY > 0);

  // Barriers
  if (dCacti.length === 0 || dCacti[dCacti.length - 1].x < dCanvas.width - (300 - speed*10)) {
    if (Math.random() < 0.02) dCacti.push({ x: dCanvas.width, w: 20, h: Math.random() * 20 + 26 });
  }

  for (let i = 0; i < dCacti.length; i++) {
    let c = dCacti[i]; c.x -= speed;
    ctx.fillStyle = "#ff003c"; ctx.shadowColor = "#ff003c"; ctx.shadowBlur = 8;
    ctx.fillRect(c.x, groundY + 26 - c.h, c.w, c.h);
    ctx.shadowBlur = 0;

    if (70 + 15 > c.x && 70 - 15 < c.x + c.w && dY < c.h) {
      dinoActive = false;
      showOverlay("dinoOverlay", "IMPACT BREACH", `Distance: <strong>${Math.floor(dScore/5)}m</strong>`, "Run Again", "startDinoGame()");
      return;
    }
  }

  dScore++; document.getElementById("dinoScore").innerText = `${Math.floor(dScore/5)}m`;
  dCacti = dCacti.filter(c => c.x > -40);
  dAnimId = requestAnimationFrame(loopDino);
}

/* ==========================================================
   2-PLAYER: STRICT CHESS ENGINE WITH FULL MOVE RULES
========================================================== */
const INITIAL_CHESS = [
  "r","n","b","q","k","b","n","r",
  "p","p","p","p","p","p","p","p",
  "","","","","","","","",
  "","","","","","","","",
  "","","","","","","","",
  "","","","","","","","",
  "P","P","P","P","P","P","P","P",
  "R","N","B","Q","K","B","N","R"
];
const CHESS_SYM = {
  "r":"♜","n":"♞","b":"♝","q":"♛","k":"♚","p":"♟",
  "R":"♖","N":"♘","B":"♗","Q":"♕","K":"♔","P":"♙"
};
let chessBoard = [];
let chessTurn = "W";
let selChess = null;
let validMovesForSelected = [];

function init2PDefaults() {
  resetChessBoard();
  resetSeaBattle();
  resetTTT2P();
}

function resetChessBoard() {
  chessBoard = [...INITIAL_CHESS];
  chessTurn = "W";
  selChess = null;
  validMovesForSelected = [];
  document.getElementById("chessTurn").innerText = "WHITE (PLAYER 1)";
  document.getElementById("chessStatus").innerText = "MATCH ACTIVE";
  renderChessBoard();
}

function isPathClear(from, to, board) {
  const r1 = Math.floor(from / 8), c1 = from % 8;
  const r2 = Math.floor(to / 8), c2 = to % 8;
  const dr = Math.sign(r2 - r1);
  const dc = Math.sign(c2 - c1);
  let currR = r1 + dr;
  let currC = c1 + dc;
  while (currR !== r2 || currC !== c2) {
    if (board[currR * 8 + currC] !== "") return false;
    currR += dr; currC += dc;
  }
  return true;
}

// STRICT CHESS MOVE VALIDATION (REAL RULES)
function isValidChessMove(from, to, board, turn) {
  const piece = board[from];
  const target = board[to];
  if (!piece) return false;

  const isW = piece === piece.toUpperCase();
  if ((turn === "W" && !isW) || (turn === "B" && isW)) return false;

  // Cannot capture own piece
  if (target !== "") {
    const tIsW = target === target.toUpperCase();
    if (isW === tIsW) return false;
  }

  const r1 = Math.floor(from / 8), c1 = from % 8;
  const r2 = Math.floor(to / 8), c2 = to % 8;
  const dr = r2 - r1, dc = c2 - c1;
  const absR = Math.abs(dr), absC = Math.abs(dc);
  const pType = piece.toLowerCase();

  // PAWN (PYADA) RULES: 1 or 2 steps forward, cross capture ONLY
  if (pType === 'p') {
    const dir = isW ? -1 : 1;
    const startRow = isW ? 6 : 1;
    // Straight march
    if (dc === 0 && target === "") {
      if (dr === dir) return true;
      if (r1 === startRow && dr === 2 * dir && board[from + dir * 8] === "") return true;
    }
    // Diagonal capture
    else if (absC === 1 && dr === dir && target !== "") {
      return true;
    }
    return false;
  }

  // KNIGHT (GHODA) RULES: L-Shape, jumps over pieces
  if (pType === 'n') {
    return (absR === 2 && absC === 1) || (absR === 1 && absC === 2);
  }

  // BISHOP (OONT) RULES: Diagonals with clear path
  if (pType === 'b') {
    return absR === absC && isPathClear(from, to, board);
  }

  // ROOK (HAATHI) RULES: Straight lines with clear path
  if (pType === 'r') {
    return (absR === 0 || absC === 0) && isPathClear(from, to, board);
  }

  // QUEEN (RANI) RULES: Straight or Diagonals with clear path
  if (pType === 'q') {
    return (absR === absC || absR === 0 || absC === 0) && isPathClear(from, to, board);
  }

  // KING (RAJA) RULES: 1 step any direction
  if (pType === 'k') {
    return absR <= 1 && absC <= 1;
  }

  return false;
}

function getLegalMovesFor(fromIdx) {
  let moves = [];
  for (let i = 0; i < 64; i++) {
    if (isValidChessMove(fromIdx, i, chessBoard, chessTurn)) {
      moves.push(i);
    }
  }
  return moves;
}

function renderChessBoard() {
  const g = document.getElementById("chessGrid"); if (!g) return;
  g.innerHTML = "";

  for (let i = 0; i < 64; i++) {
    const c = document.createElement("div");
    const isLight = (Math.floor(i / 8) + i % 8) % 2 === 0;
    c.className = `chess-cell ${isLight ? "light" : "dark"}`;

    if (selChess === i) c.classList.add("selected");
    // Show legal move dots
    if (validMovesForSelected.includes(i)) {
      const dot = document.createElement("span");
      dot.style.cssText = "width:10px;height:10px;border-radius:50%;background:#00ff88;box-shadow:0 0 8px #00ff88;";
      c.appendChild(dot);
    }

    if (chessBoard[i]) {
      c.innerText = CHESS_SYM[chessBoard[i]];
      c.classList.add(chessBoard[i] === chessBoard[i].toUpperCase() ? "white-piece" : "black-piece");
    }

    c.onclick = () => onChessClick(i);
    g.appendChild(c);
  }
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
    if (isOwn) {
      selChess = idx;
      validMovesForSelected = getLegalMovesFor(idx);
      renderChessBoard();
    }
  } else {
    if (selChess === idx) {
      selChess = null;
      validMovesForSelected = [];
      renderChessBoard();
    } else if (isOwn) {
      // Switch selection to another of own pieces
      selChess = idx;
      validMovesForSelected = getLegalMovesFor(idx);
      renderChessBoard();
    } else if (validMovesForSelected.includes(idx)) {
      executeStrictChessMove(selChess, idx, true);
    }
  }
}

function executeStrictChessMove(from, to, broadcast) {
  const capturedPiece = chessBoard[to];
  chessBoard[to] = chessBoard[from];
  chessBoard[from] = "";
  selChess = null;
  validMovesForSelected = [];

  // WINNER DETERMINATION: King Capture
  if (capturedPiece === "k" || capturedPiece === "K") {
    const winner = capturedPiece === "k" ? "WHITE (PLAYER 1)" : "BLACK (PLAYER 2)";
    alert(`CHECKMATE // VICTORY! ${winner} has captured the King and won the game!`);
    resetChessBoard();
    return;
  }

  chessTurn = chessTurn === "W" ? "B" : "W";
  document.getElementById("chessTurn").innerText = chessTurn === "W" ? "WHITE (PLAYER 1)" : "BLACK (PLAYER 2)";

  if (broadcast && multiplayerMode === "online") {
    sendNetData({ type: "CHESS_MOVE", from, to });
  }
  renderChessBoard();
}

/* ==========================================================
   2-PLAYER: SEA BATTLE (5 SHIPS EACH)
========================================================== */
let sbPhase = "DEPLOY", sbCurrentDeployPlayer = 1, sbShips = { 1: [], 2: [] }, sbShots = { 1: [], 2: [] }, sbTurn = 1;

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
    if (sbShips[1].includes(i)) c1.classList.add("ship");
    if (sbShots[2].includes(i)) c1.classList.add(sbShips[1].includes(i) ? "hit" : "miss");
    c1.onclick = () => onSBCellClick(1, i); g1.appendChild(c1);

    const c2 = document.createElement("div"); c2.className = "sb-cell";
    if (sbPhase === "DEPLOY" && sbCurrentDeployPlayer === 2 && sbShips[2].includes(i)) c2.classList.add("ship");
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
  if (hits === 5) { alert(`VICTORY! Player ${atk} sunk all 5 enemy ships!`); resetSeaBattle(); return; }
  sbTurn = atk === 1 ? 2 : 1;
  document.getElementById("sbTurn").innerText = `PLAYER ${sbTurn}`;
  renderSeaBattleBoards();
}

/* ==========================================================
   2-PLAYER: TIC TAC TOE
========================================================== */
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
  if (w) { alert(`VICTORY! PLAYER ${tttTurn} WON!`); resetTTT2P(); return; }
  
  tttTurn = tttTurn === "X" ? "O" : "X";
  document.getElementById("tttTurn").innerText = `PLAYER ${tttTurn === "X" ? "1 (X)" : "2 (O)"}`;
  renderTTT2P();
}
