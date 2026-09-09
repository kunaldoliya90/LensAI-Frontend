import { twMerge, type ClassNameValue } from "tailwind-merge";

/**
 * Joins class names, letting a caller's `className` win over a component's
 * own Tailwind defaults instead of silently colliding with them.
 */
export function cn(...classes: ClassNameValue[]): string {
  return twMerge(classes);
}
