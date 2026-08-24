interface Props {
  size?: number
}

export default function CsmLogo({ size = 32 }: Props) {
  return (
    <img
      src={`${import.meta.env.BASE_URL}csm-logo.png`}
      width={size}
      height={size}
      alt="CSM Logo"
      className="logo-glow"
      style={{ objectFit: 'contain', display: 'block' }}
    />
  )
}
