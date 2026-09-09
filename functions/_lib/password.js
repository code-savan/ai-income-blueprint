const ITERATIONS = 100000;
const PEPPER_FALLBACK = '';

function bufToBase64(buf){
  const bytes = new Uint8Array(buf);
  let binary = '';
  for(let i=0;i<bytes.length;i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}
function base64ToBuf(b64){
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for(let i=0;i<binary.length;i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}
function getPepper(env){
  return (env && env.PEPPER) ? env.PEPPER : PEPPER_FALLBACK;
}
export async function hashPassword(password, env){
  const pepper = getPepper(env);
  const saltBytes = new Uint8Array(16);
  crypto.getRandomValues(saltBytes);
  const saltB64 = bufToBase64(saltBytes);
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(pepper + password), { name: 'PBKDF2' }, false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: saltBytes, iterations: ITERATIONS, hash: 'SHA-256' }, keyMaterial, 256);
  const hashB64 = bufToBase64(bits);
  return `pbkdf2$${ITERATIONS}$${saltB64}$${hashB64}`;
}
export async function verifyPassword(password, storedHash, env){
  const pepper = getPepper(env);
  if(!storedHash) return false;
  // New format: pbkdf2$iterations$salt$hash
  if(storedHash.startsWith('pbkdf2$')){
    const parts = storedHash.split('$');
    if(parts.length !== 4) return false;
    const iters = parseInt(parts[1],10);
    const saltB64 = parts[2];
    const expectedB64 = parts[3];
    try{
      const saltBytes = base64ToBuf(saltB64);
      const enc = new TextEncoder();
      const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(pepper + password), { name: 'PBKDF2' }, false, ['deriveBits']);
      const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: saltBytes, iterations: iters, hash: 'SHA-256' }, keyMaterial, 256);
      const hashB64 = bufToBase64(bits);
      // constant-time compare
      if(hashB64.length !== expectedB64.length) return false;
      let diff = 0;
      for(let i=0;i<hashB64.length;i++) diff |= hashB64.charCodeAt(i) ^ expectedB64.charCodeAt(i);
      return diff === 0;
    }catch{
      return false;
    }
  }
  // Old format: plain SHA-256 hex (64 chars, no salt, no pepper)
  // For migration, verify old way (pepper + password SHA-256 hex)
  // Old code did SHA-256(pepper+password) hex? Actually old did SHA-256(password) hex without pepper. We try both.
  const enc = new TextEncoder();
  const oldPeppered = await crypto.subtle.digest('SHA-256', enc.encode(pepper + password));
  const oldPepperedHex = [...new Uint8Array(oldPeppered)].map(b=>b.toString(16).padStart(2,'0')).join('');
  if(oldPepperedHex === storedHash) return true;
  const oldPlain = await crypto.subtle.digest('SHA-256', enc.encode(password));
  const oldPlainHex = [...new Uint8Array(oldPlain)].map(b=>b.toString(16).padStart(2,'0')).join('');
  return oldPlainHex === storedHash;
}
export function isOldHash(storedHash){
  return storedHash && !storedHash.startsWith('pbkdf2$');
}
