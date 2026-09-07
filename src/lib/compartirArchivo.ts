// Entrega un archivo al usuario de forma fiable en móvil y escritorio.
//
// En el móvil (iOS/Android) usa la hoja de compartir del sistema —guardar en
// Archivos, enviar por WhatsApp, por email…—, que es lo que de verdad funciona;
// crear un <a download> con una URL de blob no descarga bien en iOS Safari.
// En escritorio descarga normal, revocando la URL con margen (revocarla al
// instante corta la descarga en algunos navegadores).
export async function compartirODescargar(
  blob: Blob,
  nombre: string,
): Promise<"compartido" | "descargado" | "cancelado"> {
  const tipo = blob.type || (nombre.endsWith(".zip") ? "application/zip" : "application/pdf");
  const file = new File([blob], nombre, { type: tipo });

  if (typeof navigator !== "undefined" && typeof navigator.canShare === "function") {
    let puedeCompartir = false;
    try {
      puedeCompartir = navigator.canShare({ files: [file] });
    } catch {
      puedeCompartir = false;
    }
    if (puedeCompartir) {
      try {
        await navigator.share({ files: [file], title: nombre });
        return "compartido";
      } catch (e) {
        // Si el usuario cierra la hoja de compartir, no seguimos con la descarga.
        if (e instanceof DOMException && e.name === "AbortError") return "cancelado";
        // Otro fallo: caemos a la descarga clásica.
      }
    }
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombre;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  return "descargado";
}

// Decodifica el PDF en base64 que devuelve el endpoint de firma a un Blob.
export function pdfBase64ABlob(base64: string): Blob {
  const binario = atob(base64);
  const bytes = new Uint8Array(binario.length);
  for (let i = 0; i < binario.length; i++) bytes[i] = binario.charCodeAt(i);
  return new Blob([bytes], { type: "application/pdf" });
}
