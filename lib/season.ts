const NAMES = ['WINTER', 'SPRING', 'SUMMER', 'FALL'];
export function seasonInfo(d = new Date()) {
  const m = d.getMonth(), y = d.getFullYear();
  const i = m === 11 ? 0 : Math.floor((m + 1) / 3);
  const curY = m === 11 ? y + 1 : y;
  return { cur: NAMES[i], curY, next: NAMES[(i + 1) % 4], nextY: i === 3 ? curY + 1 : curY };
}
