import {test} from 'node:test';
import assert from 'node:assert/strict';
import {memberShippingAddress} from '../lib/shipping/member-details';
import {profileAddress,profileAddressDetails} from '../lib/shipping/config';
import {emptyProfile,parseMemberProfile} from '../lib/member-profile';
const address={name:' Avery Member ',line1:' 123 Example Street ',city:' Brooklyn ',region:' NY ',postalCode:' 11249 '};
test('complete US shipping details submit without a country field or optional apartment',()=>{
 assert.deepEqual(memberShippingAddress(address),{name:'Avery Member',line1:'123 Example Street',line2:'',city:'Brooklyn',region:'NY',postalCode:'11249',country:'US'});
 for(const country of ['US','us','USA','U.S.A.','United States','United States of America',''])assert.equal(memberShippingAddress({...address,country}).country,'US');
 assert.throws(()=>memberShippingAddress({...address,country:'CA'}),/United States only/);
 assert.throws(()=>memberShippingAddress({...address,region:''}),/Add your state/);
 assert.throws(()=>memberShippingAddress({...address,postalCode:''}),/Add your ZIP code/);
});
test('saved US profiles normalize for labels and incomplete details remain available for prefilling',()=>{
 const shipping={...emptyProfile.shipping,recipient:address.name,line1:address.line1,city:address.city,region:address.region,postalCode:address.postalCode,country:'United States'};
 const profile=parseMemberProfile({...emptyProfile,shipping});assert.equal(profile.shipping.country,'US');assert.equal(profileAddress(profile)?.country,'US');
 assert.equal(profileAddress({shipping:{...shipping,region:''}}),null);assert.equal(profileAddressDetails({shipping:{...shipping,region:''}})?.line1,'123 Example Street');
 assert.equal(profileAddress({shipping:{...shipping,country:'Canada'}}),null);assert.throws(()=>parseMemberProfile({...emptyProfile,shipping:{...shipping,country:'Canada'}}),/United States only/);
 assert.deepEqual(parseMemberProfile({...emptyProfile,shipping:{...emptyProfile.shipping,country:''}}),emptyProfile);
});
