import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { renderLucideIcon } from "../js/ui/icons/lucideIcons.js";

test("renders Lucide markup for a mapped UI icon", () => {
  const markup = renderLucideIcon("play", "player-control-icon");

  assert.match(markup, /class="player-control-icon lucide-icon"/);
  assert.match(markup, /viewBox="0 0 24 24"/);
  assert.match(markup, /stroke="currentColor"/);
  assert.match(markup, /M5 5a2 2/);
});

test("falls back to the Lucide settings icon for unknown names", () => {
  const markup = renderLucideIcon("unknown-icon");

  assert.match(markup, /circle/);
  assert.doesNotMatch(markup, /unknown-icon/);
});

test("keeps Lucide shapes transparent without scaling the document", async () => {
  const css = await readFile(new URL("../css/base.css", import.meta.url), "utf8");

  assert.match(css, /\.lucide-icon \*[\s\S]*?fill:\s*none !important/);
  assert.doesNotMatch(css, /html\s*\{[\s\S]*?\bzoom\s*:/);
});

test("always marks custom icon slots as Lucide SVGs", () => {
  const markup = renderLucideIcon("home", "home-nav-icon root-sidebar-icon-svg");

  assert.match(markup, /class="home-nav-icon root-sidebar-icon-svg lucide-icon"/);
  assert.match(markup, /fill="none"/);
});
