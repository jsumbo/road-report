import { SiteHeader } from "@/components/public/site-header";

/* Full-screen map: header floats over the map, no footer. */
export default function MapLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader overlay />
      <main className="fixed inset-0 overflow-hidden">{children}</main>
    </>
  );
}
