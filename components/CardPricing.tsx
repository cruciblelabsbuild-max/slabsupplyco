export default function CardPricing({ retail, member, savings }: { retail: string; member: string; savings: string }) {
  return <div className="shelf-pricing"><span>Retail<s>{retail}</s></span><span>Member price<b>{member}</b></span><span className="savings">Your savings<b>{savings}</b></span></div>;
}
