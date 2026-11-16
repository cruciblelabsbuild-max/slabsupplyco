import test from 'node:test';
import assert from 'node:assert/strict';
import {grailCycle,dropState,maxInterestPrice,suggestionDetails} from '../lib/grail-cycle';
test('grail cycle follows New York month boundaries and rolls December into January',()=>{
 assert.deepEqual(grailCycle(new Date('2026-12-01T04:59:59Z')),{current:'2026-11',next:'2026-12',nextLabel:'December'});
 assert.deepEqual(grailCycle(new Date('2026-12-01T05:00:00Z')),{current:'2026-12',next:'2027-01',nextLabel:'January'});
 assert.equal(grailCycle(new Date('2026-07-01T03:59:59Z')).current,'2026-06');
 assert.equal(grailCycle(new Date('2026-07-01T04:00:00Z')).current,'2026-07');
});
test('drop availability respects release, end time, reservation and sold inventory',()=>{
 const start='2026-12-10T18:00:00Z',end='2026-12-11T18:00:00Z';
 assert.equal(dropState('available',start,end,new Date('2026-12-10T17:59:59Z')),'upcoming');
 assert.equal(dropState('available',start,end,new Date(start)),'live');
 assert.equal(dropState('reserved',start,end,new Date(start)),'reserved');
 assert.equal(dropState('available',start,end,new Date(end)),'ended');
 assert.equal(dropState('sold',start,end,new Date(end)),'sold-out');
 assert.equal(dropState('unknown',start,end,new Date(start)),'unavailable');
});
test('maximum price is optional, stored in cents and rejects malformed amounts',()=>{
 for(const value of ['',null,undefined])assert.equal(maxInterestPrice(value),null);
 assert.equal(maxInterestPrice('1250.50'),125050);assert.equal(maxInterestPrice('0.01'),1);
 for(const value of ['0','-10','1.111','1e4',Infinity,{},'1000000'])assert.throws(()=>maxInterestPrice(value));
});
test('suggestions require an identifiable card, set and preferred grade',()=>{
 assert.deepEqual(suggestionDetails({name:'  Lugia   #9 ',set:'Neo Genesis',grade:'PSA 8'}),{name:'Lugia #9',set:'Neo Genesis',grade:'PSA 8'});
 for(const value of [null,{}, {name:'Lugia',set:'',grade:'PSA 8'},{name:'Lugia',set:'Neo Genesis',grade:'x'.repeat(41)}])assert.throws(()=>suggestionDetails(value));
});
import {defaultGrailCandidates,grailTiers,grailFeatures} from '../lib/grail-selection';
import {bagCards} from '../lib/bag';
test('each budget band has three distinct sourcing options without unconfirmed card prices',()=>{
 assert.equal(new Set(defaultGrailCandidates.map(c=>c.id)).size,9);
 for(const tier of grailTiers)assert.equal(defaultGrailCandidates.filter(c=>c.tier===tier.id).length,3);
 assert.ok(defaultGrailCandidates.every(c=>!('member' in c)&&!('retail' in c)));
});
test('November editorial picks remain separate from actual purchasable inventory and roll off by month',()=>{
 const cards=grailFeatures('2026-11');assert.deepEqual(cards.map(c=>c.name),['Neo Genesis Lugia #9','Jungle Snorlax #11','Evolutions Charizard #11']);
 assert.ok(cards.every(c=>c.stock==='preview'&&!bagCards.some(b=>String(b.slug)===String(c.slug))));
 assert.ok(cards[0].member>=1000);assert.ok(cards[1].member>=350&&cards[1].member<=650);assert.ok(cards[2].member<=200);
 assert.equal(grailFeatures('2026-12').length,0);
});
