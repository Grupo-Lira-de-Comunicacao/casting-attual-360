import Image from 'next/image';

type TalentImageProps = {
  src: string | null;
  alt: string;
  priority?: boolean;
  sizes: string;
  className?: string;
};

export function TalentImage({ src, alt, priority = false, sizes, className = 'object-cover' }: TalentImageProps) {
  if (!src) {
    return (
      <div role="img" aria-label={`${alt} — imagem ainda não cadastrada`} className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue/30 to-teal/15 p-6 text-center text-sm font-bold text-white/70">
        Imagem ainda não cadastrada
      </div>
    );
  }

  return <Image src={src} alt={alt} fill priority={priority} sizes={sizes} className={className} />;
}

