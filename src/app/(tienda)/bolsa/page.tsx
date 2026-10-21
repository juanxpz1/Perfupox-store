import type { Metadata } from "next";
import { BagView } from "@/components/store/bag-view";

export const metadata: Metadata = { title: "Tu bolsa", robots: { index: false } };

export default function BagPage() {
  return (
    <div className="mx-auto max-w-[1320px] pb-24 pl-[max(20px,env(safe-area-inset-left,0px))] pr-[max(20px,env(safe-area-inset-right,0px))] pt-12">
      <h1 className="mb-10 text-[clamp(36px,5vw,60px)]">Tu bolsa</h1>
      <BagView />
    </div>
  );
}
