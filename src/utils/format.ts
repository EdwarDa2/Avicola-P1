/**
 * Formato de números para mostrar resultados del motor (`avicola-1.0.0`).
 *
 * El motor entrega los valores exactos y sin redondear (D-10); el redondeo se aplica solo aquí,
 * al construir el texto que ve la persona, y nunca se guarda ni se recalcula con él
 * (INTEGRACION.md §5).
 */

/** Texto con hasta `decimals` decimales, sin ceros sobrantes: 71.76 → "71.76", 0.3333… → "0.33". */
export function formatNumber(value: number, decimals = 2): string {
  if (!Number.isFinite(value)) return '—';
  return String(Number(value.toFixed(decimals)));
}

/** Proporción a porcentaje para mostrar: 0.57 → "57 %" (evita 56.99999999999999). */
export function formatPercent(rate: number, decimals = 1): string {
  return `${formatNumber(rate * 100, decimals)} %`;
}
