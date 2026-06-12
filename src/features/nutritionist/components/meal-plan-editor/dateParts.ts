/**
 * Pure date helpers shared by `DateField` and `CreatePlanModal`.
 *
 * All dates are represented as ISO `YYYY-MM-DD` strings in app state and
 * split into `{ d, m, y }` parts for the three-input date picker UI.
 */

export function isoToDisplay(iso: string | null): string {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

export function partsToIso(d: string, m: string, y: string): string | null {
  if (d.length === 2 && m.length === 2 && y.length === 4) return `${y}-${m}-${d}`;
  return null;
}

export function isoToParts(iso: string): { d: string; m: string; y: string } {
  if (!iso) return { d: '', m: '', y: '' };
  return { d: iso.slice(8, 10), m: iso.slice(5, 7), y: iso.slice(0, 4) };
}
