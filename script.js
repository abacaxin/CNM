// ===============================
// CNM - Copa Nexus Monospoto
// script.js
// ===============================

// -------------------------------
// Scroll Reveal Animations
// -------------------------------

const observer = new IntersectionObserver(
    (entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add("show");
            }
        });
    },
    {
        threshold: 0.15
    }
);

document.querySelectorAll(".reveal").forEach((element) => {
    observer.observe(element);
});


// -------------------------------
// Countdown da próxima corrida
// -------------------------------

const targetDate = new Date(Date.now() + 24 * 60 * 60 * 1000);

function updateCountdown() {
    const now = new Date();
    const diff = targetDate - now;

    if (diff <= 0) {
        document.getElementById("countdown").textContent =
            "Corrida iniciada!";
        return;
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(
        (diff % (1000 * 60 * 60)) / (1000 * 60)
    );
    const seconds = Math.floor(
        (diff % (1000 * 60)) / 1000
    );

    document.getElementById(
        "countdown"
    ).textContent = `${hours}h ${minutes}m ${seconds}s`;

    requestAnimationFrame(updateCountdown);
}

updateCountdown();


// -------------------------------
// Slider de notícias
// -------------------------------

const slides = document.querySelectorAll(".slide");
let currentSlide = 0;

function showSlide(index) {
    slides.forEach((slide) => {
        slide.classList.remove("active");
    });

    slides[index].classList.add("active");
}

function nextSlide() {
    currentSlide++;

    if (currentSlide >= slides.length) {
        currentSlide = 0;
    }

    showSlide(currentSlide);
}

setInterval(nextSlide, 5000);


// -------------------------------
// Header encolhendo no scroll
// -------------------------------

const header = document.querySelector(".header");

window.addEventListener("scroll", () => {
    if (window.scrollY > 50) {
        header.classList.add("shrink");
    } else {
        header.classList.remove("shrink");
    }
});


// -------------------------------
// Hall da Fama - movimento contínuo
// -------------------------------

const hallTrack = document.querySelector(".hall-track");

let position = 0;
let paused = false;

hallTrack?.addEventListener("mouseenter", () => {
    paused = true;
});

hallTrack?.addEventListener("mouseleave", () => {
    paused = false;
});

function animateHall() {
    if (!paused && hallTrack) {
        position -= 0.5;

        if (Math.abs(position) >= hallTrack.scrollWidth / 2) {
            position = 0;
        }

        hallTrack.style.transform = `translateX(${position}px)`;
    }

    requestAnimationFrame(animateHall);
}

animateHall();
