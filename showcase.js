/* ==========================================================
   SHOWCASE: 3D HOLOGRAPHIC CAD BLUEPRINT ARCHITECT
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

  // Mouse / Touch Drag Rotation for true 3D inspection
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

  setCADModel('sphere');

  function renderCADCore() {
    hCtx.clearRect(0, 0, holoCanvas.width, holoCanvas.height);
    const cx = holoCanvas.width / 2;
    const cy = holoCanvas.height / 2;
    const fov = 350;

    let projected = [];

    // Rotate 3D vertices
    for (let i = 0; i < cadVerts.length; i++) {
      let v = cadVerts[i];

      // Rotate Y
      let cosY = Math.cos(rotY), sinY = Math.sin(rotY);
      let x1 = v.x * cosY - v.z * sinY;
      let z1 = v.z * cosY + v.x * sinY;

      // Rotate X
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

    // Render CAD Blueprint Edges
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

    // Render Vertices Nodes
    for (let p of projected) {
      hCtx.fillStyle = p.color;
      hCtx.beginPath();
      hCtx.arc(p.x, p.y, Math.max(1, p.scale * 2.5), 0, Math.PI * 2);
      hCtx.fill();
    }

    requestAnimationFrame(renderCADCore);
  }
  renderCADCore();
}

function setCADModel(type) {
  document.querySelectorAll(".shape-btn").forEach(b => b.classList.remove("active"));
  event?.currentTarget?.classList.add("active");

  const meshTypeEl = document.getElementById("cadMeshType");
  const coordsEl = document.getElementById("cadCoords");
  cadVerts = [];
  cadEdges = [];

  if (type === 'sphere') {
    if (meshTypeEl) meshTypeEl.innerText = "SPHERE LATTICE";
    if (coordsEl) coordsEl.innerText = "FIBONACCI 3D (240 VERTS)";
    const count = 240, R = 110;
    for (let i = 0; i < count; i++) {
      const phi = Math.acos(-1 + (2 * i) / count);
      const theta = Math.sqrt(count * Math.PI) * phi;
      cadVerts.push({
        x: R * Math.cos(theta) * Math.sin(phi),
        y: R * Math.sin(theta) * Math.sin(phi),
        z: R * Math.cos(phi),
        color: i % 2 === 0 ? "#00d4ff" : "#ff003c"
      });
      if (i > 0 && i % 4 === 0) cadEdges.push([i, i - 1]);
    }
  } else if (type === 'cube') {
    if (meshTypeEl) meshTypeEl.innerText = "TESSERACT CUBE";
    if (coordsEl) coordsEl.innerText = "ISOMETRIC 8-CORNER DUAL";
    const S = 65;
    // Outer cube
    const corners = [
      [-S,-S,-S],[S,-S,-S],[S,S,-S],[-S,S,-S],
      [-S,-S,S],[S,-S,S],[S,S,S],[-S,S,S]
    ];
    corners.forEach(c => cadVerts.push({ x: c[0], y: c[1], z: c[2], color: "#00d4ff" }));
    // Edges
    const e = [
      [0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],
      [0,4],[1,5],[2,6],[3,7]
    ];
    cadEdges = [...e];
    // Inner Tesseract
    corners.forEach(c => cadVerts.push({ x: c[0]*0.5, y: c[1]*0.5, z: c[2]*0.5, color: "#ff003c" }));
    for (let i = 0; i < 8; i++) cadEdges.push([i, i + 8]);
  } else if (type === 'torus') {
    if (meshTypeEl) meshTypeEl.innerText = "TOROIDAL RING";
    if (coordsEl) coordsEl.innerText = "DUAL REVOLUTION MATRIX";
    const R1 = 90, R2 = 35;
    for (let u = 0; u < 20; u++) {
      const theta = (u / 20) * Math.PI * 2;
      for (let v = 0; v < 10; v++) {
        const phi = (v / 10) * Math.PI * 2;
        cadVerts.push({
          x: (R1 + R2 * Math.cos(phi)) * Math.cos(theta),
          y: (R1 + R2 * Math.cos(phi)) * Math.sin(theta),
          z: R2 * Math.sin(phi),
          color: v % 2 === 0 ? "#00d4ff" : "#ff003c"
        });
      }
    }
  } else if (type === 'helix') {
    if (meshTypeEl) meshTypeEl.innerText = "DNA DOUBLE HELIX";
    if (coordsEl) coordsEl.innerText = "GENETIC POLYNOMIAL";
    const strands = 60;
    for (let i = 0; i < strands; i++) {
      const t = (i / strands) * Math.PI * 6;
      const y = (i - strands / 2) * 4;
      cadVerts.push({ x: Math.cos(t) * 50, y: y, z: Math.sin(t) * 50, color: "#00d4ff" });
      cadVerts.push({ x: Math.cos(t + Math.PI) * 50, y: y, z: Math.sin(t + Math.PI) * 50, color: "#ff003c" });
      if (i % 3 === 0) cadEdges.push([i * 2, i * 2 + 1]); // Rungs
    }
  } else if (type === 'jet') {
    if (meshTypeEl) meshTypeEl.innerText = "3D JET STARFIGHTER";
    if (coordsEl) coordsEl.innerText = "AERODYNAMIC CAD POLYGON";
    const jetPts = [
      {x: 0, y: -90, z: 0},     // 0: Nose
      {x: 18, y: -15, z: 8},    // 1: Cockpit right
      {x: -18, y: -15, z: 8},   // 2: Cockpit left
      {x: 80, y: 30, z: 0},     // 3: Wing tip right
      {x: -80, y: 30, z: 0},    // 4: Wing tip left
      {x: 20, y: 60, z: -5},    // 5: Engine right
      {x: -20, y: 60, z: -5},   // 6: Engine left
      {x: 0, y: 30, z: 35}      // 7: Tail fin
    ];
    jetPts.forEach(p => cadVerts.push({ x: p.x, y: p.y, z: p.z, color: "#00d4ff" }));
    cadEdges = [
      [0,1],[0,2],[1,2],[1,3],[2,4],[3,5],[4,6],[5,6],
      [1,7],[2,7],[5,7],[6,7],[0,7]
    ];
  }
}

/* ==========================================================
   USER DESIGN STUDIO (CREATIVE MATRIX SANDBOX)
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
                              
