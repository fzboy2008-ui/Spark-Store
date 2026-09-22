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
   GAME 1: FLAPPY BIRD
========================================================== */
let flappyActive = false;
let fBirdY = 150;
let fBirdV = 0;
let fPipes = [];
let fScore = 0;
let fAnimId = null;
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
  document.getElementById("flappyStatus").innerText = "IN FLIGHT";
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

  fBirdV += 0.32;
  fBirdY += fBirdV;

  // Bird
  ctx.fillStyle = "#ffbe0b";
  ctx.beginPath();
  ctx.arc(65, fBirdY, 14, 0, Math.PI * 2);
  ctx.fill();

  // Pipe spawn
  if (fPipes.length === 0 || fPipes[fPipes.length - 1].x < fCanvas.width - 170) {
    const gap = 115;
    const topH = Math.random() * (fCanvas.height - gap - 80) + 40;
    fPipes.push({ x: fCanvas.width, top: topH, bottom: topH + gap, passed: false });
  }

  for (let i = 0; i < fPipes.length; i++) {
    let p = fPipes[i];
    p.x -= 2.8;

    ctx.fillStyle = "#00f0ff";
    ctx.fillRect(p.x, 0, 44, p.top);
    ctx.fillRect(p.x, p.bottom, 44, fCanvas.height - p.bottom);

    if (65 + 14 > p.x && 65 - 14 < p.x + 44) {
      if (fBirdY - 14 < p.top || fBirdY + 14 > p.bottom) {
        return endFlappy();
      }
    }

    if (!p.passed && p.x < 65) {
      p.passed = true;
      fScore++;
      document.getElementById("flappyScore").innerText = fScore;
    }
  }

  if (fBirdY > fCanvas.height - 14 || fBirdY < 14) return endFlappy();

  fPipes = fPipes.filter((p) => p.x > -60);
  fAnimId = requestAnimationFrame(loopFlappy);
}

function endFlappy() {
  flappyActive = false;
  document.getElementById("flappyStatus").innerText = "CRASHED";
  const o = document.getElementById("flappyOverlay");
  o.innerHTML = `<h3>SYSTEM LOST</h3><p>Total Cleared: <strong>${fScore}</strong></p><button class="spark-btn btn-primary" onclick="startFlappyGame()">Flight Again</button>`;
  o.classList.add("active");
}

/* ==========================================================
   GAME 2: DINO RUNNER
========================================================== */
let dinoActive = false;
let dinoY = 0;
let dinoV = 0;
let dinoObstacles = [];
let dScore = 0;
let dAnimId = null;
const dCanvas = document.getElementById("dinoCanvas");

function startDinoGame() {
  if (!dCanvas) return;
  dCanvas.width = dCanvas.parentElement.clientWidth;
  dCanvas.height = dCanvas.parentElement.clientHeight;

  dinoY = 0;
  dinoV = 0;
  dinoObstacles = [];
  dScore = 0;
  dinoActive = true;

  document.getElementById("dinoScore").innerText = "0";
  document.getElementById("dinoStatus").innerText = "RUNNING";
  document.getElementById("dinoOverlay").classList.remove("active");

  cancelAnimationFrame(dAnimId);
  loopDino();
}

function jumpDinoAction() {
  if (dinoActive && dinoY === 0) dinoV = 9.8;
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

  const groundY = dCanvas.height - 35;
  dinoY += dinoV;
  if (dinoY > 0) dinoV -= 0.45;
  else { dinoY = 0; dinoV = 0; }

  // Ground
  ctx.strokeStyle = "rgba(0, 240, 255, 0.4)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, groundY);
  ctx.lineTo(dCanvas.width, groundY);
  ctx.stroke();

  // Dino Cube
  ctx.fillStyle = "#ff007f";
  ctx.fillRect(50, groundY - dinoY - 32, 32, 32);

  // Obstacle spawn
  if (dinoObstacles.length === 0 || dinoObstacles[dinoObstacles.length - 1].x < dCanvas.width - 240) {
    if (Math.random() < 0.6) {
      dinoObstacles.push({ x: dCanvas.width, w: 22, h: Math.random() * 26 + 26 });
    }
  }

  for (let i = 0; i < dinoObstacles.length; i++) {
    let o = dinoObstacles[i];
    o.x -= 4.8;

    ctx.fillStyle = "#ffbe0b";
    ctx.fillRect(o.x, groundY - o.h, o.w, o.h);

    if (50 + 32 > o.x && 50 < o.x + o.w && dinoY < o.h) {
      dinoActive = false;
      document.getElementById("dinoStatus").innerText = "IMPACT";
      const ov = document.getElementById("dinoOverlay");
      ov.innerHTML = `<h3>GRID COLLISION</h3><p>Distance: <strong>${Math.floor(dScore / 5)}</strong></p><button class="spark-btn btn-primary" onclick="startDinoGame()">Run Again</button>`;
      ov.classList.add("active");
      return;
    }
  }

  dScore++;
  document.getElementById("dinoScore").innerText = Math.floor(dScore / 5);
  dinoObstacles = dinoObstacles.filter((o) => o.x > -40);
  dAnimId = requestAnimationFrame(loopDino);
}

/* ==========================================================
   GAME 3: SPACE SHIP
========================================================== */
let spaceActive = false;
let shipX = 160;
let spaceBullets = [];
let spaceEnemies = [];
let sScore = 0;
let sAnimId = null;
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
  document.getElementById("spaceOverlay").classList.remove("active");

  cancelAnimationFrame(sAnimId);
  loopSpace();
}

function fireSpaceBullet() {
  if (spaceActive) spaceBullets.push({ x: shipX, y: sCanvas.height - 45 });
  else startSpaceGame();
}

sCanvas?.addEventListener("pointerdown", (e) => { e.preventDefault(); fireSpaceBullet(); });
sCanvas?.addEventListener("pointermove", (e) => {
  const rect = sCanvas.getBoundingClientRect();
  shipX = e.clientX - rect.left;
});
window.addEventListener("keydown", (e) => {
  if (e.code === "Space" && document.getElementById("spaceView")?.classList.contains("active")) {
    e.preventDefault();
    fireSpaceBullet();
  }
});

function loopSpace() {
  if (!spaceActive) return;
  const ctx = sCanvas.getContext("2d");
  ctx.clearRect(0, 0, sCanvas.width, sCanvas.height);

  // Ship
  ctx.fillStyle = "#00f0ff";
  ctx.beginPath();
  ctx.moveTo(shipX, sCanvas.height - 40);
  ctx.lineTo(shipX - 16, sCanvas.height - 12);
  ctx.lineTo(shipX + 16, sCanvas.height - 12);
  ctx.fill();

  // Bullets
  ctx.fillStyle = "#ffbe0b";
  spaceBullets.forEach((b) => {
    b.y -= 7.5;
    ctx.fillRect(b.x - 2, b.y, 4, 12);
  });

  // Enemies
  if (Math.random() < 0.035) {
    spaceEnemies.push({ x: Math.random() * (sCanvas.width - 40) + 20, y: -20, r: 14 });
  }

  for (let eIdx = spaceEnemies.length - 1; eIdx >= 0; eIdx--) {
    let en = spaceEnemies[eIdx];
    en.y += 2.5;

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
      ov.innerHTML = `<h3>BASE INFILTRATED</h3><p>Destroyed Ships: <strong>${sScore / 10}</strong></p><button class="spark-btn btn-primary" onclick="startSpaceGame()">Launch Again</button>`;
      ov.classList.add("active");
      return;
    }
  }

  spaceBullets = spaceBullets.filter((b) => b.y > -20);
  sAnimId = requestAnimationFrame(loopSpace);
}

/* ==========================================================
   GAME 4: TOWER JUMP
========================================================== */
let towerActive = false;
let tPlayer = { x: 150, y: 250, vx: 0, vy: -7 };
let tBlocks = [];
let tAltitude = 0;
let tAnimId = null;
const tCanvas = document.getElementById("towerCanvas");

function startTowerGame() {
  if (!tCanvas) return;
  tCanvas.width = tCanvas.parentElement.clientWidth;
  tCanvas.height = tCanvas.parentElement.clientHeight;

  tPlayer = { x: tCanvas.width / 2, y: tCanvas.height - 40, vx: 0, vy: -7.5 };
  tBlocks = [];
  tAltitude = 0;
  towerActive = true;

  for (let i = 0; i < 7; i++) {
    tBlocks.push({
      x: Math.random() * (tCanvas.width - 70),
      y: tCanvas.height - i * 55,
      w: 70,
      h: 12
    });
  }

  document.getElementById("towerHeight").innerText = "0m";
  document.getElementById("towerOverlay").classList.remove("active");

  cancelAnimationFrame(tAnimId);
  loopTower();
}

function setTowerMove(dir) {
  tPlayer.vx = dir * 4.5;
}

window.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft" || e.key === "a") setTowerMove(-1);
  if (e.key === "ArrowRight" || e.key === "d") setTowerMove(1);
});
window.addEventListener("keyup", () => { setTowerMove(0); });

function loopTower() {
  if (!towerActive) return;
  const ctx = tCanvas.getContext("2d");
  ctx.clearRect(0, 0, tCanvas.width, tCanvas.height);

  tPlayer.vy += 0.24;
  tPlayer.x += tPlayer.vx;
  tPlayer.y += tPlayer.vy;

  if (tPlayer.x < 0) tPlayer.x = tCanvas.width;
  if (tPlayer.x > tCanvas.width) tPlayer.x = 0;

  tBlocks.forEach((b) => {
    if (
      tPlayer.vy > 0 &&
      tPlayer.x > b.x &&
      tPlayer.x < b.x + b.w &&
      tPlayer.y + 12 >= b.y &&
      tPlayer.y + 12 <= b.y + 14
    ) {
      tPlayer.vy = -7.5;
      tAltitude += 10;
      document.getElementById("towerHeight").innerText = `${tAltitude}m`;
    }
  });

  if (tPlayer.y < 140) {
    tPlayer.y = 140;
    tBlocks.forEach((b) => {
      b.y += 4;
      if (b.y > tCanvas.height) {
        b.y = 0;
        b.x = Math.random() * (tCanvas.width - 70);
      }
    });
  }

  ctx.fillStyle = "#ffbe0b";
  tBlocks.forEach((b) => ctx.fillRect(b.x, b.y, b.w, b.h));

  ctx.fillStyle = "#00f0ff";
  ctx.fillRect(tPlayer.x - 8, tPlayer.y, 16, 16);

  if (tPlayer.y > tCanvas.height) {
    towerActive = false;
    const ov = document.getElementById("towerOverlay");
    ov.innerHTML = `<h3>FALLEN OFF MATRIX</h3><p>Highest: <strong>${tAltitude}m</strong></p><button class="spark-btn btn-primary" onclick="startTowerGame()">Jump Again</button>`;
    ov.classList.add("active");
    return;
  }

  tAnimId = requestAnimationFrame(loopTower);
}

/* ==========================================================
   GAME 5: TIC TAC TOE (PLAYER VS AI)
========================================================== */
let tttBoard = ["", "", "", "", "", "", "", "", ""];
const tttCells = document.querySelectorAll(".ttt-cell");

function resetTTT() {
  tttBoard = ["", "", "", "", "", "", "", "", ""];
  tttCells.forEach((c) => {
    c.innerText = "";
    c.className = "ttt-cell";
  });
  document.getElementById("tttTurn").innerText = "Player (X)";
  document.getElementById("tttResult").innerText = "Playing";
}

tttCells.forEach((cell) => {
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
      if (tttBoard.every((val) => val !== "")) {
        document.getElementById("tttResult").innerText = "Match Tied!";
        return;
      }

      document.getElementById("tttTurn").innerText = "AI (O)...";
      setTimeout(makeAiMove, 300);
    }
  });
});

function makeAiMove() {
  const empty = tttBoard.map((val, idx) => (val === "" ? idx : null)).filter((val) => val !== null);
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
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
  ];
  return wins.some(([x, y, z]) => b[x] && b[x] === b[y] && b[x] === b[z]);
}
