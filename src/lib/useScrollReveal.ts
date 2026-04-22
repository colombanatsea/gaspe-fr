"use client";

import { useEffect, useRef } from "react";

const REVEAL_SELECTOR = ".reveal, .reveal-scale, .reveal-left";

/**
 * Observes elements with .reveal / .reveal-scale / .reveal-left and adds
 * `.revealed` when they enter the viewport.
 *
 * Les éléments apparaissant APRÈS le premier render (onglets CCN 3228,
 * contenus chargés async, sections CMS rendues après fetch) sont détectés
 * via un MutationObserver : sans ça, ils conservent leur `opacity: 0`
 * par défaut et l'utilisateur voit un panneau vide.
 */
export function useScrollReveal() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
            intersectionObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );

    function observeAll() {
      root!.querySelectorAll(REVEAL_SELECTOR).forEach((el) => {
        if (!el.classList.contains("revealed")) {
          intersectionObserver.observe(el);
        }
      });
    }

    observeAll();

    // Re-observe sur toute mutation du sous-arbre (ajout d'onglet,
    // hydratation CMS, etc.). Les nœuds déjà observés sont ignorés par
    // IntersectionObserver — pas de doublon.
    const mutationObserver = new MutationObserver(observeAll);
    mutationObserver.observe(root, { childList: true, subtree: true });

    return () => {
      intersectionObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, []);

  return containerRef;
}
