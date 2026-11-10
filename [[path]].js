const json = (data, status=200, headers={}) => new Response(JSON.stringify(data), {status, headers:{'content-type':'application/json; charset=utf-8', 'cache-control':'no-store', ...headers}});
const cookieName='kb_admin';
const enc=s=>new TextEncoder().encode(s);
async function sign(value, secret){const key=await crypto.subtle.importKey('raw',enc(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);const sig=await crypto.subtle.sign('HMAC',key,enc(value));return btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')}
async function validSession(request, env){const raw=request.headers.get('Cookie')||'';const token=raw.split(';').map(x=>x.trim()).find(x=>x.startsWith(cookieName+'='))?.slice(cookieName.length+1);if(!token||!env.SESSION_SECRET)return false;const [value,sig]=token.split('.');if(!value||!sig)return false;const expected=await sign(value,env.SESSION_SECRET);if(sig!==expected)return false;try{return JSON.parse(atob(value)).exp>Date.now()}catch{return false}}
const requireAuth=async(req,env)=>await validSession(req,env);
const cookie=(value,maxAge)=>`${cookieName}=${value}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${maxAge}`;
export async function onRequest({request,env}) {
  if(!env.DB)return json({error:'Database belum terhubung. Periksa binding D1 bernama DB.'},500);
  const url=new URL(request.url),path=url.pathname.replace('/api/','').replace(/\/$/,'')||'';
  if(path==='login'&&request.method==='POST'){
    const body=await request.json().catch(()=>({}));
    if(!env.ADMIN_PASSWORD||!env.SESSION_SECRET)return json({error:'ADMIN_PASSWORD dan SESSION_SECRET belum diatur.'},500);
    if(body.password!==env.ADMIN_PASSWORD)return json({error:'Kata sandi admin salah.'},401);
    const value=btoa(JSON.stringify({exp:Date.now()+8*60*60*1000}));
    const token=value+'.'+await sign(value,env.SESSION_SECRET);
    return json({ok:true},200,{'set-cookie':cookie(token,8*60*60)})
  }
  if(path==='logout'&&request.method==='POST')return json({ok:true},200,{'set-cookie':cookie('',0)});
  if(path==='me'&&request.method==='GET')return await requireAuth(request,env)?json({ok:true}):json({error:'Belum login'},401);
  if(!await requireAuth(request,env))return json({error:'Sesi berakhir. Silakan login kembali.'},401);
  if(path==='products'&&request.method==='GET'){
    const {results}=await env.DB.prepare('SELECT id,name,category,price,emoji FROM products WHERE active=1 ORDER BY category,name').all();
    return json({products:results});
  }
  if(path==='summary'&&request.method==='GET'){
    const today=new Date().toISOString().slice(0,10);
    const row=await env.DB.prepare("SELECT COALESCE(SUM(total),0) sales,COUNT(*) count,COALESCE(SUM(item_count),0) items FROM transactions WHERE substr(created_at,1,10)=?").bind(today).first();
    return json(row||{sales:0,count:0,items:0});
  }
  if(path==='transactions'&&request.method==='GET'){
    const {results}=await env.DB.prepare('SELECT invoice,created_at,total,item_count FROM transactions ORDER BY created_at DESC LIMIT 20').all();
    return json({transactions:results});
  }
  if(path==='transactions'&&request.method==='POST'){
    const body=await request.json().catch(()=>null);
    if(!body||!Array.isArray(body.items)||!body.items.length)return json({error:'Keranjang kosong atau format tidak valid.'},400);
    if(body.items.length>100)return json({error:'Terlalu banyak jenis item.'},400);
    let total=0,itemCount=0,validated=[];
    for(const item of body.items){
      const qty=Number(item.qty);
      if(!Number.isInteger(qty)||qty<1||qty>500)return json({error:'Jumlah item tidak valid.'},400);
      const product=await env.DB.prepare('SELECT id,name,price FROM products WHERE id=? AND active=1').bind(String(item.product_id)).first();
      if(!product)return json({error:'Produk tidak ditemukan: '+String(item.name||'')},400);
      total+=product.price*qty;itemCount+=qty;validated.push({product_id:product.id,name:product.name,price:product.price,qty});
    }
    const cash=Number(body.cash_received);
    if(!Number.isSafeInteger(cash)||cash<total)return json({error:'Uang pembayaran kurang atau tidak valid.'},400);
    const invoice='KB-'+Date.now().toString(36).toUpperCase()+'-'+crypto.randomUUID().slice(0,5).toUpperCase();
    const created=new Date().toISOString();
    const result=await env.DB.prepare('INSERT INTO transactions(invoice,created_at,total,cash_received,item_count,items_json) VALUES(?,?,?,?,?,?)').bind(invoice,created,total,cash,itemCount,JSON.stringify(validated)).run();
    return json({ok:true,invoice,created_at:created,total,change:cash-total,transaction_id:result.meta?.last_row_id});
  }
  return json({error:'Endpoint tidak ditemukan.'},404);
}
