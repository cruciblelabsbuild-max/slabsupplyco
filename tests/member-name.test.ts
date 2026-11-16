import test from 'node:test';
import assert from 'node:assert/strict';
import {cleanMemberName,identityFirstName,resolveMemberName} from '../lib/member-name';
const user={id:'user_member',firstName:null,privateMetadata:{stripeTestCustomerId:'cus_member'}};
test('checkout name fills the account before transition and member home render',async()=>{
 const saved:string[][]=[];
 const name=await resolveMemberName(user,{billingName:async(customer,id)=>{assert.equal(customer,'cus_member');assert.equal(id,user.id);return '  Jordan   Smith ';},saveFirstName:async(id,name)=>{saved.push([id,name]);}});
 assert.equal(name,'Jordan');assert.deepEqual(saved,[[user.id,'Jordan']]);
});
test('existing profile names take precedence and do not fetch or overwrite billing names',async()=>{
 const never=async()=>{throw Error('Must not be called');};
 assert.equal(await resolveMemberName({...user,firstName:'Sam'},{billingName:never,saveFirstName:never}),'Sam');
 assert.equal(identityFirstName({firstName:'  ',externalAccounts:[{firstName:'Alex'}]}),'Alex');
});
test('missing, mismatched or unavailable billing data cannot invent a name or prevent sign-in',async()=>{
 for(const billingName of [async()=>null,async()=>{throw Error('Unavailable');}]){
 assert.equal(await resolveMemberName(user,{billingName,saveFirstName:async()=>{assert.fail('Nothing to persist');}}),'Collector');
 }
 assert.equal(await resolveMemberName(user,{billingName:async()=>'Taylor',saveFirstName:async()=>{throw Error('Retry');}}),'Taylor');
 assert.equal(cleanMemberName('   '),null);assert.equal(cleanMemberName('bad\u0000name'),null);
});
