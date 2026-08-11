/**
 * Format dynamic prize pool string (e.g., "₹1,50,000" -> "₹1.5L", "₹1,90,000" -> "₹1.9L")
 */
export function formatPrizeShort(prizePool: string): string {
  if (!prizePool) return '₹1.5L';
  if (prizePool.includes('L') || prizePool.includes('Lakh')) {
    return prizePool;
  }
  const digits = prizePool.replace(/[^0-9]/g, '');
  if (!digits) return prizePool;
  const num = parseInt(digits, 10);
  if (num >= 100000) {
    const lakhs = num / 100000;
    const lakhStr = lakhs % 1 === 0 ? lakhs.toFixed(0) : lakhs.toFixed(1);
    return `₹${lakhStr}L`;
  }
  return prizePool;
}
