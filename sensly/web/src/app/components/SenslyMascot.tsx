import { AxolotlSvg } from './AxolotlSvg';

interface SenslyMascotProps {
  risk?: number;
  size?: 'small' | 'medium' | 'large';
  animate?: boolean;
  className?: string;
}

export function SenslyMascot({ risk = 0, size = 'medium', animate = true, className = '' }: SenslyMascotProps) {
  const dims = { small: 80, medium: 128, large: 160 };
  const s = dims[size];

  const mood =
    risk > 85 ? 'stressed' as const :
    risk > 70 ? 'alert' as const :
    risk > 40 ? 'thinking' as const :
    'happy' as const;

  return <AxolotlSvg mood={mood} size={s} animate={animate} className={className} />;
}
