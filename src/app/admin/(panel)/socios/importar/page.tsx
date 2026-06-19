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
      <h1 className="mb-2 mt-2 font-display text-2xl font-extrabold uppercase text-neutral-900">
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
