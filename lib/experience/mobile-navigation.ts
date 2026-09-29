export type MobileNavigationItem = { href: string; label: string };

export function selectPrimaryNavigation(items: readonly MobileNavigationItem[], limit = 4) {
  return items.slice(0, Math.max(0, limit));
}

export function isNavigationItemActive(pathname: string, href: string) {
  if (href.includes("?")) return false;
  const target = href.split("?")[0];
  if (target === "/") return pathname === "/";
  return pathname === target || pathname.startsWith(`${target}/`);
}

export function findActiveNavigationHref(items: readonly MobileNavigationItem[], pathname: string) {
  return items
    .filter((item) => isNavigationItemActive(pathname, item.href))
    .sort((left, right) => right.href.length - left.href.length)[0]?.href;
}
