import Image from 'next/image';

export function Logo({
  size = 28,
  textClassName = 'text-lg',
  className = '',
}: {
  size?: number;
  textClassName?: string;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-2 font-display font-bold text-ink ${className}`}>
      <Image src="/logo-icon.svg" alt="" width={size} height={size} priority />
      <span className={textClassName}>TaskFlow</span>
    </span>
  );
}
