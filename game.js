/* ==========================================================
   GLOBAL SESSION & AUTH SYSTEM (UNIQUE NAME & PASSWORD)
========================================================== */
let currentAgent = localStorage.getItem("spark_agent_name") || "";

function checkAuthStatus() {
  const modal = document.getElementById("authModal");
  if (!currentAgent) {
    modal.style.display = "flex";
  } else {
    modal.style.display = "none";
    const tag = document.getElementById("headerAgentTag");
    if (tag) tag.innerText = currentAgent.toUpperCase();
  }
}

function registerAndEnterArcade() {
  const name = document.getElementById("regAgentName").value.trim();
  const pass = document.getElementById("regAgentPass").value.trim();
  const err = document.getElementById("authErrorMsg");

  if (!name || !pass) {
    err.innerText = "Please enter both name & passcode!";
    return;
  }

  // Prevent duplicate names in registry
  let registry = JSON.parse(localStorage.getItem("spark_registered_users") || "{}");
  if (registry[name] && registry[name] !== pass) {
    err.innerText = "Agent name already claimed with different password!";
    return;
  }

  registry[name] = pass;
  localStorage.setItem("spark_registered_users", JSON.stringify(registry));
  localStorage.setItem("spark_agent_name", name);
  currentAgent = name;

  document.getElementById("authModal").style.display = "none";
  document.getElementById("headerAgentTag").innerText = name.toUpperCase();
}

window.addEventListener("DOMContentLoaded", checkAuthStatus);

/* ==========================================================
   ROBUST CANVAS SETUP & OVERLAY HELPERS
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
   TIER 1P VS 2P SELECTOR & TABS
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
const QUEUE_ROOM_BASE = "spark_auto_queue_v2_";

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
  status.innerText = "SEARCHING OPPONENT...";

  peer = new Peer();
  peer.on('open', () => tryConnectToQueue(1));
}

function tryConnectToQueue(slotIndex) {
  const status = document.getElementById("netStatusText");
  if (slotIndex > 3) {
    hostQueueMatch();
    return;
  }
  status.innerText = `JOINING LOBBY ${slotIndex}...`;
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
    status.innerText = "CONNECTED! YOU ARE P2";
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
    status.innerText = "WAITING FOR CHALLENGER...";
    myPlayerIndex = 1;
  });
  peer.on('connection', (conn) => {
    netConn = conn;
    status.innerText = "OPPONENT JOINED! YOU ARE P1";
    setupNetListeners();
    sendNetData({ type: "SYNC_START", agent: currentAgent });
  });
  peer.on('error', () => {
    peer = new Peer(QUEUE_ROOM_BASE + "2");
    peer.on('open', () => { status.innerText = "WAITING IN LOBBY 2..."; myPlayerIndex = 1; });
    peer.on('connection', (conn) => { netConn = conn; status.innerText = "OPPONENT JOINED!"; setupNetListeners(); });
  });
}

function setupNetListeners() {
  if (!netConn) return;
  netConn.on("data", (data) => {
    if (data.type === "SEABATTLE_DEPLOY_COMPLETE") {
      sbFleetData[data.player] = data.fleet;
      if (sbFleetData[1] && sbFleetData[2]) {
        startSeaBattleCombat();
      }
    } else if (data.type === "SEABATTLE_ATTACK") {
      receiveSeaBattleShot(data.index);
    } else if (data.type === "CHESS_MOVE") {
      executeStrictChessMove(data.from, data.to, false);
    } else if (data.type === "TTT_MOVE") {
      handleTTT2PMove(data.index, false);
    }
  });
}
function sendNetData(data) { if (netConn && netConn.open) netConn.send(data); }

/* ==========================================================
   1. SINGLE PLAYER: SPACE STRIKER (SMOOTH DRAG + POWER-UPS)
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
  document.getElementById("speedBuff").innerText = "CRUISING";
  hideOverlay("spaceOverlay");
  cancelAnimationFrame(sAnimId);
  loopSpace();
}

function handleShipPointer(clientX) {
  const rect = sCanvas.getBoundingClientRect();
  sShipX = Math.max(30, Math.min(sCanvas.width - 30, clientX - rect.left));
}

// Fixed drag listener for both desktop and touch screens
sCanvas?.addEventListener("pointerdown", (e) => {
  if (!spaceActive) startSpaceGame();
  else handleShipPointer(e.clientX);
});
sCanvas?.addEventListener("pointermove", (e) => {
  if (spaceActive) handleShipPointer(e.clientX);
});
sCanvas?.addEventListener("touchmove", (e) => {
  e.preventDefault();
  if (spaceActive && e.touches[0]) handleShipPointer(e.touches[0].clientX);
}, { passive: false });

function drawBlueprintFighter(ctx, x, y) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = "#00d4ff"; ctx.lineWidth = 2.2;
  ctx.fillStyle = "rgba(0, 212, 255, 0.15)";

  ctx.beginPath();
  ctx.moveTo(0, -30);
  ctx.lineTo(10, -8);
  ctx.lineTo(30, 10);
  ctx.lineTo(10, 15);
  ctx.lineTo(6, 24);
  ctx.lineTo(-6, 24);
  ctx.lineTo(-10, 15);
  ctx.lineTo(-30, 10);
  ctx.lineTo(-10, -8);
  ctx.closePath();
  ctx.stroke(); ctx.fill();

  ctx.fillStyle = "#ff003c";
  ctx.fillRect(-5, 24, 10, 8 + Math.random()*5);
  ctx.restore();
}

function loopSpace() {
  if (!spaceActive) return;
  const ctx = sCanvas.getContext("2d");
  ctx.clearRect(0, 0, sCanvas.width, sCanvas.height);
  sTimeTicks++;

  const diff = 1 + (sScore / 600) + (sTimeTicks / 7500);
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
      sBullets.push({ x: sShipX - 16, y: sCanvas.height - 40, vx: -0.8 });
      sBullets.push({ x: sShipX, y: sCanvas.height - 40, vx: 0 });
      sBullets.push({ x: sShipX + 16, y: sCanvas.height - 40, vx: 0.8 });
    }
  }

  drawBlueprintFighter(ctx, sShipX, sCanvas.height - 35);

  ctx.fillStyle = "#00d4ff";
  sBullets.forEach(b => {
    b.y -= 10; b.x += b.vx;
    ctx.fillRect(b.x - 2, b.y, 4, 16);
  });

  // Power Up Spawn
  if (sTimeTicks % 700 === 0) {
    const type = Math.random() > 0.5 ? "LASER" : "SPEED";
    sPowerBalls.push({ x: Math.random()*(sCanvas.width-60)+30, y: -20, r: 16, type: type });
  }

  for (let i = sPowerBalls.length - 1; i >= 0; i--) {
    let p = sPowerBalls[i];
    p.y += 1.6;
    ctx.fillStyle = p.type === "LASER" ? "#ffbe0b" : "#00ff88";
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#000"; ctx.font = "bold 11px Rajdhani"; ctx.textAlign = "center";
    ctx.fillText(p.type === "LASER" ? "2X" : "⚡", p.x, p.y + 4);

    sBullets.forEach((b, bIdx) => {
      if (Math.hypot(b.x - p.x, b.y - p.y) < p.r + 5) {
        if (p.type === "LASER") {
          sLaserTier = Math.min(sLaserTier + 1, 3);
          document.getElementById("laserBuff").innerText = sLaserTier === 2 ? "DUAL LASER" : "QUAD SPREAD";
        } else {
          sSpeedBoost = 1.4; document.getElementById("speedBuff").innerText = "WARP SPEED";
          setTimeout(() => { sSpeedBoost = 1; document.getElementById("speedBuff").innerText = "CRUISING"; }, 12000);
        }
        sPowerBalls.splice(i, 1); sBullets.splice(bIdx, 1);
      }
    });
  }

  // Meteors
  if (Math.random() < 0.02 * diff) {
    sMeteors.push({ x: Math.random()*(sCanvas.width-40)+20, y: -20, r: Math.random()*8+15 });
  }

  for (let mIdx = sMeteors.length - 1; mIdx >= 0; mIdx--) {
    let m = sMeteors[mIdx];
    m.y += meteorSpeed;

    ctx.strokeStyle = "#ff003c"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(m.x, m.y, m.r, 0, Math.PI*2); ctx.stroke();

    sBullets.forEach((b, bIdx) => {
      if (Math.hypot(b.x - m.x, b.y - m.y) < m.r + 5) {
        sMeteors.splice(mIdx, 1); sBullets.splice(bIdx, 1);
        sScore += 10; document.getElementById("spaceScore").innerText = sScore;
      }
    });

    if (m.y > sCanvas.height + 20) {
      spaceActive = false;
      showOverlay("spaceOverlay", "SHIELD CRITICAL", `Score: <strong>${sScore}</strong>`, "Relaunch", "startSpaceGame()");
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
  ctx.strokeStyle = "#00d4ff"; ctx.lineWidth = 2.2;
  ctx.strokeRect(-12, -8, 24, 16);
  ctx.fillStyle = "#ff003c"; ctx.fillRect(12, -2, 8, 4);
  ctx.fillStyle = "#fff"; ctx.fillRect(-4, Math.sin(cycle)*12, 10, 14);
  ctx.restore();
}

function loopFlappy() {
  if (!flappyActive) return;
  const ctx = fCanvas.getContext("2d");
  ctx.clearRect(0, 0, fCanvas.width, fCanvas.height);

  fBirdV += 0.35; fBirdY += fBirdV; wingCycle += 0.24;
  drawCyberBird(ctx, 80, fBirdY, fBirdV, wingCycle);

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
        flappyActive = false; showOverlay("flappyOverlay", "GATEWAY LOST", `Score: <strong>${fScore}</strong>`, "Fly Again", "startFlappyGame()"); return;
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
   3. SINGLE PLAYER: CHROME DINO (EXACT PIXEL ART ENGINE)
========================================================== */
let dinoActive = false, dY = 0, dV = 0, dScore = 0, dCacti = [], dAnimId = null;
let dLegCycle = 0;
const dCanvas = document.getElementById("dinoCanvas");

function startDinoGame() {
  if (!dCanvas) return;
  setupCanvas(dCanvas);
  dY = 0; dV = 0; dScore = 0; dCacti = []; dinoActive = true;
  document.getElementById("dinoScore").innerText = "00000";
  hideOverlay("dinoOverlay");
  cancelAnimationFrame(dAnimId);
  loopDino();
}

function jumpDinoAction() { if (dinoActive && dY === 0) dV = 12; else if (!dinoActive) startDinoGame(); }
dCanvas?.addEventListener("pointerdown", jumpDinoAction);
window.addEventListener("keydown", (e) => { if (e.code === "Space" && document.getElementById("dinoView")?.classList.contains("active")) jumpDinoAction(); });

// Exact Chrome pixel-art T-Rex drawing
function drawChromePixelDino(ctx, x, y, cycle, inAir) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "#535353";

  // Head
  ctx.fillRect(8, -36, 16, 14);
  ctx.fillRect(20, -32, 6, 8);
  ctx.clearRect(12, -34, 3, 3); // Eye

  // Body
  ctx.fillRect(0, -22, 14, 18);
  ctx.fillRect(-6, -18, 6, 8); // Tail

  // Running Legs
  if (!inAir) {
    const l = Math.floor(Math.sin(cycle) * 2);
    ctx.fillRect(2, -4, 3, 8 + l);
    ctx.fillRect(8, -4, 3, 8 - l);
  } else {
    ctx.fillRect(2, -4, 3, 5);
    ctx.fillRect(8, -4, 3, 5);
  }
  ctx.restore();
}

function drawChromeCactus(ctx, x, y, w, h) {
  ctx.fillStyle = "#535353";
  ctx.fillRect(x + 4, y - h, w - 8, h);
  ctx.fillRect(x, y - h + 8, 4, 10);
  ctx.fillRect(x + w - 4, y - h + 6, 4, 10);
}

function loopDino() {
  if (!dinoActive) return;
  const ctx = dCanvas.getContext("2d");
  ctx.clearRect(0, 0, dCanvas.width, dCanvas.height);

  const groundY = dCanvas.height - 35;
  const speed = 5.2 + Math.min(dScore * 0.003, 5.0);

  dY += dV;
  if (dY > 0) dV -= 0.58; else { dY = 0; dV = 0; }
  dLegCycle += 0.28;

  // Pixel ground line
  ctx.fillStyle = "#535353";
  ctx.fillRect(0, groundY + 4, dCanvas.width, 2);

  drawChromePixelDino(ctx, 70, groundY, dLegCycle, dY > 0);

  if (dCacti.length === 0 || dCacti[dCacti.length - 1].x < dCanvas.width - 260) {
    if (Math.random() < 0.03) dCacti.push({ x: dCanvas.width, w: 20, h: Math.random() * 15 + 26 });
  }

  for (let i = 0; i < dCacti.length; i++) {
    let c = dCacti[i]; c.x -= speed;
    drawChromeCactus(ctx, c.x, groundY + 4, c.w, c.h);

    if (70 + 12 > c.x && 70 - 4 < c.x + c.w && dY < c.h) {
      dinoActive = false;
      showOverlay("dinoOverlay", "GAME OVER", `Score: <strong>${Math.floor(dScore)}</strong>`, "Run Again", "startDinoGame()");
      return;
    }
  }

  dScore += 0.5;
  document.getElementById("dinoScore").innerText = String(Math.floor(dScore)).padStart(5, '0');
  dCacti = dCacti.filter(c => c.x > -40);
  dAnimId = requestAnimationFrame(loopDino);
}

/* ==========================================================
   2-PLAYER GAME 1: SEA BATTLE (EXACT TO SCREENSHOTS)
========================================================== */
const SHIPS_CONFIG = [
  { id: "carrier", size: 5, name: "Aircraft Carrier", color: "#00d4ff" },
  { id: "battleship", size: 4, name: "Battleship", color: "#00d4ff" },
  { id: "cruiser", size: 3, name: "Cruiser", color: "#00d4ff" },
  { id: "submarine", size: 3, name: "Submarine", color: "#00d4ff" },
  { id: "patrol", size: 2, name: "Patrol Boat", color: "#00d4ff" }
];

let sbDeployingPlayer = 1;
let sbFleetData = { 1: [], 2: [] };
let sbPlayerHits = { 1: [], 2: [] };
let sbActiveTurn = 1;
let selectedDockShip = null;
let currentDeployPlacements = [];

function init2PDefaults() {
  resetSeaBattle();
  resetChessBoard();
  resetTTT2P();
}

function resetSeaBattle() {
  sbDeployingPlayer = 1;
  sbFleetData = { 1: [], 2: [] };
  sbPlayerHits = { 1: [], 2: [] };
  sbActiveTurn = 1;
  selectedDockShip = null;
  currentDeployPlacements = [];

  document.getElementById("sbPassScreen").style.display = "flex";
  document.getElementById("sbDeployStage").style.display = "none";
  document.getElementById("sbBattleStage").style.display = "none";
  document.getElementById("sbPassTitle").innerText = "Hide the screen from your friend and place your ships (Player 1)";
}

function dismissPassScreen() {
  document.getElementById("sbPassScreen").style.display = "none";
  document.getElementById("sbDeployStage").style.display = "flex";
  initDeployStage(sbDeployingPlayer);
}

function initDeployStage(player) {
  document.getElementById("sbDeployHeadline").innerText = `Deploy your ships (Player ${player})`;
  currentDeployPlacements = [];
  selectedDockShip = null;

  // Render Dock
  const dock = document.getElementById("sbShipDock");
  dock.innerHTML = "";
  SHIPS_CONFIG.forEach(ship => {
    const sEl = document.createElement("div");
    sEl.className = "sb-dock-ship";
    sEl.innerText = `${ship.name} (${ship.size})`;
    sEl.onclick = () => {
      document.querySelectorAll(".sb-dock-ship").forEach(d => d.classList.remove("active"));
      sEl.classList.add("active");
      selectedDockShip = ship;
    };
    dock.appendChild(sEl);
  });

  renderDeployGrid();
}

function renderDeployGrid() {
  const grid = document.getElementById("sbDeployGrid");
  grid.innerHTML = "";
  for (let i = 0; i < 64; i++) {
    const c = document.createElement("div");
    c.className = "sb-cell-pro";
    if (currentDeployPlacements.includes(i)) c.classList.add("occupied");
    c.onclick = () => onDeployCellClick(i);
    grid.appendChild(c);
  }
}

function onDeployCellClick(idx) {
  if (!selectedDockShip) {
    alert("Select a ship from the dock first!");
    return;
  }
  const size = selectedDockShip.size;
  const row = Math.floor(idx / 8);
  const col = idx % 8;

  if (col + size > 8) {
    alert("Ship doesn't fit horizontally here!");
    return;
  }

  let cellsToOccupy = [];
  for (let s = 0; s < size; s++) {
    const targetCell = idx + s;
    if (currentDeployPlacements.includes(targetCell)) {
      alert("Overlaps another ship!");
      return;
    }
    cellsToOccupy.push(targetCell);
  }

  currentDeployPlacements.push(...cellsToOccupy);
  selectedDockShip = null;
  document.querySelectorAll(".sb-dock-ship.active").forEach(el => el.classList.add("placed"));
  renderDeployGrid();
}

function randomDeployShips() {
  currentDeployPlacements = [];
  SHIPS_CONFIG.forEach(ship => {
    let placed = false;
    while (!placed) {
      const idx = Math.floor(Math.random() * 56);
      const col = idx % 8;
      if (col + ship.size <= 8) {
        let fits = true;
        for (let s = 0; s < ship.size; s++) {
          if (currentDeployPlacements.includes(idx + s)) fits = false;
        }
        if (fits) {
          for (let s = 0; s < ship.size; s++) currentDeployPlacements.push(idx + s);
          placed = true;
        }
      }
    }
  });
  renderDeployGrid();
}

function savePlayerDeployment() {
  if (currentDeployPlacements.length < 17) {
    alert("Deploy all 5 ships first!");
    return;
  }

  sbFleetData[sbDeployingPlayer] = [...currentDeployPlacements];

  if (multiplayerMode === "online") {
    sendNetData({ type: "SEABATTLE_DEPLOY_COMPLETE", player: sbDeployingPlayer, fleet: currentDeployPlacements });
    document.getElementById("sbDeployStage").style.display = "none";
    document.getElementById("sbPassScreen").style.display = "flex";
    document.getElementById("sbPassTitle").innerText = "Waiting for opponent to finish deployment...";
    return;
  }

  if (sbDeployingPlayer === 1) {
    sbDeployingPlayer = 2;
    document.getElementById("sbDeployStage").style.display = "none";
    document.getElementById("sbPassScreen").style.display = "flex";
    document.getElementById("sbPassTitle").innerText = "Hide screen! Player 2 deployment turn.";
  } else {
    startSeaBattleCombat();
  }
}

function startSeaBattleCombat() {
  document.getElementById("sbPassScreen").style.display = "none";
  document.getElementById("sbDeployStage").style.display = "none";
  document.getElementById("sbBattleStage").style.display = "flex";
  sbActiveTurn = 1;
  renderRadarGrid();
}

function renderRadarGrid() {
  const grid = document.getElementById("sbRadarGrid");
  grid.innerHTML = "";
  const targetPlayer = sbActiveTurn === 1 ? 2 : 1;
  const targetFleet = sbFleetData[targetPlayer] || [];
  const myShots = sbPlayerHits[sbActiveTurn] || [];

  document.getElementById("sbTurnTag").innerText = `PLAYER ${sbActiveTurn}'S TURN!`;

  for (let i = 0; i < 64; i++) {
    const c = document.createElement("div");
    c.className = "sb-cell-pro";
    if (myShots.includes(i)) {
      if (targetFleet.includes(i)) c.classList.add("hit");
      else c.classList.add("miss");
    }
    c.onclick = () => fireRadarCannon(i);
    grid.appendChild(c);
  }
}

function fireRadarCannon(idx) {
  if (multiplayerMode === "online" && sbActiveTurn !== myPlayerIndex) return;

  const currentShots = sbPlayerHits[sbActiveTurn];
  if (currentShots.includes(idx)) return;

  currentShots.push(idx);

  if (multiplayerMode === "online") {
    sendNetData({ type: "SEABATTLE_ATTACK", index: idx });
  }

  const targetPlayer = sbActiveTurn === 1 ? 2 : 1;
  const targetFleet = sbFleetData[targetPlayer] || [];

  // Victory Condition: 17 total hit tiles across all 5 ships
  const totalHits = currentShots.filter(cell => targetFleet.includes(cell)).length;
  document.getElementById("sbSinkCounter").innerText = `HITS: ${totalHits} / 17`;

  if (totalHits >= 17) {
    alert(`VICTORY! Player ${sbActiveTurn} annihilated the enemy fleet!`);
    resetSeaBattle();
    return;
  }

  // Switch turn
  sbActiveTurn = sbActiveTurn === 1 ? 2 : 1;
  renderRadarGrid();
}

function receiveSeaBattleShot(idx) {
  const currentShots = sbPlayerHits[sbActiveTurn];
  currentShots.push(idx);
  sbActiveTurn = sbActiveTurn === 1 ? 2 : 1;
  renderRadarGrid();
}

/* ==========================================================
   2-PLAYER GAME 2: STRICT CHESS ENGINE (GHOST MOVES & RULES)
========================================================== */
const INITIAL_CHESS_ARRAY = [
  "r","n","b","q","k","b","n","r",
  "p","p","p","p","p","p","p","p",
  "","","","","","","","",
  "","","","","","","","",
  "","","","","","","","",
  "","","","","","","","",
  "P","P","P","P","P","P","P","P",
  "R","N","B","Q","K","B","N","R"
];
const CHESS_UNICODES = {
  "r":"♜","n":"♞","b":"♝","q":"♛","k":"♚","p":"♟",
  "R":"♖","N":"♘","B":"♗","Q":"♕","K":"♔","P":"♙"
};

let cBoard = [];
let cTurn = "W";
let cSelected = null;
let cLegalMoves = [];
let pendingPromotion = null;

function resetChessBoard() {
  cBoard = [...INITIAL_CHESS_ARRAY];
  cTurn = "W";
  cSelected = null;
  cLegalMoves = [];
  pendingPromotion = null;
  document.getElementById("chessTurn").innerText = "WHITE (PLAYER 1)";
  document.getElementById("chessStatus").innerText = "MATCH ACTIVE";
  document.getElementById("pawnPromoModal").style.display = "none";
  renderStrictChess();
}

function isRayClear(from, to) {
  const r1 = Math.floor(from/8), c1 = from%8, r2 = Math.floor(to/8), c2 = to%8;
  const dr = Math.sign(r2 - r1), dc = Math.sign(c2 - c1);
  let r = r1 + dr, c = c1 + dc;
  while (r !== r2 || c !== c2) {
    if (cBoard[r*8 + c] !== "") return false;
    r += dr; c += dc;
  }
  return true;
}

function computeStrictMoves(from) {
  const moves = [];
  const piece = cBoard[from];
  if (!piece) return moves;

  const isWhite = piece === piece.toUpperCase();
  const r1 = Math.floor(from/8), c1 = from%8;
  const type = piece.toLowerCase();

  for (let to = 0; to < 64; to++) {
    if (to === from) continue;
    const target = cBoard[to];
    if (target !== "") {
      const targetIsWhite = target === target.toUpperCase();
      if (isWhite === targetIsWhite) continue; // Own piece block
    }

    const r2 = Math.floor(to/8), c2 = to%8;
    const dr = r2 - r1, dc = c2 - c1;
    const absR = Math.abs(dr), absC = Math.abs(dc);

    // PAWN (1 or 2 steps forward, cross capture)
    if (type === 'p') {
      const dir = isWhite ? -1 : 1;
      const startRow = isWhite ? 6 : 1;
      if (dc === 0 && target === "") {
        if (dr === dir) moves.push(to);
        if (r1 === startRow && dr === 2*dir && cBoard[from + dir*8] === "") moves.push(to);
      } else if (absC === 1 && dr === dir && target !== "") {
        moves.push(to);
      }
    }
    // KNIGHT (L-Shape)
    else if (type === 'n') {
      if ((absR === 2 && absC === 1) || (absR === 1 && absC === 2)) moves.push(to);
    }
    // BISHOP
    else if (type === 'b') {
      if (absR === absC && isRayClear(from, to)) moves.push(to);
    }
    // ROOK
    else if (type === 'r') {
      if ((absR === 0 || absC === 0) && isRayClear(from, to)) moves.push(to);
    }
    // QUEEN
    else if (type === 'q') {
      if ((absR === absC || absR === 0 || absC === 0) && isRayClear(from, to)) moves.push(to);
    }
    // KING
    else if (type === 'k') {
      if (absR <= 1 && absC <= 1) moves.push(to);
    }
  }
  return moves;
}

function renderStrictChess() {
  const g = document.getElementById("chessGrid");
  if (!g) return;
  g.innerHTML = "";

  for (let i = 0; i < 64; i++) {
    const c = document.createElement("div");
    const isLight = (Math.floor(i/8) + i%8) % 2 === 0;
    c.className = `chess-cell ${isLight ? "light" : "dark"}`;

    if (cSelected === i) c.classList.add("selected");

    // Ghost Move Print (Halka sa print dot)
    if (cLegalMoves.includes(i)) {
      const dot = document.createElement("span");
      dot.className = "ghost-move-dot";
      c.appendChild(dot);
    }

    if (cBoard[i]) {
      const p = document.createElement("span");
      p.innerText = CHESS_UNICODES[cBoard[i]];
      p.className = cBoard[i] === cBoard[i].toUpperCase() ? "white-piece" : "black-piece";
      c.appendChild(p);
    }

    c.onclick = () => onChessClick(i);
    g.appendChild(c);
  }
}

function onChessClick(idx) {
  if (multiplayerMode === "online") {
    if (cTurn === "W" && myPlayerIndex !== 1) return;
    if (cTurn === "B" && myPlayerIndex !== 2) return;
  }

  const piece = cBoard[idx];
  const isWhite = piece && piece === piece.toUpperCase();
  const isOwn = piece && ((cTurn === "W" && isWhite) || (cTurn === "B" && !isWhite));

  if (cSelected === null) {
    if (isOwn) {
      cSelected = idx;
      cLegalMoves = computeStrictMoves(idx);
      renderStrictChess();
    }
  } else {
    if (cSelected === idx) {
      cSelected = null; cLegalMoves = [];
      renderStrictChess();
    } else if (isOwn) {
      cSelected = idx;
      cLegalMoves = computeStrictMoves(idx);
      renderStrictChess();
    } else if (cLegalMoves.includes(idx)) {
      // Pawn Promotion Check (When Pawn reaches the last line)
      const pieceType = cBoard[cSelected].toLowerCase();
      const endRow = cTurn === "W" ? 0 : 7;
      if (pieceType === 'p' && Math.floor(idx/8) === endRow) {
        pendingPromotion = { from: cSelected, to: idx };
        document.getElementById("pawnPromoModal").style.display = "flex";
        return;
      }
      executeStrictChessMove(cSelected, idx, true);
    }
  }
}

function promotePawnTo(choice) {
  if (!pendingPromotion) return;
  const newPiece = cTurn === "W" ? choice.toUpperCase() : choice.toLowerCase();
  cBoard[pendingPromotion.from] = newPiece;
  document.getElementById("pawnPromoModal").style.display = "none";
  executeStrictChessMove(pendingPromotion.from, pendingPromotion.to, true);
  pendingPromotion = null;
}

function executeStrictChessMove(from, to, shouldBroadcast) {
  const captured = cBoard[to];
  cBoard[to] = cBoard[from];
  cBoard[from] = "";
  cSelected = null;
  cLegalMoves = [];

  // King or Queen captured ends match
  if (captured.toLowerCase() === "k" || captured.toLowerCase() === "q") {
    const winner = cTurn === "W" ? "PLAYER 1 (WHITE)" : "PLAYER 2 (BLACK)";
    alert(`CHECKMATE! ${winner} captured the Royal and won the match!`);
    resetChessBoard();
    return;
  }

  cTurn = cTurn === "W" ? "B" : "W";
  document.getElementById("chessTurn").innerText = cTurn === "W" ? "WHITE" : "BLACK";

  if (shouldBroadcast && multiplayerMode === "online") {
    sendNetData({ type: "CHESS_MOVE", from, to });
  }
  renderStrictChess();
}

/* ==========================================================
   2-PLAYER GAME 3: TIC TAC TOE (SLASH STRIKE LINE)
========================================================== */
let ttt2PBoard = ["","","","","","","","",""];
let ttt2PTurn = "O";

function resetTTT2P() {
  ttt2PBoard = ["","","","","","","","",""];
  ttt2PTurn = "O";
  document.getElementById("tttTurn").innerText = "PLAYER 1 (O)";
  document.getElementById("tttSlashLine").style.display = "none";
  renderTTT2P();
}

function renderTTT2P() {
  const g = document.getElementById("tttGrid2P");
  if (!g) return;
  g.innerHTML = "";

  ttt2PBoard.forEach((val, idx) => {
    const cell = document.createElement("div");
    cell.className = "ttt-cell-2p";
    cell.innerText = val;
    if (val === "O") cell.classList.add("o");
    if (val === "X") cell.classList.add("x");
    cell.onclick = () => onTTT2PClick(idx);
    g.appendChild(cell);
  });
}

function onTTT2PClick(idx) {
  if (multiplayerMode === "online") {
    if (ttt2PTurn === "O" && myPlayerIndex !== 1) return;
    if (ttt2PTurn === "X" && myPlayerIndex !== 2) return;
  }
  if (ttt2PBoard[idx] === "") {
    handleTTT2PMove(idx, true);
  }
}

function handleTTT2PMove(idx, shouldBroadcast) {
  ttt2PBoard[idx] = ttt2PTurn;
  if (shouldBroadcast && multiplayerMode === "online") {
    sendNetData({ type: "TTT_MOVE", index: idx });
  }

  const winPatterns = [
    [0,1,2, "h0"], [3,4,5, "h1"], [6,7,8, "h2"],
    [0,3,6, "v0"], [1,4,7, "v1"], [2,5,8, "v2"],
    [0,4,8, "d0"], [2,4,6, "d1"]
  ];

  const win = winPatterns.find(([a,b,c]) => ttt2PBoard[a] && ttt2PBoard[a] === ttt2PBoard[b] && ttt2PBoard[a] === ttt2PBoard[c]);

  if (win) {
    // Show strike slash line
    const slash = document.getElementById("tttSlashLine");
    slash.style.display = "block";
    slash.className = `ttt-slash-line strike-${win[3]}`;
    renderTTT2P();
    setTimeout(() => {
      alert(`PLAYER (${ttt2PTurn}) WON!`);
      resetTTT2P();
    }, 600);
    return;
  }

  ttt2PTurn = ttt2PTurn === "O" ? "X" : "O";
  document.getElementById("tttTurn").innerText = `PLAYER (${ttt2PTurn})`;
  renderTTT2P();
}
