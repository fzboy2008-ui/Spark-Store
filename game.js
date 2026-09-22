/* ==========================================================
   GAME SWITCHER
========================================================== */
const gameSelectors = document.querySelectorAll(".game-selector-btn");
const arcadeViews = document.querySelectorAll(".arcade-view");

if (gameSelectors.length) {
  gameSelectors.forEach((btn) => {
    btn.addEventListener("click", () => {
      gameSelectors.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const target = btn.getAttribute("data-game");
      arcadeViews.forEach((view) => {
        view.classList.toggle("active", view.id === `${target}View`);
      });
    });
  });
}

/* ==========================================================
   1. FLAPPY BIRD (DYNAMIC DIFFICULTY SCALING)
========================================================== */
let flappyActive = false, fBirdY = 200, fBirdV = 0, fPipes = [], fScore = 0, fAnimId = null;
const fCanvas = document.getElementById("flappyCanvas");

function startFlappyGame() {
  if (!fCanvas) return;
  fCanvas.width = fCanvas.parentElement.clientWidth;
  fCanvas.height = fCanvas.parentElement.clientHeight;

  fBirdY = fCanvas.height / 2;
  fBirdV = -5;
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

  // Difficulty scaling speed: score barhne se speed increase hoti hai
  const currentSpeed = 2.8 + Math.min(fScore * 0.15, 4.0);
  document.getElementById("flappyDiff").innerText = `${(currentSpeed / 2.8).toFixed(1)}x`;

  fBirdV += 0.32;
  fBirdY += fBirdV;

  // Draw Cyber Bird
  ctx.fillStyle = "#ffbe0b";
  ctx.beginPath();
  ctx.arc(80, fBirdY, 15, 0, Math.PI * 2);
  ctx.fill();

  // Pipe spawn
  if (fPipes.length === 0 || fPipes[fPipes.length - 1].x < fCanvas.width - 200) {
    const gap = Math.max(105 - fScore * 1.5, 80); // Gap narrows as score rises
    const topH = Math.random() * (fCanvas.height - gap - 100) + 40;
    fPipes.push({ x: fCanvas.width, top: topH, bottom: topH + gap, passed: false });
  }

  for (let i = 0; i < fPipes.length; i++) {
    let p = fPipes[i];
    p.x -= currentSpeed;

    ctx.fillStyle = "#00f0ff";
    ctx.fillRect(p.x, 0, 48, p.top);
    ctx.fillRect(p.x, p.bottom, 48, fCanvas.height - p.bottom);

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
  o.innerHTML = `<h3>ENERGY LOST</h3><p>Score: <strong>${fScore}</strong></p><button class="spark-btn btn-primary" onclick="startFlappyGame()">Flight Again</button>`;
  o.classList.add("active");
}

/* ==========================================================
   2. DINO RUNNER (ADAPTIVE VELOCITY SCALING)
========================================================== */
let dinoActive = false, dinoY = 0, dinoV = 0, dinoObs = [], dScore = 0, dAnimId = null;
const dCanvas = document.getElementById("dinoCanvas");

function startDinoGame() {
  if (!dCanvas) return;
  dCanvas.width = dCanvas.parentElement.clientWidth;
  dCanvas.height = dCanvas.parentElement.clientHeight;

  dinoY = 0; dinoV = 0; dinoObs = []; dScore = 0; dinoActive = true;
  document.getElementById("dinoScore").innerText = "0m";
  document.getElementById("dinoOverlay").classList.remove("active");

  cancelAnimationFrame(dAnimId);
  loopDino();
}

function jumpDinoAction() {
  if (dinoActive && dinoY === 0) dinoV = 10.5;
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
  const currentSpeed = 5.0 + Math.min((dScore / 40) * 0.4, 6.0);
  document.getElementById("dinoSpeedDisplay").innerText = `${(currentSpeed / 5.0).toFixed(1)}x`;

  dinoY += dinoV;
  if (dinoY > 0) dinoV -= 0.48; else { dinoY = 0; dinoV = 0; }

  // Neon Floor
  ctx.strokeStyle = "rgba(0, 240, 255, 0.4)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, groundY);
  ctx.lineTo(dCanvas.width, groundY);
  ctx.stroke();

  // Dino
  ctx.fillStyle = "#ff007f";
  ctx.fillRect(60, groundY - dinoY - 36, 36, 36);

  // Dynamic Spawning
  if (dinoObs.length === 0 || dinoObs[dinoObs.length - 1].x < dCanvas.width - (220 - Math.min(dScore / 10, 60))) {
    if (Math.random() < 0.6) {
      dinoObs.push({ x: dCanvas.width, w: 24, h: Math.random() * 26 + 28 });
    }
  }

  for (let i = 0; i < dinoObs.length; i++) {
    let o = dinoObs[i];
    o.x -= currentSpeed;

    ctx.fillStyle = "#ffbe0b";
    ctx.fillRect(o.x, groundY - o.h, o.w, o.h);

    if (60 + 36 > o.x && 60 < o.x + o.w && dinoY < o.h) {
      dinoActive = false;
      const ov = document.getElementById("dinoOverlay");
      ov.innerHTML = `<h3>GRID COLLISION</h3><p>Distance Cleared: <strong>${Math.floor(dScore / 4)}m</strong></p><button class="spark-btn btn-primary" onclick="startDinoGame()">Run Again</button>`;
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
   3. SPACE SHIP (AUTO-LASER + LEVEL PROGRESSION)
========================================================== */
let spaceActive = false, shipX = 200, spaceBullets = [], spaceEnemies = [], sScore = 0, sAnimId = null;
let lastAutoShot = 0;
const sCanvas = document.getElementById("spaceCanvas");

function startSpaceGame() {
  if (!sCanvas) return;
  sCanvas.width = sCanvas.parentElement.clientWidth;
  sCanvas.height = sCanvas.parentElement.clientHeight;

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

sCanvas?.addEventListener("pointermove", (e) => {
  const rect = sCanvas.getBoundingClientRect();
  shipX = e.clientX - rect.left;
});

function loopSpace() {
  if (!spaceActive) return;
  const ctx = sCanvas.getContext("2d");
  ctx.clearRect(0, 0, sCanvas.width, sCanvas.height);

  const now = Date.now();
  // Auto-Laser Fire Rate (Every 220ms automatically)
  if (now - lastAutoShot > 220) {
    lastAutoShot = now;
    // Weapon Upgrades based on score
    if (sScore >= 300) {
      document.getElementById("laserLevel").innerText = "LEVEL 4 (QUAD PLASMA)";
      spaceBullets.push({ x: shipX - 16, y: sCanvas.height - 45, vx: -1.2 });
      spaceBullets.push({ x: shipX - 6, y: sCanvas.height - 45, vx: 0 });
      spaceBullets.push({ x: shipX + 6, y: sCanvas.height - 45, vx: 0 });
      spaceBullets.push({ x: shipX + 16, y: sCanvas.height - 45, vx: 1.2 });
    } else if (sScore >= 180) {
      document.getElementById("laserLevel").innerText = "LEVEL 3 (TRIPLE SPREAD)";
      spaceBullets.push({ x: shipX - 12, y: sCanvas.height - 45, vx: -1.5 });
      spaceBullets.push({ x: shipX, y: sCanvas.height - 45, vx: 0 });
      spaceBullets.push({ x: shipX + 12, y: sCanvas.height - 45, vx: 1.5 });
    } else if (sScore >= 80) {
      document.getElementById("laserLevel").innerText = "LEVEL 2 (DUAL TWIN)";
      spaceBullets.push({ x: shipX - 8, y: sCanvas.height - 45, vx: 0 });
      spaceBullets.push({ x: shipX + 8, y: sCanvas.height - 45, vx: 0 });
    } else {
      document.getElementById("laserLevel").innerText = "LEVEL 1 (SINGLE)";
      spaceBullets.push({ x: shipX, y: sCanvas.height - 45, vx: 0 });
    }
  }

  // Draw Ship
  ctx.fillStyle = "#00f0ff";
  ctx.beginPath();
  ctx.moveTo(shipX, sCanvas.height - 45);
  ctx.lineTo(shipX - 18, sCanvas.height - 12);
  ctx.lineTo(shipX + 18, sCanvas.height - 12);
  ctx.fill();

  // Move Bullets
  ctx.fillStyle = "#ffbe0b";
  spaceBullets.forEach((b) => {
    b.y -= 8.5;
    b.x += (b.vx || 0);
    ctx.fillRect(b.x - 2, b.y, 4, 14);
  });

  // Spawn Enemy Ships (Faster as score scales)
  const spawnRate = 0.035 + Math.min(sScore * 0.0002, 0.05);
  if (Math.random() < spawnRate) {
    spaceEnemies.push({
      x: Math.random() * (sCanvas.width - 40) + 20,
      y: -20,
      r: 15,
      speed: 2.5 + Math.min(sScore * 0.008, 3.5)
    });
  }

  // Enemy Collisions
  for (let eIdx = spaceEnemies.length - 1; eIdx >= 0; eIdx--) {
    let en = spaceEnemies[eIdx];
    en.y += en.speed;

    ctx.fillStyle = "#ff007f";
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
      ov.innerHTML = `<h3>BASE INFILTRATED</h3><p>Score: <strong>${sScore}</strong></p><button class="spark-btn btn-primary" onclick="startSpaceGame()">Relaunch Defender</button>`;
      ov.classList.add("active");
      return;
    }
  }

  spaceBullets = spaceBullets.filter((b) => b.y > -20);
  sAnimId = requestAnimationFrame(loopSpace);
}

/* ==========================================================
   4. TOWER JUMP (INCREASING ALTITUDE SPEED)
========================================================== */
let towerActive = false, tPlayer = { x: 200, y: 250, vx: 0, vy: -7 };
let tBlocks = [], tAltitude = 0, tAnimId = null;
const tCanvas = document.getElementById("towerCanvas");

function startTowerGame() {
  if (!tCanvas) return;
  tCanvas.width = tCanvas.parentElement.clientWidth;
  tCanvas.height = tCanvas.parentElement.clientHeight;

  tPlayer = { x: tCanvas.width / 2, y: tCanvas.height - 40, vx: 0, vy: -8 };
  tBlocks = [];
  tAltitude = 0;
  towerActive = true;

  for (let i = 0; i < 8; i++) {
    tBlocks.push({
      x: Math.random() * (tCanvas.width - 80),
      y: tCanvas.height - i * 55,
      w: 80,
      h: 12
    });
  }

  document.getElementById("towerHeight").innerText = "0m";
  document.getElementById("towerOverlay").classList.remove("active");

  cancelAnimationFrame(tAnimId);
  loopTower();
}

function setTowerMove(dir) { tPlayer.vx = dir * 5.2; }
window.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft" || e.key === "a") setTowerMove(-1);
  if (e.key === "ArrowRight" || e.key === "d") setTowerMove(1);
});
window.addEventListener("keyup", () => { setTowerMove(0); });

function loopTower() {
  if (!towerActive) return;
  const ctx = tCanvas.getContext("2d");
  ctx.clearRect(0, 0, tCanvas.width, tCanvas.height);

  tPlayer.vy += 0.25;
  tPlayer.x += tPlayer.vx;
  tPlayer.y += tPlayer.vy;

  if (tPlayer.x < 0) tPlayer.x = tCanvas.width;
  if (tPlayer.x > tCanvas.width) tPlayer.x = 0;

  // Narrower blocks as altitude rises
  const currentBlockW = Math.max(80 - Math.floor(tAltitude / 30), 45);

  tBlocks.forEach((b) => {
    if (
      tPlayer.vy > 0 &&
      tPlayer.x > b.x &&
      tPlayer.x < b.x + b.w &&
      tPlayer.y + 14 >= b.y &&
      tPlayer.y + 14 <= b.y + 16
    ) {
      tPlayer.vy = -8.2;
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

  ctx.fillStyle = "#ffbe0b";
  tBlocks.forEach((b) => ctx.fillRect(b.x, b.y, b.w, b.h));

  ctx.fillStyle = "#00f0ff";
  ctx.fillRect(tPlayer.x - 9, tPlayer.y, 18, 18);

  if (tPlayer.y > tCanvas.height) {
    towerActive = false;
    const ov = document.getElementById("towerOverlay");
    ov.innerHTML = `<h3>MATRIX DROP</h3><p>Peak Altitude: <strong>${tAltitude}m</strong></p><button class="spark-btn btn-primary" onclick="startTowerGame()">Climb Again</button>`;
    ov.classList.add("active");
    return;
  }

  tAnimId = requestAnimationFrame(loopTower);
}

/* ==========================================================
   5. CYBER SNAKE (DYNAMIC ACCELERATION)
========================================================== */
let snakeActive = false;
let snake = [];
let food = { x: 0, y: 0 };
let snakeDir = 'RIGHT';
let snakeScore = 0;
let snakeInterval = null;
const snCanvas = document.getElementById("snakeCanvas");
const GRID_SIZE = 16;

function startSnakeGame() {
  if (!snCanvas) return;
  snCanvas.width = snCanvas.parentElement.clientWidth;
  snCanvas.height = snCanvas.parentElement.clientHeight;

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

    // Wall collision
    if (head.x < 0 || head.x >= snCanvas.width || head.y < 0 || head.y >= snCanvas.height) {
      return endSnake();
    }

    // Body collision
    for (let segment of snake) {
      if (head.x === segment.x && head.y === segment.y) {
        return endSnake();
      }
    }

    snake.unshift(head);

    // Eat food
    if (head.x === food.x && head.y === food.y) {
      snakeScore++;
      document.getElementById("snakeScore").innerText = snakeScore;
      spawnFood();
      // Increase speed every 3 orbs
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

  // Draw Food
  ctx.fillStyle = "#ff007f";
  ctx.shadowColor = "#ff007f";
  ctx.shadowBlur = 10;
  ctx.fillRect(food.x, food.y, GRID_SIZE - 2, GRID_SIZE - 2);

  // Draw Snake
  ctx.shadowBlur = 0;
  snake.forEach((seg, idx) => {
    ctx.fillStyle = idx === 0 ? "#ffbe0b" : "#00f0ff";
    ctx.fillRect(seg.x, seg.y, GRID_SIZE - 2, GRID_SIZE - 2);
  });
}

function endSnake() {
  snakeActive = false;
  clearInterval(snakeInterval);
  const ov = document.getElementById("snakeOverlay");
  ov.innerHTML = `<h3>ENERGY SEVERED</h3><p>Total Orbs: <strong>${snakeScore}</strong></p><button class="spark-btn btn-primary" onclick="startSnakeGame()">Slither Again</button>`;
  ov.classList.add("active");
}
