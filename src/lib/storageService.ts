import { supabase } from './supabase';

export type BucketName = 'product-images' | 'profile-images' | 'store-logos' | 'branch-images' | 'banners';

/**
 * Valida un archivo antes de procesarlo.
 */
export const validateFile = (file: File): { valid: boolean; error?: string } => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Tipo de archivo no permitido. Usa JPG, PNG o WebP.' };
  }
  
  // Limitar tamaño a 5MB (5 * 1024 * 1024)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    return { valid: false, error: 'El archivo excede el tamaño máximo permitido de 5MB.' };
  }

  return { valid: true };
};

/**
 * Comprime y redimensiona una imagen devolviendo un Blob.
 */
export const compressImageToBlob = (file: File, maxWidth = 800, maxHeight = 800, quality = 0.8): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('No se pudo obtener el contexto del canvas'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Error al generar el blob'));
          }
        }, 'image/webp', quality);
      };
      
      img.onerror = () => reject(new Error('Error al cargar la imagen para compresión'));
      if (event.target?.result) {
        img.src = event.target.result as string;
      } else {
        reject(new Error('No se pudo leer el archivo'));
      }
    };
    reader.onerror = () => reject(new Error('Error de lectura de archivo'));
    reader.readAsDataURL(file);
  });
};

/**
 * Sube una imagen directamente al bucket especificado.
 * Si es posible, comprime la imagen a WebP antes de subirla.
 */
export const uploadAsset = async (file: File, bucket: BucketName): Promise<string> => {
  if (!supabase) {
    throw new Error('Supabase no configurado.');
  }

  const validation = validateFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  let fileToUpload: File | Blob = file;
  let fileExt = 'webp';
  
  try {
    fileToUpload = await compressImageToBlob(file);
  } catch (err) {
    console.warn('Fallo la compresión, subiendo archivo original', err);
    fileExt = file.name.split('.').pop() || 'jpg';
  }

  const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

  const { data: publicUrlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(fileName);

  const { error } = await supabase.storage
    .from(bucket)
    .upload(fileName, fileToUpload, { cacheControl: '3600', upsert: false });

  if (error) {
    throw error;
  }

  return publicUrlData.publicUrl;
};
