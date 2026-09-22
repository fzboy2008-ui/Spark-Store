/* ==========================================================
   SHOWCASE: 4D MORPHING LATTICE (BLUE & RED CORE)
========================================================== */
const holoCanvas = document.getElementById("aiHologramCanvas");
let hCtx = null;
let currentShape = 'sphere';
let morphNodes = [];
const TOTAL_SHAPE_NODES = 300;
let rotX = 0.006, rotY = 0.008;

function fitHoloCanvas() {
  if (!holoCanvas) return;
  holoCanvas.width = holoCanvas.parentElement.clientWidth;
  holoCanvas.height = holoCanvas.parentElement.clientHeight;
}
window.addEventListener("resize", fitHoloCanvas);

if (holoCanvas) {
  hCtx = holoCanvas.getContext("2d");
  fitHoloCanvas();
  generateMorphNodes();

  window.addEventListener("mousemove", (e) => {
    rotX = (e.clientY / window.innerHeight - 0.5) * 0.035;
    rotY = (e.clientX / window.innerWidth - 0.5) * 0.035;
  });

  function renderMorphCore() {
    hCtx.clearRect(0, 0, holoCanvas.width, holoCanvas.height);
    const cx = holoCanvas.width / 2;
    const cy = holoCanvas.height / 2;
    const fov = 320;

    let projected = [];

    morphNodes.forEach(node => {
      node.x += (node.tx - node.x) * 0.08;
      node.y += (node.ty - node.y) * 0.08;
      node.z += (node.tz - node.z) * 0.08;

      let cosY = Math.cos(rotY), sinY = Math.sin(rotY);
      let x1 = node.x * cosY - node.z * sinY;
      let z1 = node.z * cosY + node.x * sinY;

      let cosX = Math.cos(rotX), sinX = Math.sin(rotX);
      let y2 = node.y * cosX - z1 * sinX;
      let z2 = z1 * cosX + node.y * sinX;

      node.x = x1; node.y = y2; node.z = z2;

      let scale = fov / (fov + z2);
      projected.push({
        x: x1 * scale + cx,
        y: y2 * scale + cy,
        scale: scale,
        color: node.color,
        alpha: Math.max(0.15, (z2 + 130) / 260)
      });
    });

    for (let a = 0; a < projected.length; a++) {
      for (let b = a + 1; b < projected.length; b++) {
        let dist = Math.hypot(projected[a].x - projected[b].x, projected[a].y - projected[b].y);
        if (dist < 38) {
          hCtx.strokeStyle = `rgba(0, 212, 255, ${0.35 * (1 - dist / 38)})`;
          hCtx.lineWidth = 0.8;
          hCtx.beginPath();
          hCtx.moveTo(projected[a].x, projected[a].y);
          hCtx.lineTo(projected[b].x, projected[b].y);
          hCtx.stroke();
        }
      }
    }

    projected.forEach(p => {
      hCtx.fillStyle = p.color;
      hCtx.beginPath();
      hCtx.arc(p.x, p.y, Math.max(1, p.scale * 2.2), 0, Math.PI * 2);
      hCtx.fill();
    });

    requestAnimationFrame(renderMorphCore);
  }
  renderMorphCore();
}

function generateMorphNodes() {
  morphNodes = [];
  for (let i = 0; i < TOTAL_SHAPE_NODES; i++) {
    morphNodes.push({ 
      x: 0, y: 0, z: 0, tx: 0, ty: 0, tz: 0,
      color: i % 2 === 0 ? "#00d4ff" : "#ff003c"
    });
  }
  morphTo('sphere');
}

function morphTo(shape) {
  currentShape = shape;
  document.querySelectorAll('.shape-btn').forEach(btn => btn.classList.remove('active'));
  event?.currentTarget?.classList.add('active');

  const R = 110;
  const formDisplay = document.getElementById('formDisplay');
  const geoMode = document.getElementById('geoMode');

  if (shape === 'sphere') {
    geoMode.innerText = "HYPER-SPHERE";
    formDisplay.innerText = "SPHERE (300 TENSORS)";
    for (let i = 0; i < TOTAL_SHAPE_NODES; i++) {
      const phi = Math.acos(-1 + (2 * i) / TOTAL_SHAPE_NODES);
      const theta = Math.sqrt(TOTAL_SHAPE_NODES * Math.PI) * phi;
      morphNodes[i].tx = R * Math.cos(theta) * Math.sin(phi);
      morphNodes[i].ty = R * Math.sin(theta) * Math.sin(phi);
      morphNodes[i].tz = R * Math.cos(phi);
    }
  } else if (shape === 'torus') {
    geoMode.innerText = "TOROIDAL RING";
    formDisplay.innerText = "DONUT VORTEX";
    const R1 = 90, R2 = 35;
    for (let i = 0; i < TOTAL_SHAPE_NODES; i++) {
      const u = Math.random() * Math.PI * 2;
      const v = Math.random() * Math.PI * 2;
      morphNodes[i].tx = (R1 + R2 * Math.cos(v)) * Math.cos(u);
      morphNodes[i].ty = (R1 + R2 * Math.cos(v)) * Math.sin(u);
      morphNodes[i].tz = R2 * Math.sin(v);
    }
  } else if (shape === 'cube') {
    geoMode.innerText = "TESSERACT CUBE";
    formDisplay.innerText = "QUANTUM CUBE";
    const S = 80;
    for (let i = 0; i < TOTAL_SHAPE_NODES; i++) {
      morphNodes[i].tx = (Math.random() - 0.5) * 2 * S;
      morphNodes[i].ty = (Math.random() - 0.5) * 2 * S;
      morphNodes[i].tz = (Math.random() - 0.5) * 2 * S;
    }
  } else if (shape === 'vortex') {
    geoMode.innerText = "BLACKHOLE VORTEX";
    formDisplay.innerText = "WARP SPIRAL";
    for (let i = 0; i < TOTAL_SHAPE_NODES; i++) {
      const t = (i / TOTAL_SHAPE_NODES) * Math.PI * 8;
      const rad = (i / TOTAL_SHAPE_NODES) * 120;
      morphNodes[i].tx = rad * Math.cos(t);
      morphNodes[i].ty = (i - TOTAL_SHAPE_NODES / 2) * 0.7;
      morphNodes[i].tz = rad * Math.sin(t);
    }
  }
}

/* ==========================================================
   USER DESIGN STUDIO (CREATIVE SANDBOX)
========================================================== */
const uCanvas = document.getElementById("userCanvas");
let userParticles = [];
let drawColor = "#00d4ff";
let showConnectors = true;

function fitUserCanvas() {
  if (!uCanvas) return;
  uCanvas.width = uCanvas.parentElement.clientWidth;
  uCanvas.height = uCanvas.parentElement.clientHeight;
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
      p.x += p.vx;
      p.y += p.vy;

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
function burstUserParticles() {
  userParticles.forEach(p => {
    p.vx = (Math.random() - 0.5) * 8;
    p.vy = (Math.random() - 0.5) * 8;
  });
}
