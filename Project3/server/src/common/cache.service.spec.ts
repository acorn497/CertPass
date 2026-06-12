import { CacheService } from './cache.service';

describe('CacheService', () => {
  it('returns stored values before expiry', () => {
    const cache = new CacheService();
    cache.set('key', { ok: true }, 10);
    expect(cache.get('key')).toEqual({ ok: true });
  });

  it('deletes values by prefix', () => {
    const cache = new CacheService();
    cache.set('courses:list:1', 1, 10);
    cache.set('courses:detail:1', 2, 10);
    cache.deleteByPrefix('courses:list:');
    expect(cache.get('courses:list:1')).toBeNull();
    expect(cache.get('courses:detail:1')).toBe(2);
  });
});
