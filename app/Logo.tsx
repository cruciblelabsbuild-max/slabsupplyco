export default function Logo() {
  return (
    <a className="brand" href="/#top" aria-label="Slab Supply home">
      <svg className="brand-mark" viewBox="0 0 58 56" aria-hidden="true">
        <g className="brand-mark-back" transform="rotate(-9 20 29)">
          <rect x="5" y="8" width="32" height="43" rx="6" />
          <rect x="9" y="12" width="24" height="7" rx="2" />
          <rect x="9" y="23" width="24" height="23" rx="2" />
        </g>
        <g className="brand-mark-front">
          <rect className="brand-slab-shell" x="18" y="4" width="35" height="47" rx="7" />
          <rect className="brand-slab-label" x="22" y="8" width="27" height="9" rx="2.5" />
          <circle cx="27" cy="12.5" r="1.5" />
          <path d="M30 11.2h15M30 14h10" />
          <rect className="brand-slab-art" x="22" y="21" width="27" height="25" rx="3" />
          <path className="brand-orbit" d="M27 37c3.6-8.5 12.1-12.2 18-8.4 5.8 3.8 2.1 11.9-5.2 13.1-7.4 1.2-13.9-5.2-10.5-10.4 3.2-5 12.2-5.9 16.6-.8" />
          <path className="brand-star" d="m37.2 25.2 1.2 3.2 3.2 1.2-3.2 1.2-1.2 3.2-1.2-3.2-3.2-1.2 3.2-1.2 1.2-3.2Z" />
        </g>
      </svg>
      <span className="brand-lockup">
        <span className="brand-name"><b>Slab</b><em>Supply</em></span>
        <span className="brand-tag">Buy · Trade · Collect</span>
      </span>
    </a>
  );
}
