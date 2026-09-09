export function getCsrfToken(request){
  const cookie = request.headers.get('Cookie') || '';
  const m = cookie.match(/csrf_token=([^;]+)/);
  return m ? m[1] : null;
}
export function generateCsrfToken(){
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return [...arr].map(b=>b.toString(16).padStart(2,'0')).join('');
}
export function verifyCsrf(request){
  const token = request.headers.get('X-CSRF-Token');
  const cookieToken = getCsrfToken(request);
  if(!token || !cookieToken) return false;
  // constant-time compare
  if(token.length !== cookieToken.length) return false;
  let diff=0;
  for(let i=0;i<token.length;i++) diff |= token.charCodeAt(i) ^ cookieToken.charCodeAt(i);
  return diff===0;
}
