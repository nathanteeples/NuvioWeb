export const PLAYER_SURFACE_BLOCKED_SELECTOR = [
  "button",
  "a",
  "input",
  "select",
  "textarea",
  "iframe",
  ".focusable",
  ".player-controls-top",
  ".player-controls-bottom",
  ".player-modal",
  ".player-sources-panel",
  ".player-next-episode-card",
  ".player-skip-intro",
  "[data-action]",
  "[data-player-pointer-action]"
].join(",");

export function canTogglePlaybackFromPointer({
  isBrowser = false,
  externalFrame = false,
  loading = false,
  startupError = false,
  dialogOpen = false,
  stillWatching = false,
  seeking = false,
  button = 0
} = {}) {
  return Boolean(
    isBrowser &&
    !externalFrame &&
    !loading &&
    !startupError &&
    !dialogOpen &&
    !stillWatching &&
    !seeking &&
    Number(button || 0) === 0
  );
}
