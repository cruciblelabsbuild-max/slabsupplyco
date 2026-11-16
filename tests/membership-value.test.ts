import { test } from "node:test";
import assert from "node:assert/strict";
import { membershipValue } from "../lib/membership-value";
const defaults = { annualSpend: 2000, annualTrades: 1000, purchaseDiscount: 10, traditionalTradePercent: 90, memberTradePercent: 100 };
test("default comparison separates purchase savings, additional credit, and membership fee", () => {
  assert.deepEqual(membershipValue(defaults), { retailPurchases: 200000, memberPurchases: 180000, purchaseSavings: 20000, traditionalCredit: 90000, memberCredit: 100000, additionalCredit: 10000, totalBenefit: 30000, membershipFee: 9900, netBenefit: 20100 });
});
test("unfavorable credit assumptions and low spending show a negative net benefit", () => {
  const result = membershipValue({ ...defaults, annualSpend: 250, purchaseDiscount: 0, traditionalTradePercent: 100, memberTradePercent: 80 });
  assert.equal(result.additionalCredit, -20000); assert.equal(result.netBenefit, -29900);
});
test("zero trades, percentage limits, invalid inputs, and fractional dollars remain safe", () => {
  assert.equal(membershipValue({ ...defaults, annualTrades: 0 }).additionalCredit, 0);
  assert.equal(membershipValue({ ...defaults, annualSpend: 100.25, purchaseDiscount: 10 }).purchaseSavings, 1003);
  const result = membershipValue({ annualSpend: NaN, annualTrades: -100, purchaseDiscount: Infinity, traditionalTradePercent: -1, memberTradePercent: 150 });
  assert.equal(result.netBenefit, -9900);
});
