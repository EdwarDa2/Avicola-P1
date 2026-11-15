/**
 * Sistema de Diseño — Propuesta Violet UI Studio (Decisión de Diseño Adoptada)
 * Tokens de color, tipografía, espaciados y sombras.
 */

export const Colors = {
  // Paleta principal acordada
  primary: '#e4f222',        // Highlighter Yellow: CTA, progreso, acento activo
  primaryDark: '#c8d415',
  ink: '#0c0a08',            // Ink: texto principal, iconos oscuros, texto sobre CTA
  obsidian: '#1a1919',       // Obsidian: tarjetas de resultado destacado, navegación, fondos oscuros
  obsidianLight: '#262424',
  paper: '#ffffff',          // Paper: tarjetas de contenido, controles, modales
  bone: '#f4f2f0',           // Bone: fondo general de pantallas
  boneDark: '#eae6e2',
  ash: '#6d6c6b',            // Ash: texto secundario, unidades, subtítulos
  hairline: '#e5e7eb',       // Hairline: bordes finos, separadores
  smoke: '#d3d3d3',          // Smoke: estados suaves, bordes inactivos
  disabled: '#d3d3d3',
  textMuted: '#6d6c6b',
  
  // Feedback semántico
  danger: '#d32f2f',
  dangerLight: '#ffebee',
  success: '#2e7d32',
  successLight: '#e8f5e9',
  warning: '#ed6c02',
  warningLight: '#fff4e5',
  info: '#0288d1',
  infoLight: '#e1f5fe',

  // Acentos por producto
  productHenEggs: '#f59e0b',
  productChickenMeat: '#ef4444',
  productQuailEggs: '#8b5cf6',
  productQuailMeat: '#06b6d4',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
};

export const BorderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const Typography = {
  h1: {
    fontSize: 28,
    fontWeight: '700' as const,
    lineHeight: 34,
    color: Colors.ink,
  },
  h2: {
    fontSize: 22,
    fontWeight: '700' as const,
    lineHeight: 28,
    color: Colors.ink,
  },
  h3: {
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 24,
    color: Colors.ink,
  },
  body: {
    fontSize: 15,
    fontWeight: '400' as const,
    lineHeight: 22,
    color: Colors.ink,
  },
  bodyBold: {
    fontSize: 15,
    fontWeight: '600' as const,
    lineHeight: 22,
    color: Colors.ink,
  },
  caption: {
    fontSize: 13,
    fontWeight: '400' as const,
    lineHeight: 18,
    color: Colors.ash,
  },
  captionBold: {
    fontSize: 13,
    fontWeight: '600' as const,
    lineHeight: 18,
    color: Colors.ash,
  },
  numberDisplay: {
    fontSize: 36,
    fontWeight: '800' as const,
    lineHeight: 42,
    color: Colors.ink,
  },
  numberDisplayLarge: {
    fontSize: 48,
    fontWeight: '800' as const,
    lineHeight: 54,
    color: Colors.primary,
  },
};

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
};

