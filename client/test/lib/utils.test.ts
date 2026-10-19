import { describe, it, expect } from 'vitest';
import { cn } from '../../lib/utils';

describe('Utils Library', () => {
  describe('cn function', () => {
    it('should combine simple class strings', () => {
      expect(cn('class1', 'class2')).toBe('class1 class2');
    });

    it('should handle conditional classes with objects', () => {
      expect(cn('base', { active: true, disabled: false })).toBe('base active');
      expect(cn('base', { active: false, disabled: true })).toBe('base disabled');
    });

    it('should handle arrays of classes', () => {
      expect(cn(['class1', 'class2'], 'class3')).toBe('class1 class2 class3');
    });

    it('should ignore falsy values', () => {
      expect(cn('base', false, null, undefined, 0, '')).toBe('base');
    });

    it('should merge conflicting Tailwind classes', () => {
      expect(cn('px-2 py-1', 'px-4 py-2')).toBe('px-4 py-2');
      expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500');
      expect(cn('text-sm', 'text-lg')).toBe('text-lg');
    });

    it('should handle complex combinations', () => {
      const result = cn(
        'base-class',
        { 'conditional-class': true },
        ['array-class1', 'array-class2'],
        false && 'false-class',
        'final-class'
      );
      expect(result).toBe('base-class conditional-class array-class1 array-class2 final-class');
    });

    it('should handle empty input', () => {
      expect(cn()).toBe('');
      expect(cn('')).toBe('');
      expect(cn(null)).toBe('');
      expect(cn(undefined)).toBe('');
    });

    it('should merge Tailwind spacing conflicts correctly', () => {
      expect(cn('m-2', 'm-4')).toBe('m-4');
      expect(cn('mt-2 mb-2', 'my-4')).toBe('my-4');
      expect(cn('p-2', 'px-4 py-2')).toBe('p-2 px-4 py-2');
    });

    it('should handle responsive classes', () => {
      expect(cn('text-sm md:text-lg', 'text-base')).toBe('md:text-lg text-base');
      expect(cn('hidden md:block', 'md:hidden')).toBe('hidden md:hidden');
    });

    it('should preserve non-conflicting classes', () => {
      expect(cn('flex items-center', 'justify-between text-red-500')).toBe(
        'flex items-center justify-between text-red-500'
      );
    });
  });
});
