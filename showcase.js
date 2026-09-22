const holoCanvas = document.getElementById("aiHologramCanvas");
let rotX = 0.006;
let rotY = 0.008;
let sphereNodes = [];
const TOTAL_BALL_NODES = 320;
const BALL_RADIUS = 115;
let burstEffect = 1;

function fitHoloCanvas() {
  if (!holoCanvas) return;
  holoCanvas.width = holoCanvas.parentElement.clientWidth;
  holoCanvas.height = holoCanvas.parentElement.clientHeight;
}
window.addEventListener("resize", fitHoloCanvas);

if (holoCanvas) {
  const hCtx = holoCanvas.getContext("2d");
  fitHoloCanvas();

  // Fibonacci Sphere Lattice distribution
  for (let i = 0; i < TOTAL_BALL_NODES; i++) {
    const phi = Math.acos(-1 + (2 * i) / TOTAL_BALL_NODES);
    const theta = Math.sqrt(TOTAL_BALL_NODES * Math.PI) * phi;
    sphereNodes.push({
      x: BALL_RADIUS * Math.cos(theta) * Math.sin(phi),
      y: BALL_RADIUS * Math.sin(theta) * Math.sin(phi),
      z: BALL_RADIUS * Math.cos(phi)
    });
  }

  window.addEventListener("mousemove", (e) => {
    rotX = (e.clientY / window.innerHeight - 0.5) * 0.04;
    rotY = (e.clientX / window.innerWidth - 0.5) * 0.04;
    const angEl = document.getElementById("angVel");
    if (angEl) angEl.innerText = `${Math.abs(rotX * 10).toFixed(2)} rad/s`;
  });

  function renderQuantumSphere() {
    hCtx.clearRect(0, 0, holoCanvas.width, holoCanvas.height);
    const cx = holoCanvas.width / 2;
    const cy = holoCanvas.height / 2;
    const fov = 320;

    let projected = [];

    sphereNodes.forEach((node) => {
      let cosY = Math.cos(rotY * burstEffect), sinY = Math.sin(rotY * burstEffect);
      let x1 = node.x * cosY - node.z * sinY;
      let z1 = node.z * cosY + node.x * sinY;

      let cosX = Math.cos(rotX * burstEffect), sinX = Math.sin(rotX * burstEffect);
      let y2 = node.y * cosX - z1 * sinX;
      let z2 = z1 * cosX + node.y * sinX;

      node.x = x1; node.y = y2; node.z = z2;

      let scale = fov / (fov + z2);
      projected.push({
        x: x1 * scale + cx,
        y: y2 * scale + cy,
        scale: scale,
        alpha: Math.max(0.12, (z2 + BALL_RADIUS) / (2 * BALL_RADIUS))
      });
    });

    // Neural mesh connections
    for (let a = 0; a < projected.length; a++) {
      for (let b = a + 1; b < projected.length; b++) {
        let dist = Math.hypot(projected[a].x - projected[b].x, projected[a].y - projected[b].y);
        if (dist < 42) {
          hCtx.strokeStyle = `rgba(0, 240, 255, ${0.45 * (1 - dist / 42)})`;
          hCtx.lineWidth = 0.8;
          hCtx.beginPath();
          hCtx.moveTo(projected[a].x, projected[a].y);
          hCtx.lineTo(projected[b].x, projected[b].y);
          hCtx.stroke();
        }
      }
    }

    // Nodes
    projected.forEach((p) => {
      hCtx.fillStyle = `rgba(255, 190, 11, ${p.alpha})`;
      hCtx.beginPath();
      hCtx.arc(p.x, p.y, Math.max(1, p.scale * 2.2), 0, Math.PI * 2);
      hCtx.fill();
    });

    requestAnimationFrame(renderQuantumSphere);
  }
  renderQuantumSphere();
}

function accelerateWarp() {
  burstEffect = 3.5;
  logHolo("Warp speed engaged! Spin acceleration factor: 3.5x");
  setTimeout(() => { burstEffect = 1; }, 2500);
}

function invertTensorField() {
  rotY = -rotY;
  rotX = -rotX;
  logHolo("Tensor rotational poles inverted successfully.");
}

function burstSphere() {
  sphereNodes.forEach((n) => {
    n.x *= 1.4; n.y *= 1.4; n.z *= 1.4;
    setTimeout(() => {
      n.x /= 1.4; n.y /= 1.4; n.z /= 1.4;
    }, 400);
  });
  logHolo("Quantum Core Burst: Tensors expanded and stabilized.");
}

function logHolo(msg) {
  const t = document.getElementById("showcaseTerminal");
  if (!t) return;
  const p = document.createElement("p");
  p.innerText = `> ${msg}`;
  t.appendChild(p);
  t.scrollTop = t.scrollHeight;
}
