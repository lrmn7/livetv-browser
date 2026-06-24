'use client';

interface Props {
  src?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizes = {
  sm: 'h-9 w-9 text-xs',
  md: 'h-12 w-12 text-sm',
  lg: 'h-16 w-16 text-lg',
};

export default function ChannelLogo({ src, name, size = 'md' }: Props) {
  const initial = name.trim().charAt(0).toUpperCase() || 'TV';

  if (!src) {
    return (
      <div className={`${sizes[size]} flex flex-shrink-0 items-center justify-center rounded-xl bg-white/10 font-bold text-white/50`}>
        {initial}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      className={`${sizes[size]} flex-shrink-0 rounded-xl bg-white/5 object-contain p-1`}
      onError={(event) => {
        event.currentTarget.style.display = 'none';
      }}
    />
  );
}
