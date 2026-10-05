const defaultConfig = {
  site: {
    name: "Linuxo",
    shortName: "l",
    eyebrow: "A better bot for better servers",
    title: "Your server's\nsecret weapon.",
    description: "Linuxo brings the everyday tools your community needs into one calm, capable Discord bot — so conversations stay moving and admins stay in the loop.",
    statusLabel: "Discord bot · ready to deploy",
    tagline: "Discord, but with a little Linux.",
    copyright: "© 2024 Linuxo"
  },
  links: {
    invite: "https://discord.com/oauth2/authorize?client_id=YOUR_LINUXO_CLIENT_ID&scope=bot%20applications.commands&permissions=277025770048",
    github: "https://github.com/linuxo-bot/linuxo",
    discord: "https://discord.gg/linuxo",
    privacy: "/privacy",
    terms: "/terms"
  },
  palette: {
    ink: "#11110f",
    inkSoft: "#1a1915",
    paper: "#f2f0e9",
    paperDark: "#e5e2d9",
    muted: "#77756d",
    mutedDark: "#9b988e",
    lime: "#d2f45b",
    limeBright: "#e2ff76"
  },
  settings: {
    inviteLabel: "Add to Discord",
    githubLabel: "View on GitHub",
    discordLabel: "Join the Discord"
  }
};

function mergeConfig(config) {
  return {
    ...defaultConfig,
    ...config,
    site: { ...defaultConfig.site, ...(config.site || {}) },
    links: { ...defaultConfig.links, ...(config.links || {}) },
    palette: { ...defaultConfig.palette, ...(config.palette || {}) },
    settings: { ...defaultConfig.settings, ...(config.settings || {}) }
  };
}

function escapeHtml(value) {
  return String(value).replace(/[&<>\"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '\"': "&quot;",
    "'": "&#039;"
  })[character]);
}

function applyConfig(config) {
  const { site, links, palette, settings } = mergeConfig(config);

  Object.entries(palette).forEach(([name, value]) => {
    const cssName = name.replace(/[A-Z]/g, (character) => `-${character.toLowerCase()}`);
    document.documentElement.style.setProperty(`--${cssName}`, value);
  });

  document.querySelectorAll("[data-site]").forEach((element) => {
    const value = site[element.dataset.site];
    if (value == null) return;
    if (element.dataset.site === "title") {
      const titleLines = String(value).split("\n");
      element.innerHTML = titleLines
        .map((line, index) => index === titleLines.length - 1 ? `<em>${escapeHtml(line)}</em>` : escapeHtml(line))
        .join("<br />");
      return;
    }
    element.textContent = String(value);
  });

  document.querySelectorAll("[data-link]").forEach((element) => {
    const value = links[element.dataset.link];
    if (value) element.href = value;
  });

  document.querySelectorAll("[data-text]").forEach((element) => {
    const value = settings[element.dataset.text];
    if (value) element.textContent = value;
  });

  document.querySelectorAll("[data-label]").forEach((element) => {
    const value = settings[element.dataset.label];
    if (value) element.textContent = value;
  });

  document.title = `${site.name} — ${site.title.replace("\n", " ")}`;
}

async function loadConfig() {
  try {
    const response = await fetch("./config.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`Config request failed: ${response.status}`);
    applyConfig(await response.json());
  } catch (error) {
    // The fallback keeps the static page usable if it is opened without a web server.
    console.warn("Linuxo config.json could not be loaded; using defaults.", error);
    applyConfig(defaultConfig);
  }
}

const menuToggle = document.querySelector(".menu-toggle");
const mobileMenu = document.querySelector(".mobile-menu");

menuToggle?.addEventListener("click", () => {
  const isOpen = mobileMenu.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
  menuToggle.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
  mobileMenu.setAttribute("aria-hidden", String(!isOpen));
});

document.querySelectorAll(".mobile-menu a").forEach((link) => {
  link.addEventListener("click", () => {
    mobileMenu.classList.remove("open");
    menuToggle?.setAttribute("aria-expanded", "false");
    menuToggle?.setAttribute("aria-label", "Open menu");
    mobileMenu?.setAttribute("aria-hidden", "true");
  });
});

loadConfig();
