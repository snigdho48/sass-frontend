import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind class names (shadcn/ui helper).
 * Safe for existing code — unused until new components opt in.
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
