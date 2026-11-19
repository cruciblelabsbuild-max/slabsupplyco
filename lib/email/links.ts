/** Only the email system's authenticated destinations are accepted; never an external redirect. */
export function emailDestination(value:unknown):string|null{
 if(typeof value!=='string'||value.length>500)return null;
 if(['/account','/account/profile#membership','/account/profile#preferences','/shop','/drops'].includes(value))return value;
 if(/^\/trade-ins\?view=trades&trade=[0-9a-f-]{36}$/.test(value))return value;
 if(/^\/api\/trades\/[0-9a-f-]{36}\/files\/[0-9a-f-]{36}$/.test(value))return value;
 if(/^\/account\/orders\?session_id=cs_[a-zA-Z0-9_]+$/.test(value))return value;
 return null;
}
