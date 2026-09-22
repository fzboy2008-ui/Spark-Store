/* ==========================================================
   ROBUST CANVAS SIZING HELPER
========================================================== */
function ensureCanvasDimensions(canvas) {
  if (!canvas) return false;
  const parent = canvas.parentElement;
  if (!parent) return false;

  // Agar tab hidden ho to default dimensions do taaki 0x0 na ho
  const w = parent.clientWidth || 800;
  const h = parent.clientHeight || 460;

  canvas.width = w;
  canvas.height = h;
  return true;
}

/* ==========================================================
   ARCADE TAB SWITCHER
========================================================== */
const gameTabBtns = document.querySelectorAll(".game-selector-btn");
const arcadeScreens = document.querySelectorAll(".arcade-view");

gameTabBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    gameTabBtns.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    const targetGame = btn.getAttribute("data-game");
    arcadeScreens.forEach((screen) => {
      screen.classList.toggle("active", screen.id === `${targetGame}View`);
    });

    // Stop all other running loops when switching tab
    cancelAnimationFrame(fAnimId);
    cancelAnimationFrame(rAnimId);
    cancelAnimationFrame(sAnimId);
    cancelAnimationFrame(bAnimId);
    cancelAnimationFrame(oAnimId);

    flappyActive = false;
    runnerActive = false;
    spaceActive = false;
    bladeActive = false;
    orbitActive = false;
  });
});

/* Particle FX Class */
class SparkFX {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.radius = Math.random() * 3 + 2;
    this.vx = (Math.random() - 0.5) * 6;
    this.vy = (Math.random() - 0.5) * 6;
    this.alpha = 1;
    this.decay = 0.03;
  }
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.alpha -= this.decay;
  }
  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.alpha);
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

/* ==========================================================
   GAME 1: FLAPPY PHOENIX
========================================================== */
let flappyActive = false, fBirdY = 200, fBirdV = 0, fPipes = [], fScore = 0, fAnimId = null;
let birdWingAngle = 0;
const fCanvas = document.getElementById("flappyCanvas");

function startFlappyGame() {
  if (!fCanvas) return;
  ensureCanvasDimensions(fCanvas);

  fBirdY = fCanvas.height / 2;
  fBirdV = -5;
  fPipes = [];
  fScore = 0;
  flappyActive = true;

  document.getElementById("flappyScore").innerText = "0";
  document.getElementById("flappyDiff").innerText = "1.0x";
  
  // Hide overlay explicitly
  const overlay = document.getElementById("flappyOverlay");
  overlay.classList.remove("active");
  overlay.style.display = "none";

  cancelAnimationFrame(fAnimId);
  loopFlappy();
}

function flapWing() {
  if (flappyActive) {
    fBirdV = -6.5;
  } else {
    startFlappyGame();
  }
}

// Click on Canvas to Flap
fCanvas?.addEventListener("click", flapWing);
fCanvas?.addEventListener("touchstart", (e) => {
  e.preventDefault();
  flapWing();
}, { passive: false });

window.addEventListener("keydown", (e) => {
  if (e.code === "Space" && document.getElementById("flappyView")?.classList.contains("active")) {
    e.preventDefault();
    flapWing();
  }
});

function drawAnimatedBird(ctx, x, y, vy, wingCycle) {
  ctx.save();
  ctx.translate(x, y);
  const angle = Math.min(Math.max(vy * 0.05, -0.5), 0.6);
  ctx.rotate(angle);

  // Flaming Tail
  ctx.fillStyle = "#ff003c";
  ctx.beginPath();
  ctx.moveTo(-16, 0);
  ctx.lineTo(-30, -5 + Math.sin(wingCycle) * 4);
  ctx.lineTo(-30, 5 - Math.sin(wingCycle) * 4);
  ctx.fill();

  // Body Core
  ctx.fillStyle = "#00d4ff";
  ctx.shadowColor = "#00d4ff";
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.ellipse(0, 0, 16, 11, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Animated Wing
  const wingY = Math.sin(wingCycle) * 12;
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.moveTo(-4, 0);
  ctx.lineTo(4, wingY);
  ctx.lineTo(12, 0);
  ctx.fill();

  // Eye & Beak
  ctx.fillStyle = "#ff003c";
  ctx.beginPath();
  ctx.arc(8, -2, 2.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#ffbe0b";
  ctx.beginPath();
  ctx.moveTo(14, -2);
  ctx.lineTo(24, 1);
  ctx.lineTo(14, 4);
  ctx.fill();

  ctx.restore();
}

function loopFlappy() {
  if (!flappyActive) return;
  const ctx = fCanvas.getContext("2d");
  ctx.clearRect(0, 0, fCanvas.width, fCanvas.height);

  const speed = 3.2 + Math.min(fScore * 0.15, 4.5);
  document.getElementById("flappyDiff").innerText = `${(speed / 3.2).toFixed(1)}x`;

  fBirdV += 0.35;
  fBirdY += fBirdV;
  birdWingAngle += 0.25;

  drawAnimatedBird(ctx, 80, fBirdY, fBirdV, birdWingAngle);

  // Spawn Gates
  if (fPipes.length === 0 || fPipes[fPipes.length - 1].x < fCanvas.width - 220) {
    const gap = Math.max(125 - fScore * 1.5, 95);
    const topH = Math.random() * (fCanvas.height - gap - 100) + 40;
    fPipes.push({ x: fCanvas.width, top: topH, bottom: topH + gap, passed: false });
  }

  for (let i = 0; i < fPipes.length; i++) {
    let p = fPipes[i];
    p.x -= speed;

    // Neon Pillars
    ctx.fillStyle = "#ff003c";
    ctx.fillRect(p.x, 0, 46, p.top);
    ctx.fillStyle = "#00d4ff";
    ctx.fillRect(p.x, p.bottom, 46, fCanvas.height - p.bottom);

    // Collision Check
    if (80 + 14 > p.x && 80 - 14 < p.x + 46) {
      if (fBirdY - 10 < p.top || fBirdY + 10 > p.bottom) {
        return endFlappy();
      }
    }

    if (!p.passed && p.x < 80) {
      p.passed = true;
      fScore++;
      document.getElementById("flappyScore").innerText = fScore;
    }
  }

  // Bounds
  if (fBirdY > fCanvas.height - 15 || fBirdY < 15) return endFlappy();

  fPipes = fPipes.filter((p) => p.x > -60);
  fAnimId = requestAnimationFrame(loopFlappy);
}

function endFlappy() {
  flappyActive = false;
  const overlay = document.getElementById("flappyOverlay");
  overlay.style.display = "flex";
  overlay.innerHTML = `
    <h3>ENERGY SEVERED</h3>
    <p>Cleared Gateways: <strong>${fScore}</strong></p>
    <button class="spark-btn btn-primary btn-launch" onclick="startFlappyGame()">Flight Again</button>
  `;
}

/* ==========================================================
   GAME 2: NEON SHINOBI RUNNER
========================================================== */
let runnerActive = false, rY = 0, rV = 0, rJumpsLeft = 2, rObs = [], rScore = 0, rAnimId = null;
let runCycle = 0;
const rCanvas = document.getElementById("runnerCanvas");

function startRunnerGame() {
  if (!rCanvas) return;
  ensureCanvasDimensions(rCanvas);

  rY = 0; rV = 0; rJumpsLeft = 2; rObs = []; rScore = 0;
  runnerActive = true;
  document.getElementById("runnerScore").innerText = "0m";
  document.getElementById("jumpStatus").innerText = "DOUBLE READY";

  const overlay = document.getElementById("runnerOverlay");
  overlay.classList.remove("active");
  overlay.style.display = "none";

  cancelAnimationFrame(rAnimId);
  loopRunner();
}

function runnerJumpAction() {
  if (!runnerActive) return startRunnerGame();
  if (rJumpsLeft > 0) {
    rV = 11.5;
    rJumpsLeft--;
    document.getElementById("jumpStatus").innerText = rJumpsLeft === 1 ? "1 JUMP LEFT" : "DEPLETED";
  }
}

rCanvas?.addEventListener("click", runnerJumpAction);
rCanvas?.addEventListener("touchstart", (e) => {
  e.preventDefault();
  runnerJumpAction();
}, { passive: false });

window.addEventListener("keydown", (e) => {
  if (e.code === "Space" && document.getElementById("runnerView")?.classList.contains("active")) {
    e.preventDefault();
    runnerJumpAction();
  }
});

function drawShinobi(ctx, x, y, cycle, inAir) {
  ctx.save();
  ctx.translate(x, y);

  // Red Scarf
  ctx.strokeStyle = "#ff003c";
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(-8, -20);
  ctx.lineTo(-24, -20 + Math.sin(cycle) * 5);
  ctx.lineTo(-34, -16);
  ctx.stroke();

  // Torso
  ctx.fillStyle = "#00d4ff";
  ctx.fillRect(-8, -24, 16, 18);

  // Head
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(0, -30, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ff003c";
  ctx.fillRect(-2, -32, 7, 3);

  // Limbs
  ctx.strokeStyle = "#00d4ff";
  ctx.lineWidth = 3;
  if (!inAir) {
    const l1 = Math.sin(cycle) * 11;
    const l2 = -Math.sin(cycle) * 11;
    ctx.beginPath(); ctx.moveTo(-4, -6); ctx.lineTo(-8, 6 + l1); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(4, -6); ctx.lineTo(8, 6 + l2); ctx.stroke();
  } else {
    ctx.beginPath(); ctx.moveTo(-4, -6); ctx.lineTo(-12, 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(4, -6); ctx.lineTo(12, 2); ctx.stroke();
  }
  ctx.restore();
}

function loopRunner() {
  if (!runnerActive) return;
  const ctx = rCanvas.getContext("2d");
  ctx.clearRect(0, 0, rCanvas.width, rCanvas.height);

  const groundY = rCanvas.height - 40;
  const speed = 5.8 + Math.min((rScore / 40) * 0.45, 6.5);

  rY += rV;
  if (rY > 0) {
    rV -= 0.54;
  } else {
    rY = 0; rV = 0; rJumpsLeft = 2;
    document.getElementById("jumpStatus").innerText = "DOUBLE READY";
  }

  runCycle += 0.25;

  // Ground
  ctx.strokeStyle = "rgba(0, 212, 255, 0.4)";
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, groundY); ctx.lineTo(rCanvas.width, groundY); ctx.stroke();

  // Draw Shinobi
  drawShinobi(ctx, 70, groundY - rY, runCycle, rY > 0);

  // Spikes
  if (rObs.length === 0 || rObs[rObs.length - 1].x < rCanvas.width - 240) {
    if (Math.random() < 0.6) {
      rObs.push({ x: rCanvas.width, w: 22, h: Math.random() * 26 + 26 });
    }
  }

  for (let i = 0; i < rObs.length; i++) {
    let o = rObs[i];
    o.x -= speed;

    ctx.fillStyle = "#ff003c";
    ctx.fillRect(o.x, groundY - o.h, o.w, o.h);

    if (70 + 10 > o.x && 70 - 10 < o.x + o.w && rY < o.h) {
      runnerActive = false;
      const overlay = document.getElementById("runnerOverlay");
      overlay.style.display = "flex";
      overlay.innerHTML = `
        <h3>SHINOBI FALLEN</h3>
        <p>Distance: <strong>${Math.floor(rScore / 4)}m</strong></p>
        <button class="spark-btn btn-primary btn-launch" onclick="startRunnerGame()">Run Again</button>
      `;
      return;
    }
  }

  rScore++;
  document.getElementById("runnerScore").innerText = `${Math.floor(rScore / 4)}m`;
  rObs = rObs.filter((o) => o.x > -40);
  rAnimId = requestAnimationFrame(loopRunner);
}

/* ==========================================================
   GAME 3: VOID STRIKER ULTRA
========================================================== */
let spaceActive = false, sShipX = 200, sBullets = [], sEnemies = [], sScore = 0, sStreak = 0;
let sAnimId = null, sBlastFx = [], lastShotTime = 0;
const sCanvas = document.getElementById("spaceCanvas");

function startSpaceGame() {
  if (!sCanvas) return;
  ensureCanvasDimensions(sCanvas);

  sShipX = sCanvas.width / 2;
  sBullets = [];
  sEnemies = [];
  sBlastFx = [];
  sScore = 0;
  sStreak = 0;
  spaceActive = true;

  document.getElementById("spaceScore").innerText = "0";
  document.getElementById("spaceCombo").innerText = "x0";
  document.getElementById("abilityMeter").innerText = "NORMAL";

  const overlay = document.getElementById("spaceOverlay");
  overlay.classList.remove("active");
  overlay.style.display = "none";

  cancelAnimationFrame(sAnimId);
  loopSpace();
}

function updateShipPos(clientX) {
  const rect = sCanvas.getBoundingClientRect();
  sShipX = Math.max(25, Math.min(sCanvas.width - 25, clientX - rect.left));
}

sCanvas?.addEventListener("pointermove", (e) => updateShipPos(e.clientX));
sCanvas?.addEventListener("touchmove", (e) => {
  e.preventDefault();
  updateShipPos(e.touches[0].clientX);
}, { passive: false });

function loopSpace() {
  if (!spaceActive) return;
  const ctx = sCanvas.getContext("2d");
  ctx.clearRect(0, 0, sCanvas.width, sCanvas.height);

  const now = Date.now();
  // Continuous Auto-Fire
  const rate = sStreak >= 15 ? 130 : 210;
  if (now - lastShotTime > rate) {
    lastShotTime = now;
    if (sStreak >= 15) {
      document.getElementById("abilityMeter").innerText = "OVERDRIVE ⚡";
      sBullets.push({ x: sShipX - 16, y: sCanvas.height - 45, vx: -1.2, color: "#ff003c" });
      sBullets.push({ x: sShipX - 6, y: sCanvas.height - 45, vx: 0, color: "#00d4ff" });
      sBullets.push({ x: sShipX + 6, y: sCanvas.height - 45, vx: 0, color: "#00d4ff" });
      sBullets.push({ x: sShipX + 16, y: sCanvas.height - 45, vx: 1.2, color: "#ff003c" });
    } else if (sStreak >= 8) {
      document.getElementById("abilityMeter").innerText = "TRIPLE BEAM";
      sBullets.push({ x: sShipX - 12, y: sCanvas.height - 45, vx: -1.4, color: "#ff003c" });
      sBullets.push({ x: sShipX, y: sCanvas.height - 45, vx: 0, color: "#00d4ff" });
      sBullets.push({ x: sShipX + 12, y: sCanvas.height - 45, vx: 1.4, color: "#ff003c" });
    } else {
      document.getElementById("abilityMeter").innerText = "DUAL LASER";
      sBullets.push({ x: sShipX - 8, y: sCanvas.height - 45, vx: 0, color: "#00d4ff" });
      sBullets.push({ x: sShipX + 8, y: sCanvas.height - 45, vx: 0, color: "#00d4ff" });
    }
  }

  // Draw Player
  ctx.fillStyle = "#00d4ff";
  ctx.beginPath();
  ctx.moveTo(sShipX, sCanvas.height - 48);
  ctx.lineTo(sShipX - 20, sCanvas.height - 12);
  ctx.lineTo(sShipX + 20, sCanvas.height - 12);
  ctx.fill();

  // Bullets
  sBullets.forEach((b) => {
    b.y -= 10;
    b.x += b.vx;
    ctx.fillStyle = b.color;
    ctx.fillRect(b.x - 2, b.y, 4, 15);
  });

  // Spawn Enemy
  if (Math.random() < 0.04) {
    sEnemies.push({
      x: Math.random() * (sCanvas.width - 40) + 20,
      y: -20,
      r: 15,
      speed: 2.6 + Math.min(sScore * 0.008, 4)
    });
  }

  // FX update
  sBlastFx.forEach((p, idx) => {
    p.update();
    p.draw(ctx);
    if (p.alpha <= 0) sBlastFx.splice(idx, 1);
  });

  // Enemy update & Collision
  for (let eIdx = sEnemies.length - 1; eIdx >= 0; eIdx--) {
    let en = sEnemies[eIdx];
    en.y += en.speed;

    ctx.fillStyle = "#ff003c";
    ctx.beginPath();
    ctx.arc(en.x, en.y, en.r, 0, Math.PI * 2);
    ctx.fill();

    sBullets.forEach((b, bIdx) => {
      if (Math.hypot(b.x - en.x, b.y - en.y) < en.r + 5) {
        for (let k = 0; k < 12; k++) {
          sBlastFx.push(new SparkFX(en.x, en.y, "#ff003c"));
        }
        sEnemies.splice(eIdx, 1);
        sBullets.splice(bIdx, 1);
        sScore += 10;
        sStreak++;
        document.getElementById("spaceScore").innerText = sScore;
        document.getElementById("spaceCombo").innerText = `x${sStreak}`;
      }
    });

    // Miss Penalty: Ability Reset
    if (en.y > sCanvas.height) {
      sEnemies.splice(eIdx, 1);
      sStreak = 0;
      document.getElementById("spaceCombo").innerText = "x0 (RESET!)";
      document.getElementById("abilityMeter").innerText = "NORMAL";
    }
  }

  sBullets = sBullets.filter((b) => b.y > -20);
  sAnimId = requestAnimationFrame(loopSpace);
}

/* ==========================================================
   GAME 4: CYBER BLADE SLASH
========================================================== */
let bladeActive = false, bladeScore = 0, bladeTargets = [], bladeTrail = [], bAnimId = null;
const bCanvas = document.getElementById("bladeCanvas");

function startBladeGame() {
  if (!bCanvas) return;
  ensureCanvasDimensions(bCanvas);

  bladeScore = 0;
  bladeTargets = [];
  bladeTrail = [];
  bladeActive = true;

  document.getElementById("bladeScore").innerText = "0";
  const overlay = document.getElementById("bladeOverlay");
  overlay.classList.remove("active");
  overlay.style.display = "none";

  cancelAnimationFrame(bAnimId);
  loopBlade();
}

function handleBladeSwipe(clientX, clientY) {
  const rect = bCanvas.getBoundingClientRect();
  const x = clientX - rect.left;
  const y = clientY - rect.top;
  bladeTrail.push({ x, y, alpha: 1 });

  for (let i = bladeTargets.length - 1; i >= 0; i--) {
    let t = bladeTargets[i];
    if (Math.hypot(t.x - x, t.y - y) < t.r) {
      for (let k = 0; k < 14; k++) {
        bladeTrail.push(new SparkFX(t.x, t.y, t.color));
      }
      bladeTargets.splice(i, 1);
      bladeScore++;
      document.getElementById("bladeScore").innerText = bladeScore;
    }
  }
}

bCanvas?.addEventListener("pointermove", (e) => {
  if (bladeActive) handleBladeSwipe(e.clientX, e.clientY);
});
bCanvas?.addEventListener("touchmove", (e) => {
  e.preventDefault();
  if (bladeActive) handleBladeSwipe(e.touches[0].clientX, e.touches[0].clientY);
}, { passive: false });

function loopBlade() {
  if (!bladeActive) return;
  const ctx = bCanvas.getContext("2d");
  ctx.clearRect(0, 0, bCanvas.width, bCanvas.height);

  if (Math.random() < 0.04) {
    bladeTargets.push({
      x: Math.random() * (bCanvas.width - 80) + 40,
      y: bCanvas.height + 20,
      vx: (Math.random() - 0.5) * 4,
      vy: -(Math.random() * 4 + 11),
      r: 22,
      color: Math.random() > 0.5 ? "#00d4ff" : "#ff003c"
    });
  }

  for (let i = bladeTargets.length - 1; i >= 0; i--) {
    let t = bladeTargets[i];
    t.x += t.vx;
    t.y += t.vy;
    t.vy += 0.28;

    ctx.fillStyle = t.color;
    ctx.beginPath();
    ctx.arc(t.x, t.y, t.r, 0, Math.PI * 2);
    ctx.fill();

    if (t.y > bCanvas.height + 60 && t.vy > 0) {
      bladeTargets.splice(i, 1);
    }
  }

  if (bladeTrail.length > 1) {
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (let i = 0; i < bladeTrail.length; i++) {
      let pt = bladeTrail[i];
      if (i === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
      pt.alpha -= 0.05;
    }
    ctx.stroke();
  }
  bladeTrail = bladeTrail.filter((pt) => pt.alpha > 0);

  bAnimId = requestAnimationFrame(loopBlade);
}

/* ==========================================================
   GAME 5: QUANTUM ORBIT SHIELD
========================================================== */
let orbitActive = false, orbitScore = 0, coreHp = 100, shieldAngle = 0, incomingLasers = [], oAnimId = null;
const oCanvas = document.getElementById("orbitCanvas");

function startOrbitGame() {
  if (!oCanvas) return;
  ensureCanvasDimensions(oCanvas);

  orbitScore = 0;
  coreHp = 100;
  incomingLasers = [];
  shieldAngle = 0;
  orbitActive = true;

  document.getElementById("orbitScore").innerText = "0";
  document.getElementById("coreHealth").innerText = "100%";

  const overlay = document.getElementById("orbitOverlay");
  overlay.classList.remove("active");
  overlay.style.display = "none";

  cancelAnimationFrame(oAnimId);
  loopOrbit();
}

function updateShieldAngle(clientX, clientY) {
  const rect = oCanvas.getBoundingClientRect();
  const cx = oCanvas.width / 2;
  const cy = oCanvas.height / 2;
  shieldAngle = Math.atan2(clientY - rect.top - cy, clientX - rect.left - cx);
}

oCanvas?.addEventListener("pointermove", (e) => updateShieldAngle(e.clientX, e.clientY));
oCanvas?.addEventListener("touchmove", (e) => {
  e.preventDefault();
  updateShieldAngle(e.touches[0].clientX, e.touches[0].clientY);
}, { passive: false });

function loopOrbit() {
  if (!orbitActive) return;
  const ctx = oCanvas.getContext("2d");
  ctx.clearRect(0, 0, oCanvas.width, oCanvas.height);

  const cx = oCanvas.width / 2;
  const cy = oCanvas.height / 2;

  // Center Core
  ctx.fillStyle = "#00d4ff";
  ctx.beginPath();
  ctx.arc(cx, cy, 24, 0, Math.PI * 2);
  ctx.fill();

  // Shield Arc
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(cx, cy, 58, shieldAngle - 0.6, shieldAngle + 0.6);
  ctx.stroke();

  // Spawn Lasers
  if (Math.random() < 0.045) {
    const ang = Math.random() * Math.PI * 2;
    const dist = Math.hypot(cx, cy) + 40;
    incomingLasers.push({
      x: cx + Math.cos(ang) * dist,
      y: cy + Math.sin(ang) * dist,
      speed: 3.2 + Math.min(orbitScore * 0.1, 4.0)
    });
  }

  for (let i = incomingLasers.length - 1; i >= 0; i--) {
    let l = incomingLasers[i];
    const angleToCore = Math.atan2(cy - l.y, cx - l.x);
    l.x += Math.cos(angleToCore) * l.speed;
    l.y += Math.sin(angleToCore) * l.speed;

    ctx.fillStyle = "#ff003c";
    ctx.beginPath();
    ctx.arc(l.x, l.y, 6, 0, Math.PI * 2);
    ctx.fill();

    const distToCore = Math.hypot(cx - l.x, cy - l.y);

    // Deflect check
    if (distToCore <= 62 && distToCore >= 52) {
      const hitAngle = Math.atan2(l.y - cy, l.x - cx);
      let diff = Math.abs(shieldAngle - hitAngle);
      while (diff > Math.PI) diff -= Math.PI * 2;
      diff = Math.abs(diff);

      if (diff < 0.6) {
        incomingLasers.splice(i, 1);
        orbitScore++;
        document.getElementById("orbitScore").innerText = orbitScore;
        continue;
      }
    }

    // Core Hit
    if (distToCore < 24) {
      incomingLasers.splice(i, 1);
      coreHp -= 20;
      document.getElementById("coreHealth").innerText = `${coreHp}%`;
      if (coreHp <= 0) {
        orbitActive = false;
        const overlay = document.getElementById("orbitOverlay");
        overlay.style.display = "flex";
        overlay.innerHTML = `
          <h3>CORE COMPROMISED</h3>
          <p>Lasers Deflected: <strong>${orbitScore}</strong></p>
          <button class="spark-btn btn-primary btn-launch" onclick="startOrbitGame()">Reactivate</button>
        `;
        return;
      }
    }
  }

  oAnimId = requestAnimationFrame(loopOrbit);
}
