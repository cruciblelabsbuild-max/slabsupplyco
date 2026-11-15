import { test } from "node:test";
import assert from "node:assert/strict";
import { enrollmentTermsVersion, hasRecentEnrollmentConsent } from "../lib/enrollment-consent";
test("automatic checkout requires recent explicit consent to the current membership terms",()=>{
 const now=2000000;
 assert.equal(hasRecentEnrollmentConsent({version:enrollmentTermsVersion,at:now-1000},now),true);
 for(const value of [null,{},true,{version:"old-terms",at:now},{version:enrollmentTermsVersion,at:now-1800000},{version:enrollmentTermsVersion,at:now+1},{version:enrollmentTermsVersion,at:"2000000"}])assert.equal(hasRecentEnrollmentConsent(value,now),false);
});
