import Link from "next/link";
import { ImportarSocios } from "./ImportarSocios";

export default function ImportarSociosPage() {
  return (
    <div className="p-6 md:p-8">
      <Link
        href="/admin/socios"
        className="text-sm font-semibold text-neutral-500 hover:text-neutral-800"
      >
        ← Volver a socios
      </Link>
      <h1 className="mb-2 mt-2 font-display text-[28px] font-extrabold uppercase leading-none tracking-tight text-azul-900 md:text-[32px]">
        Importar socios
      </h1>
      <p className="mb-6 text-sm text-neutral-500">
        Importa múltiples socios desde un archivo CSV. Los que tengan IBAN se darán de alta
        automáticamente en Stripe con domiciliación bancaria.
      </p>
      <ImportarSocios />
    </div>
  );
}
