import React, { useState, useEffect, useRef } from 'react';
import { Product, ClientDebt, Order, Coupon, ClientAccount, OrderItem, StoreInfo, NotificationPreferences } from '../types';
import { 
  User, Mail, Phone, Lock, Store, ArrowLeft, LogOut, ShoppingCart, 
  Trash2, Ticket, Check, RefreshCw, Clock, History, CreditCard, ShieldAlert,
  Bell, CheckCircle2, MessageSquare, AlertCircle, ChevronRight
} from 'lucide-react';
import StoreSelectorModal from './StoreSelectorModal';
import { requestNotificationPermission } from '../services/notifications';
import AvatarUploader from './AvatarUploader';
import { formatStoreName } from '../lib/database/sucursales';
import { CustomizationsRenderer } from './CustomizationsRenderer';

interface ClientPanelProps {
  products: Product[];
  isStoreClosed: boolean;
  menuDelDia: string;
  logoUrl: string;
  clients: ClientDebt[];
  onAddClient: (c: ClientDebt) => void;
  orders: Order[];
  onAddOrder: (newOrder: Order) => void;
  coupons: Coupon[];
  setCoupons: React.Dispatch<React.SetStateAction<Coupon[]>>;
  clientAccounts: ClientAccount[];
  setClientAccounts: React.Dispatch<React.SetStateAction<ClientAccount[]>>;
  activeClient: ClientAccount | null;
  setActiveClient: React.Dispatch<React.SetStateAction<ClientAccount | null>>;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  onExit: () => void;
  stores: StoreInfo[];
  polloStatus?: { pierna: boolean; muslo: boolean };
}

export default function ClientPanel({
  products,
  isStoreClosed,
  menuDelDia,
  logoUrl,
  clients,
  onAddClient,
  orders,
  onAddOrder,
  coupons,
  setCoupons,
  clientAccounts,
  setClientAccounts,
  activeClient,
  setActiveClient,
  isDarkMode,
  toggleDarkMode,
  onExit,
  stores = [],
  polloStatus = { pierna: true, muslo: true }
}: ClientPanelProps) {
  
  // --- CLIENT VIEW CONTROL ---
  const [isRegistering, setIsRegistering] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [activeClientTab, setActiveClientTab] = useState<'menu' | 'pedidos' | 'creditos' | 'perfil'>('menu');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Form states
  const [phoneInput, setPhoneInput] = useState(''); // Replaces emailInput
  const [passwordInput, setPasswordInput] = useState('');
  
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState(''); // Replaces regEmail
  const [regStore, setRegStore] = useState(() => {
    const activeList = stores.filter(s => s.active);
    return activeList[0]?.name || 'Martí';
  });
  
  useEffect(() => {
    const activeList = stores.filter(s => s.active);
    if (activeList.length > 0) {
      const isCurrentActive = activeList.some(s => s.name === regStore);
      if (!isCurrentActive) {
        setRegStore(activeList[0].name);
      }
    }
  }, [stores]);

  // WhatsApp and store modals
  const [isRegStoreModalOpen, setIsRegStoreModalOpen] = useState(false);
  const [isVerifyingWhatsApp, setIsVerifyingWhatsApp] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationInput, setVerificationInput] = useState('');
  const [verificationAction, setVerificationAction] = useState<'register' | 'recovery'>('register');
  const [showNotifPromoModal, setShowNotifPromoModal] = useState(false);
  const [viewingOrderDetail, setViewingOrderDetail] = useState<Order | null>(null);
  // Guard ref: prevents executeWhatsAppRegistration from running more than once per verification session
  const registrationExecuted = useRef(false);



  // Recovery flow states
  const [recoveryPhone, setRecoveryPhone] = useState('');
  const [recoveryStep, setRecoveryStep] = useState<'phone' | 'verify' | 'new_password'>('phone');
  const [tempPasswordToSet, setTempPasswordToSet] = useState('');
  const [confirmTempPassword, setConfirmTempPassword] = useState('');

  // Cart / Order state
  const [clientCart, setClientCart] = useState<OrderItem[]>([]);
  const [selectedCouponCode, setSelectedCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'Pendiente' | 'Crédito'>('Pendiente');

  // Variant Modal State
  const [selectedProductForVariants, setSelectedProductForVariants] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState('');
  const [horaEntrega, setHoraEntrega] = useState('Ahora');

  const getAvailableHours = () => {
    const slots = [
      { label: 'Ahora', hour: 0, minute: 0 },
      { label: '7:00 AM', hour: 7, minute: 0 },
      { label: '7:30 AM', hour: 7, minute: 30 },
      { label: '8:00 AM', hour: 8, minute: 0 },
      { label: '8:30 AM', hour: 8, minute: 30 },
      { label: '9:00 AM', hour: 9, minute: 0 },
      { label: '9:30 AM', hour: 9, minute: 30 },
      { label: '10:00 AM', hour: 10, minute: 0 },
      { label: '10:30 AM', hour: 10, minute: 30 },
      { label: '11:00 AM', hour: 11, minute: 0 },
      { label: '11:30 AM', hour: 11, minute: 30 },
      { label: '12:00 PM', hour: 12, minute: 0 },
      { label: '12:30 PM', hour: 12, minute: 30 },
      { label: '1:00 PM', hour: 13, minute: 0 },
      { label: '1:30 PM', hour: 13, minute: 30 },
      { label: '2:00 PM', hour: 14, minute: 0 },
      { label: '2:30 PM', hour: 14, minute: 30 },
      { label: '3:00 PM', hour: 15, minute: 0 },
      { label: '3:30 PM', hour: 15, minute: 30 },
      { label: '4:00 PM', hour: 16, minute: 0 },
      { label: '4:30 PM', hour: 16, minute: 30 },
      { label: '5:00 PM', hour: 17, minute: 0 },
    ];

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    return slots.filter((slot) => {
      if (slot.label === 'Ahora') return true;
      if (currentHour > slot.hour) return false;
      if (currentHour === slot.hour && currentMinute > slot.minute) return false;
      return true;
    });
  };
  const [selectedCustomizations, setSelectedCustomizations] = useState<string[]>([]);
  const [excludedIngredients, setExcludedIngredients] = useState<string[]>([]);
  const [selectedPolloPiece, setSelectedPolloPiece] = useState<'Muslo' | 'Pierna' | ''>('');

  // Layout customizer states
  const [dobleTortilla, setDobleTortilla] = useState<boolean>(false);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedFlavor, setSelectedFlavor] = useState<string>('');
  const [withMilk, setWithMilk] = useState<boolean>(false);
  const [customOptions, setCustomOptions] = useState<string[]>([]);
  const [selectedFruits, setSelectedFruits] = useState<string[]>([]);
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const [tacoQuantities, setTacoQuantities] = useState<Record<string, number>>({});
  const [tortillasQty, setTortillasQty] = useState<number>(6);
  const [excludedDefaults, setExcludedDefaults] = useState<string[]>([]);
  const [sinAzucar, setSinAzucar] = useState<boolean>(false);
  const [sugarSpoons, setSugarSpoons] = useState<number>(0);

  // Find Client credit profile from global clients list
  const clientCreditProfile = activeClient 
    ? clients.find(c => c.id === activeClient.id || (c.phone !== 'Sin teléfono' && c.phone === activeClient.phone))
    : null;

  useEffect(() => {
    // El método de pago siempre inicia con 'Pendiente' (Pagar en sucursal) por defecto
    setPaymentMethod('Pendiente');
  }, [clientCreditProfile]);

  // Desplazar automáticamente al inicio al cambiar de pestaña
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeClientTab]);

  // Filter products for the menu (noDisponibleHoy === false && oculto === false)
  // Also order them by the 'orden' field
  const menuProducts = products
    .filter(p => !p.noDisponibleHoy && !p.oculto && p.active !== false && !p.agotado)
    .sort((a, b) => (a.orden || 0) - (b.orden || 0));

  // --- ACTIONS ---
  
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phoneInput.trim();
    const found = clientAccounts.find(c => c.phone === cleanPhone && c.password === passwordInput);
    if (found) {
      setActiveClient(found);
      alert(`¡Bienvenido de nuevo, ${found.name}!`);
      // Clean form
      setPhoneInput('');
      setPasswordInput('');
    } else {
      alert('Número telefónico o contraseña incorrectos.');
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regPhone || !regPassword || !regConfirmPassword) {
      alert('Por favor llena todos los campos.');
      return;
    }
    const cleanPhone = regPhone.trim();
    if (!/^\d{10}$/.test(cleanPhone)) {
      alert('Por favor ingresa un número de teléfono válido a 10 dígitos.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      alert('Las contraseñas no coinciden.');
      return;
    }
    if (regPassword.length < 6) {
      alert('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    
    const exists = clientAccounts.some(c => c.phone === cleanPhone);
    if (exists) {
      alert('Ya existe una cuenta asociada a este número de teléfono.');
      setRecoveryPhone(cleanPhone);
      setRecoveryStep('phone');
      setShowForgotPassword(true);
      setIsRegistering(false);
      return;
    }

    // Generate WhatsApp verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    registrationExecuted.current = false; // reset guard for new verification session
    setVerificationCode(code);
    setVerificationAction('register');
    setVerificationInput('');
    setIsVerifyingWhatsApp(true);
    
    // Simulate WhatsApp message
    setTimeout(() => {
      alert(`[WhatsApp SIMULADO] Rinconcito Frutal: Tu código de verificación para crear tu cuenta es: ${code}`);
    }, 400);
  };

  const executeWhatsAppRegistration = () => {
    // Guard: ensure this runs exactly once per verification session
    if (registrationExecuted.current) return;
    registrationExecuted.current = true;
    const clientId = `CRED-${regPhone}`;
    const newAccount: ClientAccount = {
      id: clientId,
      name: regName,
      phone: regPhone,
      password: regPassword,
      defaultStore: regStore,
      notificationPrefs: {
        orderStatus: true,
        menuDelDia: true,
        cupones: true,
        promociones: false
      },
      notificationsPromptShown: false
    };

    // Register customer account
    setClientAccounts(prev => [...prev, newAccount]);

    // Also auto-create a credit / debt record so they have profile integration
    const newCreditProfile: ClientDebt = {
      id: clientId,
      name: regName,
      phone: regPhone,
      branch: regStore,
      balance: 0.00,
      daysOverdue: 0,
      lastMovement: 'Registro de cliente nuevo',
      pedidosPendientes: 0,
      status: 'Activa',
      history: [
        {
          id: `mov-init-${Date.now()}`,
          type: 'Inicial',
          label: 'Cuenta creada',
          date: new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }),
          amount: 0,
          statusLabel: 'SALDO INICIAL',
          notes: 'Registro inicial del usuario'
        }
      ]
    };
    onAddClient(newCreditProfile);

    // Auto-assign BIENVENIDA10 — upsert: remove any existing for this client, then add exactly one
    const welcomeCoupon: Coupon = {
      id: `cop-welcome-${clientId}`,
      code: 'BIENVENIDA10',
      type: 'porcentaje',
      value: 10,
      validUntil: '2026-12-31',
      clientId: clientId,
      used: false
    };
    setCoupons(prev => [
      ...prev.filter(c => !(c.code === 'BIENVENIDA10' && (c.clientId === clientId || c.clientId === regPhone))),
      welcomeCoupon
    ]);

    // Auto log-in
    setActiveClient(newAccount);
    alert(`¡Cuenta creada con éxito! Bienvenido, ${regName}.`);

    // Reset fields
    setRegName('');
    setRegPhone('');
    setRegPassword('');
    setRegConfirmPassword('');
    setIsVerifyingWhatsApp(false);
    setIsRegistering(false);
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = recoveryPhone.trim();
    if (!/^\d{10}$/.test(cleanPhone)) {
      alert('Por favor ingresa un número de teléfono válido a 10 dígitos.');
      return;
    }
    const exists = clientAccounts.some(c => c.phone === cleanPhone);
    if (!exists) {
      alert('No existe ninguna cuenta asociada a este número de teléfono.');
      return;
    }

    // Generate WhatsApp recovery code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setVerificationCode(code);
    setVerificationAction('recovery');
    setVerificationInput('');
    setIsVerifyingWhatsApp(true);
    setRecoveryStep('verify');

    setTimeout(() => {
      alert(`[WhatsApp SIMULADO] Rinconcito Frutal: Tu código para recuperar tu contraseña es: ${code}`);
    }, 400);
  };

  const executeWhatsAppRecovery = () => {
    if (verificationInput.trim() !== verificationCode) {
      alert('El código de verificación es incorrecto.');
      return;
    }
    setIsVerifyingWhatsApp(false);
    setRecoveryStep('new_password');
  };

  const handleResetPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempPasswordToSet || !confirmTempPassword) {
      alert('Por favor ingresa tu nueva contraseña.');
      return;
    }
    if (tempPasswordToSet !== confirmTempPassword) {
      alert('Las contraseñas no coinciden.');
      return;
    }
    if (tempPasswordToSet.length < 6) {
      alert('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    // Update password in global state
    setClientAccounts(prev => prev.map(c => 
      c.phone === recoveryPhone ? { ...c, password: tempPasswordToSet } : c
    ));

    alert('Tu contraseña se ha restablecido exitosamente.');
    
    // Reset recovery flow
    setRecoveryPhone('');
    setTempPasswordToSet('');
    setConfirmTempPassword('');
    setRecoveryStep('phone');
    setShowForgotPassword(false);
  };

  const handleToggleNotifPref = (key: keyof NotificationPreferences, value: boolean) => {
    if (!activeClient) return;
    const currentPrefs = activeClient.notificationPrefs || {
      orderStatus: true,
      menuDelDia: true,
      cupones: true,
      promociones: false
    };
    const updatedPrefs = { ...currentPrefs, [key]: value };
    const updatedAccount: ClientAccount = {
      ...activeClient,
      notificationPrefs: updatedPrefs
    };
    setActiveClient(updatedAccount);
    setClientAccounts(prev => prev.map(c => c.phone === activeClient.phone ? updatedAccount : c));
  };

  const handleLogout = () => {
    setActiveClient(null);
    setClientCart([]);
    setAppliedCoupon(null);
    setSelectedCouponCode('');
    setShowLogoutConfirm(false);
  };

  const handleDeleteAccount = () => {
    if (!activeClient) return;
    
    // Check if customer has unpaid credits / balance
    if (clientCreditProfile && clientCreditProfile.balance > 0) {
      alert(`No puedes eliminar tu cuenta porque tienes un saldo pendiente de $${clientCreditProfile.balance.toFixed(2)}. Acude a caja para liquidar tu crédito.`);
      return;
    }

    if (confirm('¿Estás completamente seguro de eliminar tu cuenta? Esta acción es irreversible.')) {
      setClientAccounts(prev => prev.filter(c => c.phone !== activeClient.phone));
      setActiveClient(null);
      alert('Tu cuenta ha sido eliminada permanentemente.');
    }
  };

  // Helper functions for customizations
  const getProductIngredients = (item: Product): string[] => {
    const list: string[] = [];
    if (item.ingredients) list.push(...item.ingredients);
    if (item.baseIngredients) list.push(...item.baseIngredients);
    if (item.removableIngredients) list.push(...item.removableIngredients);
    return Array.from(new Set(list));
  };

  const productHasCustomization = (item: Product) => {
    const isPollo = item.layout3AllowPolloPiece || item.name.toLowerCase().includes('pollo') || (item.description && item.description.toLowerCase().includes('pollo'));
    if (isPollo) return true;

    if (item.productLayout) {
      return item.productLayout !== 'layout_1_simple';
    }
    if (item.productType === 'simple') return false;
    if (item.productType && item.productType !== 'custom') return true;
    if (item.tieneVariantes) return true;
    if (item.variants && item.variants.length > 0) return true;
    if (item.ingredients && item.ingredients.length > 0) return true;
    if (item.baseIngredients && item.baseIngredients.length > 0) return true;
    if (item.extraIngredients && item.extraIngredients.length > 0) return true;
    if (item.removableIngredients && item.removableIngredients.length > 0) return true;
    if (item.customizationOptions && item.customizationOptions.length > 0) return true;
    return false;
  };

  // Pricing calculator helper for ClientPanel layout options
  const getClientBasePrice = () => {
    if (!selectedProductForVariants) return 0;
    const item = selectedProductForVariants;

    if (item.productLayout) {
      switch (item.productLayout) {
        case 'layout_1_simple':
          return item.price;

        case 'layout_2_cantidades': {
          let totalQty = 0;
          let sum = 0;
          item.layout2Options?.forEach(opt => {
            const qty = tacoQuantities[opt.name] || 0;
            if (qty > 0 && opt.active !== false) {
              sum += qty * opt.price;
              totalQty += qty;
            }
          });
          item.layout2Extras?.forEach(ext => {
            if (selectedExtras.includes(ext.name) && ext.active !== false) {
              const isDobleTortilla = ext.name.toLowerCase().includes('doble tortilla');
              const extPrice = isDobleTortilla && ext.price === 0 ? 1.00 : ext.price;
              const isPerPiece = isDobleTortilla ? true : ext.perPiece;
              if (isPerPiece) {
                sum += totalQty * extPrice;
              } else {
                sum += extPrice;
              }
            }
          });
          return sum;
        }

        case 'layout_3_platillo': {
          let price = item.price;
          const prep = item.layout3Preps?.find(p => p.name === selectedFlavor);
          if (prep && prep.active !== false) {
            price += prep.priceDiff || 0;
          }
          const extraTortillas = Math.max(0, tortillasQty - 6);
          price += extraTortillas * 1;
          return price;
        }

        case 'layout_4_huevos': {
          let price = item.price;
          const extraTortillas = Math.max(0, tortillasQty - 6);
          price += extraTortillas * 1;
          return price;
        }

        case 'layout_5_frutas': {
          const pres = item.layout5Presentations?.find(p => p.name === selectedSize);
          let price = pres ? pres.price : item.price;
          item.layout5Extras?.forEach(ext => {
            if (selectedExtras.includes(ext.name) && ext.active !== false) {
              price += ext.price;
            }
          });
          return price;
        }

        case 'layout_6_proteina': {
          let basePrice = item.price;
          if (item.layoutAllowPresentation && item.layoutPresentations && item.layoutPresentations.length > 0) {
            const pres = item.layoutPresentations.find(p => p.name === selectedSize) || item.layoutPresentations[0];
            basePrice = pres.price;
          } else {
            const prot = item.layout6Proteins?.find(p => p.name === selectedFlavor);
            if (prot) basePrice = prot.price;
          }
          let price = basePrice;
          item.layout6Extras?.forEach(ext => {
            if (selectedExtras.includes(ext.name) && ext.active !== false) {
              price += ext.price;
            }
          });
          return price;
        }

        case 'layout_7_calientes': {
          const sz = item.layout7Sizes?.find(s => s.name === selectedSize);
          let price = sz ? sz.price : item.price;
          if (item.layout7AllowMilk && withMilk) {
            price += item.layout7MilkPrice || 0;
          }
          return price;
        }

        case 'layout_8_aguas': {
          const sz = item.layout8Sizes?.find(s => s.name === selectedSize);
          let price = sz ? sz.price : item.price;
          return price;
        }

        case 'layout_9_jugos': {
          const sz = item.layout9Sizes?.find(s => s.name === selectedSize);
          let price = sz ? sz.price : item.price;
          return price;
        }
      }
    }

    let basePrice = item.price;
    if (selectedVariant) {
      const match = selectedVariant.match(/\(\$([0-9.]+)\)/);
      if (match) {
        basePrice = parseFloat(match[1]);
      }
    }
    return basePrice;
  };

  const getCurrentClientCalculatedPrice = () => {
    if (!selectedProductForVariants) return 0;
    const item = selectedProductForVariants;
    let base = getClientBasePrice();
    let extra = 0;
    if (item.extraIngredients && item.extraIngredients.length > 0) {
      item.extraIngredients.forEach(ext => {
        if (selectedExtras.includes(ext.name)) {
          extra += ext.price;
        }
      });
    }
    return base + extra;
  };

  const shouldNotRound = (product: Product) => {
    if (!product) return false;
    return product.applyRounding === false;
  };

  // Cart operations
  const addToCart = (product: Product) => {
    if (isStoreClosed) {
      alert('La tienda está cerrada. No se pueden realizar pedidos.');
      return;
    }

    if (product.agotado || product.active === false) {
      alert('Este producto está agotado por el momento.');
      return;
    }

    const hasCustomization = productHasCustomization(product);

    if (hasCustomization) {
      setSelectedSize('');
      setSelectedFlavor('');
      setSelectedVariant('');
      setSelectedCustomizations([]);
      setExcludedIngredients([]);
      setDobleTortilla(false);
      setWithMilk(false);
      setCustomOptions([]);
      setSelectedFruits([]);
      setSelectedExtras([]);
      setTacoQuantities({});
      setTortillasQty(6);
      setExcludedDefaults([]);
      setSinAzucar(false);
      if (product.layout7AllowSugar) {
        setSugarSpoons(2);
      } else {
        setSugarSpoons(0);
      }
      setSelectedPolloPiece('');

      setSelectedProductForVariants(product);

      // Initialize layout-specific states
      if (product.productLayout === 'layout_2_cantidades') {
        const initialTacoQuantities: Record<string, number> = {};
        product.layout2Options?.forEach(o => {
          initialTacoQuantities[o.name] = 0;
        });
        setTacoQuantities(initialTacoQuantities);
        setSelectedExtras([]);
      } else if (product.productLayout === 'layout_3_platillo') {
        setSelectedFlavor(product.layout3Preps?.[0]?.name || '');
        setExcludedDefaults([]);
        setTortillasQty(6);
      } else if (product.productLayout === 'layout_4_huevos') {
        setSelectedFlavor(product.layout4Preps?.[0]?.name || '');
        setExcludedDefaults([]);
        setTortillasQty(6); // Default 6 tortillas included
      } else if (product.productLayout === 'layout_5_frutas') {
        setSelectedSize(product.layout5Presentations?.[0]?.name || '');
        setSelectedFruits([]);
        setSelectedExtras([]);
      } else if (product.productLayout === 'layout_6_proteina') {
        setSelectedFlavor(product.layout6Proteins?.[0]?.name || '');
        setExcludedDefaults([]);
        setSelectedExtras([]);
        if (product.layoutAllowPresentation && product.layoutPresentations && product.layoutPresentations.length > 0) {
          setSelectedSize(product.layoutPresentations[0].name);
        } else {
          setSelectedSize('');
        }
      } else if (product.productLayout === 'layout_7_calientes') {
        setSelectedSize(product.layout7Sizes?.[0]?.name || '');
        setWithMilk(false);
        setCustomOptions([]);
        setSelectedFlavor(product.customizationOptions?.[0] || ''); // Initialize tea flavor
      } else if (product.productLayout === 'layout_8_aguas') {
        setSelectedSize(product.layout8Sizes?.[0]?.name || '');
        setSelectedFlavor(product.layout8Flavors?.filter(f => f.active)?.[0]?.name || '');
      } else if (product.productLayout === 'layout_9_jugos') {
        setSelectedSize(product.layout9Sizes?.[0]?.name || '');
        setSelectedFlavor(product.layout9Flavors?.filter(f => f.active)?.[0]?.name || '');
        setCustomOptions([]);
      }

      // Initialize presentation for legacy tortas/sandwiches
      const pId = product.id.toLowerCase();
      const pName = product.name.toLowerCase();
      const isTorta = pId.includes('torta') || pName.includes('torta');
      const isSandwich = pId.includes('sand') || pName.includes('sándwich') || pName.includes('sandwich');
      if (isTorta) {
        const showPres = product.layoutAllowPresentation ?? false;
        const presentations = product.layoutPresentations && product.layoutPresentations.length > 0 
          ? product.layoutPresentations 
          : [{ name: 'Sencillo', price: 40 }, { name: 'Doble', price: 55 }];
        setSelectedSize(showPres ? presentations[0].name : '');
      } else if (isSandwich) {
        const presentations = product.layoutPresentations && product.layoutPresentations.length > 0 
          ? product.layoutPresentations 
          : [{ name: 'Sencillo', price: 30 }, { name: 'Doble', price: 45 }];
        setSelectedSize(presentations[0].name);
      }

      // Initialize chicken piece selector
      const isChicken = product.layout3AllowPolloPiece || product.name.toLowerCase().includes('pollo') || (product.description && product.description.toLowerCase().includes('pollo'));
      if (isChicken) {
        if (polloStatus?.muslo) {
          setSelectedPolloPiece('Muslo');
        } else if (polloStatus?.pierna) {
          setSelectedPolloPiece('Pierna');
        } else {
          setSelectedPolloPiece('');
        }
      } else {
        setSelectedPolloPiece('');
      }

      return;
    }

    // Direct addition - non-mutant map update
    setClientCart(prev => {
      const existingIdx = prev.findIndex(item => item.product.id === product.id && item.customizations.length === 0);
      if (existingIdx > -1) {
        return prev.map((item, idx) => {
          if (idx === existingIdx) {
            const nextQty = item.quantity + 1;
            const rawSub = nextQty * product.price;
            const finalSub = shouldNotRound(product) ? rawSub : Math.ceil(rawSub / 5) * 5;
            return {
              ...item,
              quantity: nextQty,
              subtotal: finalSub
            };
          }
          return item;
        });
      }
      const finalSub = shouldNotRound(product) ? product.price : Math.ceil(product.price / 5) * 5;
      return [...prev, {
        product,
        quantity: 1,
        customizations: [],
        subtotal: finalSub
      }];
    });

    alert(`Se agregó "${product.name}" al pedido.`);
  };

  const confirmVariantAddition = () => {
    if (!selectedProductForVariants) return;
    const item = selectedProductForVariants;

    if (item.productLayout) {
      let derivedName = item.name;
      let detailsList: string[] = [];
      const calculatedPrice = getCurrentClientCalculatedPrice();

      switch (item.productLayout) {
        case 'layout_2_cantidades': {
          const ops: string[] = [];
          item.layout2Options?.forEach(opt => {
            const qty = tacoQuantities[opt.name] || 0;
            if (qty > 0 && opt.active !== false) {
              ops.push(`${qty} ${opt.name}`);
            }
          });
          if (ops.length > 0) {
            detailsList.push(ops.join(', '));
          }
          item.layout2Extras?.forEach(ext => {
            if (selectedExtras.includes(ext.name) && ext.active !== false) {
              detailsList.push(`Con ${ext.name}`);
            }
          });
          break;
        }

        case 'layout_3_platillo': {
          detailsList.push(`Prep: ${selectedFlavor}`);
          const removed = (item.layout3Removables || []).filter(r => excludedDefaults.includes(r.name)).map(r => r.name);
          if (removed && removed.length > 0) {
            detailsList.push(`Sin: ${removed.join(', ')}`);
          }
          if (tortillasQty !== 6) {
            detailsList.push(`${tortillasQty} Tortillas`);
          }
          break;
        }

        case 'layout_4_huevos': {
          detailsList.push(`Prep: ${selectedFlavor}`);
          const removed = (item.layout4Removables || []).filter(r => excludedDefaults.includes(r.name)).map(r => r.name);
          if (removed && removed.length > 0) {
            detailsList.push(`Sin: ${removed.join(', ')}`);
          }
          if (tortillasQty > 0) {
            detailsList.push(`+${tortillasQty} Tortillas`);
          }
          break;
        }

        case 'layout_5_frutas': {
          derivedName = `${item.name} (${selectedSize})`;
          const activeFruits = selectedFruits.filter(f => {
            const fConfig = item.layout5Fruits?.find(x => x.name === f);
            return fConfig && fConfig.active !== false;
          });
          detailsList.push(`Frutas: ${activeFruits.join(', ') || 'Surtidas'}`);
          const activeExtras = selectedExtras.filter(e => {
            const eConfig = item.layout5Extras?.find(x => x.name === e);
            return eConfig && eConfig.active !== false;
          });
          if (activeExtras.length > 0) {
            detailsList.push(`Extras: ${activeExtras.join(', ')}`);
          }
          break;
        }

        case 'layout_6_proteina': {
          derivedName = item.layoutAllowPresentation && selectedSize
            ? `${item.name} ${selectedSize} (${selectedFlavor})`
            : `${item.name} (${selectedFlavor})`;
          
          const removed = item.layout6Removables?.filter(r => excludedDefaults.includes(r.name)).map(r => r.name);
          if (removed && removed.length > 0) {
            removed.forEach(r => detailsList.push(`Sin ${r.toLowerCase()}`));
          }
          const activeExtras = selectedExtras.filter(e => {
            const eConfig = item.layout6Extras?.find(x => x.name === e);
            return eConfig && eConfig.active !== false;
          });
          if (activeExtras.length > 0) {
            activeExtras.forEach(e => detailsList.push(e));
          }
          break;
        }

        case 'layout_7_calientes': {
          derivedName = selectedFlavor
            ? `${item.name} de ${selectedFlavor} (${selectedSize})`
            : `${item.name} (${selectedSize})`;
          if (item.layout7AllowMilk && withMilk) {
            detailsList.push('Con Leche');
          }
          if (item.layout7AllowSugar) {
            if (sinAzucar) {
              detailsList.push('Sin azúcar');
            } else if (sugarSpoons > 0) {
              detailsList.push(`${sugarSpoons} Cda(s) de Azúcar`);
            }
          }
          break;
        }

        case 'layout_8_aguas': {
          derivedName = `${item.name} de ${selectedFlavor} (${selectedSize})`;
          break;
        }

        case 'layout_9_jugos': {
          derivedName = `${item.name} de ${selectedFlavor} (${selectedSize})`;
          const activeModifiers = customOptions.filter(o => {
            const oConfig = item.layout9Modifiers?.find(x => x.name === o);
            return oConfig && oConfig.active !== false;
          });
          if (activeModifiers.length > 0) {
            detailsList.push(activeModifiers.join(', '));
          }
          break;
        }
      }

      if (excludedIngredients.length > 0) {
        excludedIngredients.forEach(exc => detailsList.push(`Sin ${exc.toLowerCase()}`));
      }
      if (selectedExtras.length > 0) {
        selectedExtras.forEach(e => detailsList.push(e));
      }

      const isPollo = item.layout3AllowPolloPiece || item.name.toLowerCase().includes('pollo') || (item.description && item.description.toLowerCase().includes('pollo'));
      if (isPollo && selectedPolloPiece) {
        detailsList.push(`Pieza: ${selectedPolloPiece}`);
      }

      const finalPrice = shouldNotRound(item) ? calculatedPrice : Math.ceil(calculatedPrice / 5) * 5;

      const compiledProduct: Product = {
        id: item.id,
        name: derivedName,
        category: item.category,
        price: finalPrice,
        image: item.image,
        active: true,
        description: detailsList.join(' | ') || item.description
      };

      const rawSubtotal = calculatedPrice;
      const finalSubtotal = finalPrice;

      setClientCart(prev => [...prev, {
        product: compiledProduct,
        quantity: 1,
        customizations: detailsList,
        subtotal: finalSubtotal
      }]);

      alert(`Se agregó "${compiledProduct.name}" al pedido.`);
      setSelectedProductForVariants(null);
      return;
    }

    // Legacy fallback addition
    const isPollo = item.layout3AllowPolloPiece || item.name.toLowerCase().includes('pollo') || (item.description && item.description.toLowerCase().includes('pollo'));
    const customizationsStr = [...selectedCustomizations];
    if (selectedVariant) {
      customizationsStr.unshift(selectedVariant);
    }
    if (isPollo && selectedPolloPiece) {
      customizationsStr.push(`Pieza: ${selectedPolloPiece}`);
    }
    if (excludedIngredients.length > 0) {
      customizationsStr.push(`Sin: ${excludedIngredients.join(', ')}`);
    }

    const compiledProduct: Product = {
      ...selectedProductForVariants,
      price: calculatedPrice
    };

    const rawSubtotal = calculatedPrice;
    const finalSubtotal = rawSubtotal;

    setClientCart(prev => {
      return [...prev, {
        product: compiledProduct,
        quantity: 1,
        customizations: customizationsStr,
        subtotal: finalSubtotal
      }];
    });

    alert(`Se agregó "${selectedProductForVariants.name}" al pedido.`);
    setSelectedProductForVariants(null);
  };

  const handleCustomizationToggle = (opt: string) => {
    setSelectedCustomizations(prev => 
      prev.includes(opt) ? prev.filter(o => o !== opt) : [...prev, opt]
    );
  };

  const updateCartQuantity = (index: number, change: number) => {
    setClientCart(prev => {
      const updated = prev.map((item, idx) => {
        if (idx === index) {
          const nextQty = item.quantity + change;
          const rawSub = nextQty * item.product.price;
          return {
            ...item,
            quantity: nextQty,
            subtotal: rawSub
          };
        }
        return item;
      });
      return updated.filter(item => item.quantity > 0);
    });
  };

  const applyCoupon = () => {
    if (!selectedCouponCode) return;
    const found = coupons.find(c => 
      c.code.toUpperCase() === selectedCouponCode.toUpperCase() && 
      !c.used && 
      (c.clientId === 'all_clients' || c.clientId === activeClient?.id)
    );

    if (found) {
      setAppliedCoupon(found);
      alert('¡Cupón aplicado correctamente!');
    } else {
      alert('El cupón es inválido, ya fue utilizado o expiró.');
      setAppliedCoupon(null);
    }
  };

  const handleViewCart = () => {
    setActiveClientTab('menu');
    setTimeout(() => {
      const cartElement = document.getElementById('client-cart-section');
      if (cartElement) {
        cartElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  const cartSubtotal = clientCart.reduce((sum, item) => sum + item.subtotal, 0);
  
  const couponDiscount = appliedCoupon
    ? (appliedCoupon.type === 'porcentaje' 
        ? (cartSubtotal * appliedCoupon.value) / 100 
        : appliedCoupon.value)
    : 0;

  const cartTotal = Math.max(0, cartSubtotal - couponDiscount);

  const handleCheckoutSubmit = async () => {
    if (clientCart.length === 0) return;
    if (!activeClient) return;

    const isCredit = paymentMethod === 'Crédito' && clientCreditProfile && !['Cerrada', 'Archivada', 'Eliminada'].includes(clientCreditProfile.status);

    const newOrder: Order = {
      id: `#CLI-${Math.floor(10000 + Math.random() * 90000)}`,
      items: clientCart,
      subtotal: cartSubtotal,
      discount: couponDiscount,
      total: cartTotal,
      status: 'Pendiente',
      paymentStatus: isCredit ? 'Crédito' : 'Pendiente',
      clientName: activeClient.name,
      clientId: activeClient.id, // Corrección: Usar ID real ('CRED-...') que existe en la tabla clientes
      timestamp: new Date().toISOString(),
      notes: `Tienda: ${activeClient.defaultStore} | Canales: Portal Cliente`,
      deliveryTime: horaEntrega
    };

    try {
      await onAddOrder(newOrder);

      // If coupon was applied, mark it as used
      if (appliedCoupon) {
        setCoupons(prev => prev.map(c => c.id === appliedCoupon.id ? { ...c, used: true } : c));
      }

      setClientCart([]);
      setAppliedCoupon(null);
      setSelectedCouponCode('');
      setPaymentMethod('Pendiente');
      setActiveClientTab('pedidos');
      alert(`¡Pedido ${newOrder.id} enviado exitosamente! Puedes revisar el estado en tiempo real.`);
    } catch (err: any) {
      alert(`Hubo un error al enviar tu pedido: ${err.message || 'La base de datos rechazó la operación.'}`);
    }
  };

  // Client Orders list (including direct client orders, POS credit orders, and matching name orders)
  const clientOrders = orders.filter(o => 
    o.clientId === activeClient?.phone || 
    o.clientId === activeClient?.id ||
    (clientCreditProfile && (o.clientId === clientCreditProfile.id || o.clientId === clientCreditProfile.phone)) ||
    (activeClient && o.clientName?.toLowerCase().includes(activeClient.name.toLowerCase()))
  );

  // --- RENDERING ---

  // Auth Layout (Login / Register)
  if (!activeClient) {
    return (
      <div className="min-h-screen bg-orange-50 dark:bg-slate-900 flex flex-col justify-center items-center p-4 transition-colors font-sans text-slate-800 dark:text-slate-100">
        
        {/* Floating exit */}
        <button 
          onClick={onExit}
          className="absolute top-4 left-4 bg-white dark:bg-slate-800 hover:bg-neutral-100 text-gray-700 dark:text-gray-250 p-2.5 rounded-full shadow-md border cursor-pointer flex items-center justify-center gap-1.5 transition text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver a Panel Operativo</span>
        </button>

        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-200 dark:border-slate-700 shadow-2xl p-6 sm:p-8 max-w-md w-full text-center space-y-6">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="h-16 w-16 mx-auto object-cover rounded-2xl shadow-md" />
          ) : (
            <div className="h-16 w-16 bg-[#904d00]/10 text-[#904d00] flex justify-center items-center rounded-2xl mx-auto font-black text-2xl">
              🍊
            </div>
          )}

          <div className="space-y-1">
            <h1 className="text-2xl font-black text-[#904d00] dark:text-amber-500 tracking-tight">Rinconcito Frutal</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">Accede a tu cuenta o regístrate.</p>
          </div>

          {!isRegistering ? (
            /* LOGIN FORM */
            <form onSubmit={handleLoginSubmit} className="space-y-4 text-left">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-gray-500 tracking-wider">Número Telefónico:</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                    type="tel" 
                    required
                    placeholder="Número a 10 dígitos"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 pl-10 pr-4 py-2.5 rounded-xl text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none font-semibold text-gray-800 dark:text-gray-150"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black uppercase text-gray-500 tracking-wider">Contraseña:</label>
                  <button 
                    type="button" 
                    onClick={() => {
                      setRecoveryPhone('');
                      setRecoveryStep('phone');
                      setShowForgotPassword(true);
                    }}
                    className="text-[10.5px] font-bold text-amber-700 hover:underline cursor-pointer"
                  >
                    ¿La olvidaste?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                    type="password" 
                    required
                    placeholder="Contraseña"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 pl-10 pr-4 py-2.5 rounded-xl text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none text-gray-800 dark:text-gray-150"
                  />
                </div>
              </div>

              <button 
                type="submit"
                className="w-full bg-[#904d00] hover:bg-amber-900 text-white font-bold py-3 px-4 rounded-xl text-xs shadow-md transition-all mt-6 cursor-pointer"
              >
                Iniciar Sesión
              </button>

              <div className="text-center pt-2">
                <span className="text-xs text-gray-500">¿No tienes una cuenta? </span>
                <button 
                  type="button" 
                  onClick={() => setIsRegistering(true)}
                  className="text-xs font-black text-amber-800 hover:underline cursor-pointer"
                >
                  Regístrate aquí
                </button>
              </div>
            </form>
          ) : (
            /* REGISTER FORM */
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5 text-left max-h-[50vh] overflow-y-auto pr-1">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-500 tracking-wider">Nombre:</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                    type="text" 
                    required
                    placeholder="Tu nombre"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 pl-10 pr-4 py-2.5 rounded-xl text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none text-gray-800 dark:text-gray-150"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-gray-500 tracking-wider">Teléfono:</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="tel" 
                      required
                      placeholder="Número a 10 dígitos"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value.replace(/\D/g, ''))}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 pl-10 pr-4 py-2.5 rounded-xl text-xs focus:outline-none text-gray-800 dark:text-gray-150"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-gray-500 tracking-wider">Tienda / Sucursal:</label>
                  <button
                    type="button"
                    onClick={() => setIsRegStoreModalOpen(true)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 pl-3 pr-3 py-2.5 rounded-xl text-xs flex justify-between items-center font-bold text-gray-850 dark:text-gray-200 cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5 min-w-0">
                      <Store className="w-4 h-4 text-gray-400 shrink-0" />
                      <span className="truncate">{formatStoreName(regStore) || 'Seleccionar sucursal...'}</span>
                    </span>
                    <span className="text-[10px] text-orange-600 font-black shrink-0 ml-1">Cambiar</span>
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-500 tracking-wider">Contraseña:</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                    type="password" 
                    required
                    placeholder="Mínimo 6 caracteres"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 pl-10 pr-4 py-2.5 rounded-xl text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none text-gray-800 dark:text-gray-150"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-500 tracking-wider">Confirmar Contraseña:</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                    type="password" 
                    required
                    placeholder="Confirma la contraseña"
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 pl-10 pr-4 py-2.5 rounded-xl text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none text-gray-800 dark:text-gray-150"
                  />
                </div>
              </div>

              <button 
                type="submit"
                className="w-full bg-[#006e0a] hover:bg-emerald-800 text-white font-bold py-3 px-4 rounded-xl text-xs shadow-md transition-all mt-4 cursor-pointer"
              >
                Crear Cuenta
              </button>

              <div className="text-center pt-2">
                <span className="text-xs text-gray-500">¿Ya tienes cuenta? </span>
                <button 
                  type="button" 
                  onClick={() => setIsRegistering(false)}
                  className="text-xs font-black text-amber-800 hover:underline cursor-pointer"
                >
                  Inicia Sesión
                </button>
              </div>
            </form>
          )}

        </div>

        {/* FORGOT PASSWORD MODAL (SIMULATED VIA WHATSAPP) */}
        {showForgotPassword && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-[100]">
            {recoveryStep === 'phone' && (
              <form onSubmit={handleForgotSubmit} className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-200 dark:border-slate-700 shadow-2xl p-6 max-w-sm w-full space-y-4">
                <h3 className="font-sans font-black text-sm text-[#904d00] dark:text-amber-500 flex items-center gap-1.5">
                  <Lock className="w-4 h-4" />
                  <span>Recuperación de Contraseña</span>
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Ingresa tu número telefónico registrado para enviarte un código de recuperación por WhatsApp.</p>
                
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-gray-500 tracking-wider">Número Telefónico:</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="tel" 
                      required
                      placeholder="Número a 10 dígitos"
                      value={recoveryPhone}
                      onChange={(e) => setRecoveryPhone(e.target.value.replace(/\D/g, ''))}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 pl-10 pr-4 py-2.5 rounded-xl text-xs focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button 
                    type="button" 
                    onClick={() => setShowForgotPassword(false)}
                    className="w-1/2 bg-white dark:bg-slate-700 border p-2 rounded-lg text-xs font-bold"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className="w-1/2 bg-amber-600 hover:bg-amber-700 text-white p-2 rounded-lg text-xs font-bold"
                  >
                    Enviar Código
                  </button>
                </div>
              </form>
            )}

            {recoveryStep === 'new_password' && (
              <form onSubmit={handleResetPasswordSubmit} className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-200 dark:border-slate-700 shadow-2xl p-6 max-w-sm w-full space-y-4">
                <h3 className="font-sans font-black text-sm text-emerald-700 dark:text-emerald-500 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Crear Nueva Contraseña</span>
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Verificación exitosa. Crea tu nueva contraseña de acceso.</p>
                
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-gray-500 tracking-wider">Nueva Contraseña:</label>
                  <input 
                    type="password" 
                    required
                    placeholder="Mínimo 6 caracteres"
                    value={tempPasswordToSet}
                    onChange={(e) => setTempPasswordToSet(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border p-2 rounded-lg text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-gray-500 tracking-wider">Confirmar Contraseña:</label>
                  <input 
                    type="password" 
                    required
                    placeholder="Confirma la contraseña"
                    value={confirmTempPassword}
                    onChange={(e) => setConfirmTempPassword(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border p-2 rounded-lg text-xs"
                  />
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button 
                    type="button" 
                    onClick={() => { setShowForgotPassword(false); setRecoveryStep('phone'); }}
                    className="w-1/2 bg-white dark:bg-slate-750 border p-2 rounded-lg text-xs font-bold"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className="w-1/2 bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded-lg text-xs font-bold"
                  >
                    Guardar
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Store Selector Modal */}
        <StoreSelectorModal
          isOpen={isRegStoreModalOpen}
          onClose={() => setIsRegStoreModalOpen(false)}
          stores={stores}
          selectedStoreName={regStore}
          onSelectStore={setRegStore}
          title="Selecciona tu Sucursal de Registro"
        />

        {/* WhatsApp Verification Modal */}
        {isVerifyingWhatsApp && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-[9999] text-gray-800 dark:text-gray-100">
            <div className="bg-white dark:bg-slate-900 border border-gray-250 dark:border-slate-800 rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden flex flex-col transform animate-in fade-in zoom-in-95 duration-200">
              {/* WhatsApp style header */}
              <div className="bg-[#075E54] text-white p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-xl">
                  💬
                </div>
                <div>
                  <h3 className="font-bold text-sm">Verificación de WhatsApp</h3>
                  <span className="text-[10px] text-emerald-100 font-mono">Código de seguridad enviado</span>
                </div>
              </div>

              <div className="p-5 space-y-4">
                {/* Simulated Chat Message Bubble */}
                <div className="bg-[#DCF8C6] dark:bg-emerald-950/20 text-gray-800 dark:text-gray-200 p-3 rounded-2xl rounded-tl-none border border-emerald-200/50 dark:border-emerald-900/30 text-xs shadow-xs leading-relaxed">
                  <p className="font-bold text-[10px] text-[#075E54] dark:text-emerald-400 mb-1">Rinconcito Frutal:</p>
                  <p>Tu código de seguridad para verificar tu número es: <strong className="font-mono text-sm tracking-wider text-black dark:text-white bg-white/60 dark:bg-black/40 px-2 py-0.5 rounded">{verificationCode}</strong></p>
                  <span className="text-[9px] text-gray-400 block text-right mt-1.5 font-mono">Hace 1 min • Enviado</span>
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider font-bold">Código de 6 dígitos:</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="Escribe el código"
                    value={verificationInput}
                    onChange={(e) => setVerificationInput(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-slate-50 dark:bg-slate-950/40 text-center font-mono text-lg font-black tracking-widest border border-gray-200 dark:border-slate-800 p-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsVerifyingWhatsApp(false)}
                    className="w-1/2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-gray-700 dark:text-gray-250 py-2.5 rounded-xl border border-gray-250 dark:border-slate-700 text-xs font-bold transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (verificationInput.trim() === verificationCode) {
                        if (verificationAction === 'register') {
                          executeWhatsAppRegistration();
                        } else {
                          executeWhatsAppRecovery();
                        }
                      } else {
                        alert('El código ingresado es incorrecto.');
                      }
                    }}
                    className="w-1/2 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl text-xs font-bold transition shadow-md cursor-pointer"
                  >
                    Verificar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    );
  }

  // --- CLIENT PORTAL MAIN VIEW ---
  return (
    <div className="min-h-screen bg-slate-55 dark:bg-slate-950 text-gray-900 dark:text-gray-100 flex flex-col font-sans transition-colors pb-20">
      
      {/* Client Header */}
      <header className="bg-white dark:bg-slate-900 sticky top-0 z-50 border-b border-gray-200 dark:border-slate-850 shadow-sm p-4 transition-colors">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="h-10 w-10 object-cover rounded-xl" />
            ) : (
              <span className="text-xl">🍊</span>
            )}
            <div>
              <h2 className="text-sm font-black text-[#904d00] dark:text-amber-500 leading-none">Rinconcito Frutal</h2>
              <span className="text-[10px] text-gray-400 font-mono">Portal de Cliente</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Refresh Button */}
            <button 
              onClick={() => window.location.reload()}
              className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-gray-700 dark:text-gray-250 flex items-center justify-center cursor-pointer hover:bg-slate-200"
              title="Refrescar aplicación"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>

            {/* Theme Toggle */}
            <button 
              onClick={toggleDarkMode}
              className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-xs flex items-center justify-center cursor-pointer hover:bg-slate-200"
            >
              {isDarkMode ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
      </header>

      {/* Main client container */}
      <main 
        className={`flex-grow max-w-4xl w-full mx-auto p-4 space-y-6 ${
          clientCart.length > 0 ? 'main-client-container-has-cart' : 'main-client-container-empty-cart'
        }`}
      >
        
        {/* Welcome message */}
        <div className="bg-gradient-to-r from-orange-500 to-amber-700 rounded-3xl p-5 text-white shadow-lg relative overflow-hidden flex items-center justify-between">
          <div className="space-y-1 relative z-10">
            <h1 className="text-xl sm:text-2xl font-black">¡Hola, {activeClient.name}!</h1>
            <p className="text-xs text-orange-50 font-medium">¿Qué se te antoja saborear hoy en tu sucursal {formatStoreName(activeClient.defaultStore)}?</p>
          </div>
          <div className="relative z-10 shrink-0">
            <AvatarUploader
              avatar={activeClient.avatar}
              avatarUrl={activeClient.avatarUrl}
              name={activeClient.name}
              size="lg"
              editable={false}
            />
          </div>
          <div className="absolute right-0 top-0 text-9xl opacity-5 pointer-events-none">🍊</div>
        </div>

        {/* Navigation tabs removed - using bottom navigation bar */}

        {/* --- TAB CONTENT: MENU & ORDERING --- */}
        {activeClientTab === 'menu' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Menu catalog */}
            <div className="lg:col-span-8 space-y-4">
              
              {/* Daily text banner */}
              {menuDelDia && (
                <div className="bg-amber-50 dark:bg-slate-900 border border-amber-200 dark:border-slate-800 p-4.5 rounded-2xl shadow-xs">
                  <h3 className="font-bold text-xs uppercase text-[#904d00] dark:text-amber-500 tracking-wider">Especiales de Hoy:</h3>
                  <p className="text-xs mt-1.5 leading-relaxed italic whitespace-pre-line text-gray-700 dark:text-gray-300">
                    {menuDelDia}
                  </p>
                </div>
              )}

              {isStoreClosed && (
                <div className="bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 p-4 rounded-2xl border border-red-200 text-xs font-bold">
                  ⚠️ Tienda Cerrada: Actualmente el POS está cerrado y no se admiten nuevos pedidos. Puedes navegar por el catálogo pero la compra está deshabilitada.
                </div>
              )}

              {/* Products Grid */}
              <div className="space-y-6">
                {['Bebidas frías', 'Bebidas calientes', 'Frutas', 'Comidas', 'Tortas y Sándwiches', 'Snacks', 'Licuados y Jugos', 'Comida y Snacks', 'Sabritas y Galletas', 'Otros'].map((cat) => {
                  const catProds = menuProducts.filter(p => p.category === cat);
                  if (catProds.length === 0) return null;

                  return (
                    <div key={cat} className="space-y-3">
                      <h3 className="font-black text-sm text-gray-900 dark:text-white border-b pb-1 flex items-center gap-2 capitalize">
                        <span className="w-1 h-3 bg-[#904d00] rounded"></span>
                        {cat}
                      </h3>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        {catProds.map(p => (
                          <div 
                            key={p.id} 
                            className={`bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-3 shadow-xs flex justify-between gap-3 group relative overflow-hidden transition-all hover:shadow-md ${
                              p.agotado ? 'opacity-80' : ''
                            }`}
                          >
                            <div className="flex-1 flex gap-3 items-start min-w-0">
                              {p.image && (
                                <img src={p.image} alt={p.name} className="w-14 h-14 object-cover rounded-xl border bg-slate-50 shrink-0" />
                              )}
                              <div className="space-y-0.5 min-w-0">
                                <h4 className="font-bold text-gray-900 dark:text-gray-100 text-xs sm:text-[13px] leading-tight line-clamp-1">
                                  {p.name}
                                </h4>
                                <p className="text-[10px] text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                                  {p.description || 'Sin ingredientes asignados.'}
                                </p>
                                <span className="text-xs font-black font-mono text-emerald-800 dark:text-emerald-400 block pt-1">
                                  ${p.price.toFixed(2)}
                                </span>
                              </div>
                            </div>

                            <div className="flex flex-col justify-end shrink-0">
                              {p.agotado ? (
                                <span className="text-[9px] bg-red-100 text-red-800 px-2.5 py-1 rounded-lg font-black uppercase text-center border border-red-200">
                                  AGOTADO
                                </span>
                              ) : (
                                <button
                                  onClick={() => addToCart(p)}
                                  disabled={isStoreClosed}
                                  className={`font-sans font-extrabold text-[11px] py-1.5 px-3.5 rounded-xl transition-all cursor-pointer shadow-xs border ${
                                    isStoreClosed
                                      ? 'bg-gray-100 text-gray-450 border-gray-200 cursor-not-allowed'
                                      : 'bg-orange-50 text-[#904d00] hover:bg-[#904d00] hover:text-white border-orange-200'
                                  }`}
                                >
                                  {p.tieneVariantes ? 'Configurar' : 'Agregar +'}
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>

            {/* Cart preview */}
            <div id="client-cart-section" className="lg:col-span-4 space-y-4">
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-slate-805 p-5 shadow-lg space-y-4 sticky top-24">
                <div className="flex items-center justify-between border-b pb-3 border-gray-150 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-[#904d00]" />
                    <span className="font-sans font-black text-gray-950 dark:text-white uppercase tracking-tight text-xs">MI PEDIDO</span>
                  </div>
                  <span className="text-[10px] bg-amber-100 text-amber-950 px-2 py-0.5 rounded-md font-black">
                    {clientCart.reduce((sum, i) => sum + i.quantity, 0)} Items
                  </span>
                </div>

                <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                  {clientCart.length === 0 ? (
                    <p className="text-center py-16 text-gray-400 text-xs">Tu pedido está vacío. Agrega delicias del menú de hoy.</p>
                  ) : (
                    clientCart.map((item, index) => (
                      <div key={index} className="bg-amber-50/10 dark:bg-slate-800/40 rounded-xl p-3 border border-amber-100/50 flex flex-col gap-1.5">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100 leading-tight">{item.product.name}</h4>
                            {item.customizations.length > 0 && (
                              <CustomizationsRenderer 
                                customizations={item.customizations}
                                listClassName="flex flex-col gap-0.5 mt-1 pl-1"
                                itemClassName="text-[9px] text-gray-500 font-mono italic flex items-start gap-1 leading-tight"
                                bulletClassName="text-gray-400 mt-[1px]"
                              />
                            )}
                          </div>
                          <button 
                            onClick={() => updateCartQuantity(index, -100)}
                            className="text-gray-400 hover:text-red-650 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="flex justify-between items-center pt-1 border-t border-dashed border-gray-200 dark:border-slate-700">
                          <span className="text-xs font-black font-mono text-emerald-700 dark:text-emerald-400">
                            ${item.subtotal.toFixed(2)}
                          </span>
                          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 rounded-md border p-0.5">
                            <button onClick={() => updateCartQuantity(index, -1)} className="w-4 h-4 text-xs font-black">-</button>
                            <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                            <button onClick={() => updateCartQuantity(index, 1)} className="w-4 h-4 text-xs font-black">+</button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {clientCart.length > 0 && (
                  <div className="space-y-3 pt-3 border-t border-gray-105 dark:border-slate-800 text-xs">
                    <div className="space-y-1">
                      <div className="flex justify-between text-gray-500 font-mono">
                        <span>Subtotal:</span>
                        <span>${cartSubtotal.toFixed(2)}</span>
                      </div>
                      
                      {/* Coupon Application */}
                      <div className="space-y-1.5 pt-1">
                        <label className="text-[9px] font-black text-gray-400 block uppercase">Aplicar Cupón de Descuento:</label>
                        <div className="flex gap-1.5">
                          <input 
                            type="text"
                            placeholder="Código de cupón"
                            value={selectedCouponCode}
                            onChange={(e) => setSelectedCouponCode(e.target.value.toUpperCase())}
                            className="bg-slate-50 dark:bg-slate-900 border p-1.5 rounded-lg flex-1 text-xs uppercase"
                          />
                          <button 
                            onClick={applyCoupon}
                            className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-3.5 py-1.5 rounded-lg text-xs"
                          >
                            Aplicar
                          </button>
                        </div>
                        {appliedCoupon && (
                          <div className="text-[10px] text-emerald-750 font-bold bg-emerald-50 dark:bg-emerald-950/20 p-1.5 rounded border border-emerald-100 flex justify-between items-center mt-1">
                            <span>🎟️ Descuento: -${couponDiscount.toFixed(2)} ({appliedCoupon.code})</span>
                            <button onClick={() => setAppliedCoupon(null)} className="text-rose-650 hover:underline">Quitar</button>
                          </div>
                        )}
                      </div>

                      {/* Payment Method Selector */}
                      {clientCreditProfile && (
                        <div className="space-y-1.5 pt-2.5 border-t border-gray-150 dark:border-slate-800">
                          <label className="text-[9px] font-black text-gray-400 block uppercase tracking-wider">
                            Método de Pago:
                          </label>
                          <div className="flex gap-1.5 bg-gray-105 dark:bg-slate-950 p-1 rounded-xl">
                            <button
                              type="button"
                              onClick={() => setPaymentMethod('Pendiente')}
                              className={`flex-1 py-1.5 rounded-lg text-center text-[10px] font-black transition-all ${
                                paymentMethod === 'Pendiente'
                                  ? 'bg-[#904d00] text-white shadow-sm'
                                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                              }`}
                            >
                              Pago en Sucursal
                            </button>
                            <button
                              type="button"
                              disabled={['Cerrada', 'Archivada', 'Eliminada'].includes(clientCreditProfile.status)}
                              onClick={() => setPaymentMethod('Crédito')}
                              className={`flex-1 py-1.5 rounded-lg text-center text-[10px] font-black transition-all ${
                                paymentMethod === 'Crédito'
                                  ? 'bg-emerald-750 text-white shadow-sm'
                                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                              }`}
                            >
                              Cargar a mi Crédito
                            </button>
                          </div>
                          {paymentMethod === 'Crédito' && (
                            <div className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400 text-[10px] p-2 rounded-lg border border-emerald-100/50 flex flex-col gap-0.5 mt-1 font-semibold leading-relaxed">
                              <span className="font-bold flex items-center gap-1">✓ Pagarás con tu Crédito Autorizado</span>
                              <span>Tu saldo deudor actual de ${clientCreditProfile.balance.toFixed(2)} se incrementará por ${cartTotal.toFixed(2)}.</span>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex justify-between font-black text-sm text-gray-900 dark:text-white border-t pt-2 border-dashed">
                        <span>Total Pedido:</span>
                        <span className="text-base font-mono text-emerald-800 dark:text-emerald-400">${cartTotal.toFixed(2)}</span>
                      </div>
                    </div>
                    
                    <div className="mb-4 bg-white/50 dark:bg-slate-800/50 p-2 rounded-xl border border-gray-150 dark:border-slate-700">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider block mb-1">
                        Programar Entrega:
                      </label>
                      <select 
                        value={horaEntrega}
                        onChange={(e) => setHoraEntrega(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 p-2 rounded-lg text-xs font-bold focus:ring-1 focus:ring-amber-500 focus:outline-none"
                      >
                        {getAvailableHours().map(slot => (
                          <option key={slot.label} value={slot.label}>
                            {slot.label === 'Ahora' ? 'Para Ahora' : slot.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      onClick={handleCheckoutSubmit}
                      className="w-full bg-[#006e0a] hover:bg-emerald-800 text-white font-black py-3 rounded-xl flex items-center justify-center gap-1.5 text-xs shadow cursor-pointer uppercase transition-all"
                    >
                      <span>Confirmar Pedido</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* --- TAB CONTENT: MY ORDERS --- */}
        {activeClientTab === 'pedidos' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border p-5 shadow-sm space-y-4">
            <div>
              <h3 className="font-sans font-black text-sm text-[#904d00] dark:text-amber-500">Mis Pedidos y Estados de Entrega</h3>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">Sigue tus pedidos activos en tiempo real o consulta tu historial.</p>
            </div>

            <div className="divide-y divide-gray-150 dark:divide-slate-800">
              {clientOrders.length === 0 ? (
                <div className="text-center py-16 text-gray-400 text-xs">Aún no has registrado pedidos con tu cuenta de cliente.</div>
              ) : (
                [...clientOrders]
                  .sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                  .map(order => (
                    <div key={order.id} className="py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div className="flex gap-3 items-start">
                        <AvatarUploader
                          avatar={activeClient.avatar}
                          avatarUrl={activeClient.avatarUrl}
                          name={activeClient.name}
                          size="sm"
                          editable={false}
                        />
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-mono text-xs font-black text-gray-800 dark:text-gray-250">
                              {order.id}
                            </span>
                            <span className="text-xs text-gray-500 font-mono">
                              {new Date(order.timestamp).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })}
                            </span>
                          </div>
                          <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                            {order.items.map(i => `${i.quantity}x ${i.product.name}`).join(', ')}
                          </p>
                          <div className="text-[10px] text-gray-400">
                            Total: <strong className="text-emerald-700 dark:text-emerald-400 font-mono">${order.total.toFixed(2)}</strong> ({order.paymentStatus === 'Pagado' ? 'Pagado' : 'Crédito'})
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-start sm:items-end gap-1 shrink-0">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase text-center border ${
                          order.status === 'Pendiente' ? 'bg-amber-100/70 text-amber-900 border-amber-200' :
                          order.status === 'En preparación' ? 'bg-blue-100/70 text-blue-900 border-blue-200 animate-pulse' :
                          order.status === 'Listo' ? 'bg-green-150 text-[#006e0a] border-green-250' :
                          order.status === 'Entregado' ? 'bg-slate-100 text-slate-700 border-slate-200' :
                          'bg-red-50 text-red-700 border-red-200'
                        }`}>
                          {order.status === 'Listo' ? '🛵 En camino / Listo' : order.status}
                        </span>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        )}

        {/* --- TAB CONTENT: DEBT / CREDIT --- */}
        {activeClientTab === 'creditos' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border p-5 shadow-sm space-y-6">
            
            {/* Balance Overview */}
            <div className="bg-[#fcf3f3] dark:bg-red-950/20 border border-red-200/50 p-5 rounded-2xl flex justify-between items-center">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase text-red-800 dark:text-red-400 tracking-wider">Mi Saldo Deudor Pendiente</span>
                <span className="text-2xl font-black font-mono text-red-950 dark:text-red-300 block">
                  ${clientCreditProfile ? clientCreditProfile.balance.toFixed(2) : '0.00'}
                </span>
                <span className="text-[10px] text-gray-500 dark:text-gray-400 block font-semibold">
                  Alineado con el sistema de créditos en tiempo real.
                </span>
              </div>
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center text-red-700">
                <CreditCard className="w-6 h-6" />
              </div>
            </div>

            {/* History movements */}
            <div className="space-y-4">
              <div>
                <h4 className="font-extrabold text-xs uppercase tracking-wider text-gray-500 font-mono">Historial de Cargos y Abonos</h4>
                <p className="text-[10px] text-gray-400 mt-0.5">Sigue el desglose detallado de tus abonos y compras a crédito.</p>
              </div>

              <div className="divide-y divide-gray-150 dark:divide-slate-800">
                {!clientCreditProfile || clientCreditProfile.history.length === 0 ? (
                  <p className="text-center py-10 text-xs text-gray-400">Aún no hay cargos ni abonos cargados en tu cuenta de crédito.</p>
                ) : (
                  clientCreditProfile.history.map(mov => (
                    <div key={mov.id} className="py-3 flex justify-between items-center text-xs">
                      <div>
                        <strong className="text-gray-900 dark:text-gray-150 block">{mov.label}</strong>
                        <span className="text-[10px] text-gray-400">{mov.date} • {mov.notes || 'Detalles'}</span>
                      </div>
                      <span className={`font-mono font-bold text-sm ${mov.amount > 0 ? 'text-[#bb171d]' : 'text-emerald-700'}`}>
                        {mov.amount > 0 ? '+' : ''}${mov.amount.toFixed(2)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        )}

        {/* --- TAB CONTENT: PROFILE / COUPONS --- */}
        {activeClientTab === 'perfil' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Account Settings */}
            <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-3xl border p-5 shadow-sm space-y-4">
              <h3 className="font-sans font-black text-sm text-[#904d00] dark:text-amber-500">Configuración de mi Cuenta</h3>
              
              <div className="flex flex-col items-center gap-2 pb-4 border-b border-gray-150 dark:border-slate-800">
                <AvatarUploader
                  avatar={activeClient.avatar}
                  avatarUrl={activeClient.avatarUrl}
                  name={activeClient.name}
                  size="xl"
                  editable={true}
                  onAvatarChange={(base64) => {
                    const updated = { ...activeClient, avatar: base64 || undefined };
                    setActiveClient(updated);
                    setClientAccounts(prev => prev.map(c => c.id === activeClient.id ? updated : c));
                  }}
                />
                <p className="text-[10px] text-gray-405 dark:text-slate-500 font-medium">
                  Toca la foto para tomar una fotografía o elegir desde tu galería
                </p>
              </div>
              
              <div className="space-y-3.5 text-xs">
                <div>
                  <span className="text-gray-400 font-bold block">Nombre:</span>
                  <span className="font-bold text-gray-900 dark:text-white text-[13px]">{activeClient.name}</span>
                </div>
                <div>
                  <span className="text-gray-400 font-bold block">Teléfono:</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-250 font-mono">{activeClient.phone}</span>
                </div>
                <div>
                  <span className="text-gray-400 font-bold block">Sucursal Predeterminada:</span>
                  <span className="font-bold text-[#904d00] dark:text-amber-500">{formatStoreName(activeClient.defaultStore)}</span>
                </div>

                {/* Preferencias de Notificaciones */}
                <div className="pt-4 border-t border-gray-150 dark:border-slate-800 space-y-3">
                  <h4 className="font-sans font-black text-xs text-[#904d00] dark:text-amber-500 flex items-center gap-1.5">
                    <Bell className="w-4 h-4 text-orange-600" />
                    <span>Preferencias de Notificaciones</span>
                  </h4>
                  <div className="space-y-2.5 text-[11px] font-semibold text-gray-700 dark:text-gray-300">
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={activeClient.notificationPrefs?.orderStatus ?? true}
                        onChange={(e) => handleToggleNotifPref('orderStatus', e.target.checked)}
                        className="rounded text-orange-600 focus:ring-orange-500 w-4 h-4 cursor-pointer"
                      />
                      <span>Estado de mis pedidos (Reparto y Entrega)</span>
                    </label>
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={activeClient.notificationPrefs?.menuDelDia ?? true}
                        onChange={(e) => handleToggleNotifPref('menuDelDia', e.target.checked)}
                        className="rounded text-orange-600 focus:ring-orange-500 w-4 h-4 cursor-pointer"
                      />
                      <span>Menú del día (8:30 AM)</span>
                    </label>
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={activeClient.notificationPrefs?.cupones ?? true}
                        onChange={(e) => handleToggleNotifPref('cupones', e.target.checked)}
                        className="rounded text-orange-600 focus:ring-orange-500 w-4 h-4 cursor-pointer"
                      />
                      <span>Cupones de descuento recibidos</span>
                    </label>
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={activeClient.notificationPrefs?.promociones ?? false}
                        onChange={(e) => handleToggleNotifPref('promociones', e.target.checked)}
                        className="rounded text-orange-600 focus:ring-orange-500 w-4 h-4 cursor-pointer"
                      />
                      <span>Promociones y novedades (Futuro)</span>
                    </label>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-150 dark:border-slate-800 flex flex-col gap-2">
                  {showLogoutConfirm ? (
                    <div className="bg-amber-50 dark:bg-slate-800 p-3 rounded-xl border border-amber-250 dark:border-slate-700 space-y-2">
                      <p className="text-[11px] font-bold text-amber-900 dark:text-amber-300">¿Estás seguro de que deseas cerrar sesión?</p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white py-1.5 rounded-lg font-bold text-[10px] cursor-pointer"
                        >
                          Sí, Salir
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowLogoutConfirm(false)}
                          className="flex-1 bg-white dark:bg-slate-750 text-gray-700 dark:text-gray-250 py-1.5 rounded-lg border border-gray-300 dark:border-slate-600 font-bold text-[10px] cursor-pointer"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button 
                      type="button"
                      onClick={() => setShowLogoutConfirm(true)}
                      className="w-full bg-orange-100 dark:bg-slate-750 text-orange-950 dark:text-orange-200 hover:bg-orange-200 dark:hover:bg-slate-700 py-2.5 rounded-xl border border-orange-200 dark:border-slate-600 text-xs font-bold transition shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Cerrar Sesión</span>
                    </button>
                  )}

                  <button 
                    onClick={handleDeleteAccount}
                    className="w-full bg-rose-50 text-rose-750 hover:bg-rose-100 hover:text-rose-900 py-2.5 rounded-xl border border-rose-200 text-xs font-bold transition shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Eliminar Cuenta Definitivamente</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Coupons list */}
            <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-3xl border p-5 shadow-sm space-y-4">
              <h3 className="font-sans font-black text-sm text-[#904d00] dark:text-amber-500">Mis Cupones Personales</h3>
              
              <div className="space-y-3.5">
                {coupons.filter(c => c.clientId === 'all_clients' || c.clientId === activeClient.id || c.clientId === activeClient.phone).length === 0 ? (
                  <p className="text-center py-10 text-xs text-gray-400">No tienes cupones de descuento activos o disponibles en este momento.</p>
                ) : (
                  coupons
                    .filter(c => c.clientId === 'all_clients' || c.clientId === activeClient.id || c.clientId === activeClient.phone)
                    .map(coupon => (
                      <div 
                        key={coupon.id} 
                        className={`border rounded-2xl p-3.5 relative overflow-hidden flex justify-between items-center transition-all ${
                          coupon.used 
                            ? 'bg-neutral-50 dark:bg-slate-800/40 border-neutral-200 dark:border-slate-850 opacity-60 text-gray-450' 
                            : 'bg-amber-50/50 dark:bg-amber-950/10 border-amber-200 dark:border-amber-900 text-amber-950 dark:text-amber-200 shadow-xs'
                        }`}
                      >
                        <div className="space-y-1">
                          <span className="font-sans font-black text-xs uppercase block tracking-wider font-mono">
                            🎟️ {coupon.code}
                          </span>
                          <span className="text-[10px] text-gray-500 dark:text-gray-400 block font-semibold">
                            Vigencia: {coupon.validUntil}
                          </span>
                          <span className="text-xs font-extrabold text-[#904d00] dark:text-amber-500 block">
                            Descuento: {coupon.type === 'porcentaje' ? `${coupon.value}%` : `$${coupon.value.toFixed(2)}`}
                          </span>
                        </div>
                        <div className="shrink-0 text-xs font-black">
                          {coupon.used ? (
                            <span className="text-gray-400 border border-gray-300 px-2 py-0.5 rounded uppercase text-[9px]">Usado</span>
                          ) : (
                            <span className="text-emerald-700 dark:text-emerald-400 border border-emerald-350 px-2 py-0.5 rounded uppercase text-[9px]">Disponible</span>
                          )}
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>

          </div>
        )}

      </main>

      {/* FOOTER BAR FOR NAVIGATION */}
      <footer 
        className="fixed bottom-0 left-0 right-0 max-w-4xl mx-auto bg-white dark:bg-slate-900 border-t sm:border-x sm:rounded-t-2xl p-2 flex justify-around text-[10px] font-bold text-gray-500 shadow-inner z-[90] transition-colors"
        style={{ paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom, 0px))' }}
      >
        <button onClick={() => setActiveClientTab('menu')} className={`flex flex-col items-center gap-1 ${activeClientTab === 'menu' ? 'text-[#904d00]' : ''}`}>
          <span>📋</span><span>Menú</span>
        </button>
        <button onClick={() => setActiveClientTab('pedidos')} className={`flex flex-col items-center gap-1 ${activeClientTab === 'pedidos' ? 'text-[#904d00]' : ''}`}>
          <span>⏱️</span><span>Pedidos</span>
        </button>
        <button onClick={() => setActiveClientTab('creditos')} className={`flex flex-col items-center gap-1 ${activeClientTab === 'creditos' ? 'text-[#904d00]' : ''}`}>
          <span>🗂️</span><span>Mi Saldo</span>
        </button>
        <button onClick={() => setActiveClientTab('perfil')} className={`flex flex-col items-center gap-1 ${activeClientTab === 'perfil' ? 'text-[#904d00]' : ''}`}>
          <span>👤</span><span>Perfil</span>
        </button>
      </footer>

      {/* --- IN-MENU VARIANT SELECTOR MODAL --- */}
      {selectedProductForVariants && (() => {
        const item = selectedProductForVariants;
        const calculatedPrice = getCurrentClientCalculatedPrice();
        const displayedPrice = shouldNotRound(item)
          ? calculatedPrice
          : Math.ceil(calculatedPrice / 5) * 5;

        const totalPieces = (
          item.productLayout === 'layout_2_cantidades'
        ) 
          ? (Object.values(tacoQuantities) as number[]).reduce((acc, val) => acc + val, 0)
          : 0;

        return (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-[110] animate-fade-in text-xs">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-slate-800 shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col overflow-hidden text-slate-800 dark:text-slate-100 transform scale-100 transition-transform">
              
              {/* Header */}
              <div className="bg-amber-50 dark:bg-slate-850 p-4 border-b border-amber-100 dark:border-slate-800 flex justify-between items-center shrink-0">
                <div>
                  <span className="text-[10px] font-black text-[#904d00] dark:text-amber-500 block uppercase">Personalizar Producto</span>
                  <h4 className="font-bold text-sm text-gray-900 dark:text-white mt-0.5">{item.name}</h4>
                </div>
                <button onClick={() => setSelectedProductForVariants(null)} className="text-gray-400 hover:text-gray-900 dark:hover:text-white font-bold bg-white dark:bg-slate-800 border dark:border-slate-700 p-1 rounded-full">X</button>
              </div>

              {/* Modal Body */}
              <div className="p-5 space-y-4 flex-grow overflow-y-auto">
                {item.productLayout ? (
                  <>
                    {/* Layout 2: Selección por cantidades */}
                    {item.productLayout === 'layout_2_cantidades' && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          {item.layout2Options?.filter(o => o.active !== false)?.map(opt => {
                            const qty = tacoQuantities[opt.name] || 0;
                            return (
                              <div key={opt.name} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-3 flex items-center justify-between shadow-xs hover:border-amber-305 transition-colors">
                                <div className="flex items-center gap-2.5">
                                  {item.layoutIcon === 'taco' && (
                                    <div className="w-8 h-8 bg-amber-50 dark:bg-slate-700 rounded-lg flex items-center justify-center text-lg select-none">
                                      🌮
                                    </div>
                                  )}
                                  <div>
                                    <span className="text-xs font-sans font-black text-gray-905 dark:text-gray-100 block">{opt.name}</span>
                                    <span className="text-[10px] text-gray-500 dark:text-gray-400 font-mono tracking-tight">${opt.price.toFixed(2)} c/u</span>
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-3">
                                  {qty > 0 && (
                                    <span className="text-xs font-mono font-bold text-amber-800 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded border border-amber-100 dark:border-amber-900">
                                      ${(qty * opt.price).toFixed(2)}
                                    </span>
                                  )}
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => setTacoQuantities(prev => ({ ...prev, [opt.name]: Math.max(0, qty - 1) }))}
                                      className="bg-slate-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-650 w-7 h-7 font-black text-xs flex items-center justify-center rounded-lg cursor-pointer text-gray-800 dark:text-gray-200"
                                    >
                                      -
                                    </button>
                                    <span className="text-xs font-bold w-5 text-center text-gray-900 dark:text-gray-100">{qty}</span>
                                    <button
                                      type="button"
                                      onClick={() => setTacoQuantities(prev => ({ ...prev, [opt.name]: qty + 1 }))}
                                      className="bg-slate-50 dark:bg-slate-700 border border-gray-205 dark:border-slate-600 hover:bg-green-50 dark:hover:bg-green-950/30 hover:text-green-600 w-7 h-7 font-black text-xs flex items-center justify-center rounded-lg cursor-pointer text-gray-800 dark:text-gray-205"
                                    >
                                      +
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {item.layout2Extras && item.layout2Extras.filter(e => e.active !== false).length > 0 && (
                          <div className="bg-amber-50/20 dark:bg-amber-955/10 rounded-2xl border border-amber-200 dark:border-amber-900 p-3 space-y-2 mt-2">
                            <label className="text-[10px] font-black text-amber-900 dark:text-amber-400 uppercase tracking-wider block font-bold">Opciones Adicionales:</label>
                            <div className="grid grid-cols-1 gap-2">
                              {item.layout2Extras.filter(e => e.active !== false).map(ext => {
                                const isSel = selectedExtras.includes(ext.name);
                                const isDobleTortilla = ext.name.toLowerCase().includes('doble tortilla');
                                const extPrice = isDobleTortilla && ext.price === 0 ? 1.00 : ext.price;
                                const isPerPiece = isDobleTortilla ? true : ext.perPiece;
                                return (
                                  <button
                                    type="button"
                                    key={ext.name}
                                    onClick={() => setSelectedExtras(prev => prev.includes(ext.name) ? prev.filter(x => x !== ext.name) : [...prev, ext.name])}
                                    className={`p-2.5 rounded-xl border text-xs font-bold text-left justify-between flex items-center transition ${
                                      isSel ? 'bg-amber-50 dark:bg-amber-955/20 border-amber-400 dark:border-amber-600 text-[#904d00] dark:text-amber-400 font-extrabold' : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300'
                                    }`}
                                  >
                                    <div className="flex flex-col text-left">
                                      <span className="font-extrabold">{ext.name}</span>
                                      <span className="text-[9px] text-gray-400 dark:text-gray-450 font-normal">
                                        {isPerPiece ? `+$${extPrice.toFixed(2)} por cada pieza de taco` : `+$${extPrice.toFixed(2)} cargo fijo`}
                                      </span>
                                    </div>
                                    <span className={`text-[10px] font-black ${isSel ? 'text-[#904d00] dark:text-amber-450' : 'text-gray-400'}`}>
                                      {isSel ? '✓ Activado' : '+ Agregar'}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Layout 3: Platillo */}
                    {item.productLayout === 'layout_3_platillo' && (
                      <div className="space-y-4">
                        <div>
                          <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5 font-bold">Elige la preparación:</label>
                          <div className="grid grid-cols-2 gap-1.5">
                            {item.layout3Preps?.filter(p => p.active !== false)?.map(prep => (
                              <button
                                type="button"
                                key={prep.name}
                                onClick={() => setSelectedFlavor(prep.name)}
                                className={`p-2.5 rounded-xl border text-[11px] font-black text-left leading-tight transition-all ${
                                  selectedFlavor === prep.name ? 'bg-amber-100 dark:bg-amber-955/35 border-amber-400 dark:border-amber-600 text-[#904d00] dark:text-amber-400' : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300'
                                }`}
                              >
                                <div className="flex justify-between items-center w-full">
                                  <span>🍛 {prep.name}</span>
                                  {prep.priceDiff && prep.priceDiff !== 0 ? (
                                    <span className="text-[9px] font-mono text-amber-800 dark:text-amber-400 bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border border-amber-150 dark:border-slate-800">
                                      {prep.priceDiff > 0 ? '+' : ''}${prep.priceDiff}
                                    </span>
                                  ) : null}
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>

                        {item.infoCardText && (
                          <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-xl p-3 border border-emerald-100 dark:border-emerald-900 text-[11px] font-semibold text-emerald-950 dark:text-emerald-350">
                            {item.infoCardText}
                          </div>
                        )}

                        {item.layout3Removables && item.layout3Removables.length > 0 && (
                          <div>
                            <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5 font-bold">Quitar acompañamientos (opcional):</label>
                            <div className="grid grid-cols-2 gap-2">
                              {item.layout3Removables.map(sd => {
                                const isExcluded = excludedDefaults.includes(sd.name);
                                return (
                                  <button
                                    type="button"
                                    key={sd.name}
                                    onClick={() => setExcludedDefaults(prev => prev.includes(sd.name) ? prev.filter(x => x !== sd.name) : [...prev, sd.name])}
                                    className={`p-2 rounded-xl border text-xs font-bold text-left justify-between flex items-center transition ${
                                      isExcluded ? 'bg-red-50 dark:bg-red-955/20 border-red-200 dark:border-red-900 text-red-800 dark:text-red-400 font-extrabold' : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300'
                                    }`}
                                  >
                                    <span>{sd.name}</span>
                                    <span className="text-[10px] font-black">{isExcluded ? '❌ Quitado' : '✅ Incluido'}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {true && (
                          <div className="flex justify-between items-center py-2 bg-neutral-50 dark:bg-slate-800 px-3.5 rounded-xl border border-gray-200 dark:border-slate-700">
                            <div>
                              <span className="text-xs font-bold text-gray-800 dark:text-gray-200 block">Tortillas:</span>
                              <span className="text-[10px] text-gray-500 dark:text-gray-400 block">Incluye 6. Extra a +$1 c/u</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setTortillasQty(p => Math.max(0, p - 1))}
                                className="bg-white dark:bg-slate-700 border dark:border-slate-650 w-8 h-8 font-bold text-sm flex items-center justify-center rounded cursor-pointer text-gray-800 dark:text-gray-200"
                              >
                                -
                              </button>
                              <span className="text-xs font-black w-6 text-center text-gray-900 dark:text-gray-100">{tortillasQty}</span>
                              <button
                                type="button"
                                onClick={() => setTortillasQty(p => p + 1)}
                                className="bg-white dark:bg-slate-700 border dark:border-slate-655 w-8 h-8 font-bold text-sm flex items-center justify-center rounded cursor-pointer text-gray-800 dark:text-gray-200"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Layout 4: Huevos al gusto */}
                    {item.productLayout === 'layout_4_huevos' && (
                      <div className="space-y-4">
                        <div>
                          <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5 font-bold">Elige la preparación:</label>
                          <div className="grid grid-cols-2 gap-2">
                            {(item.layout4Preps || []).filter(p => p.active !== false).map(prep => (
                              <button
                                type="button"
                                key={prep.name}
                                onClick={() => setSelectedFlavor(prep.name)}
                                className={`p-2.5 rounded-xl border text-xs font-black text-center transition-all ${
                                  selectedFlavor === prep.name ? 'bg-amber-100 dark:bg-amber-955/35 border-amber-400 dark:border-amber-600 text-[#904d00] dark:text-amber-400 font-extrabold' : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300'
                                }`}
                              >
                                🍳 {prep.name}
                              </button>
                            ))}
                          </div>
                        </div>

                        {item.infoCardText && (
                          <div className="bg-emerald-50 dark:bg-emerald-955/20 rounded-xl p-3 border border-emerald-100 dark:border-emerald-900 text-[11px] font-semibold text-emerald-950 dark:text-emerald-350">
                            {item.infoCardText}
                          </div>
                        )}

                        {item.layout4Removables && item.layout4Removables.length > 0 && (
                          <div>
                            <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5 font-bold">Quitar acompañamientos (opcional):</label>
                            <div className="grid grid-cols-2 gap-2">
                              {item.layout4Removables.map(sd => {
                                const isExcluded = excludedDefaults.includes(sd.name);
                                return (
                                  <button
                                    type="button"
                                    key={sd.name}
                                    onClick={() => setExcludedDefaults(prev => prev.includes(sd.name) ? prev.filter(x => x !== sd.name) : [...prev, sd.name])}
                                    className={`p-2 rounded-xl border text-xs font-bold text-left justify-between flex items-center transition ${
                                      isExcluded ? 'bg-red-50 border-red-200 text-red-800' : 'bg-white border-gray-200 dark:border-slate-700 text-gray-755 dark:text-gray-250'
                                    }`}
                                  >
                                    <span>{sd.name}</span>
                                    <span className="text-[10px] font-black">{isExcluded ? '❌ Quitado' : '✅ Incluido'}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {true && (
                          <div className="flex justify-between items-center py-2 bg-neutral-50 dark:bg-slate-800 px-3.5 rounded-xl border border-gray-200 dark:border-slate-700">
                            <div>
                              <span className="text-xs font-bold text-gray-800 dark:text-gray-200 block">Tortillas:</span>
                              <span className="text-[10px] text-gray-500 dark:text-gray-400 block">Incluye 6. Extra a +$1 c/u</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setTortillasQty(p => Math.max(0, p - 1))}
                                className="bg-white dark:bg-slate-700 border dark:border-slate-600 w-8 h-8 font-bold text-sm flex items-center justify-center rounded cursor-pointer text-gray-800 dark:text-gray-200"
                              >
                                -
                              </button>
                              <span className="text-xs font-black w-6 text-center text-gray-900 dark:text-gray-100">{tortillasQty}</span>
                              <button
                                type="button"
                                onClick={() => setTortillasQty(p => p + 1)}
                                className="bg-white dark:bg-slate-700 border dark:border-slate-650 w-8 h-8 font-bold text-sm flex items-center justify-center rounded cursor-pointer text-gray-800 dark:text-gray-200"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Layout 5: Frutas */}
                    {item.productLayout === 'layout_5_frutas' && (
                      <div className="space-y-4">
                        <div>
                          <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5 font-bold">Presentación / Tamaño:</label>
                          <div className="grid grid-cols-2 gap-2">
                            {item.layout5Presentations?.filter(p => p.active !== false)?.map(pres => (
                              <button
                                type="button"
                                key={pres.name}
                                onClick={() => setSelectedSize(pres.name)}
                                className={`p-2.5 rounded-xl border text-xs font-black text-center transition-all ${
                                  selectedSize === pres.name ? 'bg-[#904d00] dark:bg-amber-600 text-white border-[#904d00] dark:border-amber-600' : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300'
                                }`}
                              >
                                {pres.name} (${pres.price.toFixed(2)})
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5 font-bold">Elegir Frutas (libre selección):</label>
                          <div className="grid grid-cols-3 gap-1.5">
                            {item.layout5Fruits?.filter(f => f.active !== false)?.map(fruit => {
                              const active = selectedFruits.includes(fruit.name);
                              return (
                                <button
                                  type="button"
                                  key={fruit.name}
                                  onClick={() => setSelectedFruits(p => p.includes(fruit.name) ? p.filter(x => x !== fruit.name) : [...p, fruit.name])}
                                  className={`p-2 rounded-xl text-[10px] font-bold text-center border transition ${
                                    active ? 'bg-[#006e0a] dark:bg-emerald-600 text-white border-[#006e0a] dark:border-emerald-600' : 'bg-white dark:bg-slate-800 border-gray-250 dark:border-slate-700 text-gray-750 dark:text-gray-300'
                                  }`}
                                >
                                  {fruit.name}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {item.layout5Extras && item.layout5Extras.filter(e => e.active !== false).length > 0 && (
                          <div>
                            <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1 font-bold">Aderezos / Extras sugeridos:</label>
                            <div className="grid grid-cols-3 gap-1.5">
                              {item.layout5Extras.filter(e => e.active !== false).map(ext => {
                                const active = selectedExtras.includes(ext.name);
                                return (
                                  <button
                                    type="button"
                                    key={ext.name}
                                    onClick={() => setSelectedExtras(p => p.includes(ext.name) ? p.filter(x => x !== ext.name) : [...p, ext.name])}
                                    className={`p-2 rounded-xl text-[10px] font-bold text-center border transition ${
                                      active ? 'bg-[#904d00] dark:bg-amber-600 text-white border-[#904d00] dark:border-amber-600 font-extrabold' : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-750 dark:text-gray-300'
                                    }`}
                                  >
                                    {ext.name} {ext.price > 0 ? `(+$${ext.price})` : ''}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Layout 6: Proteína + Ingredientes */}
                    {item.productLayout === 'layout_6_proteina' && (
                      <div className="space-y-4">
                        {item.layoutAllowPresentation && item.layoutPresentations && item.layoutPresentations.length > 0 && (
                          <div>
                            <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2 font-bold">Presentación:</label>
                            <div className="flex flex-col gap-2 p-3 bg-amber-50/50 rounded-2xl border border-amber-100 dark:bg-slate-800 dark:border-slate-700">
                              {item.layoutPresentations.map((pres) => (
                                <label
                                  key={pres.name}
                                  className={`flex items-center justify-between px-4 py-2.5 rounded-xl border cursor-pointer transition-all ${
                                    selectedSize === pres.name
                                      ? 'bg-amber-100/70 dark:bg-amber-950/40 border-amber-400 dark:border-amber-600 text-[#904d00] dark:text-amber-400 font-black'
                                      : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-350 hover:bg-gray-50'
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="radio"
                                      name="layout6-presentation"
                                      checked={selectedSize === pres.name}
                                      onChange={() => setSelectedSize(pres.name)}
                                      className="w-4 h-4 text-amber-600 border-gray-300 focus:ring-amber-500"
                                    />
                                    <span className="text-xs font-bold">{pres.name}</span>
                                  </div>
                                  <span className="text-xs font-mono font-bold">${pres.price.toFixed(2)}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        )}

                        <div>
                          <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5 font-bold">Elegir relleno / proteína principal:</label>
                          <div className="grid grid-cols-3 gap-1.5">
                            {item.layout6Proteins?.filter(p => p.active !== false)?.map(prot => (
                              <button
                                type="button"
                                key={prot.name}
                                onClick={() => setSelectedFlavor(prot.name)}
                                className={`p-2.5 rounded-xl border text-[10px] font-black text-center transition ${
                                  selectedFlavor === prot.name ? 'bg-amber-100 dark:bg-amber-955/35 border-amber-400 dark:border-amber-600 text-[#904d00] dark:text-amber-400 font-black' : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-750 dark:text-gray-300'
                                }`}
                              >
                                {prot.name}
                              </button>
                            ))}
                          </div>
                        </div>

                      </div>
                    )}

                    {/* Layout 7: Bebidas calientes */}
                    {item.productLayout === 'layout_7_calientes' && (
                      <div className="space-y-4">
                        <div>
                          <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5 font-bold">Tamaño:</label>
                          <div className="grid grid-cols-3 gap-2">
                            {item.layout7Sizes?.filter(s => s.active !== false)?.map(sz => (
                              <button
                                type="button"
                                key={sz.name}
                                onClick={() => setSelectedSize(sz.name)}
                                className={`p-3 rounded-xl border text-xs font-black text-center transition ${
                                  selectedSize === sz.name ? 'bg-[#904d00] dark:bg-amber-600 text-white border-[#904d00] dark:border-amber-600' : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-750 dark:text-gray-300'
                                }`}
                              >
                                {sz.name} (${sz.price.toFixed(2)})
                              </button>
                            ))}
                          </div>
                        </div>

                        {item.customizationOptions && item.customizationOptions.length > 0 && (
                          <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-slate-800">
                            <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block font-bold">Elige el sabor / tipo:</label>
                            <div className="grid grid-cols-2 gap-2">
                              {item.customizationOptions.map(flavor => (
                                <button
                                  type="button"
                                  key={flavor}
                                  onClick={() => setSelectedFlavor(flavor)}
                                  className={`p-2.5 rounded-xl border text-xs font-black text-center transition ${
                                    selectedFlavor === flavor 
                                      ? 'bg-[#904d00] dark:bg-amber-600 text-white border-[#904d00] dark:border-amber-600' 
                                      : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-750 dark:text-gray-300'
                                  }`}
                                >
                                  {flavor}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {item.layout7AllowMilk && (
                          <div className="pt-1">
                            <button
                              type="button"
                              onClick={() => setWithMilk(prev => !prev)}
                              className={`w-full p-3 rounded-xl border text-xs font-black flex items-center justify-between transition-all ${
                                withMilk 
                                  ? 'bg-amber-50 dark:bg-amber-955/20 border-amber-500 dark:border-amber-600 text-amber-900 dark:text-amber-300 shadow-xs' 
                                  : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-base select-none">🥛</span>
                                <span className="text-left font-sans">
                                  <span className="block font-bold">¿Agregar Leche?</span>
                                  <span className="block text-[10px] text-gray-500 dark:text-gray-400 font-normal">
                                    Suma +${item.layout7MilkPrice || 0} pesos
                                  </span>
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                {withMilk ? (
                                  <span className="bg-amber-600 text-white text-[10px] px-2.5 py-0.5 rounded-full font-bold">CON LECHE</span>
                                ) : (
                                  <span className="bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400 text-[10px] px-2.5 py-0.5 rounded-full font-medium">SIN LECHE</span>
                                )}
                              </div>
                            </button>
                          </div>
                        )}

                        {item.layout7AllowSugar && (
                          <div className="space-y-2 border-t dark:border-slate-700 pt-3">
                            <div className="flex items-center gap-2.5 select-none">
                              <input 
                                type="checkbox" 
                                id="sugar-free-chk-client"
                                checked={sinAzucar} 
                                onChange={(e) => {
                                  setSinAzucar(e.target.checked);
                                  if (e.target.checked) setSugarSpoons(0);
                                }}
                                className="w-4.5 h-4.5 text-amber-600 border-gray-350 rounded focus:ring-amber-500 cursor-pointer" 
                              />
                              <label htmlFor="sugar-free-chk-client" className="text-xs font-sans font-black text-gray-800 dark:text-gray-200 cursor-pointer">
                                Sin azúcar
                              </label>
                            </div>

                            <div className={`flex justify-between items-center py-2 bg-neutral-50 dark:bg-slate-800 px-3.5 rounded-xl border border-gray-200 dark:border-slate-700 transition ${
                              sinAzucar ? 'opacity-55 cursor-not-allowed pointer-events-none' : ''
                            }`}>
                              <div>
                                <span className="text-xs font-bold text-gray-850 dark:text-gray-200 block">Cucharadas de azúcar:</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  disabled={sinAzucar}
                                  onClick={() => setSugarSpoons(p => Math.max(0, p - 1))}
                                  className="bg-white dark:bg-slate-700 border dark:border-slate-650 w-8 h-8 font-bold text-sm flex items-center justify-center rounded cursor-pointer disabled:opacity-50 text-gray-800 dark:text-gray-200"
                                >
                                  -
                                </button>
                                <span className="text-xs font-black w-6 text-center text-gray-900 dark:text-gray-100">{sugarSpoons}</span>
                                <button
                                  type="button"
                                  disabled={sinAzucar}
                                  onClick={() => setSugarSpoons(p => p + 1)}
                                  className="bg-white dark:bg-slate-700 border dark:border-slate-650 w-8 h-8 font-bold text-sm flex items-center justify-center rounded cursor-pointer disabled:opacity-50 text-gray-800 dark:text-gray-200"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Layout 8: Aguas frescas */}
                    {item.productLayout === 'layout_8_aguas' && (
                      <div className="space-y-4">
                        <div>
                          <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5 font-bold">Tamaño:</label>
                          <div className="grid grid-cols-2 gap-2">
                            {item.layout8Sizes?.filter(s => s.active !== false)?.map(sz => (
                              <button
                                type="button"
                                key={sz.name}
                                onClick={() => setSelectedSize(sz.name)}
                                className={`p-2.5 rounded-xl border text-xs font-black text-center transition ${
                                  selectedSize === sz.name ? 'bg-[#904d00] dark:bg-amber-600 text-white border-[#904d00] dark:border-amber-600' : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-750 dark:text-gray-300'
                                }`}
                              >
                                {sz.name} (${sz.price.toFixed(2)})
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5 font-bold">Elegir sabor:</label>
                          <div className="grid grid-cols-3 gap-2">
                            {item.layout8Flavors?.filter(f => f.active !== false)?.map(fl => (
                              <button
                                type="button"
                                key={fl.name}
                                onClick={() => setSelectedFlavor(fl.name)}
                                className={`p-2.5 rounded-xl border text-[11px] text-center font-bold transition ${
                                  selectedFlavor === fl.name ? 'bg-amber-100 dark:bg-amber-955/35 border-amber-400 dark:border-amber-600 text-[#904d00] dark:text-amber-400 font-black' : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300'
                                }`}
                              >
                                {fl.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Layout 9: Jugos */}
                    {item.productLayout === 'layout_9_jugos' && (
                      <div className="space-y-4">
                        <div>
                          <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5 font-bold">Tamaño:</label>
                          <div className="grid grid-cols-2 gap-2">
                            {item.layout9Sizes?.filter(s => s.active !== false)?.map(sz => (
                              <button
                                type="button"
                                key={sz.name}
                                onClick={() => setSelectedSize(sz.name)}
                                className={`p-2.5 rounded-xl border text-xs font-black text-center transition ${
                                  selectedSize === sz.name ? 'bg-[#904d00] dark:bg-amber-600 text-white border-[#904d00] dark:border-amber-600' : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-750 dark:text-gray-300'
                                }`}
                              >
                                {sz.name} (${sz.price.toFixed(2)})
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5 font-bold">Elegir sabor principal:</label>
                          <div className="grid grid-cols-2 gap-2">
                            {item.layout9Flavors?.filter(f => f.active !== false)?.map(fl => (
                              <button
                                type="button"
                                key={fl.name}
                                onClick={() => setSelectedFlavor(fl.name)}
                                className={`p-2.5 rounded-xl border text-xs font-bold text-center transition ${
                                  selectedFlavor === fl.name ? 'bg-amber-100 dark:bg-amber-955/35 border-amber-400 dark:border-amber-600 text-[#904d00] dark:text-amber-400 font-black' : 'bg-white dark:bg-slate-800 border-gray-150 dark:border-slate-705 text-gray-700 dark:text-gray-300'
                                }`}
                              >
                                {fl.name}
                              </button>
                            ))}
                          </div>
                        </div>

                        {item.layout9Modifiers && item.layout9Modifiers.filter(o => o.active !== false).length > 0 && (
                          <div>
                            <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5 font-bold">Modificadores opcionales:</label>
                            <div className="grid grid-cols-2 gap-2">
                              {item.layout9Modifiers.filter(o => o.active !== false).map(opt => {
                                const isSel = customOptions.includes(opt.name);
                                return (
                                  <button
                                    type="button"
                                    key={opt.name}
                                    onClick={() => setCustomOptions(prev => prev.includes(opt.name) ? prev.filter(x => x !== opt.name) : [...prev, opt.name])}
                                    className={`p-2 rounded-xl text-left border text-xs font-bold transition ${
                                      isSel ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-400 dark:border-amber-650 text-[#904d00] dark:text-amber-400' : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-705 dark:text-gray-300'
                                    }`}
                                  >
                                    {opt.name}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {/* Variants */}
                    {item.variants && item.variants.length > 0 && (
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-550 dark:text-gray-400 uppercase tracking-wider block">Seleccionar Tamaño / Variación:</label>
                        <div className="grid grid-cols-2 gap-2">
                          {item.variants.map(v => (
                            <button
                              key={v}
                              type="button"
                              onClick={() => setSelectedVariant(v)}
                              className={`p-2 rounded-xl text-center border text-xs font-bold transition-all ${
                                selectedVariant === v 
                                  ? 'bg-amber-100 border-amber-400 text-[#904d00]' 
                                  : 'bg-slate-50 dark:bg-slate-805 border-gray-200 dark:border-slate-700'
                              }`}
                            >
                              {v}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Customizations */}
                    {item.customizationOptions && item.customizationOptions.length > 0 && (
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-550 dark:text-gray-400 uppercase tracking-wider block">Opciones Extras / Preparación:</label>
                        <div className="grid grid-cols-2 gap-2">
                          {item.customizationOptions.map(opt => {
                            const isSel = selectedCustomizations.includes(opt);
                            return (
                              <button
                                key={opt}
                                type="button"
                                onClick={() => handleCustomizationToggle(opt)}
                                className={`p-2 rounded-xl text-left border text-xs font-semibold transition-all ${
                                  isSel 
                                    ? 'bg-amber-50 border-amber-400 text-[#904d00] font-bold' 
                                    : 'bg-slate-50 dark:bg-slate-805 border-gray-200 dark:border-slate-700'
                                }`}
                              >
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Removable Ingredients */}
                    {getProductIngredients(item).length > 0 && (
                      <div className="space-y-1.5 border-t border-gray-150 dark:border-slate-800 pt-3">
                        <label className="text-[10px] font-black text-gray-550 dark:text-gray-400 uppercase tracking-wider block">Quitar Ingredientes:</label>
                        <div className="grid grid-cols-2 gap-2">
                          {getProductIngredients(item).map(ing => {
                            const isExcluded = excludedIngredients.includes(ing);
                            return (
                              <button
                                key={ing}
                                type="button"
                                onClick={() => {
                                  setExcludedIngredients(prev =>
                                    prev.includes(ing) ? prev.filter(x => x !== ing) : [...prev, ing]
                                  );
                                }}
                                className={`p-2 rounded-xl text-left border text-xs font-semibold transition-all ${
                                  isExcluded 
                                    ? 'bg-red-50 border-red-400 text-red-700 dark:bg-red-955/20 dark:text-red-400 dark:border-red-900 font-bold' 
                                    : 'bg-slate-50 dark:bg-slate-805 border-gray-250 dark:border-slate-700'
                                }`}
                              >
                                ❌ Sin {ing}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* UNIVERSAL INGREDIENTS CONFIGURATION FOR ALL LAYOUTS */}
                {item.removableIngredients && item.removableIngredients.length > 0 && (
                  <div className="space-y-1.5 border-t border-gray-150 dark:border-slate-800 pt-3">
                    <label className="text-[10px] font-black text-rose-500 uppercase tracking-wider block font-bold font-sans">
                      Sin Ingrediente (Remover):
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {item.removableIngredients.map(ing => {
                        const isExcluded = excludedIngredients.includes(ing);
                        return (
                          <button
                            key={ing}
                            type="button"
                            onClick={() => setExcludedIngredients(prev => prev.includes(ing) ? prev.filter(x => x !== ing) : [...prev, ing])}
                            className={`px-3 py-1.5 rounded-full border text-[10px] font-black transition-colors ${
                              isExcluded ? 'bg-rose-100 border-rose-300 text-rose-700 dark:bg-rose-950/30 dark:border-rose-900 dark:text-rose-400' : 'bg-white border-gray-200 text-gray-500 dark:bg-slate-800 dark:border-slate-700 dark:text-gray-400'
                            }`}
                          >
                            {isExcluded ? '❌' : '✅'} Sin {ing}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {item.extraIngredients && item.extraIngredients.length > 0 && (
                  <div className="space-y-1.5 border-t border-gray-150 dark:border-slate-800 pt-3">
                    <label className="text-[10px] font-black text-emerald-600 uppercase tracking-wider block font-bold font-sans">
                      Añadir Extras (+$):
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {item.extraIngredients.map(ext => {
                        const isAdded = selectedExtras.includes(ext.name);
                        return (
                          <button
                            key={ext.name}
                            type="button"
                            onClick={() => setSelectedExtras(prev => prev.includes(ext.name) ? prev.filter(x => x !== ext.name) : [...prev, ext.name])}
                            className={`px-3 py-1.5 rounded-full border text-[10px] font-black transition-colors ${
                              isAdded ? 'bg-emerald-50 border-emerald-300 text-emerald-800 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-400' : 'bg-white border-gray-200 text-gray-600 dark:bg-slate-800 dark:border-slate-700 dark:text-gray-300'
                            }`}
                          >
                            {isAdded ? '✓' : '+'} {ext.name} (+${ext.price})
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {(item.layout3AllowPolloPiece || item.name.toLowerCase().includes('pollo') || (item.description && item.description.toLowerCase().includes('pollo'))) && (
                  <div className="space-y-2 border-t border-gray-150 dark:border-slate-800 pt-3">
                    <label className="text-[10px] font-black text-gray-550 dark:text-gray-400 uppercase tracking-wider block font-bold">
                      🍗 Pieza de Pollo (Elige una):
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={!polloStatus?.muslo}
                        onClick={() => setSelectedPolloPiece('Muslo')}
                        className={`flex-1 p-2.5 rounded-xl border text-xs font-black text-center transition-all ${
                          selectedPolloPiece === 'Muslo'
                            ? 'bg-[#904d00] dark:bg-amber-600 text-white border-[#904d00] dark:border-amber-600'
                            : polloStatus?.muslo
                              ? 'bg-white dark:bg-slate-805 border-gray-200 dark:border-slate-700 text-gray-750 dark:text-gray-300'
                              : 'bg-gray-100 text-gray-450 dark:bg-slate-900 border-gray-200 dark:border-slate-850 cursor-not-allowed opacity-50'
                        }`}
                      >
                        Muslo {!polloStatus?.muslo && '(Agotado)'}
                      </button>
                      <button
                        type="button"
                        disabled={!polloStatus?.pierna}
                        onClick={() => setSelectedPolloPiece('Pierna')}
                        className={`flex-1 p-2.5 rounded-xl border text-xs font-black text-center transition-all ${
                          selectedPolloPiece === 'Pierna'
                            ? 'bg-[#904d00] dark:bg-amber-650 text-white border-[#904d00] dark:border-amber-600'
                            : polloStatus?.pierna
                              ? 'bg-white dark:bg-slate-805 border-gray-200 dark:border-slate-700 text-gray-750 dark:text-gray-300'
                              : 'bg-gray-100 text-gray-450 dark:bg-slate-900 border-gray-200 dark:border-slate-850 cursor-not-allowed opacity-50'
                        }`}
                      >
                        Pierna {!polloStatus?.pierna && '(Agotado)'}
                      </button>
                    </div>
                    {(!polloStatus?.muslo && !polloStatus?.pierna) && (
                      <p className="text-[10px] text-red-500 font-bold">⚠️ Piezas de pollo agotadas temporalmente.</p>
                    )}
                  </div>
                )}
              </div>

              {/* Real-time Subtotal display and Modal confirmation buttons */}
              <div className="bg-gray-50 dark:bg-slate-850 p-4 border-t border-gray-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-3 shrink-0">
                <div className="text-left w-full sm:w-auto flex items-center gap-4">
                  <div>
                    <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium block">Total de Preparado:</span>
                    <span className="text-xl font-mono font-black text-emerald-800 dark:text-emerald-450">${displayedPrice.toFixed(2)}</span>
                  </div>
                  {totalPieces > 0 && (
                    <div className="border-l border-gray-300 dark:border-slate-700 pl-4">
                      <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium block">Piezas:</span>
                      <span className="text-xl font-mono font-black text-amber-800 dark:text-amber-500">{totalPieces}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 w-full sm:w-auto justify-end">
                  <button 
                    type="button" 
                    onClick={() => setSelectedProductForVariants(null)}
                    className="w-1/2 sm:w-28 bg-white dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700 text-gray-705 dark:text-gray-200 text-xs font-black py-2.5 rounded-xl text-center cursor-pointer"
                  >
                    Salir
                  </button>
                  
                  <button 
                    type="button" 
                    onClick={confirmVariantAddition}
                    className="w-1/2 sm:w-44 bg-[#904d00] hover:bg-amber-900 border border-amber-800 dark:border-amber-700 text-white text-xs font-black py-2.5 rounded-xl text-center shadow-md flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span>✓ Agregar a Orden</span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        );
      })()}

      {/* Floating fixed bottom cart bar */}
      {clientCart.length > 0 && (
        <>
          <style>{`
            .cart-floating-bar {
              position: fixed;
              left: 0;
              right: 0;
              max-width: 56rem; /* max-w-4xl */
              margin: 0 auto;
              z-index: 80;
              background-color: rgba(15, 23, 42, 0.96); /* slate-900 */
              backdrop-filter: blur(12px);
              border-top: 1px solid rgb(30, 41, 59); /* slate-800 */
              border-top-left-radius: 1.25rem; /* rounded-t-2xl */
              border-top-right-radius: 1.25rem;
              box-shadow: 0 -4px 25px rgba(0, 0, 0, 0.35);
              padding-left: 1rem;
              padding-right: 1rem;
              padding-top: 0.75rem;
              padding-bottom: 0.75rem;
              color: white;
              bottom: calc(3.25rem + env(safe-area-inset-bottom, 0px)) !important;
            }
            .main-client-container-has-cart {
              padding-bottom: calc(7.5rem + env(safe-area-inset-bottom, 0px)) !important;
            }
            .main-client-container-empty-cart {
              padding-bottom: calc(3.75rem + env(safe-area-inset-bottom, 0px)) !important;
            }
            @media (min-width: 640px) {
              .cart-floating-bar {
                padding-left: 1.5rem;
                padding-right: 1.5rem;
                border-left-width: 1px;
                border-right-width: 1px;
                border-color: rgb(30, 41, 59);
              }
            }
          `}</style>
          
          <div className="cart-floating-bar animate-fade-in">
            <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] text-orange-400 font-black uppercase tracking-wider">Tu Pedido</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] font-black bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded border border-orange-500/30">
                    {clientCart.reduce((sum, i) => sum + i.quantity, 0)} {clientCart.reduce((sum, i) => sum + i.quantity, 0) === 1 ? 'producto' : 'productos'}
                  </span>
                  <span className="text-sm font-black font-mono text-white">
                    Total: ${cartTotal.toFixed(2)}
                  </span>
                </div>
              </div>
              
              <button
                onClick={handleViewCart}
                className="bg-[#904d00] hover:bg-amber-900 active:scale-95 text-white text-xs font-black px-5 py-2.5 rounded-xl shadow-md transition-all uppercase tracking-wider cursor-pointer border border-amber-800"
              >
                Ver Carrito
              </button>
            </div>
          </div>
        </>
      )}

    </div>
  );
}
