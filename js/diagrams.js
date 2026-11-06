/**
 * Light decorative SVG icons (topic cards + feedback). No per-question math diagrams.
 */
(function (global) {
  'use strict';

  function iconSvg(inner) {
    return (
      '<span class="topic-icon" aria-hidden="true">' +
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" class="topic-icon-svg">' +
      inner +
      '</svg></span>'
    );
  }

  var ICONS = {
    decimal:
      '<circle cx="24" cy="24" r="20" class="ti-bg"/>' +
      '<text x="24" y="30" text-anchor="middle" class="ti-sym">±</text>',
    fraction:
      '<circle cx="24" cy="24" r="20" class="ti-bg"/>' +
      '<text x="24" y="20" text-anchor="middle" class="ti-sym-sm">1</text>' +
      '<line x1="16" y1="24" x2="32" y2="24" class="ti-avg"/>' +
      '<text x="24" y="36" text-anchor="middle" class="ti-sym-sm">2</text>',
    word:
      '<circle cx="24" cy="24" r="20" class="ti-bg"/>' +
      '<text x="24" y="30" text-anchor="middle" class="ti-sym-sm">文</text>',
    average:
      '<circle cx="24" cy="24" r="20" class="ti-bg"/>' +
      '<rect x="10" y="28" width="6" height="10" rx="1" class="ti-bar"/>' +
      '<rect x="21" y="18" width="6" height="20" rx="1" class="ti-bar"/>' +
      '<rect x="32" y="12" width="6" height="26" rx="1" class="ti-bar"/>' +
      '<line x1="8" y1="22" x2="40" y2="22" class="ti-avg" stroke-dasharray="3 2"/>',
    area:
      '<circle cx="24" cy="24" r="20" class="ti-bg"/>' +
      '<rect x="12" y="14" width="24" height="18" rx="2" class="ti-shape"/>',
    volume:
      '<circle cx="24" cy="24" r="20" class="ti-bg"/>' +
      '<polygon points="16,30 28,30 34,22 22,22" class="ti-shape ti-dim"/>' +
      '<polygon points="16,18 28,18 28,30 16,30" class="ti-shape"/>' +
      '<polygon points="28,18 34,12 34,22 28,30" class="ti-shape ti-side"/>',
    algebra:
      '<circle cx="24" cy="24" r="20" class="ti-bg"/>' +
      '<text x="24" y="30" text-anchor="middle" class="ti-sym">𝑥</text>',
    equation:
      '<circle cx="24" cy="24" r="20" class="ti-bg"/>' +
      '<text x="24" y="29" text-anchor="middle" class="ti-sym-sm">𝑥=?</text>',
    mixed:
      '<circle cx="24" cy="24" r="20" class="ti-bg ti-bg--star"/>' +
      '<text x="24" y="30" text-anchor="middle" class="ti-sym">★</text>'
  };

  function topicIcon(id) {
    return iconSvg(ICONS[id] || ICONS.mixed);
  }

  function feedbackIcon(ok) {
    if (ok) {
      return (
        '<span class="fb-icon" aria-hidden="true">' +
        '<svg viewBox="0 0 32 32" class="fb-svg">' +
        '<circle cx="16" cy="16" r="15" class="fb-circle ok"/>' +
        '<path d="M9 16.5 L14 21.5 L23 11" class="fb-check" fill="none"/>' +
        '</svg></span>'
      );
    }
    return (
      '<span class="fb-icon" aria-hidden="true">' +
      '<svg viewBox="0 0 32 32" class="fb-svg">' +
      '<circle cx="16" cy="16" r="15" class="fb-circle no"/>' +
      '<path d="M11 11 L21 21 M21 11 L11 21" class="fb-cross" fill="none"/>' +
      '</svg></span>'
    );
  }

  global.Diagrams = {
    topicIcon: topicIcon,
    feedbackIcon: feedbackIcon,
    ICONS: ICONS
  };
})(typeof window !== 'undefined' ? window : globalThis);
