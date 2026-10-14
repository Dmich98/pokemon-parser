import { describe, expect, it } from 'bun:test';

import { normalize } from '../../src/utils/normalize';

describe('normalize', () => {
  describe('string', () => {
    it.each([
      ['  Pikachu  ', 'Pikachu'],
      ['Bulbasaur', 'Bulbasaur'],
      ['', ''],
      [undefined, ''],
      [' \n\t ', ''],
    ])('normalizes %s to %s', (input, expected) => {
      expect(normalize.string(input)).toBe(expected);
    });
  });

  describe('number', () => {
    it.each([
      ['37.00', 37],
      [' 42 ', 42],
      ['0', 0],
      ['-10', -10],
      ['', null],
      [undefined, null],
    ])('normalizes %s to %s', (input, expected) => {
      expect(normalize.number(input)).toBe(expected);
    });

    it.each(['abc', '37abc', 'NaN', 'Infinity'])('throws for invalid number %s', (input) => {
      expect(() => normalize.number(input)).toThrow(`Invalid number: ${input}`);
    });
  });
});
