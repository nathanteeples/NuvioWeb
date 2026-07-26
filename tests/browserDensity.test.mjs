import assert from "node:assert/strict";
import test from "node:test";

import { scaleBrowserPixelValue } from "../scripts/browserDensity.mjs";

test("browser density halves absolute pixels exactly once", () => {
  assert.equal(scaleBrowserPixelValue("144px 0 44px"), "72px 0 22px");
  assert.equal(scaleBrowserPixelValue("clamp(28px, 3vw, 56px)"), "clamp(14px, 3vw, 28px)");
});

test("browser density preserves viewport-relative and percentage geometry", () => {
  assert.equal(scaleBrowserPixelValue("100vw 100vh 52vh 50%"), "100vw 100vh 52vh 50%");
});
