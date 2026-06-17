// Importa las noticias del export WordPress (WXR) de la web antigua a Sanity.
//
// Uso:
//   node --env-file=.env.local scripts/migrar-noticias.mjs --dry   (prueba, no escribe)
//   node --env-file=.env.local scripts/migrar-noticias.mjs         (importa de verdad)
//
// Requiere SANITY_API_WRITE_TOKEN en .env.local para la importación real.
import fs from "fs";
import { XMLParser } from "fast-xml-parser";
import { parse as parseHTML } from "node-html-parser";
import { createClient } from "@sanity/client";

const args = process.argv.slice(2);
const DRY = args.includes("--dry");
const fileArg = args.find((a) => !a.startsWith("--"));
const FILE = fileArg || `${process.env.HOME}/Downloads/blog-export.xml`;

// Mapa de categorías de la web antigua → valores de nuestro schema
const CATEGORIA = {
  "primer equipo": "primer-equipo",
  club: "club",
  cantera: "cantera",
  "socio/as": "socios",
  "socios/as": "socios",
  socios: "socios",
};

function slugify(s) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

const ENT = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&apos;": "'",
  "&nbsp;": " ",
};
const decode = (s) =>
  (s || "")
    .replace(/&amp;|&lt;|&gt;|&quot;|&#39;|&apos;|&nbsp;/g, (m) => ENT[m])
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n));

let keyN = 0;
const newKey = () => "k" + (keyN++).toString(36);

const fixUrl = (src) => {
  if (!src) return null;
  if (src.startsWith("//")) return "https:" + src;
  if (src.startsWith("http")) return src;
  return null;
};

// Convierte los hijos inline de un nodo en spans de Portable Text (+ markDefs)
function inlineSpans(node, markDefs, active = []) {
  const spans = [];
  for (const child of node.childNodes) {
    if (child.nodeType === 3) {
      const text = decode(child.rawText);
      if (text) spans.push({ _type: "span", _key: newKey(), text, marks: [...active] });
      continue;
    }
    const tag = child.rawTagName?.toLowerCase();
    if (!tag || tag === "img") continue;
    if (tag === "br") {
      spans.push({ _type: "span", _key: newKey(), text: "\n", marks: [...active] });
      continue;
    }
    const marks = [...active];
    if (tag === "strong" || tag === "b") marks.push("strong");
    else if (tag === "em" || tag === "i") marks.push("em");
    else if (tag === "a") {
      const href = child.getAttribute("href");
      if (href) {
        const k = newKey();
        markDefs.push({ _key: k, _type: "link", href });
        marks.push(k);
      }
    }
    spans.push(...inlineSpans(child, markDefs, marks));
  }
  return spans;
}

function makeBlock(style, node, listItem) {
  const markDefs = [];
  const children = inlineSpans(node, markDefs);
  const text = children.map((c) => c.text).join("").trim();
  if (!text) return null;
  const block = { _type: "block", _key: newKey(), style, markDefs, children };
  if (listItem) {
    block.listItem = listItem;
    block.level = 1;
  }
  return block;
}

// Convierte el HTML del cuerpo a { blocks: PortableText[], images: string[] }
function htmlToPortableText(html) {
  const root = parseHTML(html);
  const images = root
    .querySelectorAll("img")
    .map((img) => fixUrl(img.getAttribute("src")))
    .filter(Boolean);
  const blocks = [];
  const walk = (parent) => {
    for (const node of parent.childNodes) {
      if (node.nodeType === 3) {
        const text = decode(node.rawText).trim();
        if (text)
          blocks.push({
            _type: "block",
            _key: newKey(),
            style: "normal",
            markDefs: [],
            children: [{ _type: "span", _key: newKey(), text, marks: [] }],
          });
        continue;
      }
      const tag = node.rawTagName?.toLowerCase();
      if (!tag || tag === "img") continue;
      if (tag === "p" || tag === "div") {
        const b = makeBlock("normal", node);
        if (b) blocks.push(b);
      } else if (["h1", "h2", "h3", "h4"].includes(tag)) {
        const b = makeBlock(tag === "h1" ? "h2" : tag, node);
        if (b) blocks.push(b);
      } else if (tag === "blockquote") {
        const b = makeBlock("blockquote", node);
        if (b) blocks.push(b);
      } else if (tag === "ul" || tag === "ol") {
        for (const li of node.querySelectorAll("li")) {
          const b = makeBlock("normal", li, tag === "ul" ? "bullet" : "number");
          if (b) blocks.push(b);
        }
      } else {
        walk(node);
      }
    }
  };
  walk(root);
  return { blocks, images };
}

// --- Parseo del XML ---
const xml = fs.readFileSync(FILE, "utf8");
const parser = new XMLParser({
  ignoreAttributes: true,
  parseTagValue: false,
  processEntities: true,
});
const parsed = parser.parse(xml);
let items = parsed?.rss?.channel?.item || [];
if (!Array.isArray(items)) items = [items];

const posts = items.filter(
  (it) => it["wp:post_type"] === "post" && it["wp:status"] === "publish",
);

const records = posts.map((it) => {
  const title = String(it.title || "").trim();
  let cat = it.category;
  if (Array.isArray(cat)) cat = cat[0];
  const categoria =
    CATEGORIA[String(cat || "").toLowerCase().trim()] || "club";
  const dateStr = it.pubDate || it["wp:post_date"];
  let fecha;
  const d = new Date(dateStr);
  fecha = isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
  const excerpt = decode(
    String(it["excerpt:encoded"] || "").replace(/<[^>]+>/g, ""),
  ).trim();
  const { blocks, images } = htmlToPortableText(
    String(it["content:encoded"] || ""),
  );
  return { title, slug: slugify(title), categoria, fecha, excerpt, blocks, images };
});

// --- Modo prueba ---
if (DRY) {
  console.log(`Noticias publicadas en el export: ${records.length}\n`);
  for (const r of records.sort((a, b) => b.fecha.localeCompare(a.fecha))) {
    console.log(
      `${r.fecha.slice(0, 10)} [${r.categoria.padEnd(13)}] ${r.title}  ` +
        `(bloques:${r.blocks.length}, imgs:${r.images.length})`,
    );
  }
  const cats = {};
  records.forEach((r) => (cats[r.categoria] = (cats[r.categoria] || 0) + 1));
  console.log("\nPor categoría:", cats);
  const vacias = records.filter((r) => r.blocks.length === 0);
  if (vacias.length)
    console.log("⚠️ Sin cuerpo:", vacias.map((r) => r.title));
  process.exit(0);
}

// --- Importación real ---
const token = process.env.SANITY_API_WRITE_TOKEN;
if (!token) {
  console.error(
    "❌ Falta SANITY_API_WRITE_TOKEN en .env.local (crea uno en sanity.io/manage → API → Tokens → Editor).",
  );
  process.exit(1);
}

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2024-01-01",
  token,
  useCdn: false,
});

const ids = records.map((r) => "noticia-" + r.slug);
const existing = new Set(await client.fetch(`*[_id in $ids]._id`, { ids }));

const imgCache = new Map();
async function uploadImage(url) {
  if (imgCache.has(url)) return imgCache.get(url);
  const res = await fetch(url);
  if (!res.ok) throw new Error("HTTP " + res.status);
  const buf = Buffer.from(await res.arrayBuffer());
  const filename = (url.split("/").pop() || "imagen").split("?")[0];
  const asset = await client.assets.upload("image", buf, { filename });
  imgCache.set(url, asset._id);
  return asset._id;
}

let created = 0,
  skipped = 0;
for (const r of records) {
  const _id = "noticia-" + r.slug;
  if (existing.has(_id)) {
    skipped++;
    continue;
  }
  let portada;
  const cuerpo = [...r.blocks];
  if (r.images.length) {
    try {
      const ref = await uploadImage(r.images[0]);
      portada = { _type: "image", asset: { _type: "reference", _ref: ref }, alt: r.title };
    } catch (e) {
      console.warn(`  imagen portada falló (${r.slug}): ${e.message}`);
    }
    for (const extra of r.images.slice(1)) {
      try {
        const ref = await uploadImage(extra);
        cuerpo.push({ _type: "image", _key: newKey(), asset: { _type: "reference", _ref: ref } });
      } catch {}
    }
  }
  const doc = {
    _id,
    _type: "noticia",
    titulo: { _type: "localeString", es: r.title },
    slug: { _type: "slug", current: r.slug },
    categoria: r.categoria,
    fecha: r.fecha,
    destacada: false,
    ...(r.excerpt ? { extracto: { _type: "localeText", es: r.excerpt } } : {}),
    ...(portada ? { portada } : {}),
    cuerpo: { _type: "localeBlockContent", es: cuerpo },
  };
  await client.createOrReplace(doc);
  created++;
  console.log(`✓ ${r.fecha.slice(0, 10)}  ${r.title}`);
}

console.log(`\nHecho. Creadas: ${created} · Saltadas (ya existían): ${skipped}`);
