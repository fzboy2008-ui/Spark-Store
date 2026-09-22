/* ==========================================================
   1. GLOBAL CANVAS PARTICLES BACKGROUND
========================================================== */
const bgCanvas = document.getElementById("sparkCanvas");
if (bgCanvas) {
  const bgCtx = bgCanvas.getContext("2d");
  let bgParticles = [];

  function resizeBg() {
    bgCanvas.width = window.innerWidth;
    bgCanvas.height = window.innerHeight;
  }
  window.addEventListener("resize", resizeBg);
  resizeBg();

  class BgP {
    constructor() {
      this.x = Math.random() * bgCanvas.width;
      this.y = Math.random() * bgCanvas.height;
      this.vx = (Math.random() - 0.5) * 1.4;
      this.vy = (Math.random() - 0.5) * 1.4;
      this.size = Math.random() * 2 + 1;
      this.color = Math.random() > 0.5 ? "#ffbe0b" : "#00f0ff";
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      if (this.x < 0 || this.x > bgCanvas.width) this.vx *= -1;
      if (this.y < 0 || this.y > bgCanvas.height) this.vy *= -1;
    }
    draw() {
      bgCtx.beginPath();
      bgCtx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      bgCtx.fillStyle = this.color;
      bgCtx.fill();
    }
  }

  for (let i = 0; i < Math.floor((bgCanvas.width * bgCanvas.height) / 18000); i++) {
    bgParticles.push(new BgP());
  }

  function renderBg() {
    bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
    bgParticles.forEach(p => { p.update(); p.draw(); });
    requestAnimationFrame(renderBg);
  }
  renderBg();
}

/* ==========================================================
   2. SHOWCASE: 3D HOLOGRAPHIC QUANTUM SPHERE
========================================================== */
const holoCanvas = document.getElementById("aiHologramCanvas");
if (holoCanvas) {
  const hCtx = holoCanvas.getContext("2d");
  let hNodes = [];
  const TOTAL_NODES = 260;
  const SPHERE_R = 110;
  let rotX = 0.005;
  let rotY = 0.007;

  function fitHolo() {
    holoCanvas.width = holoCanvas.parentElement.clientWidth;
    holoCanvas.height = holoCanvas.parentElement.clientHeight;
  }
  window.addEventListener("resize", fitHolo);
  setTimeout(fitHolo, 50);

  for (let i = 0; i < TOTAL_NODES; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(Math.random() * 2 - 1);
    hNodes.push({
      x: SPHERE_R * Math.sin(phi) * Math.cos(theta),
      y: SPHERE_R * Math.sin(phi) * Math.sin(theta),
      z: SPHERE_R * Math.cos(phi)
    });
  }

  window.addEventListener("mousemove", (e) => {
    rotX = (e.clientY / window.innerHeight - 0.5) * 0.03;
    rotY = (e.clientX / window.innerWidth - 0.5) * 0.03;
  });

  function renderHolo() {
    hCtx.clearRect(0, 0, holoCanvas.width, holoCanvas.height);
    const cx = holoCanvas.width / 2;
    const cy = holoCanvas.height / 2;
    const fov = 300;

    let projected = [];

    hNodes.forEach(node => {
      // Rotate Y
      let cosY = Math.cos(rotY), sinY = Math.sin(rotY);
      let x1 = node.x * cosY - node.z * sinY;
      let z1 = node.z * cosY + node.x * sinY;

      // Rotate X
      let cosX = Math.cos(rotX), sinX = Math.sin(rotX);
      let y2 = node.y * cosX - z1 * sinX;
      let z2 = z1 * cosX + node.y * sinX;

      node.x = x1; node.y = y2; node.z = z2;

      let scale = fov / (fov + z2);
      projected.push({
        x: x1 * scale + cx,
        y: y2 * scale + cy,
        alpha: Math.max(0.15, (z2 + SPHERE_R) / (2 * SPHERE_R))
      });
    });

    // Lines
    for (let a = 0; a < projected.length; a++) {
      for (let b = a + 1; b < projected.length; b++) {
        let dx = projected[a].x - projected[b].x;
        let dy = projected[a].y - projected[b].y;
        let dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 40) {
          hCtx.strokeStyle = `rgba(0, 240, 255, ${0.4 * (1 - dist / 40)})`;
          hCtx.lineWidth = 0.8;
          hCtx.beginPath();
          hCtx.moveTo(projected[a].x, projected[a].y);
          hCtx.lineTo(projected[b].x, projected[b].y);
          hCtx.stroke();
        }
      }
    }

    // Nodes
    projected.forEach(p => {
      hCtx.fillStyle = `rgba(255, 190, 11, ${p.alpha})`;
      hCtx.beginPath();
      hCtx.arc(p.x, p.y, 2, 0, Math.PI * 2);
      hCtx.fill();
    });

    requestAnimationFrame(renderHolo);
  }
  renderHolo();
}

function accelerateWarp() {
  rotX *= 3; rotY *= 3;
  appendLog("Warp acceleration applied to quantum sphere.");
}
function invertTensorField() {
  rotY = -rotY;
  appendLog("Tensor field polarity inverted.");
}
function synthesizeNeuralPulse() {
  appendLog("Synaptic impulse generated across 320 nodes.");
}
function appendLog(msg) {
  const terminal = document.getElementById("showcaseTerminal");
  if (!terminal) return;
  const p = document.createElement("p");
  p.innerText = `> ${msg}`;
  terminal.appendChild(p);
  terminal.scrollTop = terminal.scrollHeight;
}

/* ==========================================================
   3. ARCADE TAB SWITCHER
========================================================== */
const gameSelectors = document.querySelectorAll(".game-selector-btn");
const arcadeViews = document.querySelectorAll(".arcade-view");

if (gameSelectors.length) {
  gameSelectors.forEach(btn => {
    btn.addEventListener("click", () => {
      gameSelectors.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const target = btn.getAttribute("data-game");
      arcadeViews.forEach(view => {
        view.classList.toggle("active", view.id === `${target}View`);
      });
    });
  });
}

/* ==========================================================
   GAME 1: FLAPPY BIRD
========================================================== */
let flappyActive = false, flappyY = 150, flappyV = 0, flappyPipes = [], flappyScore = 0, flappyTimer;
const fCanvas = document.getElementById("flappyCanvas");

function initFlappy() {
  if (!fCanvas) return;
  fCanvas.width = fCanvas.parentElement.clientWidth;
  fCanvas.height = fCanvas.parentElement.clientHeight;
  flappyY = fCanvas.height / 2;
  flappyV = 0;
  flappyPipes = [];
  flappyScore = 0;
  flappyActive = true;
  document.getElementById("flappyScore").innerText = 0;
  document.getElementById("flappyOverlay").classList.remove("active");
  runFlappy();
}

function flap() { if (flappyActive) flappyV = -5.5; }
document.getElementById("flappyStartBtn")?.addEventListener("click", () => {
  if (!flappyActive) initFlappy(); else flap();
});
window.addEventListener("keydown", (e) => {
  if (e.code === "Space" && document.getElementById("flappyView")?.classList.contains("active")) {
    e.preventDefault();
    if (!flappyActive) initFlappy(); else flap();
  }
});
fCanvas?.addEventListener("pointerdown", () => {
  if (!flappyActive) initFlappy(); else flap();
});

function runFlappy() {
  if (!flappyActive) return;
  const ctx = fCanvas.getContext("2d");
  ctx.clearRect(0, 0, fCanvas.width, fCanvas.height);

  flappyV += 0.28;
  flappyY += flappyV;

  // Draw Bird (Spark Orb)
  ctx.fillStyle = "#ffbe0b";
  ctx.beginPath();
  ctx.arc(60, flappyY, 14, 0, Math.PI * 2);
  ctx.fill();

  // Pipes
  if (Math.random() < 0.015) {
    const gap = 110;
    const topH = Math.random() * (fCanvas.height - gap - 60) + 30;
    flappyPipes.push({ x: fCanvas.width, top: topH, bottom: topH + gap });
  }

  for (let i = 0; i < flappyPipes.length; i++) {
    let p = flappyPipes[i];
    p.x -= 2.5;

    ctx.fillStyle = "#00f0ff";
    ctx.fillRect(p.x, 0, 42, p.top);
    ctx.fillRect(p.x, p.bottom, 42, fCanvas.height - p.bottom);

    // Collision
    if (60 + 14 > p.x && 60 - 14 < p.x + 42) {
      if (flappyY - 14 < p.top || flappyY + 14 > p.bottom) {
        endFlappy();
        return;
      }
    }
    if (p.x === 58) {
      flappyScore++;
      document.getElementById("flappyScore").innerText = flappyScore;
    }
  }

  if (flappyY > fCanvas.height || flappyY < 0) {
    endFlappy();
    return;
  }

  flappyPipes = flappyPipes.filter(p => p.x > -50);
  requestAnimationFrame(runFlappy);
}

function endFlappy() {
  flappyActive = false;
  const overlay = document.getElementById("flappyOverlay");
  overlay.innerHTML = `<h3>ENERGY LOST</h3><p>Score: <strong>${flappyScore}</strong></p><button class="spark-btn btn-primary" onclick="initFlappy()">Restart Flight</button>`;
  overlay.classList.add("active");
}

/* ==========================================================
   GAME 2: DINO RUNNER
========================================================== */
let dinoActive = false, dinoY = 0, dinoV = 0, dinoObs = [], dinoScore = 0;
const dCanvas = document.getElementById("dinoCanvas");

function initDino() {
  if (!dCanvas) return;
  dCanvas.width = dCanvas.parentElement.clientWidth;
  dCanvas.height = dCanvas.parentElement.clientHeight;
  dinoY = 0; dinoV = 0; dinoObs = []; dinoScore = 0; dinoActive = true;
  document.getElementById("dinoScore").innerText = 0;
  document.getElementById("dinoOverlay").classList.remove("active");
  runDino();
}

function dinoJump() {
  if (dinoActive && dinoY === 0) dinoV = 9;
}
document.getElementById("dinoJumpBtn")?.addEventListener("click", dinoJump);
dCanvas?.addEventListener("pointerdown", dinoJump);

function runDino() {
  if (!dinoActive) return;
  const ctx = dCanvas.getContext("2d");
  ctx.clearRect(0, 0, dCanvas.width, dCanvas.height);

  const groundY = dCanvas.height - 40;
  dinoY += dinoV;
  if (dinoY > 0) dinoV -= 0.42; else { dinoY = 0; dinoV = 0; }

  // Draw Ground
  ctx.strokeStyle = "rgba(255,255,255,0.2)";
  ctx.beginPath(); ctx.moveTo(0, groundY); ctx.lineTo(dCanvas.width, groundY); ctx.stroke();

  // Dino (Cyber Cube)
  ctx.fillStyle = "#ff007f";
  ctx.fillRect(50, groundY - dinoY - 32, 32, 32);

  // Obstacles
  if (Math.random() < 0.02) {
    dinoObs.push({ x: dCanvas.width, w: 22, h: Math.random() * 25 + 25 });
  }

  for (let i = 0; i < dinoObs.length; i++) {
    let o = dinoObs[i];
    o.x -= 4.5;
    ctx.fillStyle = "#ffbe0b";
    ctx.fillRect(o.x, groundY - o.h, o.w, o.h);

    if (50 + 32 > o.x && 50 < o.x + o.w && dinoY < o.h) {
      dinoActive = false;
      document.getElementById("dinoOverlay").innerHTML = `<h3>GRID COLLISION</h3><p>Score: <strong>${dinoScore}</strong></p><button class="spark-btn btn-primary" onclick="initDino()">Run Again</button>`;
      document.getElementById("dinoOverlay").classList.add("active");
      return;
    }
  }

  dinoScore++;
  document.getElementById("dinoScore").innerText = Math.floor(dinoScore / 5);
  dinoObs = dinoObs.filter(o => o.x > -30);
  requestAnimationFrame(runDino);
}

/* ==========================================================
   GAME 3: SPACE SHIP
========================================================== */
let spaceActive = false, shipX = 150, bullets = [], enemies = [], spaceScore = 0;
const sCanvas = document.getElementById("spaceCanvas");

function initSpace() {
  if (!sCanvas) return;
  sCanvas.width = sCanvas.parentElement.clientWidth;
  sCanvas.height = sCanvas.parentElement.clientHeight;
  shipX = sCanvas.width / 2;
  bullets = []; enemies = []; spaceScore = 0; spaceActive = true;
  document.getElementById("spaceScore").innerText = 0;
  document.getElementById("spaceOverlay").classList.remove("active");
  runSpace();
}

sCanvas?.parentElement.addEventListener("mousemove", (e) => {
  const rect = sCanvas.getBoundingClientRect();
  shipX = e.clientX - rect.left;
});
sCanvas?.parentElement.addEventListener("touchmove", (e) => {
  const rect = sCanvas.getBoundingClientRect();
  shipX = e.touches[0].clientX - rect.left;
});

function fireBullet() {
  if (spaceActive) bullets.push({ x: shipX, y: sCanvas.height - 45 });
}
document.getElementById("spaceFireBtn")?.addEventListener("click", fireBullet);
sCanvas?.addEventListener("pointerdown", fireBullet);

function runSpace() {
  if (!spaceActive) return;
  const ctx = sCanvas.getContext("2d");
  ctx.clearRect(0, 0, sCanvas.width, sCanvas.height);

  // Ship
  ctx.fillStyle = "#00f0ff";
  ctx.beginPath();
  ctx.moveTo(shipX, sCanvas.height - 40);
  ctx.lineTo(shipX - 16, sCanvas.height - 15);
  ctx.lineTo(shipX + 16, sCanvas.height - 15);
  ctx.fill();

  // Bullets
  ctx.fillStyle = "#ffbe0b";
  bullets.forEach(b => {
    b.y -= 7;
    ctx.fillRect(b.x - 2, b.y, 4, 12);
  });

  // Spawn Enemy
  if (Math.random() < 0.03) {
    enemies.push({ x: Math.random() * (sCanvas.width - 30) + 15, y: -20, r: 14 });
  }

  // Update Enemy & Collisions
  for (let eIdx = enemies.length - 1; eIdx >= 0; eIdx--) {
    let en = enemies[eIdx];
    en.y += 2.8;
    ctx.fillStyle = "#ff007f";
    ctx.beginPath(); ctx.arc(en.x, en.y, en.r, 0, Math.PI * 2); ctx.fill();

    bullets.forEach((b, bIdx) => {
      let dist = Math.hypot(b.x - en.x, b.y - en.y);
      if (dist < en.r + 4) {
        enemies.splice(eIdx, 1);
        bullets.splice(bIdx, 1);
        spaceScore += 10;
        document.getElementById("spaceScore").innerText = spaceScore;
      }
    });

    if (en.y > sCanvas.height) {
      spaceActive = false;
      document.getElementById("spaceOverlay").innerHTML = `<h3>BASE INFILTRATED</h3><p>Destroyed Ships: <strong>${spaceScore / 10}</strong></p><button class="spark-btn btn-primary" onclick="initSpace()">Defend Again</button>`;
      document.getElementById("spaceOverlay").classList.add("active");
      return;
    }
  }

  bullets = bullets.filter(b => b.y > -20);
  requestAnimationFrame(runSpace);
}

/* ==========================================================
   GAME 4: TOWER JUMP
========================================================== */
let tActive = false, tPlayer = { x: 150, y: 300, vx: 0, vy: 0 }, tBlocks = [], tHeight = 0;
const tCanvas = document.getElementById("towerCanvas");

function initTower() {
  if (!tCanvas) return;
  tCanvas.width = tCanvas.parentElement.clientWidth;
  tCanvas.height = tCanvas.parentElement.clientHeight;
  tPlayer = { x: tCanvas.width / 2, y: tCanvas.height - 40, vx: 0, vy: -7 };
  tBlocks = []; tHeight = 0; tActive = true;

  for (let i = 0; i < 7; i++) {
    tBlocks.push({ x: Math.random() * (tCanvas.width - 70), y: tCanvas.height - i * 55, w: 70, h: 12 });
  }
  document.getElementById("towerOverlay").classList.remove("active");
  runTower();
}

window.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft" || e.key === "a") tPlayer.vx = -4.5;
  if (e.key === "ArrowRight" || e.key === "d") tPlayer.vx = 4.5;
});
window.addEventListener("keyup", () => { tPlayer.vx = 0; });
document.getElementById("towerJumpBtn")?.addEventListener("click", () => {
  tPlayer.vx = tPlayer.vx === 0 ? 4.5 : -tPlayer.vx;
});

function runTower() {
  if (!tActive) return;
  const ctx = tCanvas.getContext("2d");
  ctx.clearRect(0, 0, tCanvas.width, tCanvas.height);

  tPlayer.vy += 0.22;
  tPlayer.x += tPlayer.vx;
  tPlayer.y += tPlayer.vy;

  // Screen wrap
  if (tPlayer.x < 0) tPlayer.x = tCanvas.width;
  if (tPlayer.x > tCanvas.width) tPlayer.x = 0;

  // Platform hit
  tBlocks.forEach(b => {
    if (tPlayer.vy > 0 && tPlayer.x > b.x && tPlayer.x < b.x + b.w && tPlayer.y + 12 >= b.y && tPlayer.y + 12 <= b.y + 14) {
      tPlayer.vy = -7.2;
      tHeight += 10;
      document.getElementById("towerHeight").innerText = `${tHeight}m`;
    }
  });

  // Camera scroll
  if (tPlayer.y < 140) {
    tPlayer.y = 140;
    tBlocks.forEach(b => {
      b.y += 4;
      if (b.y > tCanvas.height) {
        b.y = 0;
        b.x = Math.random() * (tCanvas.width - 70);
      }
    });
  }

  // Draw Blocks
  ctx.fillStyle = "#ffbe0b";
  tBlocks.forEach(b => ctx.fillRect(b.x, b.y, b.w, b.h));

  // Draw Player
  ctx.fillStyle = "#00f0ff";
  ctx.fillRect(tPlayer.x - 8, tPlayer.y, 16, 16);

  if (tPlayer.y > tCanvas.height) {
    tActive = false;
    document.getElementById("towerOverlay").innerHTML = `<h3>ALTITUDE FAILED</h3><p>Height: <strong>${tHeight}m</strong></p><button class="spark-btn btn-primary" onclick="initTower()">Jump Again</button>`;
    document.getElementById("towerOverlay").classList.add("active");
    return;
  }

  requestAnimationFrame(runTower);
}

/* ==========================================================
   GAME 5: TIC TAC TOE (PLAYER VS AI)
========================================================== */
let tttBoard = ["", "", "", "", "", "", "", "", ""];
const tttCells = document.querySelectorAll(".ttt-cell");

function resetTTT() {
  tttBoard = ["", "", "", "", "", "", "", "", ""];
  tttCells.forEach(c => {
    c.innerText = "";
    c.className = "ttt-cell";
  });
  document.getElementById("tttTurn").innerText = "Player (X)";
  document.getElementById("tttResult").innerText = "Ongoing";
}

tttCells.forEach(cell => {
  cell.addEventListener("click", () => {
    const idx = +cell.getAttribute("data-idx");
    if (tttBoard[idx] === "" && !checkWin(tttBoard)) {
      tttBoard[idx] = "X";
      cell.innerText = "X";
      cell.classList.add("x");

      if (checkWin(tttBoard)) {
        document.getElementById("tttResult").innerText = "Player X Won!";
        return;
      }
      if (tttBoard.every(val => val !== "")) {
        document.getElementById("tttResult").innerText = "Match Tied!";
        return;
      }

      // AI Move
      document.getElementById("tttTurn").innerText = "AI (O)...";
      setTimeout(makeAiMove, 300);
    }
  });
});

function makeAiMove() {
  const empty = tttBoard.map((val, idx) => val === "" ? idx : null).filter(val => val !== null);
  if (!empty.length || checkWin(tttBoard)) return;
  const choice = empty[Math.floor(Math.random() * empty.length)];
  tttBoard[choice] = "O";
  tttCells[choice].innerText = "O";
  tttCells[choice].classList.add("o");

  if (checkWin(tttBoard)) {
    document.getElementById("tttResult").innerText = "AI (O) Won!";
  } else {
    document.getElementById("tttTurn").innerText = "Player (X)";
  }
}

function checkWin(b) {
  const wins = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];
  return wins.some(([x,y,z]) => b[x] && b[x] === b[y] && b[x] === b[z]);
}
