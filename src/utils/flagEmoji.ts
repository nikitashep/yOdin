export function getFlagEmoji(countryCode: string): string {
  if (!countryCode) return '🌐';
  return countryCode
    .toUpperCase()
    .split('')
    .map((c) => String.fromCodePoint(c.charCodeAt(0) + 127397))
    .join('');
}
