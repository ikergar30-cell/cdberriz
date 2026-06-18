"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

// Pantalla de bienvenida de la página de Historia: un overlay con el escudo del
// club que aparece y DESAPARECE de forma automática a los ~1,8 s. Empieza oculto
// y solo se activa tras montar en cliente, para no tapar el contenido si JS no
// se ejecuta. Respeta "prefers-reduced-motion" (no se muestra).
export function HistoriaIntro({ lema }: { lema: string }) {
  const [fase, setFase] = useState<"oculto" | "visible" | "saliendo" | "fin">("oculto");

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    setFase("visible");
    const t1 = setTimeout(() => setFase("saliendo"), 1300); // empieza a desvanecerse
    const t2 = setTimeout(() => setFase("fin"), 1850); // se retira del DOM
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  if (fase === "oculto" || fase === "fin") return null;

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 z-[120] flex flex-col items-center justify-center bg-azul transition-opacity duration-500 ${
        fase === "saliendo" ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="flex animate-[fadeUp_0.6s_ease-out] flex-col items-center">
        <Image
          src="/escudo-blanco.png"
          alt=""
          width={130}
          height={130}
          priority
          className="h-28 w-auto md:h-32"
        />
        <p className="mt-5 font-display text-lg font-bold uppercase tracking-widest text-white/90">
          C.D. Berriz
        </p>
        <p className="mt-1 text-sm text-white/60">{lema}</p>
      </div>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}
