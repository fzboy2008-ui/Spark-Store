/* ==========================================================
   ROUTING & MATRIX BACKGROUND
========================================================== */
const navTabs = document.querySelectorAll('.nav-tab');
const pageViews = document.querySelectorAll('.page-view');

function switchPage(targetId) {
  navTabs.forEach(tab => {
    tab.classList.toggle('active', tab.getAttribute('data-target') === targetId);
  });

  pageViews.forEach(view => {
    view.classList.toggle('active', view.id === targetId);
  });

  // Re-adjust canvases on tab switch
  if (targetId === 'showcaseView') {
    if (typeof fitHoloCanvas === 'function') setTimeout(fitHoloCanvas, 50);
    if (typeof fitUserCanvas === 'function') setTimeout(fitUserCanvas, 50);
  }
}

navTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    switchPage(tab.getAttribute('data-target'));
  });
});

/* Realtime Cyber Canvas Background */
const bgCanvas = document.getElementById("sparkCanvas");
if (bgCanvas) {
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

  class CyberNode {
    constructor() {
      this.x = Math.random() * bgCanvas.width;
      this.y = Math.random() * bgCanvas.height;
      this.vx = (Math.random() - 0.5) * 1.2;
      this.vy = (Math.random() - 0.5) * 1.2;
      this.radius = Math.random() * 2 + 1;
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
        let dist = Math.hypot(dx, dy);
        if (dist < 120) {
          this.x -= (dx / dist) * 2;
          this.y -= (dy / dist) * 2;
        }
      }
    }
    draw() {
      bgCtx.beginPath();
      bgCtx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      bgCtx.fillStyle = this.color;
      bgCtx.fill();
    }
  }

  function initBgGrid() {
    bgParticles = [];
    const count = Math.floor((bgCanvas.width * bgCanvas.height) / 15000);
    for (let i = 0; i < count; i++) bgParticles.push(new CyberNode());
  }
  initBgGrid();

  function renderCyberBg() {
    bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
    for (let a = 0; a < bgParticles.length; a++) {
      bgParticles[a].update();
      bgParticles[a].draw();
      for (let b = a + 1; b < bgParticles.length; b++) {
        let dist = Math.hypot(bgParticles[a].x - bgParticles[b].x, bgParticles[a].y - bgParticles[b].y);
        if (dist < 85) {
          bgCtx.strokeStyle = `rgba(0, 240, 255, ${0.2 * (1 - dist / 85)})`;
          bgCtx.lineWidth = 0.8;
          bgCtx.beginPath();
          bgCtx.moveTo(bgParticles[a].x, bgParticles[a].y);
          bgCtx.lineTo(bgParticles[b].x, bgParticles[b].y);
          bgCtx.stroke();
        }
      }
    }
    requestAnimationFrame(renderCyberBg);
  }
  renderCyberBg();
}
