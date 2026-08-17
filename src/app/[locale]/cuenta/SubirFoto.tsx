"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { subirFotoCarnet } from "./actions";

export function SubirFoto() {
  const locale = useLocale();
  const eu = locale === "eu";
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pendiente, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    setError(null);
    const formData = new FormData();
    formData.set("foto", archivo);
    startTransition(async () => {
      const r = await subirFotoCarnet(formData);
      if (r?.error) setError(r.error);
      else router.refresh();
      if (inputRef.current) inputRef.current.value = "";
    });
  }

  return (
    <div className="mt-3 text-center">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={onChange}
        disabled={pendiente}
        className="hidden"
        id="foto-carnet"
      />
      <label
        htmlFor="foto-carnet"
        className="inline-block cursor-pointer text-xs font-semibold text-azul underline hover:text-azul-700 aria-disabled:cursor-not-allowed aria-disabled:opacity-60"
        aria-disabled={pendiente}
      >
        {pendiente
          ? eu ? "Igotzen…" : "Subiendo…"
          : eu ? "Argazkia igo/aldatu" : "Subir / cambiar foto"}
      </label>
      {error && <p className="mt-1 text-xs font-semibold text-rojo">{error}</p>}
    </div>
  );
}
