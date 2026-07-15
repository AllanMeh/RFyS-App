/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { UserAccount, Role } from '../types';
import { User, UserPlus, Sparkles, CheckCircle, Info, } from 'lucide-react';
import AvatarUploader from './AvatarUploader';

const compressImage = (base64Str: string, callback: (compressed: string) => void) => {
  const img = new Image();
  img.src = base64Str;
  img.onload = () => {
    const canvas = document.createElement('canvas');
    const MAX_WIDTH = 256;
    const MAX_HEIGHT = 256;
    let width = img.width;
    let height = img.height;

    if (width > height) {
      if (width > MAX_WIDTH) {
        height *= MAX_WIDTH / width;
        width = MAX_WIDTH;
      }
    } else {
      if (height > MAX_HEIGHT) {
        width *= MAX_HEIGHT / height;
        height = MAX_HEIGHT;
      }
    }
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(img, 0, 0, width, height);
      const compressed = canvas.toDataURL('image/png');
      callback(compressed);
    } else {
      callback(base64Str);
    }
  };
  img.onerror = () => {
    callback(base64Str);
  };
};

interface CuentaPanelProps {
  users: UserAccount[];
  onAddUser: (newUser: UserAccount) => void;
  currentRole: Role;
  setCurrentRole: (role: Role) => void;
  onUpdateUserAvatar?: (userId: string, avatarUrl: string) => void;
  onUpdateUser?: (updatedUser: UserAccount) => void;
}

export default function CuentaPanel({
  users,
  onAddUser,
  currentRole,
  setCurrentRole,
  onUpdateUserAvatar,
  onUpdateUser
}: CuentaPanelProps) {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [registerAvatar, setRegisterAvatar] = useState('');
  const [registeredSuccess, setRegisteredSuccess] = useState(false);
  const [lastRegisteredUser, setLastRegisteredUser] = useState<UserAccount | null>(null);

  const activeUser = users.find(u => u.role === currentRole);

  // States for editing active user info
  const [editingId, setEditingId] = useState('');
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editPassword, setEditPassword] = useState('');

  // Sync edit states when activeUser is changed
  React.useEffect(() => {
    if (activeUser) {
      setEditingId(activeUser.id);
      setEditName(activeUser.name);
      setEditPhone(activeUser.phone);
      setEditPassword(activeUser.password || '');
    }
  }, [activeUser?.id]);

  const handleUpdateProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeUser || !onUpdateUser) return;
    
    if (!editName.trim() || !editPhone.trim()) {
      alert('El nombre y teléfono no pueden estar vacíos.');
      return;
    }

    const updated: UserAccount = {
      ...activeUser,
      name: editName.trim(),
      phone: editPhone.trim(),
      password: editPassword.trim()
    };

    onUpdateUser(updated);
    alert('¡Tus datos de perfil han sido actualizados con éxito!');
  };

  const handleActiveAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && activeUser && onUpdateUserAvatar) {
      const reader = new FileReader();
      reader.onloadend = () => {
        compressImage(reader.result as string, (compressed) => {
          onUpdateUserAvatar(activeUser.id, compressed);
          alert(`¡Foto de perfil para ${activeUser.name} actualizada con éxito!`);
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRegisterAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        compressImage(reader.result as string, (compressed) => {
          setRegisterAvatar(compressed);
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !username.trim() || !phone.trim()) {
      alert('Por favor, completa todos los campos.');
      return;
    }

    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const isDuplicate = users.some(u => u.username.toLowerCase() === cleanUsername);
    if (isDuplicate) {
      alert(`El nombre de usuario "@${cleanUsername}" ya existe. Elige otro por favor.`);
      return;
    }

    const newUser: UserAccount = {
      id: `usr-${Date.now()}`,
      name: name.trim(),
      username: cleanUsername,
      phone: phone.trim(),
      role: 'Empleado', // Automatically gets "Empleado" role
      registeredAt: new Date().toISOString(),
      avatarUrl: registerAvatar || undefined,
      avatar: registerAvatar || undefined
    };

    onAddUser(newUser);
    setLastRegisteredUser(newUser);
    setRegisteredSuccess(true);
    
    // Automatically set active app role to Empleado for testing
    setCurrentRole('Empleado');

    // Reset fields
    setName('');
    setUsername('');
    setPhone('');
    setRegisterAvatar('');
  };

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      
      {/* Visual Hub Header */}
      <div className="bg-gradient-to-r from-amber-800 to-[#904d00] text-white p-5 rounded-xl shadow-sm">
        <h2 className="text-xl font-bold font-sans flex items-center gap-2">
          <User className="w-5 h-5 text-amber-200" />
          <span>Mi Cuenta y Registro de Empleados</span>
        </h2>
        <p className="text-xs text-amber-200 mt-1 font-sans">
          Administra tu perfil, regístrate como empleado nuevo o consulta las credenciales del Rinconcito Frutal.
        </p>
      </div>

      {registeredSuccess && lastRegisteredUser && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 space-y-2 animate-fade-in text-xs">
          <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold">
            <CheckCircle className="w-5 h-5" />
            <span>¡Registro Completado Exitosamente!</span>
          </div>
          <p className="text-gray-600 dark:text-slate-400">
            Has quedado registrado(a) en el sistema. Se te ha asignado automáticamente el rol operativo:
          </p>
          <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-emerald-100 dark:border-slate-700 flex justify-between items-center text-xs font-mono font-bold">
            <div className="space-y-0.5">
              <p className="text-gray-900 dark:text-slate-100 font-sans">{lastRegisteredUser.name}</p>
              <p className="text-gray-400 dark:text-slate-500">@{lastRegisteredUser.username}</p>
            </div>
            <span className="bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 px-3 py-1 rounded-full text-[10px] font-bold">
              🧑‍🍳 Empleado
            </span>
          </div>
          <p className="text-[10px] text-gray-400 dark:text-slate-500 italic">
            * Nota: Tu rol inicial es Empleado. Solo un Administrador puede cambiar tu rol en el panel "Admin".
          </p>
          <button
            onClick={() => setRegisteredSuccess(false)}
            className="text-amber-[#904d00] underline font-bold mt-1 block"
          >
            Registrar otro empleado
          </button>
        </div>
      )}

      {/* Main Grid: User status and register box */}
      <div className="grid grid-cols-1 gap-6">
        
        {/* Current active session status */}
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-5 space-y-4">
          <h3 className="font-sans font-bold text-sm text-gray-900 dark:text-slate-100 flex items-center gap-1.5 border-b border-gray-200 dark:border-slate-700 pb-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>Estatus de Sesión Activa</span>
          </h3>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-50 dark:bg-slate-700/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
            {/* Avatar image uploader */}
            <AvatarUploader
              avatar={activeUser?.avatar}
              avatarUrl={activeUser?.avatarUrl}
              name={activeUser?.name || currentRole}
              size="lg"
              editable={!!activeUser}
              onAvatarChange={(base64) => {
                if (activeUser && onUpdateUserAvatar) {
                  onUpdateUserAvatar(activeUser.id, base64 || '');
                }
              }}
            />

            <div className="flex-grow space-y-1 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 justify-center sm:justify-start">
                <h4 className="font-bold text-gray-900 dark:text-slate-100 text-sm">
                  {activeUser ? activeUser.name : `Sesión: ${currentRole}`}
                </h4>
                <span className={`self-center px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                  currentRole === 'Administrador' 
                    ? 'bg-amber-100 text-[#904d00]' 
                    : (currentRole === 'Líder' ? 'bg-purple-100 text-purple-800' : (currentRole === 'Empleado' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'))
                }`}>
                  {currentRole === 'Administrador' ? '👑 Admin' : (currentRole === 'Líder' ? '🎖️ Líder' : (currentRole === 'Empleado' ? '🧑‍🍳 Empleado' : '🚚 Repartidor'))}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                {activeUser ? `@${activeUser.username} • ${activeUser.phone}` : `Visualizando interfaz nivel ${currentRole}`}
              </p>
            </div>
          </div>

          <div className="bg-amber-50 dark:bg-amber-950/30 rounded-lg p-3 text-xs text-amber-950 dark:text-amber-300 font-sans border border-amber-200 dark:border-amber-800">
            <div className="flex gap-2 items-start">
              <Info className="w-4 h-4 text-amber-700 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                El Rinconcito Frutal utiliza un <strong>Selector de Roles Rápido</strong> en el menú superior para facilitar las pruebas del sistema de nivel operativo de juguería.
              </p>
            </div>
          </div>

          {activeUser ? (
            <form onSubmit={handleUpdateProfileSubmit} className="border-t border-gray-150 dark:border-slate-700 pt-4 mt-3 space-y-3">
              <h4 className="font-sans font-black text-amber-900 text-[11px] uppercase tracking-wider">
                ⚙️ Editar Datos Personales
              </h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-500 dark:text-slate-400 block mb-1 font-bold">Nombre Completo del Colaborador:</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Por ej. Alejandro Gómez"
                    className="bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 w-full p-2 border border-gray-250 dark:border-slate-600 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="text-gray-500 dark:text-slate-400 block mb-1 font-bold">Teléfono Móvil:</label>
                  <input
                    type="tel"
                    required
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="3312345678"
                    className="bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 w-full p-2 border border-gray-250 dark:border-slate-600 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-500 dark:text-slate-400 block mb-1 font-bold">Modificar Contraseña:</label>
                  <input
                    type="password"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    placeholder="Contraseña nueva (opcional)"
                    className="bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 w-full p-2 border border-gray-250 dark:border-slate-600 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="text-gray-400 dark:text-slate-500 block mb-0.5 font-bold uppercase text-[9px] tracking-wider">Información de Sistema (No Editable)</label>
                  <div className="bg-slate-50 dark:bg-slate-700/50 p-2 rounded-lg border border-slate-200 dark:border-slate-600 text-[10px] space-y-1 text-slate-600 dark:text-slate-300 font-mono">
                    <p><strong>Rol:</strong> {currentRole}</p>
                    <p><strong>Login:</strong> @{activeUser.username}</p>
                    <p><strong>Registro:</strong> {activeUser.registeredAt ? new Date(activeUser.registeredAt).toLocaleDateString('es-MX', { dateStyle: 'long' }) : 'Un día operativo'}</p>
                    <p><strong>Estado PWA:</strong> <span className="text-emerald-700 font-bold">Activo 🏆</span></p>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="bg-[#904d00] hover:bg-amber-900 text-white font-sans font-bold text-xs px-5 py-2.5 rounded-xl shadow-sm transition-all active:scale-[0.98] cursor-pointer"
                >
                  Guardar Cambios de Perfil 💾
                </button>
              </div>
            </form>
          ) : (
            <div className="text-slate-400 text-xs italic border-t pt-3">
              Selecciona un rol de usuario con cuenta registrada para habilitar la edición de datos personales.
            </div>
          )}
        </div>

        {/* Employee signup / register Form */}
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-5 space-y-4">
          <h3 className="font-sans font-bold text-sm text-gray-900 dark:text-slate-100 flex items-center gap-1.5 border-b border-gray-200 dark:border-slate-700 pb-2">
            <UserPlus className="w-4 h-4 text-amber-600" />
            <span>Registro de Nuevos Empleados</span>
          </h3>

          <p className="text-xs text-gray-500 dark:text-slate-400">
            Crea una cuenta de empleado en este terminal. Al registrarte quedarás en la base de datos local y podrás operar con el rol por defecto de <strong>Empleado</strong>.
          </p>

          <form onSubmit={handleRegister} className="space-y-4 text-xs font-medium">
            <div>
              <label className="text-gray-500 dark:text-slate-400 block mb-1 font-bold">Nombre Completo del Colaborador:</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Por ej. Alejandro Gómez"
                className="bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 w-full p-2.5 border border-gray-250 dark:border-slate-600 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-gray-500 dark:text-slate-400 block mb-1 font-bold">Nombre de Usuario (Login):</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-400 dark:text-slate-500">@</span>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="alejandrog"
                    className="bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 w-full pl-7 pr-3 py-2.5 border border-gray-255 dark:border-slate-600 rounded-lg text-xs font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-gray-500 dark:text-slate-400 block mb-1 font-bold">Teléfono Móvil:</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-400 dark:text-slate-500">📞</span>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="3312345678"
                    className="bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 w-full pl-8 pr-3 py-2.5 border border-gray-255 dark:border-slate-600 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-gray-500 block mb-1 font-bold">Foto de Perfil (Opcional):</label>
              <div className="flex items-center gap-4 p-3 bg-neutral-50 dark:bg-slate-805 rounded-xl border border-dashed border-gray-300 dark:border-slate-700">
                <AvatarUploader
                  avatar={registerAvatar}
                  name={name || 'Nuevo'}
                  size="md"
                  editable={true}
                  onAvatarChange={(base64) => setRegisterAvatar(base64 || '')}
                />
                <div className="flex-grow space-y-1">
                  <span className="text-[10px] text-gray-500 dark:text-slate-400 block font-normal leading-normal">
                    Toca el círculo de la foto para tomar una fotografía o elegir desde tu galería. Se optimizará y recortará automáticamente.
                  </span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-[#904d00] hover:bg-amber-900 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 border border-amber-950/20 shadow-md transition-all active:scale-[0.98] cursor-pointer text-sm"
            >
              <Sparkles className="w-4 h-4 text-amber-200" />
              <span>Registrarse como Empleado</span>
            </button>
          </form>
        </div>

      </div>

    </div>
  );
}
