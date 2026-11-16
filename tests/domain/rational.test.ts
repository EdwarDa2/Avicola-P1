// Conversión exacta de number a decimal y operaciones racionales (D-10).
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import {
  add,
  ceil,
  compare,
  div,
  floor,
  fromNumber,
  mul,
  rational,
  sub,
  toNumber,
  type Rational,
} from '@/domain/math/rational';

const big = BigInt;
const asText = (r: Rational) => `${r.num.toString()}/${r.den.toString()}`;

describe('fromNumber · conversión desde el texto decimal', () => {
  const cases: [number, string][] = [
    [0, '0/1'],
    [-0, '0/1'],
    [7, '7/1'],
    [123456789, '123456789/1'],
    [-42, '-42/1'],
    [0.95, '19/20'],
    [0.1, '1/10'],
    [-2.5, '-5/2'],
    [-0.08, '-2/25'],
    [1.38, '69/50'],
    [0.333, '333/1000'],
    [1e-7, '1/10000000'],
    [1.5e-10, '3/20000000000'],
    [-1e-7, '-1/10000000'],
    [1e21, '1000000000000000000000/1'],
    [1.25e22, '12500000000000000000000/1'],
    [-1e21, '-1000000000000000000000/1'],
  ];
  for (const [value, expected] of cases) {
    test(`${String(value)} → ${expected}`, () => {
      assert.equal(asText(fromNumber(value)), expected);
    });
  }

  test('usa el decimal tecleado, no el binario: 0.1 + 0.2 = 3/10 exacto', () => {
    assert.equal(asText(add(0.1, 0.2)), '3/10');
  });

  for (const value of [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
    test(`rechaza ${String(value)}`, () => {
      assert.throws(() => fromNumber(value), RangeError);
    });
  }
});

describe('operaciones', () => {
  test('rational reduce y normaliza el signo del denominador', () => {
    assert.equal(asText(rational(big(6), big(-4))), '-3/2');
  });

  test('rational rechaza denominador cero', () => {
    assert.throws(() => rational(big(1), big(0)), RangeError);
  });

  test('suma, resta, producto y cociente', () => {
    assert.equal(asText(add(0.5, 0.25)), '3/4');
    assert.equal(asText(sub(1, 0.05)), '19/20');
    assert.equal(asText(mul(1.1, 0.95)), '209/200');
    assert.equal(asText(div(10, 0.27)), '1000/27');
  });

  test('división entre cero lanza error', () => {
    assert.throws(() => div(1, 0), RangeError);
  });

  test('compare', () => {
    assert.equal(compare(0.1, 0.2), -1);
    assert.equal(compare(0.5, 0.5), 0);
    assert.equal(compare(-1, -2), 1);
  });
});

describe('floor y ceil exactos', () => {
  const cases: [Rational | number, bigint, bigint][] = [
    [110, big(110), big(110)],
    [rational(big(4389000), big(39900)), big(110), big(110)],
    [rational(big(7), big(2)), big(3), big(4)],
    [rational(big(-7), big(2)), big(-4), big(-3)],
    [-3, big(-3), big(-3)],
    [0, big(0), big(0)],
  ];
  for (const [value, expectedFloor, expectedCeil] of cases) {
    const label = typeof value === 'number' ? String(value) : asText(value);
    test(`${label} → floor ${expectedFloor}, ceil ${expectedCeil}`, () => {
      assert.equal(floor(value), expectedFloor);
      assert.equal(ceil(value), expectedCeil);
    });
  }

  test('E_sem = 399 en codorniz conservadora da exactamente 110 (no 110.00000000000001)', () => {
    const quotient = div(mul(399, add(1, 0.1)), mul(7, mul(0.6, 0.95)));
    assert.equal(asText(quotient), '110/1');
    assert.equal(ceil(quotient), big(110));
  });
});

describe('toNumber', () => {
  test('devuelve el double más cercano', () => {
    assert.equal(toNumber(rational(big(7176), big(100))), 71.76);
    assert.equal(toNumber(rational(big(6993), big(1000))), 6.993);
    assert.equal(toNumber(rational(big(1), big(3))), 1 / 3);
    assert.equal(toNumber(-2.5), -2.5);
  });

  test('funciona con numeradores y denominadores mayores que 2^53', () => {
    assert.equal(toNumber(fromNumber(1e21)), 1e21);
    assert.equal(toNumber(fromNumber(1.5e-10)), 1.5e-10);
    assert.equal(toNumber(div(fromNumber(1e21), 3)), 1e21 / 3);
  });
});
