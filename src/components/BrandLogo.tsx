type BrandLogoProps = {
  className?: string;
};

export function BrandLogo({ className = 'h-10 w-10' }: BrandLogoProps) {
  return (
    <img
      src={`${process.env.PUBLIC_URL}/cbmsp.svg`}
      alt="Logotipo do Corpo de Bombeiros da Polícia Militar do Estado de São Paulo"
      className={`block shrink-0 object-contain ${className}`}
      draggable={false}
    />
  );
}
