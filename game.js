/* ==========================================================
   ARCADE MASTER ENGINE & TAB SWITCHER
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

// Global Blast Particles Array for Impact FX
class BlastParticle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.radius = Math.random() * 3 + 2;
    this.vx = (Math.random() - 0.5) * 8;
    this.vy = (Math.random() - 0.5) * 8;
    this.alpha = 1;
    this.decay = Math.random() * 0.03 + 0.02;
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
   GAME 1: FLAPPY PHOENIX (PROCEDURAL ANIMATED BIRD)
========================================================== */
let flappyActive = false, fBirdY = 200, fBirdV = 0, fPipes = [], fScore = 0, fAnimId = null;
let birdWingAngle = 0, birdExhaust = [];
const fCanvas = document.getElementById("flappyCanvas");

function startFlappyGame() {
  if (!fCanvas) return;
  fitActiveGameCanvas();

  fBirdY = fCanvas.height / 2;
  fBirdV = -5;
  fPipes = [];
  fScore = 0;
  birdExhaust = [];
  flappyActive = true;

  document.getElementById("flappyScore").innerText = "0";
  document.getElementById("flappyDiff").innerText = "1.0x";
  document.getElementById("flappyOverlay").classList.remove("active");

  cancelAnimationFrame(fAnimId);
  loopFlappy();
}

function flapWing() {
  if (flappyActive) {
    fBirdV = -6.2;
    // Wing thrust bursts
    for (let i = 0; i < 6; i++) {
      birdExhaust.push(new BlastParticle(70, fBirdY, "#00d4ff"));
    }
  } else {
    startFlappyGame();
  }
}

fCanvas?.addEventListener("pointerdown", (e) => { e.preventDefault(); flapWing(); });
window.addEventListener("keydown", (e) => {
  if (e.code === "Space" && document.getElementById("flappyView")?.classList.contains("active")) {
    e.preventDefault();
    flapWing();
  }
});

function drawAnimatedPhoenix(ctx, x, y, angle, wingCycle) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  // Flaming Tail Particles
  ctx.fillStyle = "#ff003c";
  ctx.beginPath();
  ctx.moveTo(-18, 0);
  ctx.lineTo(-32, -6 + Math.sin(wingCycle) * 4);
  ctx.lineTo(-32, 6 - Math.sin(wingCycle) * 4);
  ctx.closePath();
  ctx.fill();

  // Torso / Core Body (Cyan Luminescent Bird)
  ctx.fillStyle = "#00d4ff";
  ctx.shadowColor = "#00d4ff";
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.ellipse(0, 0, 18, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Animated Wing
  const wingY = Math.sin(wingCycle) * 14;
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.moveTo(-4, 0);
  ctx.lineTo(6, wingY);
  ctx.lineTo(14, 0);
  ctx.closePath();
  ctx.fill();

  // Glowing Eye
  ctx.fillStyle = "#ff003c";
  ctx.beginPath();
  ctx.arc(8, -3, 3, 0, Math.PI * 2);
  ctx.fill();

  // Sharp Plasma Beak
  ctx.fillStyle = "#ffbe0b";
  ctx.beginPath();
  ctx.moveTo(16, -2);
  ctx.lineTo(26, 1);
  ctx.lineTo(16, 4);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

function loopFlappy() {
  if (!flappyActive) return;
  const ctx = fCanvas.getContext("2d");
  ctx.clearRect(0, 0, fCanvas.width, fCanvas.height);

  const speed = 3.2 + Math.min(fScore * 0.16, 5.0);
  document.getElementById("flappyDiff").innerText = `${(speed / 3.2).toFixed(1)}x`;

  fBirdV += 0.32;
  fBirdY += fBirdV;
  birdWingAngle += 0.25;

  // Exhaust Update
  birdExhaust.forEach((p, idx) => {
    p.update();
    p.draw(ctx);
    if (p.alpha <= 0) birdExhaust.splice(idx, 1);
  });

  // Render Bird
  const pitchAngle = Math.min(Math.max(fBirdV * 0.06, -0.6), 0.7);
  drawAnimatedPhoenix(ctx, 80, fBirdY, pitchAngle, birdWingAngle);

  // Gates Generation
  if (fPipes.length === 0 || fPipes[fPipes.length - 1].x < fCanvas.width - 220) {
    const gap = Math.max(120 - fScore * 1.5, 90);
    const topH = Math.random() * (fCanvas.height - gap - 100) + 40;
    fPipes.push({ x: fCanvas.width, top: topH, bottom: topH + gap, passed: false });
  }

  for (let i = 0; i < fPipes.length; i++) {
    let p = fPipes[i];
    p.x -= speed;

    // Laser Boundary Pillars
    ctx.fillStyle = "#ff003c";
    ctx.fillRect(p.x, 0, 48, p.top);
    ctx.fillStyle = "#00d4ff";
    ctx.fillRect(p.x, p.bottom, 48, fCanvas.height - p.bottom);

    // Collision Check with hitbox padding
    if (80 + 16 > p.x && 80 - 16 < p.x + 48) {
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

  if (fBirdY > fCanvas.height - 15 || fBirdY < 15) return endFlappy();

  fPipes = fPipes.filter((p) => p.x > -60);
  fAnimId = requestAnimationFrame(loopFlappy);
}

function endFlappy() {
  flappyActive = false;
  const o = document.getElementById("flappyOverlay");
  o.innerHTML = `<h3>ENERGY SEVERED</h3><p>Cleared Gateways: <strong>${fScore}</strong></p><button class="spark-btn btn-primary btn-launch" onclick="startFlappyGame()">Flight Again</button>`;
  o.classList.add("active");
}

/* ==========================================================
   GAME 2: NEON SHINOBI RUNNER (DOUBLE JUMP + PARTICLES)
========================================================== */
let runnerActive = false, rY = 0, rV = 0, rJumpsLeft = 2, rObs = [], rScore = 0, rAnimId = null;
let runCycle = 0, runnerDust = [];
const rCanvas = document.getElementById("runnerCanvas");

function startRunnerGame() {
  if (!rCanvas) return;
  fitActiveGameCanvas();

  rY = 0; rV = 0; rJumpsLeft = 2; rObs = []; rScore = 0; runnerDust = [];
  runnerActive = true;
  document.getElementById("runnerScore").innerText = "0m";
  document.getElementById("jumpStatus").innerText = "DOUBLE READY";
  document.getElementById("runnerOverlay").classList.remove("active");

  cancelAnimationFrame(rAnimId);
  loopRunner();
}

function runnerJumpAction() {
  if (!runnerActive) return startRunnerGame();
  if (rJumpsLeft > 0) {
    rV = 11;
    rJumpsLeft--;
    document.getElementById("jumpStatus").innerText = rJumpsLeft === 1 ? "1 JUMP LEFT" : "DEPLETED";
    for (let i = 0; i < 8; i++) {
      runnerDust.push(new BlastParticle(70, rCanvas.height - 40 - rY, "#00d4ff"));
    }
  }
}

rCanvas?.addEventListener("pointerdown", (e) => { e.preventDefault(); runnerJumpAction(); });
window.addEventListener("keydown", (e) => {
  if (e.code === "Space" && document.getElementById("runnerView")?.classList.contains("active")) {
    e.preventDefault();
    runnerJumpAction();
  }
});

function drawAnimatedShinobi(ctx, x, y, cycle, inAir) {
  ctx.save();
  ctx.translate(x, y);

  // Scarf / Cyber Trail
  ctx.strokeStyle = "#ff003c";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-10, -22);
  ctx.quadraticCurveTo(-26, -22 + Math.sin(cycle) * 6, -38, -18);
  ctx.stroke();

  // Torso
  ctx.fillStyle = "#00d4ff";
  ctx.fillRect(-8, -26, 16, 20);

  // Cyber Visor / Head
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(0, -32, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ff003c";
  ctx.fillRect(-2, -34, 8, 3); // Glow visor

  // Running Limbs
  ctx.strokeStyle = "#00d4ff";
  ctx.lineWidth = 3.5;
  if (!inAir) {
    const leg1 = Math.sin(cycle) * 12;
    const leg2 = -Math.sin(cycle) * 12;
    ctx.beginPath(); ctx.moveTo(-4, -6); ctx.lineTo(-8, 6 + leg1); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(4, -6); ctx.lineTo(8, 6 + leg2); ctx.stroke();
  } else {
    // Tucked Ninja Jump
    ctx.beginPath(); ctx.moveTo(-4, -6); ctx.lineTo(-12, 0); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(4, -6); ctx.lineTo(12, 0); ctx.stroke();
  }

  ctx.restore();
}

function loopRunner() {
  if (!runnerActive) return;
  const ctx = rCanvas.getContext("2d");
  ctx.clearRect(0, 0, rCanvas.width, rCanvas.height);

  const groundY = rCanvas.height - 40;
  const speed = 5.6 + Math.min((rScore / 40) * 0.45, 6.5);

  rY += rV;
  if (rY > 0) {
    rV -= 0.52;
  } else {
    rY = 0; rV = 0; rJumpsLeft = 2;
    document.getElementById("jumpStatus").innerText = "DOUBLE READY";
  }

  runCycle += 0.25;

  // Render Neon Ground
  ctx.strokeStyle = "rgba(0, 212, 255, 0.4)";
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, groundY); ctx.lineTo(rCanvas.width, groundY); ctx.stroke();

  // Dust FX
  runnerDust.forEach((d, idx) => {
    d.update();
    d.draw(ctx);
    if (d.alpha <= 0) runnerDust.splice(idx, 1);
  });

  // Render Shinobi
  drawAnimatedShinobi(ctx, 70, groundY - rY, runCycle, rY > 0);

  // Spawning Spikes/Barriers
  if (rObs.length === 0 || rObs[rObs.length - 1].x < rCanvas.width - 240) {
    if (Math.random() < 0.6) {
      rObs.push({ x: rCanvas.width, w: 22, h: Math.random() * 28 + 26 });
    }
  }

  for (let i = 0; i < rObs.length; i++) {
    let o = rObs[i];
    o.x -= speed;

    ctx.fillStyle = "#ff003c";
    ctx.fillRect(o.x, groundY - o.h, o.w, o.h);

    // Collision Check
    if (70 + 10 > o.x && 70 - 10 < o.x + o.w && rY < o.h) {
      runnerActive = false;
      const ov = document.getElementById("runnerOverlay");
      ov.innerHTML = `<h3>SHINOBI FALLEN</h3><p>Distance Cleared: <strong>${Math.floor(rScore / 4)}m</strong></p><button class="spark-btn btn-primary btn-launch" onclick="startRunnerGame()">Run Again</button>`;
      ov.classList.add("active");
      return;
    }
  }

  rScore++;
  document.getElementById("runnerScore").innerText = `${Math.floor(rScore / 4)}m`;
  rObs = rObs.filter((o) => o.x > -40);
  rAnimId = requestAnimationFrame(loopRunner);
}

/* ==========================================================
   GAME 3: VOID STRIKER ULTRA (AUTO-FIRE + ABILITY STREAK)
========================================================== */
let spaceActive = false, sShipX = 200, sBullets = [], sEnemies = [], sScore = 0, sStreak = 0;
let sAnimId = null, sBlastFx = [], lastShotTime = 0;
const sCanvas = document.getElementById("spaceCanvas");

function startSpaceGame() {
  if (!sCanvas) return;
  fitActiveGameCanvas();

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
  document.getElementById("spaceOverlay").classList.remove("active");

  cancelAnimationFrame(sAnimId);
  loopSpace();
}

function updateShipPos(clientX) {
  const rect = sCanvas.getBoundingClientRect();
  sShipX = Math.max(25, Math.min(sCanvas.width - 25, clientX - rect.left));
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
  // Auto-Laser Firing Loop
  const fireRate = sStreak >= 15 ? 130 : 210; // Overdrive fire rate
  if (now - lastShotTime > fireRate) {
    lastShotTime = now;
    if (sStreak >= 15) {
      document.getElementById("abilityMeter").innerText = "OVERDRIVE ⚡";
      sBullets.push({ x: sShipX - 16, y: sCanvas.height - 45, vx: -1.2, color: "#ff003c" });
      sBullets.push({ x: sShipX - 6, y: sCanvas.height - 45, vx: 0, color: "#00d4ff" });
      sBullets.push({ x: sShipX + 6, y: sCanvas.height - 45, vx: 0, color: "#00d4ff" });
      sBullets.push({ x: sShipX + 16, y: sCanvas.height - 45, vx: 1.2, color: "#ff003c" });
    } else if (sStreak >= 8) {
      document.getElementById("abilityMeter").innerText = "TRIPLE SPREAD";
      sBullets.push({ x: sShipX - 12, y: sCanvas.height - 45, vx: -1.4, color: "#ff003c" });
      sBullets.push({ x: sShipX, y: sCanvas.height - 45, vx: 0, color: "#00d4ff" });
      sBullets.push({ x: sShipX + 12, y: sCanvas.height - 45, vx: 1.4, color: "#ff003c" });
    } else {
      document.getElementById("abilityMeter").innerText = "DUAL BEAM";
      sBullets.push({ x: sShipX - 8, y: sCanvas.height - 45, vx: 0, color: "#00d4ff" });
      sBullets.push({ x: sShipX + 8, y: sCanvas.height - 45, vx: 0, color: "#00d4ff" });
    }
  }

  // Draw Fighter Jet
  ctx.fillStyle = "#00d4ff";
  ctx.beginPath();
  ctx.moveTo(sShipX, sCanvas.height - 48);
  ctx.lineTo(sShipX - 20, sCanvas.height - 12);
  ctx.lineTo(sShipX + 20, sCanvas.height - 12);
  ctx.fill();

  // Lasers
  sBullets.forEach((b) => {
    b.y -= 10;
    b.x += b.vx;
    ctx.fillStyle = b.color;
    ctx.fillRect(b.x - 2, b.y, 4, 15);
  });

  // Spawn Enemy Ships
  if (Math.random() < 0.038 + Math.min(sScore * 0.0002, 0.04)) {
    sEnemies.push({
      x: Math.random() * (sCanvas.width - 40) + 20,
      y: -20,
      r: 15,
      speed: 2.6 + Math.min(sScore * 0.008, 3.8)
    });
  }

  // Particle Explosions
  sBlastFx.forEach((p, idx) => {
    p.update();
    p.draw(ctx);
    if (p.alpha <= 0) sBlastFx.splice(idx, 1);
  });

  // Enemies Update
  for (let eIdx = sEnemies.length - 1; eIdx >= 0; eIdx--) {
    let en = sEnemies[eIdx];
    en.y += en.speed;

    ctx.fillStyle = "#ff003c";
    ctx.beginPath();
    ctx.arc(en.x, en.y, en.r, 0, Math.PI * 2);
    ctx.fill();

    // Hit Detection
    sBullets.forEach((b, bIdx) => {
      if (Math.hypot(b.x - en.x, b.y - en.y) < en.r + 5) {
        for (let k = 0; k < 12; k++) {
          sBlastFx.push(new BlastParticle(en.x, en.y, "#ff003c"));
        }
        sEnemies.splice(eIdx, 1);
        sBullets.splice(bIdx, 1);
        sScore += 10;
        sStreak++;
        document.getElementById("spaceScore").innerText = sScore;
        document.getElementById("spaceCombo").innerText = `x${sStreak}`;
      }
    });

    // Enemy Escaped! Streak Reset Penalty
    if (en.y > sCanvas.height) {
      sEnemies.splice(eIdx, 1);
      sStreak = 0; // Ability reset when enemy escapes
      document.getElementById("spaceCombo").innerText = "x0 (RESET!)";
      document.getElementById("abilityMeter").innerText = "NORMAL";
    }
  }

  sBullets = sBullets.filter((b) => b.y > -20);
  sAnimId = requestAnimationFrame(loopSpace);
}

/* ==========================================================
   GAME 4: CYBER BLADE SLASH (INTERACTIVE SWIPE & PARTICLES)
========================================================== */
let bladeActive = false, bladeScore = 0, bladeTargets = [], bladeTrail = [], bAnimId = null;
const bCanvas = document.getElementById("bladeCanvas");

function startBladeGame() {
  if (!bCanvas) return;
  fitActiveGameCanvas();

  bladeScore = 0;
  bladeTargets = [];
  bladeTrail = [];
  bladeActive = true;

  document.getElementById("bladeScore").innerText = "0";
  document.getElementById("bladeOverlay").classList.remove("active");

  cancelAnimationFrame(bAnimId);
  loopBlade();
}

function handleBladeSwipe(clientX, clientY) {
  const rect = bCanvas.getBoundingClientRect();
  const x = clientX - rect.left;
  const y = clientY - rect.top;
  bladeTrail.push({ x, y, alpha: 1 });

  // Slice Target Check
  for (let i = bladeTargets.length - 1; i >= 0; i--) {
    let t = bladeTargets[i];
    if (Math.hypot(t.x - x, t.y - y) < t.r) {
      for (let k = 0; k < 14; k++) {
        bladeTrail.push(new BlastParticle(t.x, t.y, t.color));
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

function loopBlade() {
  if (!bladeActive) return;
  const ctx = bCanvas.getContext("2d");
  ctx.clearRect(0, 0, bCanvas.width, bCanvas.height);

  // Spawn Launching Quantum Cores
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

  // Update Targets
  for (let i = bladeTargets.length - 1; i >= 0; i--) {
    let t = bladeTargets[i];
    t.x += t.vx;
    t.y += t.vy;
    t.vy += 0.28; // Gravity

    ctx.fillStyle = t.color;
    ctx.shadowColor = t.color;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(t.x, t.y, t.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    if (t.y > bCanvas.height + 60 && t.vy > 0) {
      bladeTargets.splice(i, 1);
    }
  }

  // Draw Glowing Katana Trail
  if (bladeTrail.length > 1) {
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (let i = 0; i < bladeTrail.length; i++) {
      let pt = bladeTrail[i];
      if (i === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
      pt.alpha -= 0.04;
    }
    ctx.stroke();
  }
  bladeTrail = bladeTrail.filter((pt) => pt.alpha > 0);

  bAnimId = requestAnimationFrame(loopBlade);
}

/* ==========================================================
   GAME 5: QUANTUM ORBIT SHIELD (360-DEGREE ROTATING DEFENSE)
========================================================== */
let orbitActive = false, orbitScore = 0, coreHp = 100, shieldAngle = 0, incomingLasers = [], oAnimId = null;
const oCanvas = document.getElementById("orbitCanvas");

function startOrbitGame() {
  if (!oCanvas) return;
  fitActiveGameCanvas();

  orbitScore = 0;
  coreHp = 100;
  incomingLasers = [];
  shieldAngle = 0;
  orbitActive = true;

  document.getElementById("orbitScore").innerText = "0";
  document.getElementById("coreHealth").innerText = "100%";
  document.getElementById("orbitOverlay").classList.remove("active");

  cancelAnimationFrame(oAnimId);
  loopOrbit();
}

oCanvas?.addEventListener("pointermove", (e) => {
  const rect = oCanvas.getBoundingClientRect();
  const cx = oCanvas.width / 2;
  const cy = oCanvas.height / 2;
  shieldAngle = Math.atan2(e.clientY - rect.top - cy, e.clientX - rect.left - cx);
});

function loopOrbit() {
  if (!orbitActive) return;
  const ctx = oCanvas.getContext("2d");
  ctx.clearRect(0, 0, oCanvas.width, oCanvas.height);

  const cx = oCanvas.width / 2;
  const cy = oCanvas.height / 2;

  // Central Vulnerable Core
  ctx.fillStyle = "#00d4ff";
  ctx.shadowColor = "#00d4ff";
  ctx.shadowBlur = 16;
  ctx.beginPath();
  ctx.arc(cx, cy, 24, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Rotating Arc Shield (Blue-Red Beam)
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 6;
  ctx.shadowColor = "#00d4ff";
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.arc(cx, cy, 58, shieldAngle - 0.6, shieldAngle + 0.6);
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Spawn Incoming Lasers from screen edge
  if (Math.random() < 0.045) {
    const ang = Math.random() * Math.PI * 2;
    const dist = Math.hypot(cx, cy) + 40;
    incomingLasers.push({
      x: cx + Math.cos(ang) * dist,
      y: cy + Math.sin(ang) * dist,
      targetAngle: ang,
      speed: 3.2 + Math.min(orbitScore * 0.1, 4.0)
    });
  }

  // Update & Check Deflections
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

    // Shield Deflection Check
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
        const ov = document.getElementById("orbitOverlay");
        ov.innerHTML = `<h3>CORE COMPROMISED</h3><p>Lasers Deflected: <strong>${orbitScore}</strong></p><button class="spark-btn btn-primary btn-launch" onclick="startOrbitGame()">Reactivate</button>`;
        ov.classList.add("active");
        return;
      }
    }
  }

  oAnimId = requestAnimationFrame(loopOrbit);
}
