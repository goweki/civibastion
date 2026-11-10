import Image from "next/image";

type BrandLogoProps = {
  priority?: boolean;
  className?: string;
};

export function BrandLogo({ priority = false, className }: BrandLogoProps) {
  return (
    <Image
      src="/brand/civibastion-logo.svg"
      alt="CiviBastion"
      width={240}
      height={48}
      priority={priority}
      unoptimized
      className={className}
    />
  );
}
