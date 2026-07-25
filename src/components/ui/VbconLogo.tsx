interface VbconLogoProps {
  /** 'mark' = só o ícone V+quadrado | 'full' = ícone + wordmark horizontal */
  variant?: 'mark' | 'full'
  /** Altura do ícone em px */
  size?: number
}

const montserrat = "'Montserrat', 'Arial Black', sans-serif"

/** Marca VBCON — V que ultrapassa a borda do quadrado, fiel à logo real */
function Mark({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0 }}
    >
      {/* Quadrado — começa em y=10 para dar espaço ao V acima */}
      <rect x="3" y="10" width="34" height="28" stroke="#1a1a1a" strokeWidth="2.8" fill="none" />
      {/* V laranja — braços começam em y=2, acima da borda do quadrado */}
      <polygon points="3,2 12,2 20,34 28,2 37,2 20,38" fill="#f97316" />
    </svg>
  )
}

export default function VbconLogo({ variant = 'full', size = 36 }: VbconLogoProps) {
  if (variant === 'mark') return <Mark size={size} />

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <Mark size={size} />
      <div style={{ lineHeight: 1 }}>
        <p style={{
          fontFamily: montserrat,
          fontWeight: 900,
          fontSize: size * 0.47,
          color: '#1a1a1a',
          letterSpacing: '-0.02em',
          lineHeight: 1,
          margin: 0,
        }}>
          VBCON
        </p>
        <p style={{
          fontFamily: montserrat,
          fontWeight: 600,
          fontSize: size * 0.22,
          color: '#f97316',
          letterSpacing: '0.14em',
          lineHeight: 1,
          marginTop: size * 0.1,
          marginBottom: 0,
        }}>
          ENGENHARIA
        </p>
      </div>
    </div>
  )
}
