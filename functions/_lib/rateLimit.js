export async function checkRateLimit(KV, key, limit, windowSec){
  const now = Date.now();
  const windowStart = now - windowSec*1000;
  const kvKey = `rl:${key}`;
  let data = null;
  try{
    const raw = await KV.get(kvKey);
    if(raw) data = JSON.parse(raw);
  }catch{}
  if(!data || !Array.isArray(data.hits)) data = { hits: [] };
  // prune old
  data.hits = data.hits.filter(t=> t > windowStart);
  if(data.hits.length >= limit){
    const retry = Math.ceil((data.hits[0] + windowSec*1000 - now)/1000);
    return { allowed: false, retryAfter: retry >0?retry: windowSec, remaining: 0 };
  }
  data.hits.push(now);
  try{ await KV.put(kvKey, JSON.stringify(data), { expirationTtl: windowSec + 10 }); }catch{}
  return { allowed: true, remaining: limit - data.hits.length };
}
