import { Link } from "@/i18n/routing";
import type { ComponentProps } from "react";

type Variant = "primary" | "secondary" | "outline" | "light";

const styles: Record<Variant, string> = {
  primary: "bg-rojo text-white hover:bg-rojo-600",
  secondary: "bg-azul text-white hover:bg-azul-700",
  outline:
    "border border-neutral-300 text-neutral-800 hover:border-azul hover:text-azul",
  light: "bg-white text-azul-700 hover:bg-neutral-100",
};

export function LinkButton({
  href,
  variant = "primary",
  className = "",
  children,
}: {
  href: ComponentProps<typeof Link>["href"];
  variant?: Variant;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold transition ${styles[variant]} ${className}`}
    >
      {children}
    </Link>
  );
}
