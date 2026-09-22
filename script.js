/* ==========================================================
   1. PROCEDURAL AUDIO SYNTHESIZER (ZERO ASSET AUDIO ENGINE)
========================================================== */
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;
let soundEnabled = true;

function initAudio() {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
}

// Generates procedural sci-fi sound frequencies
function playTone(freq = 440, type = "sine", duration = 0.12, gainValue = 0.08) {
  if (!soundEnabled) return;
  initAudio();

  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

    // Envelope
    gain.gain.setValueAtTime(gainValue, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (err) {
    // Ignore context locks
  }
}

function playNeuralChord() {
  const pitch = document.getElementById("pitchSlider") ? +document.getElementById("pitchSlider").value : 440;
  playTone(pitch, "sawtooth", 0.35, 0.06);
  setTimeout(() => playTone(pitch * 1.5, "sine", 0.4, 0.05), 80);
  setTimeout(() => playTone(pitch * 2.0, "triangle", 0.5, 0.04), 160);
}

document.getElementById("audioToggleBtn").addEventListener("click", () => {
  soundEnabled = !soundEnabled;
  const icon = document.querySelector("#audioToggleBtn i");
  icon.className = soundEnabled ? "fa-solid fa-volume-high" : "fa-solid fa-volume-xmark";
  if (soundEnabled) playTone(880, "triangle", 0.1);
});

/* ==========================================================
   2. 3D PROJECTION ENGINE (HYPER-SPHERE)
========================================================== */
const canvas = document.getElementById("neuralCanvas");
const ctx = canvas.getContext("2d");

let nodes = [];
const TOTAL_NODES = 260;
const RADIUS = 280;
let angleX = 0.002;
let angleY = 0.003;
let warpSpeed = 1;

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

class HyperNode {
  constructor() {
    // Golden Spiral Sphere generation
    this.theta = Math.random() * Math.PI * 2;
    this.phi = Math.acos(Math.random() * 2 - 1);
    this.x = RADIUS * Math.sin(this.phi) * Math.cos(this.theta);
    this.y = RADIUS * Math.sin(this.phi) * Math.sin(this.theta);
    this.z = RADIUS * Math.cos(this.phi);
  }

  rotate(rx, ry) {
    // Rotation on Y
    let cosY = Math.cos(ry);
    let sinY = Math.sin(ry);
    let x1 = this.x * cosY - this.z * sinY;
    let z1 = this.z * cosY + this.x * sinY;

    // Rotation on X
    let cosX = Math.cos(rx);
    let sinX = Math.sin(rx);
    let y2 = this.y * cosX - z1 * sinX;
    let z2 = z1 * cosX + this.y * sinX;

    this.x = x1;
    this.y = y2;
    this.z = z2;
  }

  project(cx, cy, fov) {
    const scale = fov / (fov + this.z);
    return {
      x: this.x * scale + cx,
      y: this.y * scale + cy,
      scale: scale,
      alpha: Math.max(0.1, (this.z + RADIUS) / (2 * RADIUS))
    };
  }
}

for (let i = 0; i < TOTAL_NODES; i++) {
  nodes.push(new HyperNode());
}

function render3D() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const fov = 400;

  const projected = [];

  for (let i = 0; i < nodes.length; i++) {
    nodes[i].rotate(angleX * warpSpeed, angleY * warpSpeed);
    projected.push(nodes[i].project(cx, cy, fov));
  }

  // Draw inter-connecting neural lines
  for (let a = 0; a < projected.length; a++) {
    for (let b = a + 1; b < projected.length; b++) {
      const dx = projected[a].x - projected[b].x;
      const dy = projected[a].y - projected[b].y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 55) {
        ctx.strokeStyle = `rgba(0, 240, 255, ${0.35 * (1 - dist / 55)})`;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(projected[a].x, projected[a].y);
        ctx.lineTo(projected[b].x, projected[b].y);
        ctx.stroke();
      }
    }
  }

  // Draw nodes
  for (let p of projected) {
    ctx.fillStyle = `rgba(0, 255, 136, ${p.alpha})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, Math.max(1, p.scale * 2.5), 0, Math.PI * 2);
    ctx.fill();
  }

  requestAnimationFrame(render3D);
}
render3D();

// Mouse tracking shifts rotation vectors
window.addEventListener("mousemove", (e) => {
  const normX = (e.clientX / window.innerWidth) - 0.5;
  const normY = (e.clientY / window.innerHeight) - 0.5;
  angleX = normY * 0.02;
  angleY = normX * 0.02;

  // Reticle update
  const ptr = document.getElementById("cursorPointer");
  const glow = document.getElementById("cursorGlow");
  ptr.style.left = `${e.clientX}px`;
  ptr.style.top = `${e.clientY}px`;
  glow.style.left = `${e.clientX}px`;
  glow.style.top = `${e.clientY}px`;
});

/* ==========================================================
   3. DRAGGABLE WINDOW SYSTEM & DOCK
========================================================== */
let topZ = 100;

function makeDraggable(winEl) {
  const header = winEl.querySelector(".win-header");
  let isDragging = false;
  let offsetX = 0;
  let offsetY = 0;

  winEl.addEventListener("mousedown", () => {
    topZ++;
    winEl.style.zIndex = topZ;
    document.querySelectorAll(".cyber-window").forEach(w => w.classList.remove("active-win"));
    winEl.classList.add("active-win");
  });

  header.addEventListener("mousedown", (e) => {
    isDragging = true;
    offsetX = e.clientX - winEl.offsetLeft;
    offsetY = e.clientY - winEl.offsetTop;
    playTone(720, "sine", 0.05, 0.03);
  });

  window.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    winEl.style.left = `${e.clientX - offsetX}px`;
    winEl.style.top = `${e.clientY - offsetY}px`;
  });

  window.addEventListener("mouseup", () => {
    isDragging = false;
  });
}

document.querySelectorAll(".cyber-window").forEach(makeDraggable);

function openWindow(id) {
  const win = document.getElementById(id);
  win.style.display = "block";
  topZ++;
  win.style.zIndex = topZ;
  document.querySelectorAll(".cyber-window").forEach(w => w.classList.remove("active-win"));
  win.classList.add("active-win");
  playTone(580, "triangle", 0.08);
}

function closeWindow(id) {
  document.getElementById(id).style.display = "none";
  playTone(280, "square", 0.08);
}

function minimizeWindow(id) {
  closeWindow(id);
}

/* ==========================================================
   4. CLI NEURAL TERMINAL ENGINE
========================================================== */
const termInput = document.getElementById("termInput");
const termOutput = document.getElementById("termOutput");

const COMMANDS = {
  help: "AVAILABLE COMMANDS:\n  • status    - Check core integrity\n  • warp      - Accelerate quantum projection\n  • clear     - Clear terminal buffer\n  • pulse     - Test synthesize sound\n  • ping      - Measure loop latency",
  status: "KERNEL METRICS:\n  - Uptime: 99.998%\n  - Flux Density: Optimal\n  - Quantum Nodes: 260 Online",
  ping: "PONG! Loop latency: 1.2ms (Zero packet degradation)",
  warp: () => {
    warpSpeed = warpSpeed === 1 ? 5 : 1;
    return `Warp Factor toggled to: ${warpSpeed}x`;
  },
  pulse: () => {
    playNeuralChord();
    return "Procedural audio pulse dispatched to hardware.";
  },
  clear: () => {
    termOutput.innerHTML = "";
    return "";
  }
};

termInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    const raw = termInput.value.trim().toLowerCase();
    termInput.value = "";
    if (!raw) return;

    playTone(900, "sine", 0.04, 0.04);

    // Print command entered
    const userLine = document.createElement("p");
    userLine.className = "term-line";
    userLine.innerHTML = `<span class="prompt-arrow">root@synapse:~$</span> ${raw}`;
    termOutput.appendChild(userLine);

    // Execute
    const resLine = document.createElement("p");
    resLine.className = "term-line system-msg";

    if (COMMANDS[raw]) {
      const response = typeof COMMANDS[raw] === "function" ? COMMANDS[raw]() : COMMANDS[raw];
      resLine.innerText = response;
    } else {
      resLine.innerText = `Command not recognized: "${raw}". Type 'help' for available directives.`;
    }

    termOutput.appendChild(resLine);
    termOutput.scrollTop = termOutput.scrollHeight;
  }
});

/* ==========================================================
   5. REAL-TIME SYSTEM TELEMETRY SIMULATOR
========================================================== */
setInterval(() => {
  // Random dynamic fluctuation for telemetry
  const cpu = (10 + Math.random() * 8).toFixed(1);
  document.getElementById("cpuLoad").innerText = `${cpu}%`;

  // Clock
  const now = new Date();
  document.getElementById("sysClock").innerText = now.toTimeString().split(" ")[0];
}, 1000);

function triggerOverdrive() {
  playTone(1100, "sawtooth", 0.4, 0.1);
  warpSpeed = 7;
  document.getElementById("fluxFill").style.width = "100%";
  document.getElementById("fluxVal").innerText = "1420 THz (BURST)";

  setTimeout(() => {
    warpSpeed = 1;
    document.getElementById("fluxFill").style.width = "84%";
    document.getElementById("fluxVal").innerText = "840 THz";
  }, 3500);
}

function purgeMemory() {
  playTone(220, "square", 0.3, 0.08);
  const mem = document.getElementById("memFill");
  mem.style.width = "12%";
  document.getElementById("memVal").innerText = "12%";

  setTimeout(() => {
    mem.style.width = "48%";
    document.getElementById("memVal").innerText = "48%";
  }, 1200);
                        }
