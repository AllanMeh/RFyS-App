/**
 * LoginScreen.tsx
 * Pantalla de inicio de sesión con Supabase mediante Teléfono y PIN.
 * Muestra login con campos simplificados sin correos ni recuperación.
 */

import React, { useState } from 'react';
import { LogIn, Lock, Phone, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { loginWithPhoneAndPin } from '../lib/authService';
import type { AuthUser } from '../lib/authService';

interface LoginScreenProps {
  onLogin: (user: AuthUser) => void;
  /** Fallback: si Supabase falla, el usuario puede ingresar como invitado */
  onGuestLogin?: () => void;
}

export default function LoginScreen({ onLogin, onGuestLogin }: LoginScreenProps) {
  // Login form states
  const [telefono, setTelefono] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanTelefono = telefono.trim();
    if (!cleanTelefono || !pin.trim()) {
      setError('Por favor, ingresa tu número de teléfono y PIN.');
      return;
    }

    setLoading(true);
    const result = await loginWithPhoneAndPin(cleanTelefono, pin.trim());
    setLoading(false);

    if (result.success && result.user) {
      onLogin(result.user);
    } else {
      setError(result.error ?? 'Error al iniciar sesión. Verifica tu teléfono y PIN.');
    }
  };

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
      padding: '16px',
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
    }}>
      {/* Card */}
      <div style={{
        width: '100%',
        maxWidth: 420,
        background: 'rgba(255,255,255,0.06)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 24,
        padding: '40px 36px',
        boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
        color: '#fff',
      }}>
        {/* Logo / marca */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #f97316, #fb923c)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
            boxShadow: '0 8px 32px rgba(249,115,22,0.4)',
          }}>
            <span style={{ fontSize: 28 }}>🍹</span>
          </div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: '-0.5px' }}>
            Rinconcito Frutal
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>
            Sistema de Punto de Venta
          </p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleLogin} noValidate>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: 6, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Número de teléfono
            </label>
            <div style={{ position: 'relative' }}>
              <Phone size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
              <input
                id="login-telefono"
                type="tel"
                autoComplete="tel"
                value={telefono}
                onChange={e => setTelefono(e.target.value)}
                placeholder="5511223344"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '11px 14px 11px 40px',
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: 10,
                  color: '#fff',
                  fontSize: 14,
                  outline: 'none',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => (e.target.style.borderColor = 'rgba(249,115,22,0.7)')}
                onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.15)')}
              />
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: 6, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              PIN / Contraseña corta
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
              <input
                id="login-pin"
                type={showPin ? 'text' : 'password'}
                autoComplete="current-password"
                value={pin}
                onChange={e => setPin(e.target.value)}
                placeholder="••••"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '11px 40px 11px 40px',
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: 10,
                  color: '#fff',
                  fontSize: 14,
                  outline: 'none',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => (e.target.style.borderColor = 'rgba(249,115,22,0.7)')}
                onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.15)')}
              />
              <button
                type="button"
                onClick={() => setShowPin(v => !v)}
                style={{
                  position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'rgba(255,255,255,0.5)', padding: 0,
                }}
                aria-label={showPin ? 'Ocultar PIN' : 'Mostrar PIN'}
              >
                {showPin ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 8, padding: '10px 14px', marginBottom: 16,
              fontSize: 13, color: '#fca5a5',
            }}>
              {error}
            </div>
          )}

          <button
            id="btn-login-submit"
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '13px',
              background: loading ? 'rgba(249,115,22,0.5)' : 'linear-gradient(135deg, #f97316, #fb923c)',
              border: 'none',
              borderRadius: 12,
              color: '#fff',
              fontWeight: 700,
              fontSize: 15,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: loading ? 'none' : '0 4px 16px rgba(249,115,22,0.4)',
              transition: 'opacity 0.2s, transform 0.1s',
            }}
            onMouseDown={e => { if (!loading) (e.currentTarget.style.transform = 'scale(0.98)'); }}
            onMouseUp={e => { (e.currentTarget.style.transform = 'scale(1)'); }}
          >
            {loading ? (
              <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <LogIn size={16} />
            )}
            {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
          </button>

          {onGuestLogin && (
            <button
              id="btn-guest-login"
              type="button"
              onClick={onGuestLogin}
              style={{
                width: '100%',
                marginTop: 12,
                padding: '11px',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 12,
                color: 'rgba(255,255,255,0.6)',
                fontWeight: 500,
                fontSize: 13,
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
            >
              Entrar sin cuenta (modo local)
            </button>
          )}
        </form>

        <p style={{ marginTop: 28, textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>
          Rinconcito Frutal & Snacks · POS v2.0
        </p>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
