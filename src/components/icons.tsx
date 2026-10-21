import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement> & { size?: number };
const base = (size = 20, rest: SVGProps<SVGSVGElement>) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  ...rest,
});

export const IconSearch = ({ size, ...r }: P) => (
  <svg {...base(size, r)}><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2" /></svg>
);
export const IconBag = ({ size, ...r }: P) => (
  <svg {...base(size, r)}><path d="M5 8h14l-1 12H6L5 8Z" /><path d="M9 8V7a3 3 0 0 1 6 0v1" /></svg>
);
export const IconHeart = ({ size, ...r }: P) => (
  <svg {...base(size, r)}><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" /></svg>
);
export const IconArrow = ({ size, ...r }: P) => (
  <svg {...base(size, r)}><path d="M4 12h16m-6-6 6 6-6 6" /></svg>
);
export const IconClose = ({ size, ...r }: P) => (
  <svg {...base(size, r)}><path d="M6 6l12 12M18 6 6 18" /></svg>
);
export const IconMenu = ({ size, ...r }: P) => (
  <svg {...base(size, r)}><path d="M4 7h16M4 12h16M4 17h10" /></svg>
);
export const IconFilter = ({ size, ...r }: P) => (
  <svg {...base(size, r)}><path d="M4 6h16M7 12h10M10 18h4" /></svg>
);
export const IconCheck = ({ size, ...r }: P) => (
  <svg {...base(size, r)}><path d="m5 12 5 5 9-10" /></svg>
);
export const IconWhatsapp = ({ size, ...r }: P) => (
  <svg {...base(size, r)}>
    <path d="M5 18.5c-1.4-1.5-2-3.4-2-5.5a9 9 0 1 1 4.3 7.7L3 21.5l2-3Z" />
    <path d="M9 8.6c0 3.2 2.2 5.9 5.6 6.4l1-1.5-2-1-.9.8c-1-.5-1.9-1.4-2.4-2.4l.8-.9-1-2L9 8.6Z" />
  </svg>
);
export const IconTruck = ({ size, ...r }: P) => (
  <svg {...base(size, r)}><path d="M3 7h11v9H3zM14 10h4l3 3v3h-7" /><circle cx="7" cy="17.5" r="1.8" /><circle cx="17" cy="17.5" r="1.8" /></svg>
);
export const IconQr = ({ size, ...r }: P) => (
  <svg {...base(size, r)}><rect x="4" y="4" width="6" height="6" /><rect x="14" y="4" width="6" height="6" /><rect x="4" y="14" width="6" height="6" /><path d="M14 14h2v2h-2zM18 18h2v2h-2zM14 18h2M18 14h2" /></svg>
);
export const IconCard = ({ size, ...r }: P) => (
  <svg {...base(size, r)}><rect x="3" y="6" width="18" height="13" rx="1" /><path d="M3 10h18M7 15h3" /></svg>
);
export const IconShield = ({ size, ...r }: P) => (
  <svg {...base(size, r)}><path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3Z" /><path d="m9 12 2 2 4-4" /></svg>
);
export const IconDrop = ({ size, ...r }: P) => (
  <svg {...base(size, r)}><path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11Z" /></svg>
);
export const IconInstagram = ({ size, ...r }: P) => (
  <svg {...base(size, r)}><rect x="3.5" y="3.5" width="17" height="17" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.2" cy="6.8" r=".6" fill="currentColor" /></svg>
);
export const IconChevron = ({ size, ...r }: P) => (
  <svg {...base(size, r)}><path d="m9 6 6 6-6 6" /></svg>
);
export const IconMail = ({ size, ...r }: P) => (
  <svg {...base(size, r)}><rect x="3" y="5" width="18" height="14" rx="1" /><path d="m3 7 9 6 9-6" /></svg>
);

/** Estrella de ocho puntas, ornamento secundario de la marca. */
export const Star8 = ({ size, ...r }: P) => (
  <svg {...base(size, r)} strokeWidth={1.2}>
    <rect x="6" y="6" width="12" height="12" />
    <rect x="6" y="6" width="12" height="12" transform="rotate(45 12 12)" />
  </svg>
);
