/* ==========================================================
   SHOWCASE: 4 ADVANCED BLUEPRINT HOLOGRAMS + AUDIO SYNTH
========================================================== */
const holoCanvas = document.getElementById("aiHologramCanvas");
let hCtx = null;
let cadVerts = [];
let cadEdges = [];
let rotX = 0.005, rotY = 0.008;
let isDraggingCad = false;
let lastMouseX = 0, lastMouseY = 0;

function fitHoloCanvas() {
  if (!holoCanvas) return;
  const parent = holoCanvas.parentElement;
  if (parent && parent.clientWidth > 0) {
    holoCanvas.width = parent.clientWidth;
    holoCanvas.height = parent.clientHeight || 330;
  }
}
window.addEventListener("resize", fitHoloCanvas);

if (holoCanvas) {
  hCtx = holoCanvas.getContext("2d");
  fitHoloCanvas();

  holoCanvas.addEventListener("pointerdown", (e) => {
    isDraggingCad = true;
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
  });
  window.addEventListener("pointermove", (e) => {
    if (isDraggingCad) {
      const dx = e.clientX - lastMouseX;
      const dy = e.clientY - lastMouseY;
      rotY = dx * 0.01;
      rotX = dy * 0.01;
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
    }
  });
  window.addEventListener("pointerup", () => { isDraggingCad = false; });

  setCADModel('galaxy');

  function renderCADCore() {
    hCtx.clearRect(0, 0, holoCanvas.width, holoCanvas.height);
    const cx = holoCanvas.width / 2;
    const cy = holoCanvas.height / 2;
    const fov = 350;

    let projected = [];

    for (let i = 0; i < cadVerts.length; i++) {
      let v = cadVerts[i];
      let cosY = Math.cos(rotY), sinY = Math.sin(rotY);
      let x1 = v.x * cosY - v.z * sinY;
      let z1 = v.z * cosY + v.x * sinY;

      let cosX = Math.cos(rotX), sinX = Math.sin(rotX);
      let y2 = v.y * cosX - z1 * sinX;
      let z2 = z1 * cosX + v.y * sinX;

      v.x = x1; v.y = y2; v.z = z2;

      let scale = fov / (fov + z2);
      projected.push({
        x: x1 * scale + cx,
        y: y2 * scale + cy,
        scale: scale,
        color: v.color || "#00d4ff"
      });
    }

    // Blueprint Edges
    hCtx.lineWidth = 1.2;
    for (let e of cadEdges) {
      if (projected[e[0]] && projected[e[1]]) {
        hCtx.strokeStyle = "rgba(0, 212, 255, 0.4)";
        hCtx.beginPath();
        hCtx.moveTo(projected[e[0]].x, projected[e[0]].y);
        hCtx.lineTo(projected[e[1]].x, projected[e[1]].y);
        hCtx.stroke();
      }
    }

    // Nodes
    for (let p of projected) {
      hCtx.fillStyle = p.color;
      hCtx.beginPath();
      hCtx.arc(p.x, p.y, Math.max(1, p.scale * 2.4), 0, Math.PI * 2);
      hCtx.fill();
    }

    requestAnimationFrame(renderCADCore);
  }
  renderCADCore();
}

// 4 Specific Holograms: Galaxy, Vortex, Black Hole, Spark
function setCADModel(type) {
  document.querySelectorAll(".shape-btn").forEach(b => b.classList.remove("active"));
  event?.currentTarget?.classList.add("active");

  const meshTypeEl = document.getElementById("cadMeshType");
  const coordsEl = document.getElementById("cadCoords");
  cadVerts = [];
  cadEdges = [];

  if (type === 'galaxy') {
    if (meshTypeEl) meshTypeEl.innerText = "GALAXY SPIRAL";
    if (coordsEl) coordsEl.innerText = "SPIRAL ARMS (340 VERTS)";
    const count = 340;
    for (let i = 0; i < count; i++) {
      const arm = i % 3;
      const angle = (i / count) * Math.PI * 4 + (arm * (Math.PI * 2 / 3));
      const r = (i / count) * 130 + (Math.random() * 12);
      cadVerts.push({
        x: Math.cos(angle) * r,
        y: (Math.random() - 0.5) * 18,
        z: Math.sin(angle) * r,
        color: arm === 0 ? "#00d4ff" : (arm === 1 ? "#ff003c" : "#ffbe0b")
      });
      if (i > 3 && i % 3 === 0) cadEdges.push([i, i - 3]);
    }
  } else if (type === 'vortex') {
    if (meshTypeEl) meshTypeEl.innerText = "WARP VORTEX";
    if (coordsEl) coordsEl.innerText = "HYPERBOLIC FUNNEL (280 VERTS)";
    const rings = 14;
    for (let r = 0; r < rings; r++) {
      const radius = 120 - (r * 7.5);
      const depth = (r - rings / 2) * 16;
      for (let s = 0; s < 20; s++) {
        const theta = (s / 20) * Math.PI * 2 + (r * 0.25);
        cadVerts.push({
          x: Math.cos(theta) * radius,
          y: depth,
          z: Math.sin(theta) * radius,
          color: r % 2 === 0 ? "#00d4ff" : "#ff003c"
        });
        const curIdx = cadVerts.length - 1;
        if (s > 0) cadEdges.push([curIdx, curIdx - 1]);
      }
    }
  } else if (type === 'blackhole') {
    if (meshTypeEl) meshTypeEl.innerText = "BLACK HOLE CORE";
    if (coordsEl) coordsEl.innerText = "EVENT HORIZON & ACCRETION DISK";
    // Accretion disk rings
    for (let i = 0; i < 220; i++) {
      const rad = 45 + Math.random() * 85;
      const ang = Math.random() * Math.PI * 2;
      cadVerts.push({
        x: Math.cos(ang) * rad,
        y: (Math.random() - 0.5) * 8,
        z: Math.sin(ang) * rad,
        color: rad < 65 ? "#ff003c" : "#ffbe0b"
      });
    }
    // Event horizon dark sphere nodes
    for (let i = 0; i < 40; i++) {
      const ang = (i / 40) * Math.PI * 2;
      cadVerts.push({
        x: Math.cos(ang) * 35,
        y: 0,
        z: Math.sin(ang) * 35,
        color: "#ffffff"
      });
    }
  } else if (type === 'spark') {
    if (meshTypeEl) meshTypeEl.innerText = "SPARK CORE STAR";
    if (coordsEl) coordsEl.innerText = "HYPER-CHARGED PLASMA STELLA";
    const rays = 32;
    cadVerts.push({ x: 0, y: 0, z: 0, color: "#ffffff" });
    for (let i = 0; i < rays; i++) {
      const theta = (i / rays) * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI;
      const len = 90 + Math.random() * 35;
      cadVerts.push({
        x: len * Math.cos(theta) * Math.cos(phi),
        y: len * Math.sin(phi),
        z: len * Math.sin(theta) * Math.cos(phi),
        color: i % 2 === 0 ? "#00d4ff" : "#ff003c"
      });
      cadEdges.push([0, i + 1]);
    }
  }
}

/* ==========================================================
   2. USER HOLOGRAM CREATOR STUDIO
========================================================== */
const uCanvas = document.getElementById("userCanvas");
let userParticles = [];
let drawColor = "#00d4ff";
let showConnectors = true;

function fitUserCanvas() {
  if (!uCanvas) return;
  const parent = uCanvas.parentElement;
  if (parent && parent.clientWidth > 0) {
    uCanvas.width = parent.clientWidth;
    uCanvas.height = parent.clientHeight || 290;
  }
}
window.addEventListener("resize", fitUserCanvas);

if (uCanvas) {
  const uCtx = uCanvas.getContext("2d");
  fitUserCanvas();

  let isDrawing = false;
  function spawnUserParticle(x, y) {
    userParticles.push({
      x: x, y: y,
      vx: (Math.random() - 0.5) * 1.5,
      vy: (Math.random() - 0.5) * 1.5,
      radius: Math.random() * 3 + 2,
      color: drawColor
    });
    if (userParticles.length > 80) userParticles.shift();
  }

  uCanvas.addEventListener("pointerdown", (e) => {
    isDrawing = true;
    const r = uCanvas.getBoundingClientRect();
    spawnUserParticle(e.clientX - r.left, e.clientY - r.top);
  });
  uCanvas.addEventListener("pointermove", (e) => {
    if (!isDrawing) return;
    const r = uCanvas.getBoundingClientRect();
    spawnUserParticle(e.clientX - r.left, e.clientY - r.top);
  });
  window.addEventListener("pointerup", () => { isDrawing = false; });

  function renderUserCanvas() {
    uCtx.clearRect(0, 0, uCanvas.width, uCanvas.height);
    for (let a = 0; a < userParticles.length; a++) {
      let p = userParticles[a];
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > uCanvas.width) p.vx *= -1;
      if (p.y < 0 || p.y > uCanvas.height) p.vy *= -1;

      uCtx.fillStyle = p.color;
      uCtx.beginPath();
      uCtx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      uCtx.fill();

      if (showConnectors) {
        for (let b = a + 1; b < userParticles.length; b++) {
          let dist = Math.hypot(p.x - userParticles[b].x, p.y - userParticles[b].y);
          if (dist < 70) {
            uCtx.strokeStyle = p.color;
            uCtx.globalAlpha = 1 - dist / 70;
            uCtx.lineWidth = 1;
            uCtx.beginPath();
            uCtx.moveTo(p.x, p.y);
            uCtx.lineTo(userParticles[b].x, userParticles[b].y);
            uCtx.stroke();
            uCtx.globalAlpha = 1.0;
          }
        }
      }
    }
    requestAnimationFrame(renderUserCanvas);
  }
  renderUserCanvas();
}

function setDrawColor(col) {
  drawColor = col;
  document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
  event.target.classList.add('active');
}
function clearUserDesign() { userParticles = []; }
function toggleConnectors() { showConnectors = !showConnectors; }

/* ==========================================================
   3. OPTION 3: QUANTUM HARMONIC AUDIO SYNTHESIZER
========================================================== */
const synthCanvas = document.getElementById("synthCanvas");
let synthCtx = synthCanvas ? synthCanvas.getContext("2d") : null;
let synthPhase = 0;
let currentSynthFreq = 432;

function fitSynthCanvas() {
  if (!synthCanvas) return;
  synthCanvas.width = synthCanvas.parentElement.clientWidth;
  synthCanvas.height = synthCanvas.parentElement.clientHeight;
}
window.addEventListener("resize", fitSynthCanvas);
setTimeout(fitSynthCanvas, 100);

function triggerHarmonicBurst(freq) {
  currentSynthFreq = freq;
  if (typeof playProceduralSound === "function") {
    playProceduralSound(freq, "triangle", 0.4, 0.1);
  }
  const status = document.getElementById("synthStatus");
  if (status) status.innerText = `TUNED TO ${freq}Hz HARMONIC`;
}

function renderSynthWaveform() {
  if (!synthCanvas || !synthCtx) return;
  synthCtx.clearRect(0, 0, synthCanvas.width, synthCanvas.height);

  synthPhase += 0.05;
  const cy = synthCanvas.height / 2;

  synthCtx.lineWidth = 2.5;
  synthCtx.strokeStyle = "#00d4ff";
  synthCtx.beginPath();
  for (let x = 0; x < synthCanvas.width; x++) {
    const y = cy + Math.sin(x * 0.02 + synthPhase) * 35 * Math.sin(x * 0.005);
    if (x === 0) synthCtx.moveTo(x, y);
    else synthCtx.lineTo(x, y);
  }
  synthCtx.stroke();

  // Red secondary harmonic wave
  synthCtx.strokeStyle = "#ff003c";
  synthCtx.beginPath();
  for (let x = 0; x < synthCanvas.width; x++) {
    const y = cy + Math.cos(x * 0.03 - synthPhase) * 22;
    if (x === 0) synthCtx.moveTo(x, y);
    else synthCtx.lineTo(x, y);
  }
  synthCtx.stroke();

  requestAnimationFrame(renderSynthWaveform);
}
renderSynthWaveform();
