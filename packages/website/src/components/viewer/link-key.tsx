const Swatch = ({ isWrite }: { isWrite: boolean }) => (
  <svg width={14} height={10} aria-hidden>
    <rect
      x={0.5}
      y={0.5}
      width={13}
      height={9}
      rx={2}
      fill="currentColor"
      fillOpacity={0.15}
      stroke="currentColor"
      strokeOpacity={0.6}
      strokeDasharray={isWrite ? "3 2" : undefined}
    />
  </svg>
);

export const LinkKey = () => (
  <div className="hidden shrink-0 items-center gap-3 sm:flex">
    <span className="flex items-center gap-1.5">
      <Swatch isWrite={false} />
      compiles to or reads
    </span>
    <span className="flex items-center gap-1.5">
      <Swatch isWrite />
      writes
    </span>
  </div>
);
