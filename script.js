/* ==========================================================
   1. NAVIGATION ROUTER (SPA SWITCHER)
========================================================== */
const navTabs = document.querySelectorAll(".nav-tab");
const pageViews = document.querySelectorAll(".page-view");

function switchPage(pageId) {
  navTabs.forEach((tab) => {
    tab.classList.toggle("active", tab.getAttribute("data-target") === pageId);
  });

  pageViews.forEach((view) => {
    view.classList.toggle("active", view.id === pageId);
  });
}

navTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    switchPage(tab.getAttribute("data-target"));
  });
});

/* ==========================================================
   2. BACKGROUND ELECTRIC SPARK CANVAS
========================================================== */
const bgCanvas = document.getElementById("sparkCanvas");
const bgCtx = bgCanvas.getContext("2d");

let bgParticles = [];
let mouse = { x: null, y: null };

function resizeBg() {
  bgCanvas.width = window.innerWidth;
  bgCanvas.height = window.innerHeight;
}
window.addEventListener("resize", resizeBg);
resizeBg();

window.addEventListener("mousemove", (e) => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
});

class BgParticle {
  constructor() {
    this.x = Math.random() * bgCanvas.width;
    this.y = Math.random() * bgCanvas.height;
    this.size = Math.random() * 2 + 1;
    this.vx = (Math.random() - 0.5) * 1.5;
    this.vy = (Math.random() - 0.5) * 1.5;
    this.color = Math.random() > 0.5 ? "#ffbe0b" : "#00f0ff";
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    if (this.x < 0 || this.x > bgCanvas.width) this.vx *= -1;
    if (this.y < 0 || this.y > bgCanvas.height) this.vy *= -1;

    if (mouse.x !== null) {
      let dx = mouse.x - this.x;
      let dy = mouse.y - this.y;
      let dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 120) {
        this.x -= (dx / dist) * 2;
        this.y -= (dy / dist) * 2;
      }
    }
  }

  draw() {
    bgCtx.beginPath();
    bgCtx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    bgCtx.fillStyle = this.color;
    bgCtx.fill();
  }
}

function initBgParticles() {
  bgParticles = [];
  const count = Math.floor((bgCanvas.width * bgCanvas.height) / 18000);
  for (let i = 0; i < count; i++) bgParticles.push(new BgParticle());
}
initBgParticles();

function renderBg() {
  bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
  for (let p of bgParticles) {
    p.update();
    p.draw();
  }
  requestAnimationFrame(renderBg);
}
renderBg();

/* ==========================================================
   3. AI SHOWCASE: NEURAL SYNAPSE SIMULATION
========================================================== */
const aiCanvas = document.getElementById("aiMeshCanvas");
const aiCtx = aiCanvas.getContext("2d");
let aiNodes = [];
let aiWarp = 1;

function resizeAiCanvas() {
  aiCanvas.width = aiCanvas.parentElement.clientWidth;
  aiCanvas.height = aiCanvas.parentElement.clientHeight;
}
window.addEventListener("resize", resizeAiCanvas);
setTimeout(resizeAiCanvas, 100);

class AiNode {
  constructor() {
    this.x = Math.random() * (aiCanvas.width || 400);
    this.y = Math.random() * (aiCanvas.height || 260);
    this.vx = (Math.random() - 0.5) * 1.8;
    this.vy = (Math.random() - 0.5) * 1.8;
    this.radius = Math.random() * 2.5 + 2;
  }
  update() {
    this.x += this.vx * aiWarp;
    this.y += this.vy * aiWarp;
    if (this.x < 0 || this.x > aiCanvas.width) this.vx *= -1;
    if (this.y < 0 || this.y > aiCanvas.height) this.vy *= -1;
  }
  draw() {
    aiCtx.beginPath();
    aiCtx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    aiCtx.fillStyle = "#00f0ff";
    aiCtx.fill();
  }
}

function initAiNodes() {
  aiNodes = [];
  for (let i = 0; i < 45; i++) aiNodes.push(new AiNode());
}
initAiNodes();

function renderAiMesh() {
  aiCtx.clearRect(0, 0, aiCanvas.width, aiCanvas.height);
  for (let a = 0; a < aiNodes.length; a++) {
    aiNodes[a].update();
    aiNodes[a].draw();
    for (let b = a + 1; b < aiNodes.length; b++) {
      let dx = aiNodes[a].x - aiNodes[b].x;
      let dy = aiNodes[a].y - aiNodes[b].y;
      let dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 85) {
        aiCtx.strokeStyle = `rgba(0, 240, 255, ${1 - dist / 85})`;
        aiCtx.lineWidth = 0.8;
        aiCtx.beginPath();
        aiCtx.moveTo(aiNodes[a].x, aiNodes[a].y);
        aiCtx.lineTo(aiNodes[b].x, aiNodes[b].y);
        aiCtx.stroke();
      }
    }
  }
  requestAnimationFrame(renderAiMesh);
}
renderAiMesh();

function burstSynapse() {
  aiNodes.forEach((n) => {
    n.vx = (Math.random() - 0.5) * 6;
    n.vy = (Math.random() - 0.5) * 6;
  });
  logAi("Synaptic burst fired! Weights dynamically recalculated.");
}

function toggleAIWarp() {
  aiWarp = aiWarp === 1 ? 3 : 1;
  logAi(`Inference Warp adjusted: ${aiWarp}x factor.`);
}

function recalibrateWeights() {
  document.getElementById("tensorCount").innerText = (Math.random() * 1000000 + 500000).toFixed(0);
  logAi("Zero-shot loss updated. 99.99% model parity maintained.");
}

function logAi(msg) {
  const terminal = document.getElementById("aiLogTerminal");
  const p = document.createElement("p");
  p.innerText = `> ${msg}`;
  terminal.appendChild(p);
  terminal.scrollTop = terminal.scrollHeight;
}

/* ==========================================================
   4. 5 MINI GAMES SYSTEM
========================================================== */
// Game Switcher Tabs
const gameSelectors = document.querySelectorAll(".game-selector-btn");
const gameScreens = document.querySelectorAll(".game-screen");

gameSelectors.forEach((btn) => {
  btn.addEventListener("click", () => {
    gameSelectors.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    const targetGame = btn.getAttribute("data-game");
    gameScreens.forEach((screen) => {
      screen.classList.toggle("active", screen.id === `${targetGame}Screen`);
    });
  });
});

/* --- GAME 1: REFLEX AIM --- */
let g1Score = 0;
let g1Time = 15;
let g1Active = false;
let g1Timer = null;
const g1Target = document.getElementById("g1Target");
const g1Area = document.getElementById("g1Area");
const g1Overlay = document.getElementById("g1Overlay");

function moveG1() {
  const maxW = g1Area.clientWidth - 70;
  const maxH = g1Area.clientHeight - 70;
  g1Target.style.left = `${Math.random() * maxW + 35}px`;
  g1Target.style.top = `${Math.random() * maxH + 35}px`;
}

document.getElementById("g1StartBtn").addEventListener("click", () => {
  g1Score = 0;
  g1Time = 15;
  g1Active = true;
  document.getElementById("g1Score").innerText = g1Score;
  document.getElementById("g1Time").innerText = `${g1Time}s`;
  g1Overlay.classList.remove("active");
  moveG1();

  clearInterval(g1Timer);
  g1Timer = setInterval(() => {
    g1Time--;
    document.getElementById("g1Time").innerText = `${g1Time}s`;
    if (g1Time <= 0) {
      clearInterval(g1Timer);
      g1Active = false;
      g1Overlay.innerHTML = `<h3>TIME EXPIRED</h3><p>Total Hits: <strong>${g1Score}</strong></p><button class="spark-btn btn-primary" onclick="document.getElementById('g1StartBtn').click()">Play Again</button>`;
      g1Overlay.classList.add("active");
    }
  }, 1000);
});

g1Target.addEventListener("click", () => {
  if (!g1Active) return;
  g1Score++;
  document.getElementById("g1Score").innerText = g1Score;
  moveG1();
});

/* --- GAME 2: NEURAL MEMORY (SIMON SAYS) --- */
let sequence = [];
let playerStep = 0;
const pads = document.querySelectorAll(".mem-pad");
const g2Status = document.getElementById("g2Status");
const g2Level = document.getElementById("g2Level");

function flashPad(id) {
  pads[id].classList.add("lit");
  setTimeout(() => pads[id].classList.remove("lit"), 350);
}

function playSequence() {
  g2Status.innerText = "Observe Sequence...";
  let i = 0;
  const interval = setInterval(() => {
    flashPad(sequence[i]);
    i++;
    if (i >= sequence.length) {
      clearInterval(interval);
      g2Status.innerText = "Your Turn!";
    }
  }, 600);
}

document.getElementById("g2StartBtn").addEventListener("click", () => {
  sequence = [Math.floor(Math.random() * 4)];
  playerStep = 0;
  g2Level.innerText = "1";
  playSequence();
});

pads.forEach((pad) => {
  pad.addEventListener("click", () => {
    if (g2Status.innerText !== "Your Turn!") return;
    const id = +pad.getAttribute("data-id");
    flashPad(id);

    if (id === sequence[playerStep]) {
      playerStep++;
      if (playerStep === sequence.length) {
        g2Status.innerText = "Level Cleared!";
        g2Level.innerText = sequence.length + 1;
        sequence.push(Math.floor(Math.random() * 4));
        playerStep = 0;
        setTimeout(playSequence, 1000);
      }
    } else {
      g2Status.innerText = "Failed! Try again.";
    }
  });
});

/* --- GAME 3: QUANTUM DODGE --- */
const g3Canvas = document.getElementById("g3Canvas");
const g3Ctx = g3Canvas.getContext("2d");
let g3Active = false;
let g3PlayerX = 150;
let obstacles = [];
let g3Score = 0;
let g3AnimId = null;

function fitG3Canvas() {
  g3Canvas.width = g3Canvas.parentElement.clientWidth;
  g3Canvas.height = g3Canvas.parentElement.clientHeight;
}
window.addEventListener("resize", fitG3Canvas);

g3Canvas.parentElement.addEventListener("mousemove", (e) => {
  const rect = g3Canvas.getBoundingClientRect();
  g3PlayerX = e.clientX - rect.left;
});
g3Canvas.parentElement.addEventListener("touchmove", (e) => {
  const rect = g3Canvas.getBoundingClientRect();
  g3PlayerX = e.touches[0].clientX - rect.left;
});

function runG3() {
  if (!g3Active) return;
  g3Ctx.clearRect(0, 0, g3Canvas.width, g3Canvas.height);

  // Player
  g3Ctx.fillStyle = "#00f0ff";
  g3Ctx.beginPath();
  g3Ctx.arc(g3PlayerX, g3Canvas.height - 25, 12, 0, Math.PI * 2);
  g3Ctx.fill();

  // Spawn obstacles
  if (Math.random() < 0.05) {
    obstacles.push({
      x: Math.random() * g3Canvas.width,
      y: -10,
      radius: Math.random() * 12 + 6,
      speed: Math.random() * 3 + 2.5
    });
  }

  // Update Obstacles
  for (let i = 0; i < obstacles.length; i++) {
    let o = obstacles[i];
    o.y += o.speed;
    g3Ctx.fillStyle = "#ff007f";
    g3Ctx.beginPath();
    g3Ctx.arc(o.x, o.y, o.radius, 0, Math.PI * 2);
    g3Ctx.fill();

    // Collision check
    let dx = g3PlayerX - o.x;
    let dy = g3Canvas.height - 25 - o.y;
    if (Math.sqrt(dx * dx + dy * dy) < o.radius + 12) {
      g3Active = false;
      document.getElementById("g3Overlay").innerHTML = `<h3>COLLISION DETECTED</h3><p>Survived: <strong>${g3Score}s</strong></p><button class="spark-btn btn-primary" onclick="document.getElementById('g3StartBtn').click()">Relaunch</button>`;
      document.getElementById("g3Overlay").classList.add("active");
      cancelAnimationFrame(g3AnimId);
      return;
    }
  }

  obstacles = obstacles.filter((o) => o.y < g3Canvas.height + 20);
  g3AnimId = requestAnimationFrame(runG3);
}

document.getElementById("g3StartBtn").addEventListener("click", () => {
  fitG3Canvas();
  g3Active = true;
  obstacles = [];
  g3Score = 0;
  document.getElementById("g3Score").innerText = "0s";
  document.getElementById("g3Overlay").classList.remove("active");
  runG3();

  const counter = setInterval(() => {
    if (!g3Active) return clearInterval(counter);
    g3Score++;
    document.getElementById("g3Score").innerText = `${g3Score}s`;
  }, 1000);
});

/* --- GAME 4: CPS OVERDRIVE --- */
let g4Clicks = 0;
let g4Time = 5;
let g4Active = false;
let g4Timer = null;
const g4Btn = document.getElementById("g4Button");

document.getElementById("g4StartBtn").addEventListener("click", () => {
  g4Clicks = 0;
  g4Time = 5;
  g4Active = true;
  document.getElementById("g4Clicks").innerText = 0;
  document.getElementById("g4Timer").innerText = "5s";
  document.getElementById("g4CPS").innerText = "0.0";
  document.getElementById("g4Overlay").classList.remove("active");

  g4Timer = setInterval(() => {
    g4Time--;
    document.getElementById("g4Timer").innerText = `${g4Time}s`;
    if (g4Time <= 0) {
      clearInterval(g4Timer);
      g4Active = false;
      const finalCPS = (g4Clicks / 5).toFixed(1);
      document.getElementById("g4CPS").innerText = finalCPS;
      document.getElementById("g4Overlay").innerHTML = `<h3>RESULTS</h3><p>Total Clicks: <strong>${g4Clicks}</strong> | Speed: <strong>${finalCPS} CPS</strong></p><button class="spark-btn btn-primary" onclick="document.getElementById('g4StartBtn').click()">Retry</button>`;
      document.getElementById("g4Overlay").classList.add("active");
    }
  }, 1000);
});

g4Btn.addEventListener("click", () => {
  if (!g4Active) return;
  g4Clicks++;
  document.getElementById("g4Clicks").innerText = g4Clicks;
});

/* --- GAME 5: BINARY DECRYPTOR --- */
let g5Score = 0;
let g5Time = 20;
let g5Timer = null;
let currentBinary = "";
const targetDisplay = document.getElementById("g5TargetDisplay");
const optionsBox = document.getElementById("g5Options");

function generateBinary() {
  const binaryList = ["1010", "1100", "0110", "1111", "0011", "1001", "0101"];
  currentBinary = binaryList[Math.floor(Math.random() * binaryList.length)];
  targetDisplay.innerText = currentBinary;

  optionsBox.innerHTML = "";
  // Shuffle options
  const shuffled = [...binaryList].sort(() => Math.random() - 0.5).slice(0, 3);
  if (!shuffled.includes(currentBinary)) shuffled[0] = currentBinary;
  shuffled.sort(() => Math.random() - 0.5);

  shuffled.forEach((val) => {
    const btn = document.createElement("button");
    btn.className = "binary-btn";
    btn.innerText = val;
    btn.onclick = () => {
      if (val === currentBinary) {
        g5Score++;
        document.getElementById("g5Score").innerText = g5Score;
        generateBinary();
      }
    };
    optionsBox.appendChild(btn);
  });
}

document.getElementById("g5StartBtn").addEventListener("click", () => {
  g5Score = 0;
  g5Time = 20;
  document.getElementById("g5Score").innerText = 0;
  document.getElementById("g5Time").innerText = "20s";
  document.getElementById("g5Overlay").classList.remove("active");
  generateBinary();

  clearInterval(g5Timer);
  g5Timer = setInterval(() => {
    g5Time--;
    document.getElementById("g5Time").innerText = `${g5Time}s`;
    if (g5Time <= 0) {
      clearInterval(g5Timer);
      document.getElementById("g5Overlay").innerHTML = `<h3>CIPHER LOCKED</h3><p>Successfully Solved: <strong>${g5Score} Codes</strong></p><button class="spark-btn btn-primary" onclick="document.getElementById('g5StartBtn').click()">Crack Again</button>`;
      document.getElementById("g5Overlay").classList.add("active");
    }
  }, 1000);
});
