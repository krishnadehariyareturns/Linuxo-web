const menuButton = document.querySelector(".menu-toggle");
const nav = document.querySelector("#nav");

menuButton?.addEventListener("click", () => {
  const open = nav.classList.toggle("open");
  menuButton.setAttribute("aria-expanded", String(open));
});

nav?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    nav.classList.remove("open");
    menuButton?.setAttribute("aria-expanded", "false");
  });
});

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let animeApi = null;

// Load Anime.js without making the navigation or page content depend on the CDN.
if (!prefersReducedMotion) {
  import("https://cdn.jsdelivr.net/npm/animejs@4.5.0/+esm")
    .then((module) => {
      animeApi = module;
      const { animate, stagger } = module;

      // A slow, restrained float keeps the mascot artwork from feeling static.
      const heroArt = document.querySelector(".hero-art");
      if (heroArt) {
        animate(heroArt, {
          y: [0, -8],
          duration: 3200,
          ease: "inOutSine",
          alternate: true,
          loop: true,
        });
      }

      // Bring the desktop navigation in gently on first load.
      const headerLinks = document.querySelectorAll(".topbar nav > a");
      if (headerLinks.length) {
        animate(headerLinks, {
          opacity: [0, 1],
          y: [-7, 0],
          delay: stagger(55),
          duration: 520,
          ease: "outCubic",
        });
      }
    })
    .catch((error) => {
      // The page remains fully usable if the optional animation CDN is unavailable.
      console.warn("Anime.js could not be loaded; using CSS motion fallback.", error);
    });
}

const revealElements = document.querySelectorAll(".reveal, .reveal-section");
if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;

      entry.target.classList.add("visible");
      if (animeApi && !prefersReducedMotion) {
        animeApi.animate(entry.target, {
          filter: ["blur(4px)", "blur(0px)"],
          duration: 620,
          ease: "outQuad",
        });
      }
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.12 });

  revealElements.forEach((element, index) => {
    if (element.classList.contains("reveal")) {
      element.style.transitionDelay = `${Math.min(index % 4, 3) * 70}ms`;
    }
    revealObserver.observe(element);
  });
} else {
  revealElements.forEach((element) => element.classList.add("visible"));
}

// Set these two URLs before publishing.
const LINKS = {
  discord: "YOUR_DISCORD_SERVER_INVITE_URL",
  invite: "YOUR_BOT_INVITE_URL",
};

document.querySelectorAll(".discord-link").forEach((link) => {
  link.href = LINKS.discord;
  link.addEventListener("click", (event) => {
    if (LINKS.discord.includes("YOUR_")) {
      event.preventDefault();
      alert("Add your Discord server invite URL in script.js before publishing.");
    }
  });
});

document.querySelectorAll(".invite-link").forEach((link) => {
  link.href = LINKS.invite;
  link.addEventListener("click", (event) => {
    if (LINKS.invite.includes("YOUR_")) {
      event.preventDefault();
      alert("Add your bot invite URL in script.js before publishing.");
    }
  });
});
