import { test } from "node:test";
import assert from "node:assert/strict";
import { memberSelection } from "../lib/member-selection";
test("the selection contains 50 distinct cards within the requested prices and grades", () => {
  assert.equal(memberSelection.length, 50);
  assert.equal(new Set(memberSelection.map(card => card.image)).size, 50);
  assert.deepEqual([...new Set(memberSelection.map(card => card.grader))].sort(), ["BGS", "CGC", "PSA"]);
  for (const card of memberSelection) {
    assert.ok(card.member >= 15 && card.member <= 200);
    assert.ok(card.gradeNumber >= 8 && card.gradeNumber <= 10);
    assert.ok(card.retail > card.member);
  }
});
test("selection prices retain matching card and grade reference provenance", () => {
  for (const card of memberSelection) {
    assert.equal(new URL(card.reference.url).hostname, "www.pricecharting.com");
    assert.equal(card.retail, Math.round(card.reference.value));
    assert.equal(card.reference.grade, card.gradeNumber === 10 ? card.grade : `Grade ${card.gradeNumber}`);
  }
  const beedrill = memberSelection.find(card => card.name === "Beedrill #15");
  assert.ok(beedrill && beedrill.retail < 50);
});
