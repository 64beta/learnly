import type { Option } from '../../content/lessons'

/** Düzgün ardıcıllığın başdan neçə elementinin yerində olduğu. */
export function correctPrefix(placed: Option[], items: Option[]): number {
  let k = 0
  while (k < placed.length && placed[k].id === items[k].id) k++
  return k
}
