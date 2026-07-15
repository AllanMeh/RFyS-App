/**
 * LoginScreen.tsx
 * Pantalla de inicio de sesión dual: Cliente y Colaborador.
 */

import React, { useState } from 'react';
import { LogIn, Lock, Phone, Eye, EyeOff, RefreshCw, User, Users, Store, ArrowLeft } from 'lucide-react';
import { loginWithPhoneAndPin } from '../lib/authService';
import type { AuthUser } from '../lib/authService';
import type { ClientAccount, StoreInfo } from '../types';
import StoreSelectorModal from './StoreSelectorModal';

interface LoginScreenProps {
  onLogin: (user: AuthUser) => void;
  clientAccounts?: ClientAccount[];
  onClientLogin?: (client: ClientAccount) => void;
  onAddClientAccount?: (client: ClientAccount) => Promise<void>;
  stores?: StoreInfo[];
}

type LoginStep = 'initial' | 'colaborador' | 'cliente_phone' | 'cliente_register';

export default function LoginScreen({ onLogin, clientAccounts, onClientLogin, onAddClientAccount, stores }: LoginScreenProps) {
  const [step, setStep] = useState<LoginStep>('initial');
  
  // Login form states
  const [telefono, setTelefono] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Estados exclusivos para creación de cliente
  const [clientName, setClientName] = useState('');
  const [selectedStoreName, setSelectedStoreName] = useState<string>('');
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);

  // Filtrar stores de QA
  const validStores = (stores || []).filter(s => s?.name && s.name !== 'QA_SUCURSAL_666');

  const handleLoginColaborador = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanTelefono = telefono.trim();
    if (!cleanTelefono) {
      setError('Por favor, ingresa tu número de teléfono.');
      return;
    }
    if (!pin.trim()) {
      setError('Por favor, ingresa tu PIN.');
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

  const handleClientePhone = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanTelefono = telefono.trim();
    if (!cleanTelefono) {
      setError('Por favor, ingresa tu número de teléfono.');
      return;
    }

    const existingClient = clientAccounts?.find(c => c.phone === cleanTelefono);
    
    if (existingClient && onClientLogin) {
      onClientLogin(existingClient);
    } else {
      setStep('cliente_register');
    }
  };

  const handleClienteRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!clientName.trim()) {
      setError('Por favor, ingresa tu nombre completo.');
      return;
    }
    if (!selectedStoreName) {
      setError('Por favor, selecciona tu sucursal predeterminada.');
      return;
    }

    setLoading(true);
    try {
      const newId = `CLIENT-${Date.now()}`;
      
      // Buscar el ID real de la sucursal por su nombre
      const storeObj = validStores.find(s => s.name === selectedStoreName);
      const storeIdToSave = storeObj ? storeObj.id : selectedStoreName;

      const newClient: ClientAccount = {
        id: newId,
        name: clientName.trim(),
        phone: telefono.trim(),
        defaultStore: storeIdToSave
      };
      
      if (onAddClientAccount) {
        await onAddClientAccount(newClient);
      }
      
      if (onClientLogin) {
        onClientLogin(newClient);
      }
    } catch (err: any) {
      setError(err.message ?? 'Error al crear la cuenta de cliente.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setError('');
    setPin('');
    setClientName('');
    setSelectedStoreName('');
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
        position: 'relative'
      }}>
        {/* Back Button */}
        {step !== 'initial' && (
          <button
            onClick={() => {
              if (step === 'cliente_register') {
                setStep('cliente_phone');
              } else {
                setStep('initial');
                resetForm();
              }
            }}
            style={{
              position: 'absolute',
              top: 24,
              left: 24,
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              borderRadius: '50%',
              width: 36,
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
          >
            <ArrowLeft size={18} />
          </button>
        )}

        {/* Logo / marca */}
        <div style={{ textAlign: 'center', marginBottom: step === 'initial' ? 32 : 24 }}>
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
          <p style={{ margin: '8px 0 0', fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>
            {step === 'initial' ? '¿Cómo deseas ingresar?' : 'Bienvenido al Portal'}
          </p>
        </div>

        {/* PASO 1: Selección inicial */}
        {step === 'initial' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <button
              onClick={() => setStep('colaborador')}
              style={{
                width: '100%',
                padding: '16px',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 12,
                color: '#fff',
                fontSize: 16,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
              }}
            >
              <Users size={20} />
              Soy Colaborador
            </button>
            <button
              onClick={() => setStep('cliente_phone')}
              style={{
                width: '100%',
                padding: '16px',
                background: 'linear-gradient(135deg, #f97316, #fb923c)',
                border: 'none',
                borderRadius: 12,
                color: '#fff',
                fontSize: 16,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(249,115,22,0.4)',
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(249,115,22,0.5)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(249,115,22,0.4)';
              }}
            >
              <User size={20} />
              Soy Cliente
            </button>
          </div>
        )}

        {/* PASO 2: Colaborador */}
        {step === 'colaborador' && (
          <form onSubmit={handleLoginColaborador} noValidate>
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
              {loading ? <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <LogIn size={16} />}
              {loading ? 'Procesando...' : 'Iniciar Sesión'}
            </button>
          </form>
        )}

        {/* PASO 3: Cliente (Teléfono) */}
        {step === 'cliente_phone' && (
          <form onSubmit={handleClientePhone} noValidate>
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: 6, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Número de teléfono
              </label>
              <div style={{ position: 'relative' }}>
                <Phone size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
                <input
                  id="login-telefono-cliente"
                  type="tel"
                  autoComplete="tel"
                  value={telefono}
                  onChange={e => setTelefono(e.target.value)}
                  placeholder="5511223344"
                  autoFocus
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
              type="submit"
              style={{
                width: '100%',
                padding: '13px',
                background: 'linear-gradient(135deg, #f97316, #fb923c)',
                border: 'none',
                borderRadius: 12,
                color: '#fff',
                fontWeight: 700,
                fontSize: 15,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: '0 4px 16px rgba(249,115,22,0.4)',
                transition: 'opacity 0.2s, transform 0.1s',
              }}
              onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.98)' }}
              onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)' }}
            >
              <LogIn size={16} />
              Continuar
            </button>
          </form>
        )}

        {/* PASO 4: Cliente (Registro / Sucursal) */}
        {step === 'cliente_register' && (
          <form onSubmit={handleClienteRegister} noValidate>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: 6, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Número de teléfono
              </label>
              <div style={{ position: 'relative' }}>
                <Phone size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
                <input
                  type="tel"
                  value={telefono}
                  disabled
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '11px 14px 11px 40px',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    borderRadius: 10,
                    color: 'rgba(255,255,255,0.5)',
                    fontSize: 14,
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: 6, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Nombre
              </label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
                <input
                  type="text"
                  value={clientName}
                  onChange={e => setClientName(e.target.value)}
                  placeholder="Ej. Juan Pérez"
                  autoFocus
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
                Sucursal
              </label>
              <button
                type="button"
                onClick={() => setIsStoreModalOpen(true)}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '11px 14px 11px 14px',
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: 10,
                  color: selectedStoreName ? '#fff' : 'rgba(255,255,255,0.5)',
                  fontSize: 14,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  textAlign: 'left',
                  transition: 'border-color 0.2s'
                }}
              >
                {selectedStoreName ? (
                  <>
                    <Store size={18} style={{ color: 'rgba(255,255,255,0.7)' }} />
                    <span style={{ flex: 1 }}>{selectedStoreName}</span>
                  </>
                ) : (
                  <>
                    <Store size={18} style={{ color: 'rgba(255,255,255,0.4)' }} />
                    <span style={{ flex: 1 }}>Seleccionar sucursal...</span>
                  </>
                )}
              </button>
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
              {loading ? <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <LogIn size={16} />}
              {loading ? 'Procesando...' : 'Crear cuenta'}
            </button>
          </form>
        )}

        <p style={{ marginTop: 28, textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>
          Rinconcito Frutal & Snacks · POS v2.0
        </p>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* StoreSelector Modal ya existente (con buscador y tarjetas) */}
      <StoreSelectorModal
        isOpen={isStoreModalOpen}
        onClose={() => setIsStoreModalOpen(false)}
        stores={validStores}
        selectedStoreName={selectedStoreName}
        onSelectStore={setSelectedStoreName}
      />
    </div>
  );
}
