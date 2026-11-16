import { test } from "node:test";
import assert from "node:assert/strict";
import { membershipValue, membershipValueDefaults } from "../lib/membership-value";
const defaults = membershipValueDefaults;
test("default comparison separates purchase savings, additional credit, and membership fee", () => {
  assert.deepEqual(membershipValue(defaults), { retailPurchases: 250000, memberPurchases: 212500, purchaseSavings: 37500, traditionalCredit: 170000, memberCredit: 200000, additionalCredit: 30000, totalBenefit: 67500, membershipFee: 14900, netBenefit: 52600 });
});
test("unfavorable credit assumptions and low spending show a negative net benefit", () => {
  const result = membershipValue({ ...defaults, annualSpend: 250, annualTrades: 1000, purchaseDiscount: 0, traditionalTradePercent: 100, memberTradePercent: 80 });
  assert.equal(result.additionalCredit, -20000); assert.equal(result.netBenefit, -34900);
});
test("zero trades, percentage limits, invalid inputs, and fractional dollars remain safe", () => {
  assert.equal(membershipValue({ ...defaults, annualTrades: 0 }).additionalCredit, 0);
  assert.equal(membershipValue({ ...defaults, annualSpend: 100.25, purchaseDiscount: 10 }).purchaseSavings, 1003);
  const result = membershipValue({ annualSpend: NaN, annualTrades: -100, purchaseDiscount: Infinity, traditionalTradePercent: -1, memberTradePercent: 150 });
  assert.equal(result.netBenefit, -14900);
});
