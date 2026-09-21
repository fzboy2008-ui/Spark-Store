/* =========================================================
   SPARK PROJECT
   Main JavaScript
   ========================================================= */


/* ---------------------------------------------------------
   LOADER
   --------------------------------------------------------- */

window.addEventListener("load", () => {

    const loader = document.getElementById("loader");

    setTimeout(() => {
        loader.classList.add("hide");
    }, 700);

});


/* ---------------------------------------------------------
   MOBILE MENU
   --------------------------------------------------------- */

const menuToggle = document.getElementById("menuToggle");
const navMenu = document.getElementById("navMenu");

menuToggle.addEventListener("click", () => {
    navMenu.classList.toggle("open");

    if (navMenu.classList.contains("open")) {
        menuToggle.textContent = "×";
    } else {
        menuToggle.textContent = "☰";
    }
});


/* Close mobile menu after clicking a link */

document.querySelectorAll("#navMenu a").forEach(link => {

    link.addEventListener("click", () => {
        navMenu.classList.remove("open");
        menuToggle.textContent = "☰";
    });

});


/* ---------------------------------------------------------
   SMOOTH SCROLL
   --------------------------------------------------------- */

function scrollToSection(id) {

    const section = document.getElementById(id);

    if (!section) return;

    section.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

}


/* ---------------------------------------------------------
   SCROLL REVEAL
   --------------------------------------------------------- */

const revealElements = document.querySelectorAll(".reveal");

const revealObserver = new IntersectionObserver(
    (entries) => {

        entries.forEach((entry) => {

            if (entry.isIntersecting) {

                entry.target.classList.add("visible");

                revealObserver.unobserve(entry.target);

            }

        });

    },
    {
        threshold: 0.12
    }
);

revealElements.forEach((element) => {
    revealObserver.observe(element);
});


/* ---------------------------------------------------------
   ACTIVE NAVIGATION
   --------------------------------------------------------- */

const sections = document.querySelectorAll("main section");
const navLinks = document.querySelectorAll("#navMenu a");

const sectionObserver = new IntersectionObserver(
    (entries) => {

        entries.forEach((entry) => {

            if (entry.isIntersecting) {

                const currentId = entry.target.id;

                navLinks.forEach(link => {

                    link.classList.remove("active");

                    if (link.getAttribute("href") === "#" + currentId) {
                        link.classList.add("active");
                    }

                });

            }

        });

    },
    {
        rootMargin: "-35% 0px -55% 0px"
    }
);

sections.forEach(section => {
    sectionObserver.observe(section);
});


/* ---------------------------------------------------------
   SHOP QUANTITY
   --------------------------------------------------------- */

let quantity = 1;

const pricePerItem = 1;

const quantityElement = document.getElementById("quantity");
const totalElement = document.getElementById("total");

const checkoutQuantity =
    document.getElementById("checkoutQuantity");

const checkoutTotal =
    document.getElementById("checkoutTotal");


function changeQuantity(amount) {

    quantity += amount;

    /*
       Prevent quantity from going below 1.
       Maximum is currently 99 for demo purposes.
    */

    if (quantity < 1) {
        quantity = 1;
    }

    if (quantity > 99) {
        quantity = 99;
    }

    updateCart();

}


function updateCart() {

    const total = quantity * pricePerItem;

    quantityElement.textContent = quantity;

    totalElement.textContent = "₹" + total;

    checkoutQuantity.textContent = quantity;

    checkoutTotal.textContent = "₹" + total;

}


/* ---------------------------------------------------------
   CHECKOUT
   --------------------------------------------------------- */

const checkoutModal =
    document.getElementById("checkoutModal");


function openCheckout() {

    updateCart();

    checkoutModal.classList.add("show");

    document.body.style.overflow = "hidden";

}


function closeCheckout() {

    checkoutModal.classList.remove("show");

    document.body.style.overflow = "";

}


/* ---------------------------------------------------------
   DEMO PAYMENT
   --------------------------------------------------------- */

const successModal =
    document.getElementById("successModal");

const orderId =
    document.getElementById("orderId");


function demoPayment() {

    /*
       This is ONLY a frontend demonstration.

       No real payment is processed here.

       In the production version this function should:
       1. Create an order on the backend.
       2. Open a real payment gateway.
       3. Verify the payment on the backend.
       4. Wait for a verified webhook.
       5. Mark the order as PAID.
    */

    const button =
        document.querySelector(".confirm-button");

    button.disabled = true;

    button.innerHTML = `
        <span>Processing...</span>
        <span>⏳</span>
    `;

    setTimeout(() => {

        checkoutModal.classList.remove("show");

        const randomNumber =
            Math.floor(100000 + Math.random() * 900000);

        orderId.textContent =
            "SPK-" + randomNumber;

        successModal.classList.add("show");

        button.disabled = false;

        button.innerHTML = `
            <span>Continue to Payment</span>
            <span>→</span>
        `;

    }, 1200);

}


function closeSuccess() {

    successModal.classList.remove("show");

    document.body.style.overflow = "";

}


/* ---------------------------------------------------------
   CLOSE MODALS WHEN CLICKING OUTSIDE
   --------------------------------------------------------- */

checkoutModal.addEventListener("click", (event) => {

    if (event.target === checkoutModal) {
        closeCheckout();
    }

});


successModal.addEventListener("click", (event) => {

    if (event.target === successModal) {
        closeSuccess();
    }

});


/* ---------------------------------------------------------
   ESC KEY
   --------------------------------------------------------- */

document.addEventListener("keydown", (event) => {

    if (event.key === "Escape") {

        closeCheckout();
        closeSuccess();

    }

});


/* ---------------------------------------------------------
   MOUSE PARALLAX EFFECT
   --------------------------------------------------------- */

const heroVisual =
    document.querySelector(".hero-visual");

if (heroVisual && window.innerWidth > 900) {

    heroVisual.addEventListener("mousemove", (event) => {

        const rect =
            heroVisual.getBoundingClientRect();

        const x =
            event.clientX - rect.left;

        const y =
            event.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const moveX =
            (x - centerX) / 35;

        const moveY =
            (y - centerY) / 35;

        heroVisual.style.transform =
            `translate(${moveX}px, ${moveY}px)`;

    });


    heroVisual.addEventListener("mouseleave", () => {

        heroVisual.style.transform =
            "translate(0, 0)";

    });

}


/* ---------------------------------------------------------
   RANDOM FLOATING PARTICLES
   --------------------------------------------------------- */

function createParticle() {

    const particle =
        document.createElement("span");

    particle.style.position = "fixed";
    particle.style.width = "2px";
    particle.style.height = "2px";
    particle.style.borderRadius = "50%";
    particle.style.background = "rgba(190,150,255,0.6)";
    particle.style.pointerEvents = "none";
    particle.style.zIndex = "-1";

    particle.style.left =
        Math.random() * 100 + "vw";

    particle.style.top =
        Math.random() * 100 + "vh";

    particle.style.opacity =
        Math.random() * 0.7;

    const duration =
        5 + Math.random() * 8;

    particle.style.transition =
        `transform ${duration}s linear, opacity ${duration}s linear`;

    document.body.appendChild(particle);

    requestAnimationFrame(() => {

        particle.style.transform =
            `translate(${(Math.random() - 0.5) * 150}px, -${100 + Math.random() * 250}px)`;

        particle.style.opacity = "0";

    });

    setTimeout(() => {
        particle.remove();
    }, duration * 1000);

}


/* Create particles periodically */

setInterval(createParticle, 700);


/* ---------------------------------------------------------
   INITIAL CART STATE
   --------------------------------------------------------- */

updateCart();
