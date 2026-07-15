/**
 * authService.ts
 * Wrappers para login, logout, sesión y recuperación utilizando tabla propia `profiles` en Supabase.
 * Mantiene compatibilidad con localStorage cuando Supabase no está disponible o se usa modo local.
 */

import { supabase } from './supabase';
import type { Role } from '../types';

export interface AuthUser {
  id: string;
  nombre: string;
  telefono: string;
  rol: Role;
  activo: boolean;
  email?: string; // Mantener para compatibilidad de tipos
  created_at?: string;
  updated_at?: string;
}

export interface LoginResult {
  success: boolean;
  user?: AuthUser;
  error?: string;
}

// ─── Hashing de PIN (SHA-256) ──────────────────────────────────────────────────

function sha256Fallback(ascii: string): string {
  function rightRotate(value: number, amount: number) {
    return (value >>> amount) | (value << (32 - amount));
  }
  
  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  const lengthProperty = 'length';
  let i, j;
  let result = '';

  const words: number[] = [];
  const asciiLength = ascii[lengthProperty] * 8;
  
  let hash = [] as number[];
  const k = [] as number[];
  let primeCounter = 0;

  const isPrime = (n: number) => {
    for (let factor = 2; factor * factor <= n; factor++) {
      if (n % factor === 0) return false;
    }
    return true;
  };

  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (isPrime(candidate)) {
      if (primeCounter < 8) {
        hash[primeCounter] = ((mathPow(candidate, .5) % 1) * maxWord) | 0;
      }
      k[primeCounter] = ((mathPow(candidate, 1 / 3) % 1) * maxWord) | 0;
      primeCounter++;
    }
  }
  
  let asciiBytes = [] as number[];
  for (i = 0; i < ascii[lengthProperty]; i++) {
    asciiBytes.push(ascii.charCodeAt(i));
  }
  
  asciiBytes.push(0x80);
  while (asciiBytes[lengthProperty] % 64 !== 56) {
    asciiBytes.push(0);
  }
  
  for (i = 0; i < asciiBytes[lengthProperty]; i += 4) {
    words.push((asciiBytes[i] << 24) | (asciiBytes[i+1] << 16) | (asciiBytes[i+2] << 8) | asciiBytes[i+3]);
  }
  
  words.push((asciiLength / maxWord) | 0);
  words.push(asciiLength | 0);
  
  for (i = 0; i < words[lengthProperty]; i += 16) {
    const w = words.slice(i, i + 16);
    const oldHash = [ ...hash ];
    
    for (j = 0; j < 64; j++) {
      if (j >= 16) {
        const w15 = w[j - 15], w2 = w[j - 2];
        const s0 = rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3);
        const s1 = rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10);
        w[j] = (w[j - 16] + s0 + w[j - 7] + s1) | 0;
      }
      
      const s0_h = rightRotate(hash[0], 2) ^ rightRotate(hash[0], 13) ^ rightRotate(hash[0], 22);
      const maj = (hash[0] & hash[1]) ^ (hash[0] & hash[2]) ^ (hash[1] & hash[2]);
      const t2 = (s0_h + maj) | 0;
      const s1_h = rightRotate(hash[4], 6) ^ rightRotate(hash[4], 11) ^ rightRotate(hash[4], 25);
      const ch = (hash[4] & hash[5]) ^ (~hash[4] & hash[6]);
      const t1 = (hash[7] + s1_h + ch + k[j] + w[j]) | 0;
      
      hash = [(t1 + t2) | 0].concat(hash);
      hash[4] = (hash[4] + t1) | 0;
      hash.length = 8;
    }
    
    for (j = 0; j < 8; j++) {
      hash[j] = (hash[j] + oldHash[j]) | 0;
    }
  }
  
  for (i = 0; i < 8; i++) {
    for (j = 3; j >= 0; j--) {
      const byte = (hash[i] >> (j * 8)) & 0xff;
      result += byte.toString(16).padStart(2, '0');
    }
  }
  
  return result;
}

export async function hashPin(pin: string): Promise<string> {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(pin);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (e) {
      console.warn('[Auth] Fallback a hashing manual por error de Crypto:', e);
    }
  }
  return sha256Fallback(pin);
}

// ─── Login por Teléfono y PIN ──────────────────────────────────────────────────

export async function loginWithPhoneAndPin(telefono: string, pin: string): Promise<LoginResult> {
  if (!supabase) {
    return { success: false, error: 'Supabase no está configurado.' };
  }

  try {
    const pinHash = await hashPin(pin);

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('telefono', telefono)
      .eq('activo', true)
      .single();

    if (error || !profile) {
      return { success: false, error: 'Usuario no encontrado, inactivo o credenciales incorrectas.' };
    }

    if (profile.pin_hash !== pinHash) {
      return { success: false, error: 'PIN incorrecto. Intente nuevamente.' };
    }

    const authUser: AuthUser = {
      id: profile.id,
      nombre: profile.nombre,
      telefono: profile.telefono,
      rol: profile.rol as Role,
      activo: profile.activo,
      email: '', // fallback vacío
      created_at: profile.created_at,
      updated_at: profile.updated_at
    };

    localStorage.setItem('rf_auth_user', JSON.stringify(authUser));
    
    if (authStateListener) {
      authStateListener(authUser);
    }

    return { success: true, user: authUser };
  } catch (err: any) {
    return { success: false, error: err.message ?? 'Error inesperado al iniciar sesión.' };
  }
}

// ─── Logout ───────────────────────────────────────────────────────────────────

export async function logout(): Promise<void> {
  localStorage.removeItem('rf_auth_user');
  if (authStateListener) {
    authStateListener(null);
  }
}

// ─── Get current session ──────────────────────────────────────────────────────

export async function getCurrentUser(): Promise<AuthUser | null> {
  const userStr = localStorage.getItem('rf_auth_user');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr) as AuthUser;
  } catch {
    return null;
  }
}

export async function getCurrentSession(): Promise<{ user: AuthUser } | null> {
  const user = await getCurrentUser();
  return user ? { user } : null;
}

// ─── onAuthStateChange wrapper (Pub/Sub simple) ───────────────────────────────

let authStateListener: ((user: AuthUser | null) => void) | null = null;

export function subscribeToAuthChanges(
  callback: (user: AuthUser | null) => void
): () => void {
  authStateListener = callback;

  // Ejecución inicial para sincronizar estado
  getCurrentUser().then(user => {
    callback(user);
  });

  return () => {
    if (authStateListener === callback) {
      authStateListener = null;
    }
  };
}
