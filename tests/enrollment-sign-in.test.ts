import { test } from "node:test";
import assert from "node:assert/strict";
import { enrollmentSignInUrl, existingAccountError } from "../lib/enrollment-sign-in";
test("existing account errors transfer to sign-in without transferring unrelated failures", () => {
  assert.equal(existingAccountError([{code:"form_identifier_exists"}]), true);
  assert.equal(existingAccountError([{code:"identifier_already_signed_up"}]), true);
  for (const errors of [null, [], [null], [{code:"form_password_pwned"}], [{code:"network_error"}]]) assert.equal(existingAccountError(errors),false);
});
test("sign-in transfer preserves enrollment and trade intent with no arbitrary redirect", () => {
  assert.equal(enrollmentSignInUrl(), "/sign-in?checkout=continue");
  assert.equal(enrollmentSignInUrl("trades"), "/sign-in?checkout=continue&next=trades");
  assert.equal(enrollmentSignInUrl("https://other.test"), "/sign-in?checkout=continue");
});
