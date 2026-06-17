import { Studio } from "./Studio";

// El Studio de Sanity gestiona su propio enrutado interno.
export const dynamic = "force-static";

export default function StudioPage() {
  return <Studio />;
}
