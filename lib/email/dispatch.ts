import {processEmailQueue} from './worker';
/** Call only after business state commits; notification failures never affect that state. */
export async function dispatchEmails(){if(process.env.VERCEL_ENV!=='production')return;try{await processEmailQueue();}catch{console.error('Email queue deferred to scheduled retry.');}}
