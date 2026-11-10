const $ = (id) => document.getElementById(id);
const money = n => new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(n);
const defaultProducts = [
  {id:'kopi-cangking',name:'Kopi Cangking',category:'Kopi',price:4000,emoji:'☕'},
  {id:'kopi-kantong',name:'Kopi Kantong',category:'Kopi',price:7000,emoji:'🛍️'},
  {id:'kue-1',name:'Kue kecil',category:'Kue',price:1000,emoji:'🍪'},
  {id:'kue-2',name:'Kue sedang',category:'Kue',price:2000,emoji:'🧁'},
  {id:'kue-5',name:'Kue besar',category:'Kue',price:5000,emoji:'🍰'},
  {id:'kopi-saset-panas',name:'Kopi Saset Panas',category:'Kopi',price:4000,emoji:'☕'},
  {id:'kopi-saset-dingin',name:'Kopi Saset Dingin',category:'Kopi',price:6000,emoji:'🧋'},
  {id:'kopi-tambahan',name:'Tambahan Kopi',category:'Tambahan',price:1000,emoji:'➕'},
  {id:'teh-dingin',name:'Teh Dingin',category:'Teh',price:5000,emoji:'🧊'},
  {id:'teh-panas-3',name:'Teh Panas kecil',category:'Teh',price:3000,emoji:'🍵'},
  {id:'teh-panas-4',name:'Teh Panas besar',category:'Teh',price:4000,emoji:'🍵'},
  {id:'kacang-hijau',name:'Kacang Hijau Biasa',category:'Makanan',price:5000,emoji:'🥣'},
  {id:'kacang-hijau-susu',name:'Kacang Hijau Susu',category:'Makanan',price:7000,emoji:'🥛'},
  {id:'agar-agar',name:'Agar-agar',category:'Makanan',price:5000,emoji:'🍮'}
];
let products=[], cart=[], activeCategory='Semua', lastReceipt=null;
async function api(path, options={}) {
  const res=await fetch('/api/'+path,{...options,headers:{'Content-Type':'application/json',...(options.headers||{})}});
  const data=await res.json().catch(()=>({error:'Respons server tidak valid'}));
  if(!res.ok) throw new Error(data.error||'Terjadi kesalahan');
  return data;
}
function toast(msg){$('toast').textContent=msg;$('toast').classList.add('show');setTimeout(()=>$('toast').classList.remove('show'),2600)}
function showApp(){ $('loginView').classList.add('hidden');$('appView').classList.remove('hidden');$('logoutBtn').classList.remove('hidden');loadAll(); }
async function init(){
  $('clock').textContent=new Date().toLocaleString('id-ID',{dateStyle:'medium',timeStyle:'short'});
  setInterval(()=>$('clock').textContent=new Date().toLocaleString('id-ID',{dateStyle:'medium',timeStyle:'short'}),30000);
  try{await api('me');showApp()}catch{$('loginView').classList.remove('hidden')}
}
$('loginForm').addEventListener('submit',async e=>{e.preventDefault();$('loginError').textContent='';try{await api('login',{method:'POST',body:JSON.stringify({password:$('password').value})});$('password').value='';showApp()}catch(err){$('loginError').textContent=err.message}});
$('logoutBtn').onclick=async()=>{try{await api('logout',{method:'POST'})}catch{}location.reload()};
async function loadAll(){try{const [p,s,h]=await Promise.all([api('products'),api('summary'),api('transactions')]);products=p.products?.length?p.products:defaultProducts;renderMenu();renderStats(s);renderHistory(h.transactions||[])}catch(e){toast(e.message)}}
function renderStats(s){$('salesToday').textContent=money(s.sales||0);$('countToday').textContent=s.count||0;$('itemsToday').textContent=s.items||0}
function categories(){return ['Semua',...new Set(products.map(p=>p.category))]}
function renderCategories(){$('categoryTabs').innerHTML=categories().map(c=>`<button class="category-tab ${activeCategory===c?'active':''}" data-cat="${c}">${c}</button>`).join('');document.querySelectorAll('[data-cat]').forEach(b=>b.onclick=()=>{activeCategory=b.dataset.cat;renderCategories();renderMenu()})}
function renderMenu(){renderCategories();const q=$('searchMenu').value.toLowerCase();const list=products.filter(p=>(activeCategory==='Semua'||p.category===activeCategory)&&p.name.toLowerCase().includes(q));$('menuGrid').innerHTML=list.map(p=>`<article class="menu-card"><div><span class="menu-emoji">${p.emoji||'☕'}</span><h3>${esc(p.name)}</h3><p>${esc(p.category)}</p></div><div class="menu-card-bottom"><span class="price">${money(p.price)}</span><button class="add-btn" data-add="${p.id}" aria-label="Tambah ${esc(p.name)}">+</button></div></article>`).join('')||'<p class="muted">Menu tidak ditemukan.</p>';document.querySelectorAll('[data-add]').forEach(b=>b.onclick=()=>addItem(b.dataset.add))}
function addItem(id){const p=products.find(x=>x.id===id);if(!p)return;const found=cart.find(x=>x.id===id);if(found)found.qty++;else cart.push({...p,qty:1});renderCart()}
function renderCart(){const box=$('cartItems');if(!cart.length)box.innerHTML='<div class="empty-cart">☕<b>Belum ada pesanan</b><span>Pilih menu untuk memulai transaksi.</span></div>';else box.innerHTML=cart.map(p=>`<div class="cart-row"><div><h4>${esc(p.name)}</h4><small>${money(p.price)} / item</small><div class="cart-controls"><button class="qty-btn" data-dec="${p.id}">−</button><b>${p.qty}</b><button class="qty-btn" data-inc="${p.id}">+</button><button class="text-btn" data-del="${p.id}">Hapus</button></div></div><span class="cart-price">${money(p.price*p.qty)}</span></div>`).join('');document.querySelectorAll('[data-dec]').forEach(b=>b.onclick=()=>changeQty(b.dataset.dec,-1));document.querySelectorAll('[data-inc]').forEach(b=>b.onclick=()=>changeQty(b.dataset.inc,1));document.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{cart=cart.filter(x=>x.id!==b.dataset.del);renderCart()});updateTotals()}
function changeQty(id,d){const p=cart.find(x=>x.id===id);if(p){p.qty+=d;if(p.qty<=0)cart=cart.filter(x=>x.id!==id)}renderCart()}
function total(){return cart.reduce((s,p)=>s+p.price*p.qty,0)}
function updateTotals(){const t=total(),cash=Number($('cashInput').value||0);$('subtotal').textContent=money(t);$('change').textContent=money(Math.max(0,cash-t));$('payBtn').disabled=!cart.length||cash<t}
$('cashInput').addEventListener('input',updateTotals);$('searchMenu').addEventListener('input',renderMenu);
$('clearCart').onclick=()=>{cart=[];renderCart()};$('refreshBtn').onclick=loadAll;
$('payBtn').onclick=async()=>{const t=total(),cash=Number($('cashInput').value||0);if(cash<t)return toast('Uang diterima belum cukup.');$('payBtn').disabled=true;try{const result=await api('transactions',{method:'POST',body:JSON.stringify({items:cart.map(p=>({product_id:p.id,name:p.name,price:p.price,qty:p.qty})),cash_received:cash})});lastReceipt={...result,items:[...cart],cash_received:cash,total:t,created_at:new Date().toISOString()};showReceipt(lastReceipt);cart=[];$('cashInput').value='';renderCart();await loadAll();toast('Pembayaran berhasil disimpan.')}catch(e){toast(e.message)}finally{updateTotals()}};
function showReceipt(r){$('receiptContent').innerHTML=`<h2>KEUDE BLANG</h2><p>COFFEE • SNACK</p><hr><div class="receipt-line"><span>No. transaksi</span><b>${esc(r.invoice||'-')}</b></div><div class="receipt-line"><span>Waktu</span><span>${new Date(r.created_at).toLocaleString('id-ID')}</span></div><hr>${r.items.map(i=>`<div class="receipt-line"><span>${esc(i.name)} × ${i.qty}</span><b>${money(i.price*i.qty)}</b></div>`).join('')}<hr><div class="receipt-line"><b>Total</b><b>${money(r.total)}</b></div><div class="receipt-line"><span>Dibayar</span><span>${money(r.cash_received)}</span></div><div class="receipt-line"><span>Kembalian</span><b>${money(r.cash_received-r.total)}</b></div><hr><p>Terima kasih sudah berbelanja 🙏</p>`;$('receiptModal').classList.remove('hidden')}
$('closeReceipt').onclick=()=>$('receiptModal').classList.add('hidden');$('printReceipt').onclick=()=>window.print();
function renderHistory(rows){$('historyBody').innerHTML=rows.length?rows.map(r=>`<tr><td>${esc(r.invoice)}</td><td>${new Date(r.created_at).toLocaleString('id-ID')}</td><td>${r.item_count} unit</td><td><b>${money(r.total)}</b></td></tr>`).join(''):'<tr><td colspan="4" class="muted">Belum ada transaksi.</td></tr>'}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
if('serviceWorker' in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js').catch(()=>{}));
init();
