// Configuración centralizada para URLs de Supabase Storage
const BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || 'https://udtlqjmrtbcpdqknwuro.supabase.co';

export const STORAGE_CONFIG = {
  baseUrl: `${BASE_URL}/storage/v1/object/public`,
  paths: {
    productos: {
      imagenes: {
        cocteles: '/productos/imagenes/cocteles',
        bebidas: '/productos/imagenes/bebidas', 
        comidas: '/productos/imagenes/comidas'
      },
      videos: {
        bebidas: '/productos/videos/bebidas',
        cocteles: '/productos/videos/cocteles'
      },
      recursos: {
        logos: '/productos/recursos/logos',
        iconos: '/productos/recursos/iconos',
        iconosLicores: '/productos/recursos/iconos-licores'
      }
    }
  }
};

// Función helper para construir URLs completas
export function getStorageUrl(category, subcategory, filename) {
  const path = STORAGE_CONFIG.paths.productos[category]?.[subcategory];
  return path ? `${STORAGE_CONFIG.baseUrl}${path}/${filename}` : null;
}