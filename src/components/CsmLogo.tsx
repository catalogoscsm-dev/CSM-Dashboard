interface Props {
  size?: number
}

export default function CsmLogo({ size = 32 }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="CSM Logo"
    >
      <polygon
        points="16,2 28,9 28,23 16,30 4,23 4,9"
        fill="#0D1B2A"
        stroke="#C9A84C"
        strokeWidth="1.5"
      />
      <path
        d="M 19 10 L 13 10 Q 8 10 8 16 Q 8 22 13 22 L 19 22"
        fill="none"
        stroke="#C9A84C"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M 21 11 Q 26 11 26 15 Q 26 16 21 16 Q 16 16 16 20 Q 16 24 21 24"
        fill="none"
        stroke="#C9A84C"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}
