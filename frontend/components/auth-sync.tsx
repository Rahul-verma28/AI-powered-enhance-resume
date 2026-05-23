'use client';

import { useAuth } from '@clerk/nextjs';
import { useEffect } from 'react';
import { registerTokenProvider, clearTokenProvider, setAuthToken } from '@/lib/api';

/**
 * Syncs the Clerk session token with the API client.
 * 
 * Instead of a timer that can miss expirations, we register
 * Clerk's getToken() with the API client so it can fetch a
 * FRESH token before every single request via axios interceptor.
 */
export function AuthSync({ children }: { children: React.ReactNode }) {
  const { getToken, isSignedIn, isLoaded } = useAuth();

  useEffect(() => {
    if (!isLoaded) return;

    if (isSignedIn) {
      // Register the token provider — the axios request interceptor
      // will call getToken() before every API request automatically.
      registerTokenProvider(getToken);

      // Also set an initial token immediately for any in-flight requests
      getToken().then((token) => {
        if (token) {
          setAuthToken(token);
          console.log('[AuthSync] Token provider registered, initial token set');
        }
      }).catch((err) => {
        console.error('[AuthSync] Failed to get initial token:', err);
      });
    } else {
      console.log('[AuthSync] User not signed in, clearing token provider');
      clearTokenProvider();
    }

    return () => {
      // Cleanup on unmount
      clearTokenProvider();
    };
  }, [getToken, isSignedIn, isLoaded]);

  return <>{children}</>;
}
