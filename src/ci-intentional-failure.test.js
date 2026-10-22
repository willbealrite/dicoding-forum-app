import { describe, it, expect } from 'vitest';

describe('CI failure demonstration', () => {
  it('should detect an intentionally failing assertion', () => {
    expect(true).toBe(false);
  });
});
