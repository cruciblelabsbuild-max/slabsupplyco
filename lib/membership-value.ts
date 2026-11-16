export type ValueAssumptions = {
  annualSpend: number;
  annualTrades: number;
  purchaseDiscount: number;
  traditionalTradePercent: number;
  memberTradePercent: number;
};

/** Dollar inputs become cents before comparison; adverse scenarios remain visible. */
export function membershipValue(input: ValueAssumptions) {
  const cents = (value: number) => Math.round(Math.max(0, Number.isFinite(value) ? value : 0) * 100);
  const percent = (value: number) => Math.min(100, Math.max(0, Number.isFinite(value) ? value : 0));
  const retailPurchases = cents(input.annualSpend);
  const trades = cents(input.annualTrades);
  const purchaseSavings = Math.round(retailPurchases * percent(input.purchaseDiscount) / 100);
  const traditionalCredit = Math.round(trades * percent(input.traditionalTradePercent) / 100);
  const memberCredit = Math.round(trades * percent(input.memberTradePercent) / 100);
  const additionalCredit = memberCredit - traditionalCredit;
  const totalBenefit = purchaseSavings + additionalCredit;
  const membershipFee = 9900;
  return { retailPurchases, memberPurchases: retailPurchases - purchaseSavings, purchaseSavings, traditionalCredit, memberCredit, additionalCredit, totalBenefit, membershipFee, netBenefit: totalBenefit - membershipFee };
}
