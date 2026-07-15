/**
 * LoginScreen.tsx
 * Pantalla de inicio de sesión dual: Cliente y Colaborador.
 */

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { LogIn, Lock, Phone, Eye, EyeOff, RefreshCw, User, Users, Store, ChevronDown } from 'lucide-react';
import { loginWithPhoneAndPin } from '../lib/authService';
import type { AuthUser } from '../lib/authService';
import type { ClientAccount, StoreInfo } from '../types';

interface LoginScreenProps {
  onLogin: (user: AuthUser) => void;
  clientAccounts?: ClientAccount[];
  onClientLogin?: (client: ClientAccount) => void;
  onAddClientAccount?: (client: ClientAccount) => Promise<void>;
  stores?: StoreInfo[];
}

export default function LoginScreen({ onLogin, clientAccounts, onClientLogin, onAddClientAccount, stores }: LoginScreenProps) {
  const [loginMode, setLoginMode] = useState<'colaborador' | 'cliente'>('colaborador');
  
  // Login form states
  const [telefono, setTelefono] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Estados exclusivos para creación de cliente
  const [isNewClient, setIsNewClient] = useState(false);
  const [clientName, setClientName] = useState('');
  const [selectedStoreId, setSelectedStoreId] = useState<string>('');
  const [showStoreDropdown, setShowStoreDropdown] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowStoreDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Ordenar sucursales alfabéticamente
  const sortedStores = useMemo(() => {
    if (!stores) return [];
    return [...stores]
      .filter(s => s?.name)
      .sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));
  }, [stores]);

  const selectedStore = sortedStores.find(s => s.id === selectedStoreId);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanTelefono = telefono.trim();
    if (!cleanTelefono) {
      setError('Por favor, ingresa tu número de teléfono.');
      return;
    }

    if (loginMode === 'colaborador') {
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
    } else {
      // MODO CLIENTE
      if (!isNewClient) {
        // Verificar si existe el teléfono en la base de clientes local
        const existingClient = clientAccounts?.find(c => c.phone === cleanTelefono);
        
        if (existingClient && onClientLogin) {
          // Cliente existe, iniciar sesión directo
          onClientLogin(existingClient);
        } else {
          // Cliente no existe, habilitar modo registro
          setIsNewClient(true);
        }
      } else {
        // Registro de nuevo cliente
        if (!clientName.trim()) {
          setError('Por favor, ingresa tu nombre completo para crear la cuenta.');
          return;
        }
        if (!selectedStoreId) {
          setError('Por favor, selecciona tu sucursal predeterminada.');
          return;
        }

        setLoading(true);
        try {
          const newId = `CLIENT-${Date.now()}`;
          const newClient: ClientAccount = {
            id: newId,
            name: clientName.trim(),
            phone: cleanTelefono,
            defaultStore: selectedStoreId // Guardamos el ID de la sucursal seleccionada
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
      }
    }
  };

  const resetForm = () => {
    setError('');
    setPin('');
    setIsNewClient(false);
    setClientName('');
    setSelectedStoreId('');
    setShowStoreDropdown(false);
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
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
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
            Bienvenido al Portal
          </p>
        </div>

        {/* Toggle Modo */}
        <div style={{
          display: 'flex',
          background: 'rgba(255,255,255,0.08)',
          borderRadius: 12,
          padding: 4,
          marginBottom: 24,
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <button
            type="button"
            onClick={() => { setLoginMode('colaborador'); resetForm(); }}
            style={{
              flex: 1,
              padding: '10px 0',
              borderRadius: 10,
              border: 'none',
              background: loginMode === 'colaborador' ? 'rgba(255,255,255,0.15)' : 'transparent',
              color: loginMode === 'colaborador' ? '#fff' : 'rgba(255,255,255,0.5)',
              fontWeight: loginMode === 'colaborador' ? 700 : 500,
              fontSize: 13,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              transition: 'all 0.2s'
            }}
          >
            <Users size={16} />
            Soy Colaborador
          </button>
          <button
            type="button"
            onClick={() => { setLoginMode('cliente'); resetForm(); }}
            style={{
              flex: 1,
              padding: '10px 0',
              borderRadius: 10,
              border: 'none',
              background: loginMode === 'cliente' ? 'rgba(255,255,255,0.15)' : 'transparent',
              color: loginMode === 'cliente' ? '#fff' : 'rgba(255,255,255,0.5)',
              fontWeight: loginMode === 'cliente' ? 700 : 500,
              fontSize: 13,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              transition: 'all 0.2s'
            }}
          >
            <User size={16} />
            Soy Cliente
          </button>
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
                disabled={isNewClient}
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
                  opacity: isNewClient ? 0.6 : 1
                }}
                onFocus={e => (e.target.style.borderColor = 'rgba(249,115,22,0.7)')}
                onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.15)')}
              />
            </div>
          </div>

          {loginMode === 'colaborador' && (
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
          )}

          {loginMode === 'cliente' && isNewClient && (
            <>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: 6, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  Nombre Completo (Nuevo Registro)
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
                  <input
                    id="client-name"
                    type="text"
                    value={clientName}
                    onChange={e => setClientName(e.target.value)}
                    placeholder="Ej. Juan Pérez"
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

              {/* Selector Visual de Sucursal */}
              <div style={{ marginBottom: 24, position: 'relative' }} ref={dropdownRef}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: 6, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  Sucursal Predeterminada
                </label>
                <div 
                  onClick={() => setShowStoreDropdown(!showStoreDropdown)}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '11px 40px 11px 14px',
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: 10,
                    color: selectedStore ? '#fff' : 'rgba(255,255,255,0.5)',
                    fontSize: 14,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    borderColor: showStoreDropdown ? 'rgba(249,115,22,0.7)' : 'rgba(255,255,255,0.15)',
                    transition: 'border-color 0.2s'
                  }}
                >
                  {selectedStore ? (
                    <>
                      {selectedStore.image ? (
                        <img src={selectedStore.image} alt="Logo" style={{ width: 24, height: 24, borderRadius: 4, objectFit: 'cover' }} />
                      ) : (
                        <Store size={20} color="rgba(255,255,255,0.5)" />
                      )}
                      <span>{selectedStore.name}</span>
                    </>
                  ) : (
                    <>
                      <Store size={20} color="rgba(255,255,255,0.4)" />
                      <span>Seleccionar sucursal...</span>
                    </>
                  )}
                  <ChevronDown size={16} style={{ position: 'absolute', right: 14, color: 'rgba(255,255,255,0.4)' }} />
                </div>

                {showStoreDropdown && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    marginTop: 8,
                    background: '#24243e',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: 12,
                    maxHeight: 220,
                    overflowY: 'auto',
                    zIndex: 50,
                    boxShadow: '0 10px 40px rgba(0,0,0,0.6)'
                  }}>
                    {sortedStores.length > 0 ? (
                      sortedStores.map(store => (
                        <div
                          key={store.id}
                          onClick={() => {
                            setSelectedStoreId(store.id);
                            setShowStoreDropdown(false);
                          }}
                          style={{
                            padding: '10px 14px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            cursor: 'pointer',
                            borderBottom: '1px solid rgba(255,255,255,0.05)',
                            background: selectedStoreId === store.id ? 'rgba(249,115,22,0.15)' : 'transparent',
                            transition: 'background 0.2s'
                          }}
                          onMouseEnter={e => { if (selectedStoreId !== store.id) e.currentTarget.style.background = 'rgba(255,255,255,0.08)' }}
                          onMouseLeave={e => { if (selectedStoreId !== store.id) e.currentTarget.style.background = 'transparent' }}
                        >
                          {store.image ? (
                            <img src={store.image} alt="Logo" style={{ width: 24, height: 24, borderRadius: 4, objectFit: 'cover' }} />
                          ) : (
                            <Store size={20} color="rgba(255,255,255,0.5)" />
                          )}
                          <span style={{ fontSize: 13, color: '#fff' }}>{store.name}</span>
                        </div>
                      ))
                    ) : (
                      <div style={{ padding: '12px', textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>
                        No hay sucursales disponibles.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}

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
              marginTop: loginMode === 'cliente' && !isNewClient ? 24 : 0
            }}
            onMouseDown={e => { if (!loading) (e.currentTarget.style.transform = 'scale(0.98)'); }}
            onMouseUp={e => { (e.currentTarget.style.transform = 'scale(1)'); }}
          >
            {loading ? (
              <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <LogIn size={16} />
            )}
            {
              loading ? 'Procesando...' :
              loginMode === 'colaborador' ? 'Iniciar Sesión' :
              isNewClient ? 'Crear Cuenta y Entrar' : 'Entrar'
            }
          </button>

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
