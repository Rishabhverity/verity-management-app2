/**
 * Helper functions for handling Next.js 15 params in client components
 */
import { use } from 'react';

/**
 * Safely unwraps params in a client component
 * @param params The params object from useParams() or passed to a page component
 * @returns The unwrapped params object
 */
export function useParams<T extends Record<string, string>>(params: any): T {
  return use(params) as T;
}
