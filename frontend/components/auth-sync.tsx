'use client';

import { useAuth } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { registerTokenProvider, clearTokenProvider, setAuthToken } from '@/lib/api';
import { Loader2 } from 'lucide-react';

/**
 * Syncs the Clerk session token with the API client.
 * 
 * Instead of a timer that can miss expirations, we register
 * Clerk's getToken() with the API client so it can fetch a
 * FRESH token before every single request via axios interceptor.
 */
export function AuthSync({ children }: { children: React.ReactNode }) {
  const { getToken, isSignedIn, isLoaded } = useAuth();
  const [tokenReady, setTokenReady] = useState(false);

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
          setTokenReady(true);
          console.log('[AuthSync] Token provider registered, initial token set');
        }
      }).catch((err) => {
        console.error('[AuthSync] Failed to get initial token:', err);
        setTokenReady(true); // fall through so it doesn't block loading on network failure
      });
    } else {
      console.log('[AuthSync] User not signed in, clearing token provider');
      clearTokenProvider();
      setTokenReady(true);
    }

    return () => {
      // Cleanup on unmount
      clearTokenProvider();
    };
  }, [getToken, isSignedIn, isLoaded]);

  // Block rendering protected children until auth state is loaded and token is ready
  if (!isLoaded || (isSignedIn && !tokenReady)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          <p className="text-xs text-muted-foreground font-semibold">Initializing secure session...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
