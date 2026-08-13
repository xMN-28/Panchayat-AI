import { Waveform } from "@phosphor-icons/react";
import { Link } from "react-router-dom";

type BrandProps = {
  to?: string;
  compact?: boolean;
  inverse?: boolean;
};

export default function Brand({ to = "/", compact = false, inverse = false }: BrandProps) {
  return (
    <Link className={`brand ${compact ? "brand-compact" : ""} ${inverse ? "brand-inverse" : ""}`} to={to} aria-label="Panchayat AI home">
      <span className="brand-mark" aria-hidden="true"><Waveform size={24} weight="bold" /></span>
      <span className="brand-copy">Panchayat <i>AI</i>{compact ? null : <small>COMMUNITY OPERATING SYSTEM</small>}</span>
    </Link>
  );
}
