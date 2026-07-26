import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { shouldShowBrowserBackButton } from "../js/ui/components/browserNavigationPolicy.js";
import { shouldFocusPointerOnMove } from "../js/ui/navigation/pointerPolicy.js";
import { canTogglePlaybackFromPointer } from "../js/ui/screens/player/playerPointerPolicy.js";

test("mouse movement does not select browser controls", () => {
  assert.equal(shouldFocusPointerOnMove("browser"), false);
  assert.equal(shouldFocusPointerOnMove("webos"), true);
  assert.equal(shouldFocusPointerOnMove("tizen"), true);
});

test("primary browser surface clicks toggle playback only in the clear player state", () => {
  assert.equal(canTogglePlaybackFromPointer({ isBrowser: true }), true);
  assert.equal(canTogglePlaybackFromPointer({ isBrowser: true, dialogOpen: true }), false);
  assert.equal(canTogglePlaybackFromPointer({ isBrowser: true, loading: true }), false);
  assert.equal(canTogglePlaybackFromPointer({ isBrowser: false }), false);
  assert.equal(canTogglePlaybackFromPointer({ isBrowser: true, button: 2 }), false);
});

test("browser back controls cover detail and playback routes without affecting Home", () => {
  assert.equal(shouldShowBrowserBackButton("detail"), true);
  assert.equal(shouldShowBrowserBackButton("folderDetail"), true);
  assert.equal(shouldShowBrowserBackButton("player"), true);
  assert.equal(shouldShowBrowserBackButton("home"), false);
});

test("the selected primary player icon overrides the white icon filter", async () => {
  const css = await readFile(new URL("../css/components.css", import.meta.url), "utf8");

  assert.match(
    css,
    /\.player-control-btn\.is-primary\.focused[\s\S]*?\.player-control-icon:not\(\.player-control-icon-mask\)[\s\S]*?filter:\s*none/
  );
});
