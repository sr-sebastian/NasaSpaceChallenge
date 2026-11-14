/* Iconos de trazo (24×24, 1.75 px). Dibujados a mano para no depender de fuentes de símbolos. */
const P: Record<string, string> = {
  sun: 'M12 7.5a4.5 4.5 0 1 0 0 9a4.5 4.5 0 1 0 0-9M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8',
  earth: 'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18M3.6 9h16.8M3.6 15h16.8M12 3c2.6 2.6 3.6 5.6 3.6 9s-1 6.4-3.6 9M12 3C9.4 5.6 8.4 8.6 8.4 12s1 6.4 3.6 9',
  aerial: 'M3 18l5-9l4 6l3-4l6 7zM8 5h.01',
  play: 'M8 5.5v13l10-6.5z',
  pause: 'M8 5v14M16 5v14',
  star: 'M12 3.5l2.6 5.3l5.9.9l-4.25 4.1l1 5.8L12 16.9l-5.25 2.7l1-5.8L3.5 9.7l5.9-.9z',
  close: 'M6 6l12 12M18 6L6 18',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  download: 'M12 4v11m0 0l-4.5-4.5M12 15l4.5-4.5M5 19.5h14',
  link: 'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1',
  guide: 'M12 6.5C10 5 7 4.5 4 5v13c3-.5 6 0 8 1.5c2-1.5 5-2 8-1.5V5c-3-.5-6 0-8 1.5zM12 6.5v13',
  info: 'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18M12 11v5M12 7.5h.01',
  reset: 'M4.5 12a7.5 7.5 0 1 0 2.2-5.3M4.5 4.5v4h4',
  chevron: 'M6 9l6 6l6-6',
  battery: 'M3 8h15v8H3zM21 11v2M6 11h5',
  calendar: 'M4 6h16v14H4zM4 10h16M8 3.5v4M16 3.5v4',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  alert: 'M12 4l9 16H3zM12 10v4M12 17h.01',
};
export type IconName = keyof typeof P;

export function Icon({ name, size = 18, fill = false, className }: { name: IconName; size?: number; fill?: boolean; className?: string }) {
  return (
    <svg className={`ico ${className ?? ''}`} width={size} height={size} viewBox="0 0 24 24" aria-hidden focusable="false"
      fill={fill ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={fill ? 0 : 1.75} strokeLinecap="round" strokeLinejoin="round">
      <path d={P[name]} />
    </svg>
  );
}
