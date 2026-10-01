import { describe, it, expect } from 'vitest';
import { cn } from '@/utils/cn';
import { isSupabaseConfigured } from '@/lib/env';

describe('Project Foundation & Testing Suite Sanity', () => {
  it('cn utility merges Tailwind and conditional classes correctly', () => {
    const result = cn('px-4 py-2', false && 'hidden', 'px-6');
    expect(result).toBe('py-2 px-6');
  });

  it('isSupabaseConfigured returns boolean without throwing', () => {
    const configured = isSupabaseConfigured();
    expect(typeof configured).toBe('boolean');
  });
});
