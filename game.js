/* ==========================================================
   SPARK ARCADE CORE ENGINE (SINGLE + 2-PLAYER P2P RTC)
========================================================== */

// Helper to reliably size canvas
function setupCanvas(canvas) {
  if (!canvas) return;
  const parent = canvas.parentElement;
  if (parent && parent.clientWidth > 0 && parent.clientHeight > 0) {
    canvas.width = parent.clientWidth;
    canvas.height = parent.clientHeight;
  } else {
    canvas.width = 800;
    canvas.height = 460;
  }
}

function hideOverlay(id) {
  const o = document.getElementById(id);
  if (o) o.style.display = "none";
}

function showOverlay(id, title, desc, btnText, callbackName) {
  const o = document.getElementById(id);
  if (o) {
    o.style.display = "flex";
    o.innerHTML = `
      <h3>${title}</h3>
      <p>${desc}</p>
      <button class="spark-btn btn-primary btn-launch" onclick="${callbackName}">${btnText}</button>
    `;
  }
}

/* ==========================================================
   TIER SELECTOR: 1 PLAYER VS 2 PLAYERS
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

/* ==========================================================
   ONLINE / OFFLINE WEBRTC MULTIPLAYER PEER CONNECTION
========================================================== */
let multiplayerMode = "offline"; // 'offline' or 'online'
let peer = null;
let netConn = null;
let isHost = false;
let myPlayerIndex = 1; // 1 or 2

function setMultiplayerMode(mode) {
  multiplayerMode = mode;
  document.getElementById("modeOfflineBtn").classList.toggle("active", mode === "offline");
  document.getElementById("modeOnlineBtn").classList.toggle("active", mode === "online");
  document.getElementById("onlineConnectPanel").style.display = mode === "online" ? "flex" : "none";
}

function connectOnlineRoom(role) {
  const code = document.getElementById("netRoomCode").value.trim();
  const name = document.getElementById("netPlayerName").value.trim() || "Player";
  const status = document.getElementById("netStatusText");

  if (!code) {
    alert("Please enter a room code (e.g. 0000)!");
    return;
  }

  status.innerText = "CONNECTING...";
  const peerRoomId = "spark_game_room_" + code;

  if (role === 'host') {
    isHost = true;
    myPlayerIndex = 1;
    // Host registers peer ID with room code
    peer = new Peer(peerRoomId);
    peer.on("open", () => {
      status.innerText = "ROOM HOSTED! WAITING FOR P2...";
    });
    peer.on("connection", (conn) => {
      netConn = conn;
      setupNetListeners();
      status.innerText = "CONNECTED! ENJOY MATCH";
      sendNetData({ type: "SYNC_START", hostName: name });
    });
    peer.on("error", (err) => {
      status.innerText = "CODE IN USE / RETRY";
    });
  } else {
    isHost = false;
    myPlayerIndex = 2;
    peer = new Peer();
    peer.on("open", () => {
      netConn = peer.connect(peerRoomId);
      setupNetListeners();
      status.innerText = "JOINED ROOM!";
    });
  }
}

function setupNetListeners() {
  if (!netConn) return;
  netConn.on("data", (data) => {
    handleIncomingNetMove(data);
  });
}

function sendNetData(data) {
  if (netConn && netConn.open) {
    netConn.send(data);
  }
}

function handleIncomingNetMove(data) {
  if (data.type === "SEABATTLE_DEPLOY") {
    sbShips[data.player] = data.ships;
    if (sbShips[1].length === 5 && sbShips[2].length === 5) {
      sbPhase = "ATTACK";
      document.getElementById("sbPhase").innerText = "ATTACK PHASE! FIND 5 SHIPS";
      renderSeaBattleBoards();
    }
  } else if (data.type === "SEABATTLE_SHOT") {
    handleSeaBattleShot(data.targetPlayer, data.index, false);
  } else if (data.type === "CHESS_MOVE") {
    executeChessMove(data.from, data.to, false);
  } else if (data.type === "TTT_MOVE") {
    handleTTT2PMove(data.index, false);
  }
}

/* ==========================================================
   TAB SWITCHER FOR EACH TIER
========================================================== */
document.querySelectorAll(".game-selector-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const parentTier = btn.closest(".tier-container");
    parentTier.querySelectorAll(".game-selector-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    const targetGame = btn.getAttribute("data-game");
    parentTier.querySelectorAll(".arcade-view").forEach(v => {
      v.classList.toggle("active", v.id === `${targetGame}View`);
    });

    cancelAnimationFrame(sAnimId);
    cancelAnimationFrame(fAnimId);
    cancelAnimationFrame(dAnimId);
    spaceActive = false; flappyActive = false; dinoActive = false;
  });
});

/* ==========================================================
   1. SINGLE PLAYER: SPACE STRIKER (POWER-UPS & SMOOTH DIFFICULTY)
========================================================== */
let spaceActive = false, sShipX = 200, sBullets = [], sMeteors = [], sPowerBalls = [];
let sScore = 0, sAnimId = null, sLaserTier = 1, sSpeedBoost = 1, sLastShot = 0;
let sPowerSpawnTimer = 0;
const sCanvas = document.getElementById("spaceCanvas");

function startSpaceGame() {
  if (!sCanvas) return;
  setupCanvas(sCanvas);

  sShipX = sCanvas.width / 2;
  sBullets = []; sMeteors = []; sPowerBalls = [];
  sScore = 0; sLaserTier = 1; sSpeedBoost = 1; sPowerSpawnTimer = 0;
  spaceActive = true;

  document.getElementById("spaceScore").innerText = "0";
  document.getElementById("laserBuff").innerText = "SINGLE BEAM";
  document.getElementById("speedBuff").innerText = "NORMAL SPEED";
  document.getElementById("spaceDiff").innerText = "TIER 1";
  hideOverlay("spaceOverlay");

  cancelAnimationFrame(sAnimId);
  loopSpace();
}

function updateShipPos(clientX) {
  const rect = sCanvas.getBoundingClientRect();
  sShipX = Math.max(25, Math.min(sCanvas.width - 25, clientX - rect.left));
}
sCanvas?.addEventListener("pointermove", (e) => updateShipPos(e.clientX));
sCanvas?.addEventListener("pointerdown", (e) => { if (!spaceActive) startSpaceGame(); else updateShipPos(e.clientX); });

function loopSpace() {
  if (!spaceActive) return;
  const ctx = sCanvas.getContext("2d");
  ctx.clearRect(0, 0, sCanvas.width, sCanvas.height);

  const now = Date.now();
  // Smooth difficulty scaling based on 500 score brackets
  const diffTier = Math.floor(sScore / 500) + 1;
  document.getElementById("spaceDiff").innerText = `TIER ${diffTier}`;
  const meteorSpeed = (2.2 + diffTier * 0.4) * sSpeedBoost;

  // Auto-Laser Firing
  if (now - sLastShot > (200 / sSpeedBoost)) {
    sLastShot = now;
    if (sLaserTier === 1) {
      sBullets.push({ x: sShipX, y: sCanvas.height - 45, vx: 0, color: "#00d4ff" });
    } else if (sLaserTier === 2) {
      sBullets.push({ x: sShipX - 10, y: sCanvas.height - 45, vx: 0, color: "#00d4ff" });
      sBullets.push({ x: sShipX + 10, y: sCanvas.height - 45, vx: 0, color: "#00d4ff" });
    } else {
      sBullets.push({ x: sShipX - 14, y: sCanvas.height - 45, vx: -1.2, color: "#ff003c" });
      sBullets.push({ x: sShipX - 5, y: sCanvas.height - 45, vx: 0, color: "#00d4ff" });
      sBullets.push({ x: sShipX + 5, y: sCanvas.height - 45, vx: 0, color: "#00d4ff" });
      sBullets.push({ x: sShipX + 14, y: sCanvas.height - 45, vx: 1.2, color: "#ff003c" });
    }
  }

  // Draw Jet Ship
  ctx.fillStyle = "#00d4ff";
  ctx.beginPath();
  ctx.moveTo(sShipX, sCanvas.height - 50);
  ctx.lineTo(sShipX - 20, sCanvas.height - 15);
  ctx.lineTo(sShipX + 20, sCanvas.height - 15);
  ctx.fill();

  // Move Lasers
  sBullets.forEach(b => {
    b.y -= 9; b.x += b.vx;
    ctx.fillStyle = b.color;
    ctx.fillRect(b.x - 2, b.y, 4, 14);
  });

  // Spawn Power-Up Balls (Every 100 points or timed interval)
  sPowerSpawnTimer++;
  if (sPowerSpawnTimer > 400 || (sScore >= 100 && sPowerBalls.length === 0 && sLaserTier === 1)) {
    sPowerSpawnTimer = 0;
    const type = Math.random() > 0.5 ? "LASER_DOUBLE" : "SPEED_SURGE";
    sPowerBalls.push({
      x: Math.random() * (sCanvas.width - 60) + 30,
      y: -20, r: 18, type: type,
      color: type === "LASER_DOUBLE" ? "#ffbe0b" : "#ff003c"
    });
  }

  // Update & Draw Power-Up Balls
  for (let pIdx = sPowerBalls.length - 1; pIdx >= 0; pIdx--) {
    let p = sPowerBalls[pIdx];
    p.y += 2;
    ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.font = "10px Orbitron";
    ctx.fillText(p.type === "LASER_DOUBLE" ? "2x" : "⚡", p.x - 6, p.y + 4);

    // Bullet hit on Power-up Ball
    sBullets.forEach((b, bIdx) => {
      if (Math.hypot(b.x - p.x, b.y - p.y) < p.r + 5) {
        if (p.type === "LASER_DOUBLE") {
          sLaserTier = Math.min(sLaserTier + 1, 3);
          document.getElementById("laserBuff").innerText = sLaserTier === 2 ? "DUAL LASER" : "QUAD SPREAD";
        } else {
          sSpeedBoost = 1.4;
          document.getElementById("speedBuff").innerText = "1.4x SURGE";
          setTimeout(() => { sSpeedBoost = 1; document.getElementById("speedBuff").innerText = "NORMAL"; }, 15000);
        }
        sPowerBalls.splice(pIdx, 1);
        sBullets.splice(bIdx, 1);
      }
    });
  }

  // Spawn Meteors
  if (Math.random() < 0.03 + diffTier * 0.005) {
    sMeteors.push({
      x: Math.random() * (sCanvas.width - 40) + 20,
      y: -20, r: Math.random() * 8 + 14, speed: meteorSpeed
    });
  }

  // Update Meteors
  for (let mIdx = sMeteors.length - 1; mIdx >= 0; mIdx--) {
    let m = sMeteors[mIdx];
    m.y += m.speed;
    ctx.fillStyle = "#ff003c";
    ctx.beginPath(); ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2); ctx.fill();

    sBullets.forEach((b, bIdx) => {
      if (Math.hypot(b.x - m.x, b.y - m.y) < m.r + 4) {
        sMeteors.splice(mIdx, 1);
        sBullets.splice(bIdx, 1);
        sScore += 10;
        document.getElementById("spaceScore").innerText = sScore;
      }
    });

    if (m.y > sCanvas.height) {
      spaceActive = false;
      showOverlay("spaceOverlay", "METEOR BREACH", `Score: <strong>${sScore}</strong>`, "Relaunch Jet", "startSpaceGame()");
      return;
    }
  }

  sBullets = sBullets.filter(b => b.y > -20);
  sAnimId = requestAnimationFrame(loopSpace);
}

/* ==========================================================
   2. SINGLE PLAYER: FLAPPY PHOENIX (CLASSIC NORMAL SPEED)
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

function flapWing() {
  if (flappyActive) fBirdV = -6; else startFlappyGame();
}
fCanvas?.addEventListener("pointerdown", (e) => { e.preventDefault(); flapWing(); });
window.addEventListener("keydown", (e) => {
  if (e.code === "Space" && document.getElementById("flappyView")?.classList.contains("active")) {
    e.preventDefault(); flapWing();
  }
});

function loopFlappy() {
  if (!flappyActive) return;
  const ctx = fCanvas.getContext("2d");
  ctx.clearRect(0, 0, fCanvas.width, fCanvas.height);

  const speed = 2.8; // Normal classic steady speed
  fBirdV += 0.32; fBirdY += fBirdV; wingCycle += 0.22;

  // Blueprint Phoenix
  ctx.save();
  ctx.translate(80, fBirdY);
  ctx.strokeStyle = "#00d4ff"; ctx.lineWidth = 2.5;
  ctx.strokeRect(-12, -8, 24, 16);
  ctx.fillStyle = "#ff003c"; ctx.fillRect(10, -3, 8, 6); // Beak
  ctx.fillStyle = "#fff"; ctx.fillRect(-2, Math.sin(wingCycle) * 10, 8, 14); // Wing
  ctx.restore();

  if (fPipes.length === 0 || fPipes[fPipes.length - 1].x < fCanvas.width - 240) {
    const gap = 130;
    const topH = Math.random() * (fCanvas.height - gap - 100) + 40;
    fPipes.push({ x: fCanvas.width, top: topH, bottom: topH + gap, passed: false });
  }

  for (let i = 0; i < fPipes.length; i++) {
    let p = fPipes[i];
    p.x -= speed;
    ctx.fillStyle = "#ff003c"; ctx.fillRect(p.x, 0, 48, p.top);
    ctx.fillStyle = "#00d4ff"; ctx.fillRect(p.x, p.bottom, 48, fCanvas.height - p.bottom);

    if (80 + 14 > p.x && 80 - 14 < p.x + 48) {
      if (fBirdY - 10 < p.top || fBirdY + 10 > p.bottom) {
        flappyActive = false;
        showOverlay("flappyOverlay", "FLIGHT OVER", `Score: <strong>${fScore}</strong>`, "Fly Again", "startFlappyGame()");
        return;
      }
    }
    if (!p.passed && p.x < 80) {
      p.passed = true; fScore++;
      document.getElementById("flappyScore").innerText = fScore;
    }
  }

  if (fBirdY > fCanvas.height - 15 || fBirdY < 15) {
    flappyActive = false;
    showOverlay("flappyOverlay", "CRASHED", `Score: <strong>${fScore}</strong>`, "Fly Again", "startFlappyGame()");
    return;
  }

  fPipes = fPipes.filter(p => p.x > -60);
  fAnimId = requestAnimationFrame(loopFlappy);
}

/* ==========================================================
   3. SINGLE PLAYER: CHROME CYBER DINO (EXACT NO-INTERNET DINO)
========================================================== */
let dinoActive = false, dY = 0, dV = 0, dScore = 0, dCacti = [], dAnimId = null;
let dLegCycle = 0;
const dCanvas = document.getElementById("dinoCanvas");

function startDinoGame() {
  if (!dCanvas) return;
  setupCanvas(dCanvas);

  dY = 0; dV = 0; dScore = 0; dCacti = []; dinoActive = true;
  document.getElementById("dinoScore").innerText = "0m";
  hideOverlay("dinoOverlay");

  cancelAnimationFrame(dAnimId);
  loopDino();
}

function jumpDinoAction() {
  if (!dinoActive) return startDinoGame();
  if (dY === 0) dV = 11.5;
}
dCanvas?.addEventListener("pointerdown", (e) => { e.preventDefault(); jumpDinoAction(); });
window.addEventListener("keydown", (e) => {
  if (e.code === "Space" && document.getElementById("dinoView")?.classList.contains("active")) {
    e.preventDefault(); jumpDinoAction();
  }
});

function drawBlueprintDino(ctx, x, y, cycle, inAir) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = "#00d4ff"; ctx.lineWidth = 2.5;

  // Head & Snout
  ctx.strokeRect(-10, -32, 22, 14);
  ctx.fillStyle = "#ff003c"; ctx.fillRect(6, -28, 4, 4); // Eye

  // Torso
  ctx.strokeRect(-16, -20, 20, 18);

  // Tail
  ctx.beginPath(); ctx.moveTo(-16, -16); ctx.lineTo(-28, -22); ctx.stroke();

  // Animated Running Legs
  if (!inAir) {
    const l1 = Math.sin(cycle) * 8;
    ctx.beginPath(); ctx.moveTo(-10, -2); ctx.lineTo(-10, 10 + l1); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-2, -2); ctx.lineTo(-2, 10 - l1); ctx.stroke();
  } else {
    ctx.beginPath(); ctx.moveTo(-8, -2); ctx.lineTo(-12, 4); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-2, -2); ctx.lineTo(2, 4); ctx.stroke();
  }
  ctx.restore();
}

function loopDino() {
  if (!dinoActive) return;
  const ctx = dCanvas.getContext("2d");
  ctx.clearRect(0, 0, dCanvas.width, dCanvas.height);

  const groundY = dCanvas.height - 40;
  const speed = 5.2 + Math.min((dScore / 40) * 0.4, 6.5);

  dY += dV;
  if (dY > 0) dV -= 0.54; else { dY = 0; dV = 0; }
  dLegCycle += 0.28;

  // Ground Line
  ctx.strokeStyle = "rgba(0, 212, 255, 0.4)"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, groundY); ctx.lineTo(dCanvas.width, groundY); ctx.stroke();

  drawBlueprintDino(ctx, 70, groundY - dY, dLegCycle, dY > 0);

  // Spawn Cactus Obstacles
  if (dCacti.length === 0 || dCacti[dCacti.length - 1].x < dCanvas.width - 250) {
    if (Math.random() < 0.6) {
      dCacti.push({ x: dCanvas.width, w: 20, h: Math.random() * 20 + 28 });
    }
  }

  for (let i = 0; i < dCacti.length; i++) {
    let c = dCacti[i];
    c.x -= speed;
    ctx.fillStyle = "#ff003c";
    ctx.fillRect(c.x, groundY - c.h, c.w, c.h);

    if (70 + 10 > c.x && 70 - 10 < c.x + c.w && dY < c.h) {
      dinoActive = false;
      showOverlay("dinoOverlay", "GAME OVER", `Distance Cleared: <strong>${Math.floor(dScore / 4)}m</strong>`, "Run Again", "startDinoGame()");
      return;
    }
  }

  dScore++;
  document.getElementById("dinoScore").innerText = `${Math.floor(dScore / 4)}m`;
  dCacti = dCacti.filter(c => c.x > -30);
  dAnimId = requestAnimationFrame(loopDino);
}

/* ==========================================================
   2-PLAYER GAME 1: SEA BATTLE (5 SHIPS EACH)
========================================================== */
let sbPhase = "DEPLOY"; // 'DEPLOY' or 'ATTACK'
let sbCurrentDeployPlayer = 1;
let sbShips = { 1: [], 2: [] };
let sbShots = { 1: [], 2: [] };
let sbTurn = 1;

function init2PDefaults() {
  resetSeaBattle();
  resetChessBoard();
  resetTTT2P();
}

function resetSeaBattle() {
  sbPhase = "DEPLOY";
  sbCurrentDeployPlayer = 1;
  sbShips = { 1: [], 2: [] };
  sbShots = { 1: [], 2: [] };
  sbTurn = 1;
  document.getElementById("sbPhase").innerText = "P1 DEPLOY SHIPS (0/5)";
  document.getElementById("sbTurn").innerText = "PLAYER 1";
  renderSeaBattleBoards();
}

function renderSeaBattleBoards() {
  const g1 = document.getElementById("sbGrid1");
  const g2 = document.getElementById("sbGrid2");
  g1.innerHTML = ""; g2.innerHTML = "";

  for (let i = 0; i < 25; i++) {
    const c1 = document.createElement("div");
    c1.className = "sb-cell";
    if (sbShips[1].includes(i)) c1.classList.add("ship");
    if (sbShots[2].includes(i)) c1.classList.add(sbShips[1].includes(i) ? "hit" : "miss");
    c1.onclick = () => onSeaBattleCellClick(1, i);
    g1.appendChild(c1);

    const c2 = document.createElement("div");
    c2.className = "sb-cell";
    if (sbPhase === "DEPLOY" && sbCurrentDeployPlayer === 2 && sbShips[2].includes(i)) c2.classList.add("ship");
    if (sbShots[1].includes(i)) c2.classList.add(sbShips[2].includes(i) ? "hit" : "miss");
    c2.onclick = () => onSeaBattleCellClick(2, i);
    g2.appendChild(c2);
  }
}

function onSeaBattleCellClick(boardPlayer, idx) {
  if (multiplayerMode === "online" && sbTurn !== myPlayerIndex) return;

  if (sbPhase === "DEPLOY") {
    if (sbCurrentDeployPlayer === 1 && boardPlayer === 1) {
      if (!sbShips[1].includes(idx) && sbShips[1].length < 5) {
        sbShips[1].push(idx);
        document.getElementById("sbPhase").innerText = `P1 DEPLOY SHIPS (${sbShips[1].length}/5)`;
        if (sbShips[1].length === 5) {
          sbCurrentDeployPlayer = 2;
          document.getElementById("sbPhase").innerText = "P2 DEPLOY SHIPS (0/5)";
          if (multiplayerMode === "online") sendNetData({ type: "SEABATTLE_DEPLOY", player: 1, ships: sbShips[1] });
        }
        renderSeaBattleBoards();
      }
    } else if (sbCurrentDeployPlayer === 2 && boardPlayer === 2) {
      if (!sbShips[2].includes(idx) && sbShips[2].length < 5) {
        sbShips[2].push(idx);
        document.getElementById("sbPhase").innerText = `P2 DEPLOY SHIPS (${sbShips[2].length}/5)`;
        if (sbShips[2].length === 5) {
          sbPhase = "ATTACK";
          document.getElementById("sbPhase").innerText = "ATTACK PHASE! SINK 5 SHIPS";
          if (multiplayerMode === "online") sendNetData({ type: "SEABATTLE_DEPLOY", player: 2, ships: sbShips[2] });
        }
        renderSeaBattleBoards();
      }
    }
  } else if (sbPhase === "ATTACK") {
    // Attack phase
    if (sbTurn === 1 && boardPlayer === 2) {
      handleSeaBattleShot(2, idx, true);
    } else if (sbTurn === 2 && boardPlayer === 1) {
      handleSeaBattleShot(1, idx, true);
    }
  }
}

function handleSeaBattleShot(targetPlayer, idx, shouldBroadcast) {
  const attackingPlayer = targetPlayer === 2 ? 1 : 2;
  if (sbShots[attackingPlayer].includes(idx)) return;

  sbShots[attackingPlayer].push(idx);
  if (shouldBroadcast && multiplayerMode === "online") {
    sendNetData({ type: "SEABATTLE_SHOT", targetPlayer, index: idx });
  }

  // Check Victory
  const hits = sbShots[attackingPlayer].filter(i => sbShips[targetPlayer].includes(i)).length;
  if (hits === 5) {
    alert(`VICTORY! Player ${attackingPlayer} destroyed all 5 ships!`);
    resetSeaBattle();
    return;
  }

  sbTurn = attackingPlayer === 1 ? 2 : 1;
  document.getElementById("sbTurn").innerText = `PLAYER ${sbTurn}`;
  renderSeaBattleBoards();
}

/* ==========================================================
   2-PLAYER GAME 2: BLUEPRINT CHESS
========================================================== */
const INITIAL_CHESS_BOARD = [
  "r","n","b","q","k","b","n","r",
  "p","p","p","p","p","p","p","p",
  "","","","","","","","",
  "","","","","","","","",
  "","","","","","","","",
  "","","","","","","","",
  "P","P","P","P","P","P","P","P",
  "R","N","B","Q","K","B","N","R"
];
const CHESS_SYMBOLS = {
  "r": "♜", "n": "♞", "b": "♝", "q": "♛", "k": "♚", "p": "♟",
  "R": "♖", "N": "♘", "B": "♗", "Q": "♕", "K": "♔", "P": "♙"
};
let chessBoard = [];
let chessTurn = "W"; // 'W' or 'B'
let selectedChessCell = null;

function resetChessBoard() {
  chessBoard = [...INITIAL_CHESS_BOARD];
  chessTurn = "W";
  selectedChessCell = null;
  document.getElementById("chessTurn").innerText = "WHITE (BLUEPRINT)";
  renderChessBoard();
}

function renderChessBoard() {
  const grid = document.getElementById("chessGrid");
  if (!grid) return;
  grid.innerHTML = "";

  for (let i = 0; i < 64; i++) {
    const row = Math.floor(i / 8);
    const col = i % 8;
    const isLight = (row + col) % 2 === 0;

    const cell = document.createElement("div");
    cell.className = `chess-cell ${isLight ? "light" : "dark"}`;
    if (selectedChessCell === i) cell.classList.add("selected");

    const piece = chessBoard[i];
    if (piece) {
      cell.innerText = CHESS_SYMBOLS[piece];
      cell.classList.add(piece === piece.toUpperCase() ? "white-piece" : "black-piece");
    }

    cell.onclick = () => onChessCellClick(i);
    grid.appendChild(cell);
  }
}

function onChessCellClick(idx) {
  if (multiplayerMode === "online") {
    if (chessTurn === "W" && myPlayerIndex !== 1) return;
    if (chessTurn === "B" && myPlayerIndex !== 2) return;
  }

  const piece = chessBoard[idx];
  const isWhite = piece && piece === piece.toUpperCase();
  const isCurrentTurnPiece = piece && ((chessTurn === "W" && isWhite) || (chessTurn === "B" && !isWhite));

  if (selectedChessCell === null) {
    if (isCurrentTurnPiece) {
      selectedChessCell = idx;
      renderChessBoard();
    }
  } else {
    // Attempt move
    if (selectedChessCell === idx) {
      selectedChessCell = null;
      renderChessBoard();
    } else {
      executeChessMove(selectedChessCell, idx, true);
    }
  }
}

function executeChessMove(from, to, shouldBroadcast) {
  chessBoard[to] = chessBoard[from];
  chessBoard[from] = "";
  selectedChessCell = null;
  chessTurn = chessTurn === "W" ? "B" : "W";
  document.getElementById("chessTurn").innerText = chessTurn === "W" ? "WHITE" : "BLACK";

  if (shouldBroadcast && multiplayerMode === "online") {
    sendNetData({ type: "CHESS_MOVE", from, to });
  }
  renderChessBoard();
}

/* ==========================================================
   2-PLAYER GAME 3: TIC TAC TOE 2P (OFFLINE & ONLINE CODE)
========================================================== */
let ttt2PBoard = ["","","","","","","","",""];
let ttt2PTurn = "X";

function resetTTT2P() {
  ttt2PBoard = ["","","","","","","","",""];
  ttt2PTurn = "X";
  document.getElementById("tttTurn").innerText = "PLAYER 1 (X)";
  document.getElementById("tttStatus").innerText = "READY";
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
    if (val === "X") cell.classList.add("x");
    if (val === "O") cell.classList.add("o");
    cell.onclick = () => onTTT2PClick(idx);
    g.appendChild(cell);
  });
}

function onTTT2PClick(idx) {
  if (multiplayerMode === "online") {
    if (ttt2PTurn === "X" && myPlayerIndex !== 1) return;
    if (ttt2PTurn === "O" && myPlayerIndex !== 2) return;
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

  // Check Win
  const wins = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];
  const won = wins.some(([a,b,c]) => ttt2PBoard[a] && ttt2PBoard[a] === ttt2PBoard[b] && ttt2PBoard[a] === ttt2PBoard[c]);

  if (won) {
    document.getElementById("tttStatus").innerText = `PLAYER (${ttt2PTurn}) WON!`;
    renderTTT2P();
    return;
  }

  ttt2PTurn = ttt2PTurn === "X" ? "O" : "X";
  document.getElementById("tttTurn").innerText = `PLAYER (${ttt2PTurn})`;
  renderTTT2P();
}
