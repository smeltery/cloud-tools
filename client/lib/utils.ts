/**
 * @fileoverview Utility functions for the Cloud Tools application.
 *
 * This module provides common utility functions used throughout the application,
 * primarily focused on CSS class name manipulation and styling utilities.
 *
 * @author Cloud Tools Team
 * @since 1.0.0
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines and merges CSS class names intelligently.
 *
 * This utility function combines multiple class name inputs using clsx for conditional
 * class handling, then uses tailwind-merge to resolve Tailwind CSS class conflicts.
 * This ensures that conflicting Tailwind classes are properly merged, with later
 * classes taking precedence over earlier ones.
 *
 * The function is particularly useful when you need to:
 * - Conditionally apply classes based on props or state
 * - Override default classes with custom ones
 * - Merge classes from multiple sources (props, variants, etc.)
 * - Ensure Tailwind class conflicts are resolved properly
 *
 * @param {...ClassValue[]} inputs - Variable number of class name inputs.
 *   Can include strings, objects with boolean values, arrays, or undefined/null values.
 *   Supports all input types that clsx accepts.
 *
 * @returns {string} A merged string of CSS class names with conflicts resolved.
 *
 * @example
 * // Basic usage with strings
 * cn('px-4 py-2', 'bg-blue-500 text-white')
 * // Returns: 'px-4 py-2 bg-blue-500 text-white'
 *
 * @example
 * // Conditional classes with objects
 * cn('base-class', {
 *   'active-class': isActive,
 *   'disabled-class': isDisabled
 * })
 * // Returns: 'base-class active-class' (if isActive is true)
 *
 * @example
 * // Resolving Tailwind class conflicts
 * cn('px-2 py-1', 'px-4 py-2')
 * // Returns: 'py-1 px-4 py-2' (px-4 py-2 override px-2 py-1)
 *
 * @example
 * // Real-world component usage
 * const Button = ({ className, variant = 'default', ...props }) => {
 *   return (
 *     <button
 *       className={cn(
 *         'inline-flex items-center justify-center rounded-md text-sm font-medium',
 *         {
 *           'bg-primary text-primary-foreground hover:bg-primary/90': variant === 'default',
 *           'bg-destructive text-destructive-foreground hover:bg-destructive/90': variant === 'destructive',
 *         },
 *         className // Custom classes from props can override defaults
 *       )}
 *       {...props}
 *     />
 *   )
 * }
 *
 * @example
 * // With arrays and mixed types
 * cn(
 *   ['base-class', 'another-class'],
 *   condition && 'conditional-class',
 *   {
 *     'object-class': true,
 *     'false-class': false
 *   },
 *   undefined, // Safely ignores falsy values
 *   'final-class'
 * )
 *
 * @see {@link https://github.com/lukeed/clsx} clsx documentation
 * @see {@link https://github.com/dcastil/tailwind-merge} tailwind-merge documentation
 *
 * @since 1.0.0
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
