export function capitalize(str: string): string {
  return str.charAt(0).toLocaleUpperCase() + str.slice(1);
}

export function escapeHtml(str: string): string {
  return /[&<>"']/.test(str)
    ? str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/'/g, '&#39;')
        .replace(/"/g, '&quot;')
    : str;
}

export function reverse(str: string): string {
  return str.split('').reverse().join('');
}

export function camelToKebab(str: string): string {
  return str
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
    .toLowerCase();
}
