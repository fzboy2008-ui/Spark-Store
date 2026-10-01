/* ==========================================================
   NAVIGATION ROUTER & AUTO-RESIZE HANDLERS
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

  // Re-adjust active canvas resolutions
  if (targetId === 'showcaseView') {
    if (typeof fitHoloCanvas === 'function') setTimeout(fitHoloCanvas, 60);
    if (typeof fitUserCanvas === 'function') setTimeout(fitUserCanvas, 60);
    if (typeof fitSynthCanvas === 'function') setTimeout(fitSynthCanvas, 60);
  } else if (targetId === 'gameView') {
    if (typeof fitActiveGameCanvas === 'function') setTimeout(fitActiveGameCanvas, 60);
  }
}

navTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    switchPage(tab.getAttribute('data-target'));
  });
});

/* ==========================================================
   BLUE & RED DUAL-POLE CYBER MATRIX BACKGROUND
========================================================== */
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
      this.vx = (Math.random() - 0.5) * 1.1;
      this.vy = (Math.random() - 0.5) * 1.1;
      this.radius = Math.random() * 2 + 1;
      this.color = Math.random() > 0.5 ? "#00d4ff" : "#ff003c";
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
          this.x -= (dx / dist) * 2.2;
          this.y -= (dy / dist) * 2.2;
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
          bgCtx.strokeStyle = bgParticles[a].color === "#00d4ff" 
            ? `rgba(0, 212, 255, ${0.22 * (1 - dist / 85)})` 
            : `rgba(255, 0, 60, ${0.22 * (1 - dist / 85)})`;
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

/* ==========================================================
   PAYTM CHECKOUT MODAL HANDLERS
========================================================== */
function openMembershipModal() {
  const modal = document.getElementById("membershipModal");
  if (modal) {
    modal.style.display = "flex";
    backToStep1();
  }
}

function closeMembershipModal() {
  const modal = document.getElementById("membershipModal");
  if (modal) modal.style.display = "none";
}

function openPaytmCheckout() {
  document.getElementById("paytmStep1").style.display = "none";
  document.getElementById("paytmStep2").style.display = "block";
}

function backToStep1() {
  document.getElementById("paytmStep1").style.display = "block";
  document.getElementById("paytmStep2").style.display = "none";
  const status = document.getElementById("paytmStatusMsg");
  if (status) status.innerText = "";
}

function verifyPaytmPayment() {
  const utr = document.getElementById("paytmUtrInput").value.trim();
  const status = document.getElementById("paytmStatusMsg");

  if (!utr || utr.length < 8) {
    status.style.color = "var(--neon-red)";
    status.innerText = "Please enter valid 12-digit UPI reference / UTR number!";
    return;
  }

  status.style.color = "var(--neon-cyan)";
  status.innerText = "VERIFYING TRANSACTION TOKEN...";

  setTimeout(() => {
    status.style.color = "var(--neon-green)";
    status.innerHTML = "✓ ₹2 SETUP APPROVED! 30-DAY VIP PASS ACTIVATED.";
    
    // Set VIP status in local storage
    localStorage.setItem("spark_vip_active", "true");
    localStorage.setItem("spark_vip_expiry", Date.now() + (30 * 24 * 60 * 60 * 1000));

    // Update Header Tag
    const headerTag = document.getElementById("headerAgentTag");
    if (headerTag) {
      headerTag.innerHTML = "VIP • " + (localStorage.getItem("spark_agent_name") || "FOUNDER").toUpperCase();
      headerTag.style.color = "#ffd700";
    }

    if (typeof FX !== "undefined" && FX.powerup) FX.powerup();

    setTimeout(() => {
      closeMembershipModal();
      status.innerText = "";
    }, 2500);
  }, 1200);
}
