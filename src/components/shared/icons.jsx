function SvgIcon({ children, size = 18, strokeWidth = 1.9, className = '' }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

export function LayersIcon(props) {
  return (
    <SvgIcon {...props}>
      <path d="M12 3 3 8l9 5 9-5-9-5Z" />
      <path d="m3 12 9 5 9-5" />
      <path d="m3 16 9 5 9-5" />
    </SvgIcon>
  )
}

export function GridIcon(props) {
  return (
    <SvgIcon {...props}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </SvgIcon>
  )
}

export function BookIcon(props) {
  return (
    <SvgIcon {...props}>
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
    </SvgIcon>
  )
}

export function BoltIcon(props) {
  return (
    <SvgIcon {...props}>
      <path d="M13 2 3 14h7l-1 8 10-12h-7l1-8Z" />
    </SvgIcon>
  )
}

export function PuzzleIcon(props) {
  return (
    <SvgIcon {...props}>
      <path d="M12 6.2c0-1.8 1.4-3.2 3.2-3.2S18.5 4.4 18.5 6.2V8H21v4.5h-2.5V15c0 1.8-1.4 3.2-3.2 3.2S12 16.8 12 15v-1H9.5v2.5H5V14H3v-4.5h2V7h4.5v-.8c0-1.8 1.4-3.2 3.2-3.2S16 4.4 16 6.2" />
    </SvgIcon>
  )
}

export function ChartIcon(props) {
  return (
    <SvgIcon {...props}>
      <path d="M18 20V10" />
      <path d="M12 20V4" />
      <path d="M6 20v-6" />
    </SvgIcon>
  )
}

export function TrendIcon(props) {
  return (
    <SvgIcon {...props}>
      <path d="m4 16 5-5 4 4 7-7" />
      <path d="M14 8h6v6" />
    </SvgIcon>
  )
}

export function SearchIcon(props) {
  return (
    <SvgIcon {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </SvgIcon>
  )
}

export function BellIcon(props) {
  return (
    <SvgIcon {...props}>
      <path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5" />
      <path d="M9 17a3 3 0 0 0 6 0" />
    </SvgIcon>
  )
}

export function ShieldIcon(props) {
  return (
    <SvgIcon {...props}>
      <path d="M12 3c2.2 1.8 4.7 2.8 7.5 3v5.4c0 4.7-3 8.9-7.5 10.6-4.5-1.7-7.5-5.9-7.5-10.6V6c2.8-.2 5.3-1.2 7.5-3Z" />
    </SvgIcon>
  )
}

export function CheckBadgeIcon(props) {
  return (
    <SvgIcon {...props}>
      <path d="M9 12l2 2 4-4" />
      <path d="M7.8 4.7c.6 0 1.2-.3 1.9-.8a3.4 3.4 0 0 1 4.4 0c.7.5 1.3.8 1.9.8a3.4 3.4 0 0 1 3.1 3.1c0 .6.3 1.2.8 1.9a3.4 3.4 0 0 1 0 4.4c-.5.7-.8 1.3-.8 1.9a3.4 3.4 0 0 1-3.1 3.1c-.6 0-1.2.3-1.9.8a3.4 3.4 0 0 1-4.4 0c-.7-.5-1.3-.8-1.9-.8A3.4 3.4 0 0 1 4.7 16c0-.6-.3-1.2-.8-1.9a3.4 3.4 0 0 1 0-4.4c.5-.7.8-1.3.8-1.9a3.4 3.4 0 0 1 3.1-3.1Z" />
    </SvgIcon>
  )
}

export function MapIcon(props) {
  return (
    <SvgIcon {...props}>
      <path d="m3 6 6-2 6 2 6-2v14l-6 2-6-2-6 2V6Z" />
      <path d="M9 4v14" />
      <path d="M15 6v14" />
    </SvgIcon>
  )
}

export function PlayIcon(props) {
  return (
    <SvgIcon {...props}>
      <path d="m8 6 10 6-10 6V6Z" />
    </SvgIcon>
  )
}

export function ClockIcon(props) {
  return (
    <SvgIcon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </SvgIcon>
  )
}

export function SparkIcon(props) {
  return (
    <SvgIcon {...props}>
      <path d="m12 3 1.2 4.3L17.5 8.5l-4.3 1.2L12 14l-1.2-4.3L6.5 8.5l4.3-1.2L12 3Z" />
      <path d="m19 14 .7 2.3L22 17l-2.3.7L19 20l-.7-2.3L16 17l2.3-.7L19 14Z" />
      <path d="m5 14 .9 2.8L8.7 18l-2.8.9L5 21.7l-.9-2.8L1.3 18l2.8-.9L5 14Z" />
    </SvgIcon>
  )
}

export function ReviewIcon(props) {
  return (
    <SvgIcon {...props}>
      <path d="M9 3h6" />
      <path d="M10 8H8a4 4 0 0 0-4 4v2a4 4 0 0 0 4 4h2" />
      <path d="M14 8h2a4 4 0 0 1 4 4v2a4 4 0 0 1-4 4h-2" />
      <path d="m10 14 4-4" />
      <path d="m10 10 4 4" />
    </SvgIcon>
  )
}

export function QueueIcon(props) {
  return (
    <SvgIcon {...props}>
      <rect x="4" y="5" width="16" height="4" rx="2" />
      <rect x="4" y="11" width="16" height="4" rx="2" />
      <rect x="4" y="17" width="10" height="4" rx="2" />
    </SvgIcon>
  )
}

export function FlameIcon(props) {
  return (
    <SvgIcon {...props}>
      <path d="M12.5 3s1.5 2 1.5 4a4 4 0 0 1-8 0c0-1.8 1-3.4 2.2-4.7 0 0-.4 2.7 1.8 4.2 0 0 .2-2.2 2.5-3.5Z" />
      <path d="M14.5 12.5a3.5 3.5 0 1 1-7 0c0-1.1.5-2.1 1.3-2.8.1 1.5 1.2 2.5 2.7 2.5 1.2 0 2.3-.8 2.6-1.9.3.6.4 1.3.4 2.2Z" />
    </SvgIcon>
  )
}

export function TargetIcon(props) {
  return (
    <SvgIcon {...props}>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
    </SvgIcon>
  )
}

export function PencilIcon(props) {
  return (
    <SvgIcon {...props}>
      <path d="m4 20 4.5-1 9.8-9.8a2.1 2.1 0 0 0-3-3L5.5 16 4 20Z" />
      <path d="m13.5 6.5 4 4" />
    </SvgIcon>
  )
}

export function DownloadIcon(props) {
  return (
    <SvgIcon {...props}>
      <path d="M12 3v10" />
      <path d="m8 10 4 4 4-4" />
      <path d="M4 19h16" />
    </SvgIcon>
  )
}

export function TrophyIcon(props) {
  return (
    <SvgIcon {...props}>
      <path d="M8 4h8v2a4 4 0 0 1-8 0V4Z" />
      <path d="M6 6H4a3 3 0 0 0 3 3" />
      <path d="M18 6h2a3 3 0 0 1-3 3" />
      <path d="M12 10v4" />
      <path d="M8 20h8" />
      <path d="M10 14h4l1 6H9l1-6Z" />
    </SvgIcon>
  )
}

export function ReloadIcon(props) {
  return (
    <SvgIcon {...props}>
      <path d="M21 12a9 9 0 1 1-2.6-6.4" />
      <path d="M21 3v6h-6" />
    </SvgIcon>
  )
}

export function EyeIcon(props) {
  return (
    <SvgIcon {...props}>
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </SvgIcon>
  )
}

export function BrainIcon(props) {
  return (
    <SvgIcon {...props}>
      <path d="M9.5 5.5a3 3 0 0 1 5 2.2v.4a3.4 3.4 0 0 1 2.5 3.2 3.3 3.3 0 0 1-1.2 2.5 3.5 3.5 0 0 1-3.3 5.2H12" />
      <path d="M14.5 5.5a3 3 0 0 0-5 2.2v.4A3.4 3.4 0 0 0 7 11.3a3.3 3.3 0 0 0 1.2 2.5 3.5 3.5 0 0 0 3.3 5.2H12" />
      <path d="M12 8v8" />
      <path d="M9.5 10.5H12" />
      <path d="M12 14h2.5" />
    </SvgIcon>
  )
}

export function SlidersIcon(props) {
  return (
    <SvgIcon {...props}>
      <path d="M4 21v-7" />
      <path d="M4 10V3" />
      <path d="M12 21v-4" />
      <path d="M12 13V3" />
      <path d="M20 21v-9" />
      <path d="M20 8V3" />
      <path d="M2 14h4" />
      <path d="M10 13h4" />
      <path d="M18 8h4" />
    </SvgIcon>
  )
}

export function SettingsIcon(props) {
  return <SlidersIcon {...props} />
}
