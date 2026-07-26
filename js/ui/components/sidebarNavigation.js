import { Router } from "../navigation/router.js";
import { ProfileManager } from "../../core/profile/profileManager.js";
import { AvatarRepository } from "../../data/remote/supabase/avatarRepository.js";
import { I18n } from "../../i18n/index.js";
import { Platform } from "../../platform/index.js";
import { renderLucideIcon } from "../icons/lucideIcons.js";

const ROOT_SIDEBAR_ITEMS = [
  {
    action: "gotoHome",
    route: "home",
    labelKey: "sidebar.home",
    lucideName: "home"
  },
  {
    action: "gotoSearch",
    route: "search",
    labelKey: "sidebar.search",
    lucideName: "search"
  },
  {
    action: "gotoLibrary",
    route: "library",
    labelKey: "sidebar.library",
    lucideName: "library"
  },
  {
    action: "gotoSettings",
    route: "settings",
    labelKey: "sidebar.settings",
    lucideName: "settings"
  }
];

let sidebarAvatarCatalogPromise = null;

function profileInitial(name) {
  const raw = String(name || "").trim();
  return raw ? raw.charAt(0).toUpperCase() : "P";
}

function iconMarkup(item, className = "root-sidebar-icon") {
  return renderLucideIcon(
    item?.lucideName || item?.iconName || "settings",
    `${className} root-sidebar-icon-svg`
  );
}

function t(key, params = {}, fallback = key) {
  return I18n.t(key, params, { fallback });
}

function getThemeAccentFallback() {
  const value = globalThis?.document
    ? getComputedStyle(document.documentElement).getPropertyValue("--secondary-color").trim()
    : "";
  return value || "#f5f5f5";
}

function itemLabel(item) {
  return t(item?.labelKey, {}, String(item?.label || item?.route || ""));
}

function syncSidebarStateClasses(container) {
  const root = container?.closest?.(".home-shell, .settings-shell, .library-shell") || container;
  if (!root?.classList) {
    return;
  }

  const legacySidebar = root.querySelector?.(".root-sidebar-legacy");
  const modernSidebar = root.querySelector?.(".modern-sidebar-shell");
  root.classList.toggle("has-modern-sidebar", Boolean(modernSidebar));
  root.classList.toggle(
    "has-collapsible-sidebar",
    Boolean(legacySidebar?.getAttribute("data-collapsible") === "true")
  );
  root.classList.toggle(
    "has-expanded-sidebar",
    Boolean(
      legacySidebar?.classList?.contains("expanded") ||
      modernSidebar?.classList?.contains("expanded")
    )
  );
}

function getSidebarTextFitTargets(container) {
  return Array.from(
    container?.querySelectorAll(
      [
        ".home-sidebar .home-nav-label",
        ".modern-sidebar-panel .modern-sidebar-nav-label",
        ".modern-sidebar-panel .modern-sidebar-profile-name",
        ".modern-sidebar-pill-label"
      ].join(", ")
    ) || []
  );
}

function fitSidebarLabel(node, minFontSizePx) {
  if (!node || !node.isConnected) {
    return false;
  }

  const targetWidth = node.getBoundingClientRect().width;
  if (!Number.isFinite(targetWidth) || targetWidth <= 0) {
    return false;
  }

  const previousInlineSize = node.style.fontSize;
  node.style.fontSize = "";

  const computedSize =
    Number.parseFloat(globalThis?.getComputedStyle ? getComputedStyle(node).fontSize : "") || 0;
  if (!computedSize) {
    node.style.fontSize = previousInlineSize;
    return false;
  }

  const currentWidth = node.scrollWidth;
  if (currentWidth <= node.clientWidth + 1) {
    node.style.fontSize = "";
    return true;
  }

  const minSize = Math.max(12, Number(minFontSizePx) || 12);
  let low = minSize;
  let high = computedSize;
  let best = minSize;

  for (let index = 0; index < 8 && high - low > 0.25; index += 1) {
    const mid = (low + high) / 2;
    node.style.fontSize = `${mid}px`;
    if (node.scrollWidth <= node.clientWidth + 1) {
      best = mid;
      low = mid;
    } else {
      high = mid;
    }
  }

  node.style.fontSize = `${best}px`;
  return true;
}

function fitRootSidebarText(container) {
  const targets = getSidebarTextFitTargets(container);
  targets.forEach((node) => {
    if (node.matches(".home-nav-label")) {
      fitSidebarLabel(node, 24);
      return;
    }
    if (node.matches(".modern-sidebar-pill-label")) {
      fitSidebarLabel(node, 28);
      return;
    }
    if (node.matches(".modern-sidebar-profile-name")) {
      // Android TV AutoResizeText uses a 9sp floor; the Web TV canvas is 2x.
      fitSidebarLabel(node, 18);
      return;
    }
    fitSidebarLabel(node, 30);
  });
}

function scheduleRootSidebarTextFit(container) {
  if (!container) {
    return;
  }
  if (container._rootSidebarTextFitRaf) {
    cancelAnimationFrame(container._rootSidebarTextFitRaf);
  }
  container._rootSidebarTextFitRaf = requestAnimationFrame(() => {
    container._rootSidebarTextFitRaf = null;
    fitRootSidebarText(container);
  });
}

function getSelectedItem(routeName = "") {
  return (
    ROOT_SIDEBAR_ITEMS.find((item) => item.route === String(routeName || "")) ||
    ROOT_SIDEBAR_ITEMS[0]
  );
}

function getItemForAction(action = "") {
  return ROOT_SIDEBAR_ITEMS.find((item) => item.action === String(action || "")) || null;
}

function getModernSidebarPresentation(selectedRoute = "") {
  const route = String(selectedRoute || "")
    .trim()
    .toLowerCase();
  return {
    showPill: true,
    keepPillExpanded: route === "settings"
  };
}

function getSidebarAvatarCatalog() {
  if (!sidebarAvatarCatalogPromise) {
    sidebarAvatarCatalogPromise = AvatarRepository.getAvatarCatalog().catch(() => {
      sidebarAvatarCatalogPromise = null;
      return [];
    });
  }
  return sidebarAvatarCatalogPromise;
}

export async function getSidebarProfileState() {
  const activeProfileId = String(ProfileManager.getActiveProfileId() || "");
  const [profiles, avatarCatalog] = await Promise.all([
    ProfileManager.getProfiles(),
    getSidebarAvatarCatalog()
  ]);
  const activeProfile =
    profiles.find(
      (profile) => String(profile.id || profile.profileIndex || "1") === activeProfileId
    ) ||
    profiles[0] ||
    null;
  const activeProfileAvatarUrl =
    String(activeProfile?.avatarUrl || "").trim() ||
    AvatarRepository.getAvatarImageUrl(activeProfile?.avatarId, avatarCatalog);

  return {
    activeProfileName:
      String(activeProfile?.name || t("sidebar.profileFallback")).trim() ||
      t("sidebar.profileFallback"),
    activeProfileInitial: profileInitial(activeProfile?.name || t("sidebar.profileFallback")),
    activeProfileColorHex: String(activeProfile?.avatarColorHex || getThemeAccentFallback()),
    activeProfileAvatarUrl: String(activeProfileAvatarUrl || ""),
    showProfileSelector: Boolean(activeProfile)
  };
}

export function activateLegacySidebarAction(action, currentRoute = "") {
  const normalizedAction = String(action || "");
  if (!normalizedAction) {
    return;
  }
  if (normalizedAction === "gotoAccount") {
    Router.navigate("profileSelection");
    return;
  }

  const target = getItemForAction(normalizedAction);
  if (!target) {
    return;
  }
  if (target.route === currentRoute) {
    // Re-selecting the tab you are already on. Let the screen react, e.g. Home
    // scrolls back to the top, matching the Android TV app.
    Router.getCurrentScreen()?.onSidebarReselect?.();
    return;
  }
  Router.navigate(target.route);
}

export function isSelectedSidebarAction(action, selectedRoute = "") {
  return getItemForAction(action)?.route === String(selectedRoute || "");
}

export function renderLegacySidebar({ selectedRoute = "home", profile = null, layout = {} } = {}) {
  const selectedItem = getSelectedItem(selectedRoute);
  const profileState = profile || {};
  const showProfileSelector = Boolean(
    profileState.showProfileSelector && profileState.activeProfileName
  );
  const collapsible = Boolean(layout?.collapseSidebar);
  const performanceConstrained = Platform.isWebOS() || Platform.isTizen();

  return `
    <aside class="home-sidebar root-sidebar root-sidebar-legacy${performanceConstrained ? " performance-constrained" : ""}"
           data-selected-route="${selectedRoute}"
           data-collapsible="${collapsible ? "true" : "false"}">
      ${
        showProfileSelector
          ? `
        <button class="home-profile-pill focusable"
                data-nav-zone="sidebar"
                data-nav-index="0"
                data-action="gotoAccount"
                aria-label="${t("sidebar.switchProfile")}">
          <span class="home-profile-avatar" style="background:${profileState.activeProfileColorHex || getThemeAccentFallback()}">
            ${
              profileState.activeProfileAvatarUrl
                ? `<img class="sidebar-profile-avatar-image" src="${profileState.activeProfileAvatarUrl}" alt="${profileState.activeProfileName || t("sidebar.profileFallback")}" />`
                : profileState.activeProfileInitial || "P"
            }
          </span>
          <span class="home-profile-name">${profileState.activeProfileName || t("sidebar.profileFallback")}</span>
        </button>
      `
          : ""
      }
      <div class="home-nav-list">
        ${ROOT_SIDEBAR_ITEMS.map(
          (item, index) => `
          <button class="home-nav-item focusable${selectedItem.action === item.action ? " selected" : ""}"
                  data-nav-zone="sidebar"
                  data-nav-index="${showProfileSelector ? index + 1 : index}"
                  data-action="${item.action}"
                  aria-label="${itemLabel(item)}">
            <span class="home-nav-icon-wrap">${iconMarkup(item, "home-nav-icon")}</span>
            <span class="home-nav-label">${itemLabel(item)}</span>
          </button>
        `
        ).join("")}
      </div>
    </aside>
  `;
}

export function renderModernSidebar({
  selectedRoute = "home",
  profile = null,
  expanded = false,
  pillIconOnly = false,
  blurEnabled = false
} = {}) {
  const selectedItem = getSelectedItem(selectedRoute);
  const profileState = profile || {};
  const showProfileSelector = Boolean(
    profileState.showProfileSelector && profileState.activeProfileName
  );
  const { keepPillExpanded } = getModernSidebarPresentation(selectedRoute);
  const showPill = selectedItem.route !== "search";
  const selectedLabel = itemLabel(selectedItem);
  const performanceConstrained = Platform.isWebOS() || Platform.isTizen();

  return `
    <div class="modern-sidebar-shell${expanded ? " expanded panel-visible" : ""}${blurEnabled ? " blur-enabled" : ""}${keepPillExpanded ? " keep-pill-expanded" : ""}${performanceConstrained ? " performance-constrained" : ""}" data-selected-route="${selectedRoute}">
      ${
        showPill
          ? `
        <button class="modern-sidebar-pill${pillIconOnly && !keepPillExpanded ? " icon-only" : ""}"
                data-nav-zone="sidebar"
                data-nav-index="0"
                data-action="expandSidebar"
                aria-label="${t("sidebar.expandSidebar")}" aria-expanded="${expanded ? "true" : "false"}">
          ${renderLucideIcon("chevron_left", "modern-sidebar-pill-chevron lucide-icon")}
          <span class="modern-sidebar-pill-chip">
            <span class="modern-sidebar-pill-icon-wrap">${iconMarkup(selectedItem, "modern-sidebar-pill-icon")}</span>
            <span class="modern-sidebar-pill-label">${selectedLabel}</span>
          </span>
        </button>
      `
          : ""
      }
      <aside class="modern-sidebar-panel" aria-hidden="${expanded ? "false" : "true"}">
        ${
          showProfileSelector
            ? `
          <button class="modern-sidebar-profile focusable"
                  data-nav-zone="sidebar"
                  data-nav-index="${showPill ? 1 : 0}"
                  data-action="gotoAccount" aria-label="${t("sidebar.switchProfile")}">
            <span class="modern-sidebar-profile-avatar" style="background:${profileState.activeProfileColorHex || getThemeAccentFallback()}">
              ${
                profileState.activeProfileAvatarUrl
                  ? `<img class="sidebar-profile-avatar-image" src="${profileState.activeProfileAvatarUrl}" alt="${profileState.activeProfileName || t("sidebar.profileFallback")}" />`
                  : profileState.activeProfileInitial || "P"
              }
            </span>
            <span class="modern-sidebar-profile-name">${profileState.activeProfileName || t("sidebar.profileFallback")}</span>
          </button>
        `
            : ""
        }
        <div class="modern-sidebar-nav-list">
          ${ROOT_SIDEBAR_ITEMS.map(
            (item, index) => `
            <button class="modern-sidebar-nav-item focusable${selectedItem.action === item.action ? " selected" : ""}"
                    data-nav-zone="sidebar"
                    data-nav-index="${(showPill ? 1 : 0) + (showProfileSelector ? 1 : 0) + index}"
                    data-action="${item.action}"
                    aria-label="${itemLabel(item)}">
              <span class="modern-sidebar-nav-icon-circle">
                ${iconMarkup(item, "modern-sidebar-nav-icon")}
              </span>
              <span class="modern-sidebar-nav-label">${itemLabel(item)}</span>
            </button>
          `
          ).join("")}
        </div>
      </aside>
    </div>
  `;
}

export function isModernSidebarBlurAvailable() {
  return Boolean(
    globalThis.document?.documentElement?.classList?.contains("modern-sidebar-blur-capable")
  );
}

export function renderRootSidebar({
  selectedRoute = "home",
  profile = null,
  layout = {},
  expanded = false,
  pillIconOnly = false
} = {}) {
  if (layout?.modernSidebar) {
    return renderModernSidebar({
      selectedRoute,
      profile,
      expanded,
      pillIconOnly,
      blurEnabled: Boolean(layout?.modernSidebarBlur) && isModernSidebarBlurAvailable()
    });
  }
  return renderLegacySidebar({ selectedRoute, profile, layout });
}

export function bindRootSidebarEvents(
  container,
  { currentRoute = "", onExpandSidebar = null, onSelectedAction = null } = {}
) {
  const focusables = Array.from(
    container?.querySelectorAll(".home-sidebar .focusable, .modern-sidebar-panel .focusable") || []
  );

  const moveSidebarFocus = (currentNode, delta) => {
    const nodes = focusables.filter((node) => node.isConnected);
    const currentIndex = nodes.indexOf(currentNode);
    if (currentIndex === -1) {
      return false;
    }
    const nextIndex = Math.max(0, Math.min(nodes.length - 1, currentIndex + delta));
    const target = nodes[nextIndex] || null;
    if (!target || target === currentNode) {
      return true;
    }
    nodes.forEach((node) => node.classList.remove("focused"));
    target.classList.add("focused");
    focusWithoutAutoScroll(target);
    return true;
  };

  focusables.forEach((node) => {
    node.onclick = async (event) => {
      event?.preventDefault?.();
      event?.stopPropagation?.();
      event?.stopImmediatePropagation?.();
      const action = String(node.dataset.action || "");
      activateLegacySidebarAction(action, currentRoute);
      if (isSelectedSidebarAction(action, currentRoute) && typeof onSelectedAction === "function") {
        await onSelectedAction(node);
      }
    };

    node.onkeydown = (event) => {
      const keyCode = Number(event?.keyCode || 0);
      if (keyCode === 38) {
        event?.preventDefault?.();
        event?.stopPropagation?.();
        moveSidebarFocus(node, -1);
        return;
      }
      if (keyCode === 40) {
        event?.preventDefault?.();
        event?.stopPropagation?.();
        moveSidebarFocus(node, 1);
      }
    };
  });

  container
    ?.querySelectorAll(".modern-sidebar-pill[data-action='expandSidebar']")
    .forEach((node) => {
      node.onclick = (event) => {
        event?.preventDefault?.();
        event?.stopPropagation?.();
        event?.stopImmediatePropagation?.();
        if (typeof onExpandSidebar === "function") {
          onExpandSidebar(node);
        }
      };
    });

  scheduleRootSidebarTextFit(container);
  syncSidebarStateClasses(container);
}

export function setLegacySidebarExpanded(container, expanded) {
  const sidebar = container?.querySelector(".home-sidebar");
  if (!sidebar) {
    return;
  }
  if (sidebar._legacyOpenTimer) {
    clearTimeout(sidebar._legacyOpenTimer);
    sidebar._legacyOpenTimer = null;
  }
  const shouldExpand = Boolean(expanded);
  if (shouldExpand) {
    sidebar.classList.add("opening");
    sidebar.classList.add("content-expanded");
    syncSidebarStateClasses(container);
    void sidebar.offsetWidth;
    requestAnimationFrame(() => {
      sidebar.classList.add("expanded");
      syncSidebarStateClasses(container);
    });
    sidebar._legacyOpenTimer = setTimeout(() => {
      sidebar.classList.remove("opening");
      sidebar._legacyOpenTimer = null;
      scheduleRootSidebarTextFit(container);
      syncSidebarStateClasses(container);
    }, 350);
    scheduleRootSidebarTextFit(container);
    return;
  }

  sidebar.classList.remove("opening");
  sidebar.classList.remove("content-expanded");
  syncSidebarStateClasses(container);
  void sidebar.offsetWidth;
  requestAnimationFrame(() => {
    sidebar.classList.remove("expanded");
    scheduleRootSidebarTextFit(container);
    syncSidebarStateClasses(container);
  });
  scheduleRootSidebarTextFit(container);
}

export function getLegacySidebarNodes(container) {
  return Array.from(container?.querySelectorAll(".home-sidebar .focusable") || []).filter(
    (node) => !node.closest(".modern-sidebar-panel")
  );
}

export function getLegacySidebarSelectedNode(container) {
  return (
    container?.querySelector(".home-sidebar .home-nav-item.selected") ||
    container?.querySelector(".home-sidebar .home-nav-item") ||
    container?.querySelector(".home-sidebar .focusable") ||
    null
  );
}

export function handleLegacySidebarBack(screen, event) {
  const keyCode = Number(event?.keyCode || 0);
  const isBackEvent = keyCode === 8 || keyCode === 27 || keyCode === 461 || keyCode === 10009;
  if (!isBackEvent) {
    return false;
  }

  event?.preventDefault?.();

  const current =
    screen?.container?.querySelector(".focusable.focused") || document.activeElement || null;
  const sidebarFocused = Boolean(current?.closest?.(".home-sidebar"));

  if (sidebarFocused) {
    Router.navigate("home");
    return true;
  }

  if (typeof screen?.focusSidebarNode === "function") {
    screen.focusSidebarNode();
    return true;
  }

  if (screen && typeof screen.applyFocus === "function") {
    const nodes = getLegacySidebarNodes(screen.container);
    const selected = getLegacySidebarSelectedNode(screen.container);
    screen.focusZone = "sidebar";
    screen.sidebarFocusIndex = Math.max(0, nodes.indexOf(selected));
    screen.applyFocus();
    return true;
  }

  return false;
}

export function getModernSidebarNodes(container) {
  return Array.from(container?.querySelectorAll(".modern-sidebar-panel .focusable") || []);
}

export function getModernSidebarSelectedNode(container) {
  return (
    container?.querySelector(".modern-sidebar-panel .modern-sidebar-nav-item.selected") ||
    container?.querySelector(".modern-sidebar-panel .modern-sidebar-nav-item") ||
    container?.querySelector(".modern-sidebar-panel .focusable") ||
    null
  );
}

export function getRootSidebarNodes(container, layout = {}) {
  return layout?.modernSidebar
    ? getModernSidebarNodes(container)
    : getLegacySidebarNodes(container);
}

export function getRootSidebarSelectedNode(container, layout = {}) {
  return layout?.modernSidebar
    ? getModernSidebarSelectedNode(container)
    : getLegacySidebarSelectedNode(container);
}

export function isRootSidebarNode(node) {
  return Boolean(node?.closest?.(".home-sidebar, .modern-sidebar-panel"));
}

export function setModernSidebarPillIconOnly(container, iconOnly, keepExpanded = false) {
  const shell = container?.querySelector(".modern-sidebar-shell");
  const pill = container?.querySelector(".modern-sidebar-pill");
  const shouldKeepExpanded = Boolean(
    keepExpanded || shell?.classList?.contains("keep-pill-expanded")
  );
  if (!pill || shouldKeepExpanded) {
    pill?.classList.remove("icon-only");
    return;
  }
  pill.classList.toggle("icon-only", Boolean(iconOnly));
}

export function setModernSidebarExpanded(container, expanded) {
  const shell = container?.querySelector(".modern-sidebar-shell");
  if (!shell) {
    return false;
  }
  const panel = shell.querySelector(".modern-sidebar-panel");
  const pill = shell.querySelector(".modern-sidebar-pill");
  if (shell._modernOpenTimer) {
    clearTimeout(shell._modernOpenTimer);
    shell._modernOpenTimer = null;
  }
  if (shell._modernCloseStartTimer) {
    clearTimeout(shell._modernCloseStartTimer);
    shell._modernCloseStartTimer = null;
  }
  if (shell._modernCloseEndTimer) {
    clearTimeout(shell._modernCloseEndTimer);
    shell._modernCloseEndTimer = null;
  }

  if (expanded) {
    shell.classList.add("panel-visible", "opening");
    shell.classList.remove("collapsing");
    syncSidebarStateClasses(container);
    if (panel) {
      panel.setAttribute("aria-hidden", "false");
    }
    if (pill) {
      pill.setAttribute("aria-expanded", "true");
    }
    requestAnimationFrame(() => {
      shell.classList.add("expanded");
      syncSidebarStateClasses(container);
    });
    shell._modernOpenTimer = setTimeout(() => {
      shell.classList.remove("opening");
      shell._modernOpenTimer = null;
      scheduleRootSidebarTextFit(container);
      syncSidebarStateClasses(container);
    }, 365);
    scheduleRootSidebarTextFit(container);
    return true;
  }

  shell.classList.add("collapsing");
  shell.classList.remove("opening");
  syncSidebarStateClasses(container);
  if (pill) {
    pill.setAttribute("aria-expanded", "false");
  }
  shell._modernCloseStartTimer = setTimeout(() => {
    shell.classList.remove("expanded");
    shell._modernCloseStartTimer = null;
    syncSidebarStateClasses(container);
  }, 70);
  shell._modernCloseEndTimer = setTimeout(() => {
    shell.classList.remove("panel-visible", "collapsing");
    if (panel) {
      panel.setAttribute("aria-hidden", "true");
    }
    shell._modernCloseEndTimer = null;
    scheduleRootSidebarTextFit(container);
    syncSidebarStateClasses(container);
  }, 430);
  scheduleRootSidebarTextFit(container);
  return true;
}

export function focusWithoutAutoScroll(node) {
  if (!node || typeof node.focus !== "function") {
    return;
  }
  try {
    node.focus({ preventScroll: true });
  } catch (_) {
    node.focus();
  }
}
