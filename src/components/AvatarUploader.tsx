import React, { useRef, useState } from 'react';
import { Camera, Image as ImageIcon, Trash2, X, Loader2 } from 'lucide-react';
import { ClientAccount, UserAccount } from '../types';
import { uploadAsset } from '../lib/storageService';

interface AvatarUploaderProps {
  avatar?: string;
  avatarUrl?: string;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  editable?: boolean;
  onAvatarChange?: (base64: string | null) => void;
}

export const getInitials = (name: string): string => {
  if (!name) return 'U';
  const cleanName = name.replace(/\s*\([^)]*\)/g, '').trim();
  const parts = cleanName.split(/\s+/);
  if (parts.length >= 2) {
    const first = parts[0][0] || '';
    const last = parts[parts.length - 1][0] || '';
    return (first + last).toUpperCase();
  }
  return parts[0]?.[0]?.toUpperCase() || 'U';
};

const getAvatarBg = (name: string) => {
  const colors = [
    'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-900/60',
    'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/60',
    'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/60',
    'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/60',
    'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/60',
    'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-900/60',
  ];
  if (!name) return colors[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

export const getAvatarForClient = (
  clientId?: string,
  clientName?: string,
  clientAccounts?: ClientAccount[],
  users?: UserAccount[]
): { avatar?: string; avatarUrl?: string; name: string } => {
  const name = clientName || 'Cliente';
  if (clientAccounts && clientId) {
    const client = clientAccounts.find(c => c.id === clientId);
    if (client) {
      return { avatar: client.avatar, avatarUrl: client.avatarUrl, name: client.name };
    }
  }
  if (users && clientId) {
    const usr = users.find(u => u.id === clientId);
    if (usr) {
      return { avatar: usr.avatar, avatarUrl: usr.avatarUrl, name: usr.name };
    }
  }
  return { name };
};

export default function AvatarUploader({
  avatar,
  avatarUrl,
  name,
  size = 'md',
  editable = false,
  onAvatarChange
}: AvatarUploaderProps) {
  const [showOptions, setShowOptions] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const displayImage = avatar || avatarUrl;
  const initials = getInitials(name);
  const bgClass = getAvatarBg(name);

  // Size sizing classes
  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px] border',
    sm: 'w-8 h-8 text-xs border-2',
    md: 'w-12 h-12 text-base border-2',
    lg: 'w-16 h-16 text-xl border-2',
    xl: 'w-24 h-24 text-3xl border-2',
  };

  const isMobile = () => {
    if (typeof window === 'undefined') return false;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
           (navigator.maxTouchPoints > 0) || 
           (window.matchMedia('(pointer: coarse)').matches);
  };

  const handleAvatarClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!editable) return;

    if (isMobile()) {
      setShowOptions(true);
    } else {
      galleryInputRef.current?.click();
    }
  };

  const processFile = async (file: File) => {
    setIsUploading(true);
    try {
      const url = await uploadAsset(file, 'profile-images');
      onAvatarChange?.(url);
    } catch (err: any) {
      console.error('Error uploading avatar:', err);
      const detailedError = err && typeof err === 'object'
        ? `${err.message || ''} (Status: ${err.status || err.statusCode || 'N/A'}, Error: ${err.error || JSON.stringify(err)})`
        : String(err);
      alert('Error subiendo imagen: ' + detailedError);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
    // Reset inputs
    if (e.target) e.target.value = '';
    setShowOptions(false);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAvatarChange) {
      onAvatarChange(null);
    }
    setShowOptions(false);
  };

  const hasPhoto = !!avatar || !!avatarUrl;

  const AvatarWrapper = editable ? 'button' : 'div';
  const wrapperProps = editable 
    ? { type: 'button' as const, onClick: handleAvatarClick }
    : {};

  return (
    <div className="relative inline-block select-none">
      {/* Hidden inputs */}
      <input
        type="file"
        ref={galleryInputRef}
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      <input
        type="file"
        ref={cameraInputRef}
        accept="image/*"
        capture="user"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Main Avatar Wrapper */}
      <AvatarWrapper
        {...wrapperProps}
        className={`relative flex items-center justify-center rounded-full overflow-hidden shrink-0 border-amber-300 dark:border-slate-700 shadow-sm ${
          sizeClasses[size]
        } ${bgClass} ${
          editable ? 'cursor-pointer hover:border-amber-500 dark:hover:border-amber-500 hover:scale-105 active:scale-95 transition-all group' : ''
        }`}
      >
        {displayImage ? (
          <img
            src={displayImage}
            alt={name}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover rounded-full"
          />
        ) : (
          <span className="font-extrabold uppercase tracking-tight">{initials}</span>
        )}

        {/* Loading overlay */}
        {isUploading && (
          <div className="absolute inset-0 bg-white/70 dark:bg-black/60 flex items-center justify-center">
            <Loader2 className="w-5 h-5 text-orange-600 animate-spin" />
          </div>
        )}

        {/* Hover overlay on desktop */}
        {editable && !isUploading && (
          <div className="absolute inset-0 bg-black/40 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <Camera className={`${size === 'xs' || size === 'sm' ? 'w-3 h-3' : 'w-5 h-5'}`} />
          </div>
        )}
      </AvatarWrapper>

      {/* Action sheet for Mobile */}
      {showOptions && (
        <div className="fixed inset-0 z-9999 flex items-end justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in" onClick={() => setShowOptions(false)}>
          <div 
            className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-5 space-y-4 shadow-xl border border-gray-200 dark:border-slate-800 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-slate-800">
              <h4 className="font-sans font-black text-sm text-gray-900 dark:text-white uppercase tracking-wider">
                Foto de Perfil
              </h4>
              <button 
                type="button" 
                onClick={() => setShowOptions(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="w-full flex items-center gap-3 px-4 py-3 bg-orange-50 hover:bg-orange-100 dark:bg-slate-800 dark:hover:bg-slate-750 text-gray-800 dark:text-white rounded-xl text-xs font-bold transition border border-orange-100 dark:border-slate-750 cursor-pointer"
              >
                <Camera className="w-4 h-4 text-orange-600 dark:text-amber-500" />
                <span>📷 Tomar fotografía</span>
              </button>

              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                className="w-full flex items-center gap-3 px-4 py-3 bg-orange-50 hover:bg-orange-100 dark:bg-slate-800 dark:hover:bg-slate-750 text-gray-800 dark:text-white rounded-xl text-xs font-bold transition border border-orange-100 dark:border-slate-750 cursor-pointer"
              >
                <ImageIcon className="w-4 h-4 text-orange-600 dark:text-amber-500" />
                <span>🖼 Elegir desde galería</span>
              </button>

              {hasPhoto && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-900/30 text-red-700 dark:text-red-405 rounded-xl text-xs font-bold transition border border-red-100 dark:border-red-900/40 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4 text-red-650" />
                  <span>🗑 Eliminar fotografía</span>
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowOptions(false)}
              className="w-full text-center py-2.5 text-xs text-gray-505 dark:text-gray-400 font-bold border-t border-gray-100 dark:border-slate-800 cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
