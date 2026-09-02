import { ImportarSocios } from "./ImportarSocios";
import { CabeceraPagina, CuerpoPagina } from "../../ui";

export default function ImportarSociosPage() {
  return (
    <>
      <CabeceraPagina
        titulo="Importar socios"
        descripcion="Importa múltiples socios desde un archivo CSV. Los que tengan IBAN se darán de alta automáticamente en Stripe con domiciliación bancaria."
        volver={{ href: "/admin/socios", label: "Volver a socios" }}
      />
      <CuerpoPagina>
      <ImportarSocios />
      </CuerpoPagina>
    </>
  );
}
