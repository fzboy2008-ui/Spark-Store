/* ==========================================================
   1. CUSTOM GLOW CURSOR WITH TRAIL
========================================================== */
const cursorDot = document.getElementById("cursorDot");
const cursorOutline = document.getElementById("cursorOutline");

window.addEventListener("mousemove", (e) => {
  const { clientX: x, clientY: y } = e;

  cursorDot.style.left = `${x}px`;
  cursorDot.style.top = `${y}px`;

  cursorOutline.animate(
    { left: `${x}px`, top: `${y}px` },
    { duration: 400, fill: "forwards" }
  );
});

// Cursor Hover Expansion
document.querySelectorAll("button, a, .tilt-card, .showcase-card, .social-card").forEach((el) => {
  el.addEventListener("mouseenter", () => {
    cursorOutline.style.transform = "translate(-50%, -50%) scale(1.6)";
    cursorOutline.style.borderColor = "var(--neon-pink)";
  });
  el.addEventListener("mouseleave", () => {
    cursorOutline.style.transform = "translate(-50%, -50%) scale(1)";
    cursorOutline.style.borderColor = "var(--neon-cyan)";
  });
});

/* ==========================================================
   2. INTERACTIVE CANVAS BACKGROUND (PHYSICS PARTICLES)
========================================================== */
const canvas = document.getElementById("bgCanvas");
const ctx = canvas.getContext("2d");

let particlesArray = [];
let mousePos = { x: null, y: null, radius: 150 };

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

window.addEventListener("mousemove", (e) => {
  mousePos.x = e.x;
  mousePos.y = e.y;
});

class Particle {
  constructor() {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.size = Math.random() * 2.5 + 1;
    this.speedX = (Math.random() - 0.5) * 1.2;
    this.speedY = (Math.random() - 0.5) * 1.2;
    this.color = Math.random() > 0.5 ? "rgba(0, 240, 255, " : "rgba(157, 78, 221, ";
  }

  update() {
    this.x += this.speedX;
    this.y += this.speedY;

    if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
    if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;

    // Mouse Interaction
    let dx = mousePos.x - this.x;
    let dy = mousePos.y - this.y;
    let distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < mousePos.radius) {
      const force = (mousePos.radius - distance) / mousePos.radius;
      const directionX = dx / distance;
      const directionY = dy / distance;
      this.x -= directionX * force * 3;
      this.y -= directionY * force * 3;
    }
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = this.color + "0.6)";
    ctx.fill();
  }
}

function initParticles() {
  particlesArray = [];
  const count = Math.floor((canvas.width * canvas.height) / 14000);
  for (let i = 0; i < count; i++) {
    particlesArray.push(new Particle());
  }
}
initParticles();

function connectParticles() {
  for (let a = 0; a < particlesArray.length; a++) {
    for (let b = a; b < particlesArray.length; b++) {
      let dx = particlesArray[a].x - particlesArray[b].x;
      let dy = particlesArray[a].y - particlesArray[b].y;
      let dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 110) {
        let opacity = 1 - dist / 110;
        ctx.strokeStyle = `rgba(0, 240, 255, ${opacity * 0.15})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(particlesArray[a].x, particlesArray[a].y);
        ctx.lineTo(particlesArray[b].x, particlesArray[b].y);
        ctx.stroke();
      }
    }
  }
}

function animateCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  particlesArray.forEach((p) => {
    p.update();
    p.draw();
  });
  connectParticles();
  requestAnimationFrame(animateCanvas);
}
animateCanvas();

/* ==========================================================
   3. SPA PAGE NAVIGATION SYSTEM
========================================================== */
const navButtons = document.querySelectorAll(".nav-btn");
const pageViews = document.querySelectorAll(".page-view");

function switchPage(targetId) {
  // Update Buttons
  navButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.getAttribute("data-target") === targetId);
  });

  // Animate & Switch View
  pageViews.forEach((view) => {
    if (view.id === targetId) {
      view.classList.add("active");
    } else {
      view.classList.remove("active");
    }
  });

  // Trigger counters if navigating to stats
  if (targetId === "stats") {
    animateCounters();
  }
}

navButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const target = btn.getAttribute("data-target");
    switchPage(target);
  });
});

/* ==========================================================
   4. 3D TILT EFFECT ON CARDS
========================================================== */
document.querySelectorAll("[data-tilt]").forEach((card) => {
  card.addEventListener("mousemove", (e) => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    const rotX = -(y / (rect.height / 2)) * 12;
    const rotY = (x / (rect.width / 2)) * 12;

    card.style.transform = `perspective(1000px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale3d(1.04, 1.04, 1.04)`;
  });

  card.addEventListener("mouseleave", () => {
    card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
  });
});

/* ==========================================================
   5. SHOWCASE FILTER SYSTEM
========================================================== */
const filterButtons = document.querySelectorAll(".filter-btn");
const showcaseCards = document.querySelectorAll(".showcase-card");

filterButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    filterButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    const category = btn.getAttribute("data-filter");

    showcaseCards.forEach((card) => {
      const match = category === "all" || card.getAttribute("data-category") === category;
      if (match) {
        card.style.display = "block";
        card.style.animation = "pageIn 0.4s ease forwards";
      } else {
        card.style.display = "none";
      }
    });
  });
});

/* ==========================================================
   6. CYBER CLICKER MINI GAME LOGIC
========================================================== */
let score = 0;
let timeLeft = 15;
let combo = 1;
let gameInterval = null;
let isPlaying = false;

const gameScoreEl = document.getElementById("gameScore");
const gameTimeEl = document.getElementById("gameTime");
const gameComboEl = document.getElementById("gameCombo");
const coreTarget = document.getElementById("coreTarget");
const gameOverlay = document.getElementById("gameOverlay");
const startGameBtn = document.getElementById("startGameBtn");
const gameArena = document.getElementById("gameArena");

function moveTarget() {
  const arenaRect = gameArena.getBoundingClientRect();
  const maxX = arenaRect.width - 80;
  const maxY = arenaRect.height - 80;

  const randomX = Math.floor(Math.random() * maxX) + 40;
  const randomY = Math.floor(Math.random() * maxY) + 40;

  coreTarget.style.left = `${randomX}px`;
  coreTarget.style.top = `${randomY}px`;
}

function startGame() {
  score = 0;
  combo = 1;
  timeLeft = 15;
  isPlaying = true;

  gameScoreEl.innerText = score;
  gameComboEl.innerText = `x${combo}`;
  gameTimeEl.innerText = `${timeLeft}s`;

  gameOverlay.classList.remove("active");
  moveTarget();

  gameInterval = setInterval(() => {
    timeLeft--;
    gameTimeEl.innerText = `${timeLeft}s`;

    if (timeLeft <= 0) {
      endGame();
    }
  }, 1000);
}

function endGame() {
  clearInterval(gameInterval);
  isPlaying = false;
  gameOverlay.innerHTML = `
    <h3>TIME'S UP!</h3>
    <p>Final Score: <strong>${score}</strong> | Best Combo: <strong>x${combo}</strong></p>
    <button class="btn btn-primary" onclick="startGame()">Play Again</button>
  `;
  gameOverlay.classList.add("active");
}

coreTarget.addEventListener("click", (e) => {
  if (!isPlaying) return;

  score += 10 * combo;
  combo++;
  gameScoreEl.innerText = score;
  gameComboEl.innerText = `x${combo}`;

  // Spawn dynamic float score
  const floatText = document.createElement("span");
  floatText.className = "float-score";
  floatText.innerText = `+${10 * combo}`;
  floatText.style.left = `${coreTarget.offsetLeft + 10}px`;
  floatText.style.top = `${coreTarget.offsetTop - 10}px`;
  gameArena.appendChild(floatText);

  setTimeout(() => floatText.remove(), 800);
  moveTarget();
});

startGameBtn.addEventListener("click", startGame);

/* ==========================================================
   7. ANIMATED NUMBER COUNTERS
========================================================== */
function animateCounters() {
  const counters = document.querySelectorAll(".counter");
  counters.forEach((counter) => {
    counter.innerText = "0";
    const target = +counter.getAttribute("data-count");
    const speed = target / 50;

    const updateCount = () => {
      const count = +counter.innerText;
      if (count < target) {
        counter.innerText = Math.ceil(count + speed);
        setTimeout(updateCount, 25);
      } else {
        counter.innerText = target;
      }
    };
    updateCount();
  });
}

/* ==========================================================
   8. CONTACT FORM SUBMISSION FEEDBACK
========================================================== */
const contactForm = document.getElementById("contactForm");
const formFeedback = document.getElementById("formFeedback");

contactForm.addEventListener("submit", (e) => {
  e.preventDefault();
  formFeedback.style.color = "var(--neon-cyan)";
  formFeedback.innerText = "⚡ TRANSMITTING PACKET...";

  setTimeout(() => {
    formFeedback.style.color = "#4ade80";
    formFeedback.innerText = "✓ TRANSMISSION RECEIVED BY SERVER CORE!";
    contactForm.reset();

    setTimeout(() => {
      formFeedback.innerText = "";
    }, 4000);
  }, 1200);
});
                          
