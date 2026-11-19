import fs from 'node:fs';
import sharp from 'sharp';
const source=fs.readFileSync('app/Logo.tsx','utf8');
const svgs=[...source.matchAll(/<svg[\s\S]*?<\/svg>/g)].map(m=>m[0].replaceAll('className=','class=').replace(/ aria-hidden="true"| focusable="false"/g,''));
const style=`.brand-mark-back>rect:first-child{fill:#cbd9f3}.brand-mark-back>rect:nth-child(2){fill:#f1e4c8}.brand-mark-back>rect:last-child{fill:#8eae9d}.brand-slab-shell{fill:#fff9f0;stroke:#30325c;stroke-width:1.7}.brand-slab-label{fill:#ff7057}.brand-mark-front circle{fill:#f3eadc}.brand-mark-front>path:not(.brand-orbit):not(.brand-star){fill:none;stroke:#f3eadc;stroke-width:1;stroke-linecap:round;opacity:.9}.brand-slab-art{fill:#30325c}.brand-orbit{fill:none;stroke:#f4efe4;stroke-width:1.1;stroke-linecap:round;opacity:.5}.brand-star{fill:#f5c976}.brand-wordmark-rules{fill:#ff7057}`;
const icon=svgs[0].replace('<svg ','<svg x="0" y="0" width="80" height="80" '),wordmark=svgs[1].replace('<svg ','<svg x="100" y="10" width="420" height="92" ');
const logo=`<svg xmlns="http://www.w3.org/2000/svg" width="1040" height="220" viewBox="0 0 520 110" color="#30325c"><style>${style}</style>${icon}${wordmark}</svg>`;
await sharp(Buffer.from(logo)).png().toFile('public/email/logo.png');
// Quiet editorial compositions built from the approved slab icon, not fabricated product art.
const compositions={membership:`<rect x="100" y="35" width="400" height="165" rx="10" fill="#30325c"/><path d="M125 66H325M125 72H325" stroke="#ff7057" stroke-width="2"/><text x="125" y="110" font-family="Georgia" font-size="25" fill="#fff9f0">A membership.</text><text x="125" y="143" font-family="Georgia" font-style="italic" font-size="25" fill="#fff9f0">More possibilities.</text><circle cx="458" cy="164" r="5" fill="#ff7057"/>`,
 trades:`<path d="M105 170H500" stroke="#cbd9f3"/><g transform="translate(190 32) scale(2.6)">${svgs[0].replace(/<svg[^>]*>|<\/svg>/g,'')}</g><path d="M345 108H425m-13-10 13 10-13 10" fill="none" stroke="#ff7057" stroke-width="3"/>`,
 orders:`<path d="m195 91 100-42 104 42v100l-103 40-101-40Z" fill="#e2e8f7" stroke="#30325c" stroke-width="2"/><path d="m195 91 101 42 103-42M296 133v98m-51-160 102 41" fill="none" stroke="#30325c" stroke-width="2"/><path d="m275 108 22 10 22-10" fill="none" stroke="#ff7057" stroke-width="5"/>`,
 grails:`<circle cx="300" cy="126" r="90" fill="#e2e8f7"/><g transform="translate(218 35) scale(2.8)">${svgs[0].replace(/<svg[^>]*>|<\/svg>/g,'')}</g><path d="m422 63 4 13 13 4-13 4-4 13-4-13-13-4 13-4Z" fill="#ff7057"/>`};
for(const [name,content] of Object.entries(compositions)){const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="480" viewBox="0 0 600 240"><style>${style}</style><rect width="600" height="240" fill="#f3eadc"/>${content}</svg>`;await sharp(Buffer.from(svg)).png().toFile(`public/email/${name}.png`);}

fs.mkdirSync("public/email/cards",{recursive:true});for(const file of fs.readdirSync("public/cards/selection")){if(file.endsWith(".webp"))await sharp("public/cards/selection/"+file).resize({width:240,withoutEnlargement:true}).jpeg({quality:88}).toFile("public/email/cards/"+file.replace(/\.webp$/,".jpg"));}
