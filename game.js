/* ==========================================================
   GAME SWITCHER & AUTO-RESIZE CONTROLLER
========================================================== */
const gameSelectors = document.querySelectorAll(".game-selector-btn");
const arcadeViews = document.querySelectorAll(".arcade-view");

function fitActiveGameCanvas() {
  const activeView = document.querySelector(".arcade-view.active");
  if (!activeView) return;
  const canvas = activeView.querySelector("canvas");
  if (canvas && canvas.parentElement) {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
  }
}
window.addEventListener("resize", fitActiveGameCanvas);

if (gameSelectors.length) {
  gameSelectors.forEach((btn) => {
    btn.addEventListener("click", () => {
      gameSelectors.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const target = btn.getAttribute("data-game");
      arcadeViews.forEach((view) => {
        view.classList.toggle("active", view.id === `${target}View`);
      });
      setTimeout(fitActiveGameCanvas, 40);
    });
  });
}

/* ==========================================================
   1. FLAPPY BIRD (BLUE & RED PILLARS)
========================================================== */
let flappyActive = false, fBirdY = 200, fBirdV = 0, fPipes = [], fScore = 0, fAnimId = null;
const fCanvas = document.getElementById("flappyCanvas");

function startFlappyGame() {
  if (!fCanvas) return;
  fitActiveGameCanvas();

  fBirdY = fCanvas.height / 2;
  fBirdV = -5.2;
  fPipes = [];
  fScore = 0;
  flappyActive = true;

  document.getElementById("flappyScore").innerText = "0";
  document.getElementById("flappyDiff").innerText = "1.0x";
  document.getElementById("flappyOverlay").classList.remove("active");

  cancelAnimationFrame(fAnimId);
  loopFlappy();
}

function flapWing() {
  if (flappyActive) fBirdV = -5.8;
  else startFlappyGame();
}

fCanvas?.addEventListener("pointerdown", (e) => { e.preventDefault(); flapWing(); });
window.addEventListener("keydown", (e) => {
  if (e.code === "Space" && document.getElementById("flappyView")?.classList.contains("active")) {
    e.preventDefault();
    flapWing();
  }
});

function loopFlappy() {
  if (!flappyActive) return;
  const ctx = fCanvas.getContext("2d");
  ctx.clearRect(0, 0, fCanvas.width, fCanvas.height);

  const currentSpeed = 3.0 + Math.min(fScore * 0.16, 4.5);
  document.getElementById("flappyDiff").innerText = `${(currentSpeed / 3.0).toFixed(1)}x`;

  fBirdV += 0.32;
  fBirdY += fBirdV;

  // Blue Core Bird with Red Engine Trail
  ctx.fillStyle = "#00d4ff";
  ctx.shadowColor = "#00d4ff";
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.arc(80, fBirdY, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Spawn Red & Blue Gate Pillars
  if (fPipes.length === 0 || fPipes[fPipes.length - 1].x < fCanvas.width - 210) {
    const gap = Math.max(115 - fScore * 1.5, 85);
    const topH = Math.random() * (fCanvas.height - gap - 100) + 40;
    fPipes.push({ x: fCanvas.width, top: topH, bottom: topH + gap, passed: false });
  }

  for (let i = 0; i < fPipes.length; i++) {
    let p = fPipes[i];
    p.x -= currentSpeed;

    // Top Pillar: Neon Red
    ctx.fillStyle = "#ff003c";
    ctx.fillRect(p.x, 0, 48, p.top);

    // Bottom Pillar: Neon Blue
    ctx.fillStyle = "#00d4ff";
    ctx.fillRect(p.x, p.bottom, 48, fCanvas.height - p.bottom);

    // Collision Check
    if (80 + 15 > p.x && 80 - 15 < p.x + 48) {
      if (fBirdY - 15 < p.top || fBirdY + 15 > p.bottom) {
        return endFlappy();
      }
    }

    if (!p.passed && p.x < 80) {
      p.passed = true;
      fScore++;
      document.getElementById("flappyScore").innerText = fScore;
    }
  }

  if (fBirdY > fCanvas.height - 15 || fBirdY < 15) return endFlappy();

  fPipes = fPipes.filter((p) => p.x > -60);
  fAnimId = requestAnimationFrame(loopFlappy);
}

function endFlappy() {
  flappyActive = false;
  const o = document.getElementById("flappyOverlay");
  o.innerHTML = `<h3>ENERGY SEVERED</h3><p>Score: <strong>${fScore}</strong></p><button class="spark-btn btn-primary btn-launch" onclick="startFlappyGame()">Flight Again</button>`;
  o.classList.add("active");
}

/* ==========================================================
   2. DINO RUNNER (RED BARRIERS + ADAPTIVE VELOCITY)
========================================================== */
let dinoActive = false, dinoY = 0, dinoV = 0, dinoObs = [], dScore = 0, dAnimId = null;
const dCanvas = document.getElementById("dinoCanvas");

function startDinoGame() {
  if (!dCanvas) return;
  fitActiveGameCanvas();

  dinoY = 0; dinoV = 0; dinoObs = []; dScore = 0; dinoActive = true;
  document.getElementById("dinoScore").innerText = "0m";
  document.getElementById("dinoOverlay").classList.remove("active");

  cancelAnimationFrame(dAnimId);
  loopDino();
}

function jumpDinoAction() {
  if (dinoActive && dinoY === 0) dinoV = 10.8;
  else if (!dinoActive) startDinoGame();
}

dCanvas?.addEventListener("pointerdown", (e) => { e.preventDefault(); jumpDinoAction(); });
window.addEventListener("keydown", (e) => {
  if (e.code === "Space" && document.getElementById("dinoView")?.classList.contains("active")) {
    e.preventDefault();
    jumpDinoAction();
  }
});

function loopDino() {
  if (!dinoActive) return;
  const ctx = dCanvas.getContext("2d");
  ctx.clearRect(0, 0, dCanvas.width, dCanvas.height);

  const groundY = dCanvas.height - 40;
  const currentSpeed = 5.2 + Math.min((dScore / 40) * 0.45, 6.5);
  document.getElementById("dinoSpeedDisplay").innerText = `${(currentSpeed / 5.2).toFixed(1)}x`;

  dinoY += dinoV;
  if (dinoY > 0) dinoV -= 0.5; else { dinoY = 0; dinoV = 0; }

  // Ground Line
  ctx.strokeStyle = "rgba(0, 212, 255, 0.4)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, groundY);
  ctx.lineTo(dCanvas.width, groundY);
  ctx.stroke();

  // Dino (Blue Neon Core)
  ctx.fillStyle = "#00d4ff";
  ctx.shadowColor = "#00d4ff";
  ctx.shadowBlur = 8;
  ctx.fillRect(60, groundY - dinoY - 36, 36, 36);
  ctx.shadowBlur = 0;

  // Spawn Red Barriers
  if (dinoObs.length === 0 || dinoObs[dinoObs.length - 1].x < dCanvas.width - (220 - Math.min(dScore / 10, 70))) {
    if (Math.random() < 0.6) {
      dinoObs.push({ x: dCanvas.width, w: 24, h: Math.random() * 26 + 28 });
    }
  }

  for (let i = 0; i < dinoObs.length; i++) {
    let o = dinoObs[i];
    o.x -= currentSpeed;

    ctx.fillStyle = "#ff003c";
    ctx.shadowColor = "#ff003c";
    ctx.shadowBlur = 6;
    ctx.fillRect(o.x, groundY - o.h, o.w, o.h);
    ctx.shadowBlur = 0;

    if (60 + 36 > o.x && 60 < o.x + o.w && dinoY < o.h) {
      dinoActive = false;
      const ov = document.getElementById("dinoOverlay");
      ov.innerHTML = `<h3>GRID COLLISION</h3><p>Distance: <strong>${Math.floor(dScore / 4)}m</strong></p><button class="spark-btn btn-primary btn-launch" onclick="startDinoGame()">Run Again</button>`;
      ov.classList.add("active");
      return;
    }
  }

  dScore++;
  document.getElementById("dinoScore").innerText = `${Math.floor(dScore / 4)}m`;
  dinoObs = dinoObs.filter((o) => o.x > -40);
  dAnimId = requestAnimationFrame(loopDino);
}

/* ==========================================================
   3. SPACE SHIP (AUTO-LASER & WEAPON PROGRESSION)
========================================================== */
let spaceActive = false, shipX = 200, spaceBullets = [], spaceEnemies = [], sScore = 0, sAnimId = null;
let lastAutoShot = 0;
const sCanvas = document.getElementById("spaceCanvas");

function startSpaceGame() {
  if (!sCanvas) return;
  fitActiveGameCanvas();

  shipX = sCanvas.width / 2;
  spaceBullets = [];
  spaceEnemies = [];
  sScore = 0;
  spaceActive = true;

  document.getElementById("spaceScore").innerText = "0";
  document.getElementById("laserLevel").innerText = "LEVEL 1 (SINGLE)";
  document.getElementById("spaceOverlay").classList.remove("active");

  cancelAnimationFrame(sAnimId);
  loopSpace();
}

function updateShipPos(clientX) {
  const rect = sCanvas.getBoundingClientRect();
  shipX = Math.max(25, Math.min(sCanvas.width - 25, clientX - rect.left));
}

sCanvas?.addEventListener("pointermove", (e) => updateShipPos(e.clientX));
sCanvas?.addEventListener("pointerdown", (e) => {
  if (!spaceActive) startSpaceGame();
  else updateShipPos(e.clientX);
});

function loopSpace() {
  if (!spaceActive) return;
  const ctx = sCanvas.getContext("2d");
  ctx.clearRect(0, 0, sCanvas.width, sCanvas.height);

  const now = Date.now();
  // Auto-Laser Firing (Every 200ms)
  if (now - lastAutoShot > 200) {
    lastAutoShot = now;
    if (sScore >= 300) {
      document.getElementById("laserLevel").innerText = "LEVEL 4 (QUAD PLASMA)";
      spaceBullets.push({ x: shipX - 16, y: sCanvas.height - 45, vx: -1.2, color: "#ff003c" });
      spaceBullets.push({ x: shipX - 6, y: sCanvas.height - 45, vx: 0, color: "#00d4ff" });
      spaceBullets.push({ x: shipX + 6, y: sCanvas.height - 45, vx: 0, color: "#00d4ff" });
      spaceBullets.push({ x: shipX + 16, y: sCanvas.height - 45, vx: 1.2, color: "#ff003c" });
    } else if (sScore >= 180) {
      document.getElementById("laserLevel").innerText = "LEVEL 3 (TRIPLE)";
      spaceBullets.push({ x: shipX - 12, y: sCanvas.height - 45, vx: -1.4, color: "#ff003c" });
      spaceBullets.push({ x: shipX, y: sCanvas.height - 45, vx: 0, color: "#00d4ff" });
      spaceBullets.push({ x: shipX + 12, y: sCanvas.height - 45, vx: 1.4, color: "#ff003c" });
    } else if (sScore >= 80) {
      document.getElementById("laserLevel").innerText = "LEVEL 2 (DUAL TWIN)";
      spaceBullets.push({ x: shipX - 8, y: sCanvas.height - 45, vx: 0, color: "#00d4ff" });
      spaceBullets.push({ x: shipX + 8, y: sCanvas.height - 45, vx: 0, color: "#00d4ff" });
    } else {
      document.getElementById("laserLevel").innerText = "LEVEL 1 (SINGLE)";
      spaceBullets.push({ x: shipX, y: sCanvas.height - 45, vx: 0, color: "#00d4ff" });
    }
  }

  // Draw Player Ship (Blue fighter with Red wings)
  ctx.fillStyle = "#00d4ff";
  ctx.beginPath();
  ctx.moveTo(shipX, sCanvas.height - 48);
  ctx.lineTo(shipX - 18, sCanvas.height - 12);
  ctx.lineTo(shipX + 18, sCanvas.height - 12);
  ctx.fill();

  ctx.fillStyle = "#ff003c";
  ctx.fillRect(shipX - 22, sCanvas.height - 20, 6, 12);
  ctx.fillRect(shipX + 16, sCanvas.height - 20, 6, 12);

  // Bullets
  spaceBullets.forEach((b) => {
    b.y -= 9;
    b.x += (b.vx || 0);
    ctx.fillStyle = b.color;
    ctx.shadowColor = b.color;
    ctx.shadowBlur = 8;
    ctx.fillRect(b.x - 2, b.y, 4, 14);
  });
  ctx.shadowBlur = 0;

  // Spawn Enemy Ships
  const spawnRate = 0.038 + Math.min(sScore * 0.0002, 0.05);
  if (Math.random() < spawnRate) {
    spaceEnemies.push({
      x: Math.random() * (sCanvas.width - 40) + 20,
      y: -20,
      r: 15,
      speed: 2.5 + Math.min(sScore * 0.008, 3.8)
    });
  }

  // Collisions
  for (let eIdx = spaceEnemies.length - 1; eIdx >= 0; eIdx--) {
    let en = spaceEnemies[eIdx];
    en.y += en.speed;

    ctx.fillStyle = "#ff003c";
    ctx.beginPath();
    ctx.arc(en.x, en.y, en.r, 0, Math.PI * 2);
    ctx.fill();

    spaceBullets.forEach((b, bIdx) => {
      if (Math.hypot(b.x - en.x, b.y - en.y) < en.r + 4) {
        spaceEnemies.splice(eIdx, 1);
        spaceBullets.splice(bIdx, 1);
        sScore += 10;
        document.getElementById("spaceScore").innerText = sScore;
      }
    });

    if (en.y > sCanvas.height) {
      spaceActive = false;
      const ov = document.getElementById("spaceOverlay");
      ov.innerHTML = `<h3>BASE INFILTRATED</h3><p>Destroyed Ships: <strong>${sScore / 10}</strong></p><button class="spark-btn btn-primary btn-launch" onclick="startSpaceGame()">Launch Again</button>`;
      ov.classList.add("active");
      return;
    }
  }

  spaceBullets = spaceBullets.filter((b) => b.y > -20);
  sAnimId = requestAnimationFrame(loopSpace);
}

/* ==========================================================
   4. TOWER JUMP (NEON BLUE & RED LEDGES)
========================================================== */
let towerActive = false, tPlayer = { x: 200, y: 250, vx: 0, vy: -7 };
let tBlocks = [], tAltitude = 0, tAnimId = null;
const tCanvas = document.getElementById("towerCanvas");

function startTowerGame() {
  if (!tCanvas) return;
  fitActiveGameCanvas();

  tPlayer = { x: tCanvas.width / 2, y: tCanvas.height - 40, vx: 0, vy: -8 };
  tBlocks = [];
  tAltitude = 0;
  towerActive = true;

  for (let i = 0; i < 8; i++) {
    tBlocks.push({
      x: Math.random() * (tCanvas.width - 80),
      y: tCanvas.height - i * 55,
      w: 80,
      h: 12,
      color: i % 2 === 0 ? "#00d4ff" : "#ff003c"
    });
  }

  document.getElementById("towerHeight").innerText = "0m";
  document.getElementById("towerOverlay").classList.remove("active");

  cancelAnimationFrame(tAnimId);
  loopTower();
}

function setTowerMove(dir) { tPlayer.vx = dir * 5.4; }
window.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft" || e.key === "a") setTowerMove(-1);
  if (e.key === "ArrowRight" || e.key === "d") setTowerMove(1);
});
window.addEventListener("keyup", () => { setTowerMove(0); });

function loopTower() {
  if (!towerActive) return;
  const ctx = tCanvas.getContext("2d");
  ctx.clearRect(0, 0, tCanvas.width, tCanvas.height);

  tPlayer.vy += 0.26;
  tPlayer.x += tPlayer.vx;
  tPlayer.y += tPlayer.vy;

  if (tPlayer.x < 0) tPlayer.x = tCanvas.width;
  if (tPlayer.x > tCanvas.width) tPlayer.x = 0;

  const currentBlockW = Math.max(80 - Math.floor(tAltitude / 30), 45);

  tBlocks.forEach((b) => {
    if (
      tPlayer.vy > 0 &&
      tPlayer.x > b.x &&
      tPlayer.x < b.x + b.w &&
      tPlayer.y + 14 >= b.y &&
      tPlayer.y + 14 <= b.y + 16
    ) {
      tPlayer.vy = -8.4;
      tAltitude += 10;
      document.getElementById("towerHeight").innerText = `${tAltitude}m`;
    }
  });

  if (tPlayer.y < 160) {
    tPlayer.y = 160;
    tBlocks.forEach((b) => {
      b.y += 4.5;
      if (b.y > tCanvas.height) {
        b.y = 0;
        b.w = currentBlockW;
        b.x = Math.random() * (tCanvas.width - b.w);
      }
    });
  }

  // Draw Blocks
  tBlocks.forEach((b) => {
    ctx.fillStyle = b.color;
    ctx.fillRect(b.x, b.y, b.w, b.h);
  });

  // Draw Core
  ctx.fillStyle = "#ffffff";
  ctx.shadowColor = "#00d4ff";
  ctx.shadowBlur = 10;
  ctx.fillRect(tPlayer.x - 9, tPlayer.y, 18, 18);
  ctx.shadowBlur = 0;

  if (tPlayer.y > tCanvas.height) {
    towerActive = false;
    const ov = document.getElementById("towerOverlay");
    ov.innerHTML = `<h3>MATRIX DROP</h3><p>Altitude: <strong>${tAltitude}m</strong></p><button class="spark-btn btn-primary btn-launch" onclick="startTowerGame()">Climb Again</button>`;
    ov.classList.add("active");
    return;
  }

  tAnimId = requestAnimationFrame(loopTower);
}

/* ==========================================================
   5. CYBER SNAKE (BLUE BODY + RED ORBS)
========================================================== */
let snakeActive = false, snake = [], food = { x: 0, y: 0 }, snakeDir = 'RIGHT';
let snakeScore = 0, snakeInterval = null;
const snCanvas = document.getElementById("snakeCanvas");
const GRID_SIZE = 16;

function startSnakeGame() {
  if (!snCanvas) return;
  fitActiveGameCanvas();

  snake = [
    { x: 5 * GRID_SIZE, y: 5 * GRID_SIZE },
    { x: 4 * GRID_SIZE, y: 5 * GRID_SIZE },
    { x: 3 * GRID_SIZE, y: 5 * GRID_SIZE }
  ];
  snakeDir = 'RIGHT';
  snakeScore = 0;
  snakeActive = true;

  document.getElementById("snakeScore").innerText = "0";
  document.getElementById("snakeSpeedVal").innerText = "1.0x";
  document.getElementById("snakeOverlay").classList.remove("active");

  spawnFood();
  clearInterval(snakeInterval);
  runSnakeLoop(120);
}

function spawnFood() {
  const cols = Math.floor(snCanvas.width / GRID_SIZE) - 2;
  const rows = Math.floor(snCanvas.height / GRID_SIZE) - 2;
  food = {
    x: Math.floor(Math.random() * cols + 1) * GRID_SIZE,
    y: Math.floor(Math.random() * rows + 1) * GRID_SIZE
  };
}

function turnSnake(d) {
  if (d === 'UP' && snakeDir !== 'DOWN') snakeDir = 'UP';
  if (d === 'DOWN' && snakeDir !== 'UP') snakeDir = 'DOWN';
  if (d === 'LEFT' && snakeDir !== 'RIGHT') snakeDir = 'LEFT';
  if (d === 'RIGHT' && snakeDir !== 'LEFT') snakeDir = 'RIGHT';
}

window.addEventListener("keydown", (e) => {
  if (!document.getElementById("snakeView")?.classList.contains("active")) return;
  if (e.key === "ArrowUp" || e.key === "w") turnSnake('UP');
  if (e.key === "ArrowDown" || e.key === "s") turnSnake('DOWN');
  if (e.key === "ArrowLeft" || e.key === "a") turnSnake('LEFT');
  if (e.key === "ArrowRight" || e.key === "d") turnSnake('RIGHT');
});

function runSnakeLoop(speed) {
  snakeInterval = setInterval(() => {
    if (!snakeActive) return;

    let head = { ...snake[0] };
    if (snakeDir === 'RIGHT') head.x += GRID_SIZE;
    if (snakeDir === 'LEFT') head.x -= GRID_SIZE;
    if (snakeDir === 'UP') head.y -= GRID_SIZE;
    if (snakeDir === 'DOWN') head.y += GRID_SIZE;

    // Boundary Collisions
    if (head.x < 0 || head.x >= snCanvas.width || head.y < 0 || head.y >= snCanvas.height) {
      return endSnake();
    }

    // Body Collisions
    for (let segment of snake) {
      if (head.x === segment.x && head.y === segment.y) {
        return endSnake();
      }
    }

    snake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
      snakeScore++;
      document.getElementById("snakeScore").innerText = snakeScore;
      spawnFood();
      if (snakeScore % 3 === 0 && speed > 50) {
        clearInterval(snakeInterval);
        const newSpeed = Math.max(120 - snakeScore * 4, 45);
        document.getElementById("snakeSpeedVal").innerText = `${(120 / newSpeed).toFixed(1)}x`;
        runSnakeLoop(newSpeed);
      }
    } else {
      snake.pop();
    }

    renderSnake();
  }, speed);
}

function renderSnake() {
  const ctx = snCanvas.getContext("2d");
  ctx.clearRect(0, 0, snCanvas.width, snCanvas.height);

  // Red Energy Orb
  ctx.fillStyle = "#ff003c";
  ctx.shadowColor = "#ff003c";
  ctx.shadowBlur = 10;
  ctx.fillRect(food.x, food.y, GRID_SIZE - 2, GRID_SIZE - 2);

  // Blue Neon Snake
  ctx.shadowBlur = 0;
  snake.forEach((seg, idx) => {
    ctx.fillStyle = idx === 0 ? "#ffffff" : "#00d4ff";
    ctx.fillRect(seg.x, seg.y, GRID_SIZE - 2, GRID_SIZE - 2);
  });
}

function endSnake() {
  snakeActive = false;
  clearInterval(snakeInterval);
  const ov = document.getElementById("snakeOverlay");
  ov.innerHTML = `<h3>ENERGY SEVERED</h3><p>Orbs Collected: <strong>${snakeScore}</strong></p><button class="spark-btn btn-primary btn-launch" onclick="startSnakeGame()">Slither Again</button>`;
  ov.classList.add("active");
}
