/**
 * useModalA11y — hook d'accessibilité pour les modals.
 *
 * Session 54 (lot A11y du backlog G3).
 *
 * Couvre les 3 obligations WCAG 2.1 pour les dialogs :
 *   1. **Esc** ferme le modal (keyboard escape).
 *   2. **Focus trap** : Tab / Shift+Tab restent à l'intérieur du modal,
 *      la tabulation cycle entre le premier et le dernier focusable.
 *   3. **Restore focus** : à la fermeture, le focus revient sur l'élément
 *      qui avait le focus au moment de l'ouverture (souvent le bouton
 *      déclencheur).
 *
 * Usage :
 * ```tsx
 * function MyModal({ isOpen, onClose }) {
 *   const { modalRef } = useModalA11y(isOpen, onClose);
 *   if (!isOpen) return null;
 *   return (
 *     <div role="dialog" aria-modal="true" aria-labelledby="my-modal-title"
 *          ref={modalRef} className="fixed inset-0 z-50 …">
 *       <h2 id="my-modal-title">Titre</h2>
 *       …
 *     </div>
 *   );
 * }
 * ```
 *
 * Le composant doit aussi appliquer `role="dialog"` et `aria-modal="true"`,
 * et idéalement `aria-labelledby` pointant sur l'id du titre — le hook ne
 * les ajoute pas automatiquement (laissé à l'appelant pour rester explicite).
 */

import { useEffect, useRef } from "react";

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function useModalA11y(isOpen: boolean, onClose: () => void) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Sauvegarde l'élément qui avait le focus avant l'ouverture
    previousActiveRef.current =
      typeof document !== "undefined"
        ? (document.activeElement as HTMLElement | null)
        : null;

    // Donne le focus au premier élément focusable du modal (ou au modal lui-même)
    const node = modalRef.current;
    if (node) {
      const focusables = node.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      if (focusables.length > 0) {
        focusables[0].focus();
      } else if (node.tabIndex >= 0) {
        node.focus();
      }
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key === "Tab" && node) {
        const focusables = Array.from(
          node.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
        ).filter(
          // Filtre les éléments masqués (display:none / visibility:hidden via offsetParent)
          (el) => el.offsetParent !== null || el === document.activeElement,
        );

        if (focusables.length === 0) {
          // Pas d'élément focusable → on bloque le tab pour ne pas sortir
          e.preventDefault();
          return;
        }
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement;

        if (e.shiftKey && active === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      // Restore le focus à l'ouverture, si l'élément existe encore
      if (previousActiveRef.current && document.contains(previousActiveRef.current)) {
        try {
          previousActiveRef.current.focus();
        } catch {
          /* élément détaché entre-temps : silencieux */
        }
      }
    };
  }, [isOpen, onClose]);

  return { modalRef };
}
