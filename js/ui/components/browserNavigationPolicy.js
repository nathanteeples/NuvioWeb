const BROWSER_BACK_ROUTES = new Set([
  "account",
  "castDetail",
  "catalogOrder",
  "catalogSeeAll",
  "debugConsole",
  "detail",
  "folderDetail",
  "player",
  "plugin",
  "plugins",
  "stream",
  "supportersContributors",
  "trakt"
]);

export function shouldShowBrowserBackButton(routeName = "") {
  return BROWSER_BACK_ROUTES.has(String(routeName || ""));
}
