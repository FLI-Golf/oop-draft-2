/**
 * Form enhancement utilities
 * Factory functions for creating reusable form handlers with SvelteKit's enhance action
 */

import type { SubmitFunction } from '@sveltejs/kit';

export interface FormHandlerOptions {
  onSuccess?: (result: any) => void | Promise<void>;
  onFailure?: (result: any) => void | Promise<void>;
  onError?: (error: any) => void | Promise<void>;
  getMessage?: (result: any) => string;
  autoUpdate?: boolean;
}

/**
 * Create a reusable form enhancement handler
 * Handles success/failure/error states consistently across forms
 * 
 * @example
 * ```svelte
 * <form use:enhance={createFormHandler({
 *   onSuccess: async (result) => {
 *     status = "Saved!";
 *     await invalidateAll();
 *   },
 *   onFailure: (result) => {
 *     error = result.data?.error || "Save failed";
 *   }
 * })}>
 * ```
 */
export function createFormHandler(options: FormHandlerOptions = {}): SubmitFunction {
  const {
    onSuccess,
    onFailure,
    onError,
    getMessage,
    autoUpdate = true
  } = options;

  return () => {
    return async ({ result, update }) => {
      if (result.type === 'success') {
        await onSuccess?.(result);
      } else if (result.type === 'failure') {
        await onFailure?.(result);
      } else if (result.type === 'error') {
        await onError?.(result.error);
      }

      if (getMessage) {
        const message = getMessage(result);
        console.log('[Form]', message);
      }

      if (autoUpdate) {
        await update();
      }
    };
  };
}

/**
 * Extract error message from form result
 * Handles common error patterns from SvelteKit form actions
 */
export function getErrorMessage(result: any, fallback = 'An error occurred'): string {
  if (result.type === 'error') {
    return result.error?.message || fallback;
  }
  if (result.type === 'failure') {
    return result.data?.error || result.data?.message || fallback;
  }
  return fallback;
}
