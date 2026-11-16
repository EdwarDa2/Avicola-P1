/**
 * Números racionales exactos con BigInt (D-10).
 *
 * Los `number` de entrada se convierten desde su representación decimal más corta
 * (`String(value)`), no desde su valor binario: 0.95 se interpreta como 95/100 y no como
 * 0.9499999999999999555910790149937…. Así los `ceil` se aplican sobre el cociente exacto
 * que se obtendría haciendo la cuenta a mano con los valores tecleados.
 *
 * Módulo puro: sin dependencias de React Native, Expo ni de la interfaz.
 */

export interface Rational {
  /** Numerador con signo. */
  readonly num: bigint;
  /** Denominador, siempre positivo. La fracción está reducida. */
  readonly den: bigint;
}

/** Valor aceptado por las operaciones: un racional o un `number` decimal finito. */
export type Exact = Rational | number;

const ZERO = BigInt(0);
const ONE = BigInt(1);
const TEN = BigInt(10);

function abs(value: bigint): bigint {
  return value < ZERO ? -value : value;
}

/**
 * 10^exponent como BigInt. Se evita el operador `**` porque algunos transpiladores lo
 * convierten en `Math.pow`, que no acepta BigInt.
 */
function powerOfTen(exponent: number): bigint {
  let result = ONE;
  for (let i = 0; i < exponent; i++) {
    result *= TEN;
  }
  return result;
}

function gcd(a: bigint, b: bigint): bigint {
  let x = abs(a);
  let y = abs(b);
  while (y !== ZERO) {
    [x, y] = [y, x % y];
  }
  return x;
}

/** Crea un racional reducido con denominador positivo. */
export function rational(num: bigint, den: bigint = ONE): Rational {
  if (den === ZERO) {
    throw new RangeError('Denominador cero en un número racional.');
  }
  const sign = den < ZERO ? -ONE : ONE;
  const divisor = gcd(num, den) || ONE;
  return { num: (sign * num) / divisor, den: (sign * den) / divisor };
}

const DECIMAL_TEXT = /^(-?)(\d+)(?:\.(\d+))?(?:e([+-]?\d+))?$/i;

/** Cifras significativas a las que se normaliza cada double antes de convertirlo (D-16). */
const SIGNIFICANT_DIGITS = 15;

/**
 * Convierte un `number` finito al racional exacto de su texto decimal.
 * Admite enteros, negativos y notación exponencial (`1e-7`, `1e+21`).
 *
 * Antes de leer el texto, el double se normaliza a 15 cifras significativas (D-16): así el ruido
 * binario de una operación previa (p. ej. `33.3 / 100 = 0.33299999999999996`) se interpreta como
 * el decimal que se quiso escribir (0.333). Todo decimal de hasta 15 cifras se conserva intacto.
 */
export function fromNumber(value: number): Rational {
  if (!Number.isFinite(value)) {
    throw new RangeError(`Se esperaba un número finito y se recibió ${String(value)}.`);
  }
  const normalized = Number(value.toPrecision(SIGNIFICANT_DIGITS));
  const match = DECIMAL_TEXT.exec(String(normalized));
  if (!match) {
    throw new RangeError(`No se pudo interpretar el número ${String(value)}.`);
  }
  const [, sign, integerPart, fractionPart = '', exponentText = '0'] = match;
  const digits = BigInt(integerPart + fractionPart) * (sign === '-' ? -ONE : ONE);
  const exponent = Number(exponentText) - fractionPart.length;
  return exponent >= 0
    ? rational(digits * powerOfTen(exponent))
    : rational(digits, powerOfTen(-exponent));
}

/** Normaliza un `Exact` a `Rational`. */
export function toRational(value: Exact): Rational {
  return typeof value === 'number' ? fromNumber(value) : value;
}

export function add(a: Exact, b: Exact): Rational {
  const x = toRational(a);
  const y = toRational(b);
  return rational(x.num * y.den + y.num * x.den, x.den * y.den);
}

export function sub(a: Exact, b: Exact): Rational {
  const y = toRational(b);
  return add(a, { num: -y.num, den: y.den });
}

export function mul(a: Exact, b: Exact): Rational {
  const x = toRational(a);
  const y = toRational(b);
  return rational(x.num * y.num, x.den * y.den);
}

export function div(a: Exact, b: Exact): Rational {
  const x = toRational(a);
  const y = toRational(b);
  if (y.num === ZERO) {
    throw new RangeError('División entre cero.');
  }
  return rational(x.num * y.den, x.den * y.num);
}

/** -1, 0 o 1 según el signo. */
export function sign(value: Exact): -1 | 0 | 1 {
  const { num } = toRational(value);
  return num === ZERO ? 0 : num < ZERO ? -1 : 1;
}

/** -1, 0 o 1 según a < b, a = b o a > b. */
export function compare(a: Exact, b: Exact): -1 | 0 | 1 {
  return sign(sub(a, b));
}

/** Mayor entero <= valor. */
export function floor(value: Exact): bigint {
  const { num, den } = toRational(value);
  const quotient = num / den; // BigInt trunca hacia cero
  return num < ZERO && quotient * den !== num ? quotient - ONE : quotient;
}

/** Menor entero >= valor. */
export function ceil(value: Exact): bigint {
  const { num, den } = toRational(value);
  return -floor({ num: -num, den });
}

/** Convierte un entero BigInt a `number`, comprobando que no pierda precisión. */
export function bigintToSafeNumber(value: bigint): number {
  const result = Number(value);
  if (!Number.isSafeInteger(result)) {
    throw new RangeError(`El resultado ${value.toString()} excede el rango entero seguro.`);
  }
  return result;
}

/**
 * Convierte a `number` (el double más cercano) solo para entregar o mostrar resultados.
 * Nunca se usa en cálculos intermedios.
 */
export function toNumber(value: Exact): number {
  const { num, den } = toRational(value);
  const safe = BigInt(Number.MAX_SAFE_INTEGER);
  if (abs(num) <= safe && den <= safe) {
    // Ambos operandos son exactos en double y la división IEEE redondea correctamente.
    return Number(num) / Number(den);
  }
  const negative = num < ZERO;
  const magnitude = abs(num);
  const integerPart = magnitude / den;
  let remainder = magnitude % den;
  let fraction = '';
  for (let i = 0; i < 24 && remainder !== ZERO; i++) {
    remainder *= TEN;
    fraction += (remainder / den).toString();
    remainder %= den;
  }
  return Number(`${negative ? '-' : ''}${integerPart.toString()}.${fraction || '0'}`);
}
