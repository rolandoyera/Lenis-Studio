export function applyFont(value: string) {
  const root = document.documentElement;
  root.setAttribute("data-font", value);
}
