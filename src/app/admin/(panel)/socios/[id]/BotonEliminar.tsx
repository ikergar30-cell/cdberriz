"use client";

export function BotonEliminar({ accion }: { accion: () => Promise<void> }) {
  return (
    <form
      action={accion}
      onSubmit={(e) => {
        if (!confirm("¿Eliminar este socio? Esta acción no se puede deshacer.")) {
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
