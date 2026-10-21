import { Suspense } from "react";
import { AnnouncementBar } from "@/components/store/announcement-bar";
import { SiteHeader } from "@/components/store/site-header";
import { SiteFooter } from "@/components/store/site-footer";
import { WhatsappFab } from "@/components/store/whatsapp-fab";
import { AddedSheet } from "@/components/store/added-sheet";
import { Toaster } from "@/components/store/toaster";
import { announcements } from "@/modules/settings/queries";

async function Announcements() {
  return <AnnouncementBar messages={await announcements()} />;
}

export default function StoreLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <a href="#contenido" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:bg-ink focus:px-4 focus:py-2 focus:text-ivory">
        Saltar al contenido
      </a>
      <Suspense fallback={<div className="h-9 bg-night" />}>
        <Announcements />
      </Suspense>
      <SiteHeader />
      <main id="contenido" className="flex-1">
        {children}
      </main>
      <SiteFooter />
      <Suspense fallback={null}>
        <WhatsappFab />
      </Suspense>
      <AddedSheet />
      <Toaster />
    </>
  );
}
