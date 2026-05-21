import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Linking from 'expo-linking';
import * as Crypto from 'expo-crypto';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';

export type User = {
  id: string;
  name: string;
  email: string | null;
  provider: 'apple' | 'google' | 'discord' | 'guest';
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  signInWithMockProvider: (provider: Exclude<User['provider'], 'guest'>) => Promise<void>;
  signInWithApple: () => Promise<void>;
  signInWithGoogleIdToken: (idToken: string) => Promise<void>;
  signInWithDiscord: () => Promise<void>;
  signInAsGuest: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);
const MOCK_AUTH_PROVIDER_KEY = 'mock_auth_provider';

function formatAppleFullName(fullName: AppleAuthentication.AppleAuthenticationFullName | null): string | null {
  if (!fullName) return null;
  const name = [fullName.givenName, fullName.middleName, fullName.familyName]
    .filter(Boolean)
    .join(' ')
    .trim();
  return name || fullName.nickname || null;
}

function getUrlToken(url: string, key: string): string | null {
  const query = url.split('?')[1]?.split('#')[0] ?? '';
  const hash = url.split('#')[1] ?? '';
  const queryParams = new URLSearchParams(query);
  const hashParams = new URLSearchParams(hash);
  return queryParams.get(key) ?? hashParams.get(key);
}

function nameFromEmail(email: string | null | undefined): string | null {
  const localPart = email?.split('@')[0]?.trim();
  if (!localPart || localPart.includes('privaterelay.appleid')) return null;
  const normalized = localPart.replace(/[._-]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (!normalized) return null;
  return normalized.replace(/\b\w/g, char => char.toUpperCase());
}

function sessionToUser(session: Session | null): User | null {
  if (!session?.user) return null;
  const { user } = session;
  const isAnon = (user as any).is_anonymous === true;
  const provider = isAnon
    ? 'guest'
    : ((user.app_metadata?.provider as 'apple' | 'google' | 'discord') ?? 'guest');
  const metadataName =
    user.user_metadata?.display_name ??
    user.user_metadata?.full_name ??
    user.user_metadata?.name ??
    null;

  return {
    id: user.id,
    name: metadataName?.trim() || nameFromEmail(user.email) || '',
    email: user.email ?? null,
    provider,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const sessionUser = sessionToUser(session);
      if (sessionUser) {
        setUser(sessionUser);
        setIsLoading(false);
        return;
      }

      const mockProvider = await AsyncStorage.getItem(MOCK_AUTH_PROVIDER_KEY);
      setUser(
        mockProvider
          ? {
              id: 'prototype-user',
              name: '',
              email: null,
              provider: mockProvider as Exclude<User['provider'], 'guest'>,
            }
          : null,
      );
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(sessionToUser(session));
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithMockProvider = async (provider: Exclude<User['provider'], 'guest'>) => {
    await AsyncStorage.setItem(MOCK_AUTH_PROVIDER_KEY, provider);
    setUser({
      id: 'prototype-user',
      name: '',
      email: null,
      provider,
    });
  };

  const signInWithApple = async () => {
    const rawNonce = Crypto.randomUUID();
    const hashedNonce = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      rawNonce,
    );

    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashedNonce,
    });

    if (!credential.identityToken) throw new Error('No identity token from Apple');

    const appleName = formatAppleFullName(credential.fullName);

    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: credential.identityToken,
      nonce: rawNonce,
    });

    if (error) throw error;

    const metadataName =
      data.session?.user.user_metadata?.display_name ??
      data.session?.user.user_metadata?.full_name ??
      data.session?.user.user_metadata?.name;
    const fallbackName = appleName || metadataName?.trim();

    if (fallbackName) {
      await supabase.auth.updateUser({
        data: { full_name: fallbackName, name: fallbackName, display_name: fallbackName },
      });
    }
  };

  const signInWithGoogleIdToken = async (idToken: string) => {
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: idToken,
    });
    if (error) throw error;

    const metadataName =
      data.session?.user.user_metadata?.display_name ??
      data.session?.user.user_metadata?.full_name ??
      data.session?.user.user_metadata?.name;
    const fallbackName = metadataName?.trim() || nameFromEmail(data.session?.user.email);
    if (fallbackName) {
      await supabase.auth.updateUser({
        data: { full_name: fallbackName, name: fallbackName, display_name: fallbackName },
      });
    }
  };

  const signInWithDiscord = async () => {
    const redirectTo = Linking.createURL('auth/callback');
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: {
        redirectTo,
        skipBrowserRedirect: true,
      },
    });

    if (error) throw error;
    if (!data.url) throw new Error('No Discord sign in URL returned');

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (result.type !== 'success') throw new Error('Discord sign in was cancelled');

    const code = getUrlToken(result.url, 'code');
    if (code) {
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      if (exchangeError) throw exchangeError;
      return;
    }

    const accessToken = getUrlToken(result.url, 'access_token');
    const refreshToken = getUrlToken(result.url, 'refresh_token');
    if (!accessToken || !refreshToken) throw new Error('Discord did not return a session');

    const { error: sessionError } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (sessionError) throw sessionError;
  };

  const signInAsGuest = async () => {
    const { error } = await supabase.auth.signInAnonymously();
    if (error) throw error;
  };

  const signOut = async () => {
    await AsyncStorage.removeItem(MOCK_AUTH_PROVIDER_KEY);
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, signInWithMockProvider, signInWithApple, signInWithGoogleIdToken, signInWithDiscord, signInAsGuest, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
