import { Platform } from "../../platform/index.js";
import { Router } from "../navigation/router.js";
import { renderLucideIcon } from "../icons/lucideIcons.js";
import { shouldShowBrowserBackButton } from "./browserNavigationPolicy.js";

const EXISTING_BACK_CONTROL_SELECTOR = [
  '[data-action="back"]',
  '[data-action="goBack"]',
  ".cast-detail-back",
  ".debug-console-back",
  ".supporters-back-button"
].join(",");

function hasVisibleBackControl(screen) {
  const container = screen?.container;
  if (!(container instanceof HTMLElement)) {
    return false;
  }
  return Array.from(container.querySelectorAll(EXISTING_BACK_CONTROL_SELECTOR)).some((node) => {
    if (!(node instanceof HTMLElement)) {
      return false;
    }
    const style = globalThis.getComputedStyle?.(node);
    return style?.display !== "none" && style?.visibility !== "hidden" && node.getClientRects().length;
  });
}

async function requestBrowserBack() {
  const route = Router.getCurrent();
  const screen = Router.getCurrentScreen();

  if (route === "player") {
    const hasDismissablePlayerPanel = Boolean(
      screen?.stillWatchingPromptVisible ||
      screen?.seekOverlayVisible ||
      screen?.seekPreviewSeconds != null ||
      screen?.sourcesPanelVisible ||
      screen?.subtitleDialogVisible ||
      screen?.audioDialogVisible ||
      screen?.speedDialogVisible ||
      screen?.episodePanelVisible ||
      screen?.moreActionsVisible
    );
    if (hasDismissablePlayerPanel) {
      screen.consumeBackRequest?.();
      return;
    }
    if (screen?.navigateBackToStreamScreen?.()) {
      return;
    }
  }

  if (screen?.consumeBackRequest?.()) {
    return;
  }
  await Router.back({ skipConsume: true });
}

export function installBrowserNavigationControls() {
  if (!Platform.isBrowser() || document.getElementById("browserRouteBackButton")) {
    return;
  }

  const button = document.createElement("button");
  button.id = "browserRouteBackButton";
  button.className = "browser-route-back-button";
  button.type = "button";
  button.hidden = true;
  button.setAttribute("aria-label", "Back");
  button.setAttribute("title", "Back");
  button.innerHTML = renderLucideIcon("arrow_back", "browser-route-back-icon");

  const sync = () => {
    const route = Router.getCurrent();
    const screen = Router.getCurrentScreen();
    button.hidden =
      !shouldShowBrowserBackButton(route) ||
      hasVisibleBackControl(screen);
  };

  button.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    void requestBrowserBack();
  });
  document.addEventListener("nuvio:routechange", sync);
  document.getElementById("app")?.appendChild(button);
  sync();
}
