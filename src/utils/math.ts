export function fit(target: number, absLimit: number) {
  if (target < 0) {
    return Math.max(target, -absLimit)
  }
  return Math.min(target, absLimit)
}
