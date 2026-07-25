type BrandMarkProps = {
  compact?: boolean;
};

export function BrandMark({ compact = false }: BrandMarkProps) {
  return (
    <p className={compact ? "brand brand-mark compact" : "brand brand-mark"}>
      <img src="/logo.svg" alt="Spell Quest" width={28} height={28} />
      <span>Spell Quest</span>
    </p>
  );
}
