const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const script = fs.readFileSync(path.join(root, "script.js"), "utf8");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const css = fs.readFileSync(path.join(root, "styles.css"), "utf8");
const config = JSON.parse(fs.readFileSync(path.join(root, "config.json"), "utf8"));

class Element {
  constructor(dataset = {}, attributes = {}) {
    this.dataset = dataset;
    this.attributes = attributes;
    this.events = {};
    this.classes = new Set();
    this.classList = { toggle: (name, force) => force ? this.classes.add(name) : this.classes.delete(name) };
  }
  setAttribute(name, value) { this.attributes[name] = value; }
  getAttribute(name) { return this.attributes[name]; }
  addEventListener(name, callback) { this.events[name] = callback; }
  focus() { this.focused = true; }
}

async function boot(fetchConfig = async () => ({ ok: true, json: async () => config })) {
  const site = ["name", "title", "description", "statusLabel", "tagline", "copyright"].map((key) => new Element({ site: key }));
  const links = Object.keys(config.links).map((key) => new Element({ link: key }));
  const text = [new Element({ text: "inviteLabel" })];
  const labels = [new Element({ label: "githubLabel" }), new Element({ label: "discordLabel" })];
  const toggle = new Element({}, { "aria-expanded": "false" });
  const menu = new Element({}, { "aria-hidden": "true" });
  menu.inert = true;
  const mobileLinks = [new Element(), new Element()];
  const theme = new Element();
  const description = new Element();
  const properties = {};
  const documentEvents = {};
  const viewportEvents = {};
  const warnings = [];
  const document = {
    documentElement: { style: { setProperty: (name, value) => { properties[name] = value; } } },
    querySelectorAll: (selector) => ({ "[data-site]": site, "[data-link]": links, "[data-text]": text, "[data-label]": labels, ".mobile-menu a": mobileLinks })[selector] || [],
    querySelector: (selector) => ({ ".menu-toggle": toggle, ".mobile-menu": menu, 'meta[name="theme-color"]': theme, 'meta[name="description"]': description })[selector] || null,
    addEventListener: (name, callback) => { documentEvents[name] = callback; }
  };
  const context = vm.createContext({
    document,
    fetch: fetchConfig,
    window: { matchMedia: () => ({ addEventListener: (name, callback) => { viewportEvents[name] = callback; } }) },
    console: { warn: (...args) => warnings.push(args) }
  });
  vm.runInContext(script, context);
  await new Promise((resolve) => setImmediate(resolve));
  return { context, document, site, links, text, labels, toggle, menu, mobileLinks, theme, description, properties, documentEvents, viewportEvents, warnings };
}

test("configured branding, metadata, labels, and original links are applied", async () => {
  const page = await boot();
  assert.equal(page.document.title, "Linuxo — Your server's secret weapon.");
  assert.equal(page.site.find((element) => element.dataset.site === "name").textContent, "Linuxo");
  assert.equal(page.theme.attributes.content, config.palette.paper);
  assert.equal(page.description.attributes.content, config.site.description);
  for (const link of page.links) assert.equal(link.href, config.links[link.dataset.link]);
  assert.equal(page.text[0].textContent, config.settings.inviteLabel);
  for (const label of page.labels) assert.equal(label.textContent, config.settings[label.dataset.label]);
});

test("all six requested terminal colors are used in config and static CSS defaults", async () => {
  const expected = { terminal: "#091737", terminalBorder: "#18366F", terminalText: "#F5F8FF", command: "#6EAEFF", prompt: "#3278DB", cursor: "#1684FF" };
  const page = await boot();
  for (const [key, value] of Object.entries(expected)) {
    const variable = `--${key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`;
    assert.equal(config.palette[key], value);
    assert.equal(page.properties[variable], value);
    assert.match(css, new RegExp(`${variable}:\\s*${value};`, "i"));
  }
  assert.match(css, /\.terminal-panel\s*\{[^}]*background: var\(--terminal\)[^}]*font-family: var\(--mono\)/);
  assert.match(css, /code, pre, kbd, samp\s*\{ font-family: var\(--mono\)/);
  assert.match(css, /body\s*\{[^}]*font-family: var\(--sans\)/);
});

test("a failed or invalid configuration request keeps the blue fallback usable", async () => {
  for (const fetchConfig of [
    async () => { throw new Error("offline"); },
    async () => ({ ok: false, status: 404 }),
    async () => ({ ok: true, json: async () => { throw new SyntaxError("invalid JSON"); } })
  ]) {
    const page = await boot(fetchConfig);
    assert.equal(page.properties["--terminal"], "#091737");
    assert.equal(page.properties["--command"], "#6EAEFF");
    assert.equal(page.properties["--cursor"], "#1684FF");
    assert.equal(page.warnings.length, 1);
    assert.equal(page.text[0].textContent, "Add to Discord");
  }
});

test("partial configuration preserves defaults and escapes title markup", async () => {
  const page = await boot(async () => ({ ok: true, json: async () => ({ site: { title: '<img src=x>\nFirst & second\n"Last"' } }) }));
  const title = page.site.find((element) => element.dataset.site === "title");
  assert.equal(title.innerHTML, '&lt;img src=x&gt;<br />First &amp; second<br /><em>&quot;Last&quot;</em>');
  assert.equal(page.document.title, 'Linuxo — <img src=x> First & second "Last"');
  assert.equal(page.properties["--terminal-border"], "#18366F");
  assert.equal(page.links[0].href, config.links.invite);
});

test("mobile navigation opens, closes, and restores focus on Escape", async () => {
  const page = await boot();
  assert.equal(page.menu.inert, true);
  page.toggle.events.click();
  assert.equal(page.toggle.getAttribute("aria-expanded"), "true");
  assert.equal(page.toggle.getAttribute("aria-label"), "Close menu");
  assert.equal(page.menu.getAttribute("aria-hidden"), "false");
  assert.equal(page.menu.inert, false);
  assert.equal(page.menu.classes.has("open"), true);
  page.documentEvents.keydown({ key: "Escape" });
  assert.equal(page.toggle.getAttribute("aria-expanded"), "false");
  assert.equal(page.menu.inert, true);
  assert.equal(page.menu.classes.has("open"), false);
  assert.equal(page.toggle.focused, true);
});

test("navigation links and switching to desktop close the mobile menu", async () => {
  const page = await boot();
  page.toggle.events.click();
  page.mobileLinks[0].events.click();
  assert.equal(page.menu.inert, true);
  page.toggle.events.click();
  page.viewportEvents.change({ matches: true });
  assert.equal(page.toggle.getAttribute("aria-expanded"), "false");
  assert.equal(page.menu.inert, true);
});

test("local assets, anchor targets, and accessible static menu state are present", () => {
  const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]));
  for (const match of html.matchAll(/\bhref="#([^"]+)"/g)) assert.ok(ids.has(match[1]), `Missing target: ${match[1]}`);
  for (const match of html.matchAll(/(?:src|href)="([^"#]+)"/g)) {
    if (/^(https?:|\/)/.test(match[1])) continue;
    assert.ok(fs.existsSync(path.join(root, match[1])), `Missing asset: ${match[1]}`);
  }
  assert.match(html, /id="mobile-menu" aria-hidden="true" inert/);
  assert.match(html, /class="skip-link"/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /\.reveal, \.terminal-cursor \{ animation: none; \}/);
  assert.equal([...html.matchAll(/<h1\b/g)].length, 1);
});
