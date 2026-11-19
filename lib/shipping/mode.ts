/** Test documents are usable only in the explicitly enabled test application. */
export function testShippingEnabled(env:Record<string,string|undefined>=process.env){return env.SHIPPO_MODE==='test'&&env.SHIPPO_TEST_WORKFLOWS_ENABLED==='true';}
export function visibleShippingDocument(label:{provider?:string;mode?:string},env:Record<string,string|undefined>=process.env){return label.provider!=='shippo'||(label.mode==='test'?testShippingEnabled(env):label.mode==='live'&&env.SHIPPO_MODE==='live');}
