/**
 * @fileoverview Hook useMediaQuery - Détection des breakpoints responsive
 *
 * Fournit une détection réactive des breakpoints en utilisant les breakpoints Tailwind CSS.
 * Retourne des flags booléens pour les vues mobile, tablette et desktop.
 *
 * Breakpoints:
 * - Mobile: < 640px (sm)
 * - Tablette: 640px - 1024px (sm à lg)
 * - Desktop: >= 1024px (lg+)
 *
 * @example
 * const { isMobile, isTablet, isDesktop } = useMediaQuery();
 *
 * return (
 *   <div>
 *     {isMobile && <VueMobile />}
 *     {isTablet && <VueTablette />}
 *     {isDesktop && <VueDesktop />}
 *   </div>
 * );
 */

import { useState, useEffect } from 'react';

/**
 * Breakpoints Tailwind CSS
 */
const BREAKPOINTS = {
  sm: 640,   // Début tablette
  md: 768,   // Appareils moyens
  lg: 1024,  // Début desktop
  xl: 1280,  // Grand desktop
} as const;

interface MediaQueryResult {
  /** Vrai si largeur viewport < 640px */
  isMobile: boolean;
  /** Vrai si largeur viewport >= 640px et < 1024px */
  isTablet: boolean;
  /** Vrai si largeur viewport >= 1024px */
  isDesktop: boolean;
  /** Largeur actuelle du viewport en pixels */
  width: number;
}

/**
 * Hook pour détecter le breakpoint responsive actuel
 *
 * Utilise window.matchMedia avec les breakpoints Tailwind CSS.
 * Se met à jour sur les événements resize de la fenêtre.
 *
 * @returns {MediaQueryResult} Objet avec les flags de breakpoint et la largeur actuelle
 *
 * @example
 * function MonComposant() {
 *   const { isMobile, isTablet, isDesktop } = useMediaQuery();
 *
 *   return (
 *     <div>
 *       {isMobile && <p>Vue mobile (< 640px)</p>}
 *       {isTablet && <p>Vue tablette (640px - 1024px)</p>}
 *       {isDesktop && <p>Vue desktop (>= 1024px)</p>}
 *     </div>
 *   );
 * }
 */
export function useMediaQuery(): MediaQueryResult {
  const [width, setWidth] = useState<number>(
    typeof window !== 'undefined' ? window.innerWidth : 0
  );

  useEffect(() => {
    // Sortir tôt si on est sur le serveur (SSR)
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      setWidth(window.innerWidth);
    };

    // Ajouter l'écouteur d'événement
    window.addEventListener('resize', handleResize);

    // Définir la valeur initiale
    handleResize();

    // Nettoyage
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = width < BREAKPOINTS.sm;
  const isTablet = width >= BREAKPOINTS.sm && width < BREAKPOINTS.lg;
  const isDesktop = width >= BREAKPOINTS.lg;

  return {
    isMobile,
    isTablet,
    isDesktop,
    width,
  };
}

/**
 * Hook pour matcher une requête média spécifique
 *
 * Alternative plus flexible pour les requêtes média personnalisées.
 *
 * @param query - Chaîne de requête média CSS (ex: "(min-width: 768px)")
 * @returns {boolean} Vrai si la requête média correspond
 *
 * @example
 * const isPrint = useMediaQueryMatch('print');
 * const isLandscape = useMediaQueryMatch('(orientation: landscape)');
 */
export function useMediaQueryMatch(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(query);

    // Définir la valeur initiale
    setMatches(mediaQuery.matches);

    // Créer l'écouteur d'événement
    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Ajouter l'écouteur (navigateurs modernes)
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      // Fallback pour les anciens navigateurs
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, [query]);

  return matches;
}
