import assert from "node:assert/strict";
import test from "node:test";

import { renderLucideIcon } from "../js/ui/icons/lucideIcons.js";

test("renders Lucide markup for a mapped UI icon", () => {
  const markup = renderLucideIcon("play", "player-control-icon");

  assert.match(markup, /class="player-control-icon"/);
  assert.match(markup, /viewBox="0 0 24 24"/);
  assert.match(markup, /stroke="currentColor"/);
  assert.match(markup, /M5 5a2 2/);
});

test("falls back to the Lucide settings icon for unknown names", () => {
  const markup = renderLucideIcon("unknown-icon");

  assert.match(markup, /circle/);
  assert.doesNotMatch(markup, /unknown-icon/);
});
