import { describe, expect, it } from 'vitest';
import { handleProblem, normalizeHandle, suggestHandle } from './handle';

describe('handles', () => {
  it('normalizes what people type', () => {
    expect(normalizeHandle('  @Mara_L ')).toBe('mara_l');
  });

  it('explains what is wrong', () => {
    expect(handleProblem('ab')).toBe('short');
    expect(handleProblem('a'.repeat(21))).toBe('long');
    expect(handleProblem('mara.l')).toBe('chars');
    expect(handleProblem('mara_l')).toBeUndefined();
  });

  it('suggests from a name or an email', () => {
    expect(suggestHandle('Mara Lindqvist')).toBe('maralindqvist');
    expect(suggestHandle('mara.l+books@example.com')).toBe('maralbooks');
  });
});
