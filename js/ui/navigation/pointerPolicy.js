export function shouldFocusPointerOnMove(platformName = "") {
  return String(platformName || "").trim().toLowerCase() !== "browser";
}
