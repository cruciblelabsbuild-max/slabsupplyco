import { BadgeCheck, Layers, PackageCheck, WalletCards } from "lucide-react";

const steps = [
  { icon: Layers, title: "Submit your slabs.", description: "Upload slab photos or a collection list. We’ll take it from there." },
  { icon: BadgeCheck, title: "Get your offer.", description: "Receive a quote based on current market values and demand." },
  { icon: PackageCheck, title: "Send your cards.", description: "Ship approved cards using your complimentary prepaid label." },
  { icon: WalletCards, title: "Receive your credit.", description: "Get store credit toward your next purchase after approval." },
];

export default function TradeJourney() {
  return <ol className="trade-journey" aria-label="How your trade works">
    {steps.map(({ icon: Icon, title, description }) => <li key={title}>
      <div className="trade-journey-track" aria-hidden="true"><span><Icon size={23} strokeWidth={1.25} /></span></div>
      <h3>{title}</h3><p>{description}</p>
    </li>)}
  </ol>;
}
