const CARD_GRADIENTS = [
  "from-violet-500/20 via-violet-500/8 to-transparent",
  "from-sky-500/20 via-sky-500/8 to-transparent",
  "from-emerald-500/20 via-emerald-500/8 to-transparent",
  "from-amber-500/20 via-amber-500/8 to-transparent",
  "from-rose-500/20 via-rose-500/8 to-transparent",
  "from-indigo-500/20 via-indigo-500/8 to-transparent",
  "from-teal-500/20 via-teal-500/8 to-transparent",
];

export function vendorGradient(name: string) {
  const idx = name.charCodeAt(0) % CARD_GRADIENTS.length;
  return CARD_GRADIENTS[idx];
}
