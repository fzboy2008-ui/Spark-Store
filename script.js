/* ==========================================================
   1. PAGE NAVIGATION SYSTEM (SPA ROUTER)
========================================================== */
const navTabs = document.querySelectorAll('.nav-tab');
const pagePanes = document.querySelectorAll('.page-pane');

function switchPage(targetId) {
  navTabs.forEach((tab) => {
    tab.classList.toggle('active', tab.getAttribute('data-target') === targetId);
  });

  pagePanes.forEach((pane) => {
    pane.classList.toggle('active', pane.id === targetId);
  });
}

navTabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    const target = tab.getAttribute('data-target');
    switchPage(target);
  });
});

/* ==========================================================
   2. INTERACTIVE ELECTRIC SPARK CANVAS
========================================================== */
const canvas = document.getElementById('sparkCanvas');
const ctx = canvas.getContext('2d');

let particles = [];
let mouse = { x: null, y: null, radius: 120 };

function fitCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', fitCanvas);
fitCanvas();

window.addEventListener('mousemove', (e) => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
});

class SparkParticle {
  constructor() {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.size = Math.random() * 2 + 1;
    this.vx = (Math.random() - 0.5) * 1.5;
    this.vy = (Math.random() - 0.5) * 1.5;
    this.color = Math.random() > 0.5 ? '#ffb703' : '#00f0ff';
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;

    if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
    if (this.y < 0 || this.y > canvas.height) this.vy *= -1;

    // React to mouse
    if (mouse.x !== null) {
      let dx = mouse.x - this.x;
      let dy = mouse.y - this.y;
      let dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < mouse.radius) {
        const force = (mouse.radius - dist) / mouse.radius;
        this.x -= (dx / dist) * force * 4;
        this.y -= (dy / dist) * force * 4;
      }
    }
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
  }
}

function initSparks() {
  particles = [];
  const density = Math.floor((canvas.width * canvas.height) / 16000);
  for (let i = 0; i < density; i++) {
    particles.push(new SparkParticle());
  }
}
initSparks();

function connectSparks() {
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      let dx = particles[i].x - particles[j].x;
      let dy = particles[i].y - particles[j].y;
      let dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 100) {
        let opacity = 1 - dist / 100;
        ctx.strokeStyle = `rgba(255, 183, 3, ${opacity * 0.15})`;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(particles[i].x, particles[i].y);
        ctx.lineTo(particles[j].x, particles[j].y);
        ctx.stroke();
      }
    }
  }
}

function renderCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  particles.forEach((p) => {
    p.update();
    p.draw();
  });
  connectSparks();
  requestAnimationFrame(renderCanvas);
}
renderCanvas();

/* ==========================================================
   3. OVERDRIVE ARENA (MINI GAME ENGINE)
========================================================== */
let score = 0;
let timeLeft = 15;
let combo = 1;
let active = false;
let gameTimer = null;

const scoreVal = document.getElementById('scoreVal');
const timerVal = document.getElementById('timerVal');
const comboVal = document.getElementById('comboVal');
const targetNode = document.getElementById('targetNode');
const arenaField = document.getElementById('arenaField');
const arenaModal = document.getElementById('arenaModal');
const startBtn = document.getElementById('startBtn');

function repositionNode() {
  const rect = arenaField.getBoundingClientRect();
  const maxX = rect.width - 70;
  const maxY = rect.height - 70;

  const posX = Math.floor(Math.random() * maxX) + 35;
  const posY = Math.floor(Math.random() * maxY) + 35;

  targetNode.style.left = `${posX}px`;
  targetNode.style.top = `${posY}px`;
}

function startCircuit() {
  score = 0;
  combo = 1;
  timeLeft = 15;
  active = true;

  scoreVal.innerText = score;
  comboVal.innerText = `x${combo}`;
  timerVal.innerText = `${timeLeft}s`;

  arenaModal.classList.remove('active');
  repositionNode();

  gameTimer = setInterval(() => {
    timeLeft--;
    timerVal.innerText = `${timeLeft}s`;

    if (timeLeft <= 0) {
      endCircuit();
    }
  }, 1000);
}

function endCircuit() {
  clearInterval(gameTimer);
  active = false;
  arenaModal.innerHTML = `
    <h3>VOLTAGE EXHAUSTED</h3>
    <p>Final Score: <strong>${score}</strong> | Highest Streak: <strong>x${combo}</strong></p>
    <button class="spark-btn btn-glow" onclick="startCircuit()">Recharge & Restart</button>
  `;
  arenaModal.classList.add('active');
}

targetNode.addEventListener('click', () => {
  if (!active) return;

  score += 10 * combo;
  combo++;
  scoreVal.innerText = score;
  comboVal.innerText = `x${combo}`;

  // Spawn visual feedback
  const burst = document.createElement('span');
  burst.className = 'burst-float';
  burst.innerText = `+${10 * (combo - 1)}`;
  burst.style.left = `${targetNode.offsetLeft}px`;
  burst.style.top = `${targetNode.offsetTop - 15}px`;
  arenaField.appendChild(burst);

  setTimeout(() => burst.remove(), 700);
  repositionNode();
});

startBtn.addEventListener('click', startCircuit);
