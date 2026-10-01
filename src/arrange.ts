export function reorderIds<T>(items: readonly T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= items.length || to >= items.length) return [...items];
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export function indexAfterDrag(from: number, dy: number, span: number, count: number): number {
  if (count <= 0) return 0;
  const size = span > 0 ? span : 1;
  const slots = Math.round(dy / size);
  return Math.max(0, Math.min(count - 1, from + slots));
}
