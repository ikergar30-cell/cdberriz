"use client";

export function BotonEliminar({ accion }: { accion: () => Promise<void> }) {
  return (
    <form
      action={accion}
      onSubmit={(e) => {
        if (
          !confirm(
            "¿Eliminar este socio? Esta acción no se puede deshacer y su número de socio " +
              "quedará hueco para siempre (nunca se reasigna a otro socio).\n\n" +
              "Si el socio simplemente ha causado baja, usa \"Cancelar renovación\" en su ficha " +
              "en vez de eliminarlo: así conserva su historial y su número.",
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        className="rounded-full border border-rojo px-4 py-2 text-sm font-semibold text-rojo transition hover:bg-rojo hover:text-white"
      >
        Eliminar
      </button>
    </form>
  );
}
