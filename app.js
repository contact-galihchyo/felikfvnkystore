const products = [
  {id:1, title:"Party Biasa", creator:"FX Official", type:"remix", typeLabel:"REMIX", genre:"partybiasa", genreLabel:"Party Biasa", price:185000, rating:5.0, sales:0, bpm:"", key:"", date:"2026-08-18", featured:false, desc:"Style Party Biasa.", license:""},
  {id:2, title:"Party Request", creator:"FX Official", type:"remix", typeLabel:"REMIX", genre:"partyreq", genreLabel:"Party Req", price:200000, rating:5.0, sales:0, bpm:"", key:"", date:"2026-08-18", featured:true, desc:"Style Party Req.", license:""},
  {id:3, title:"Party Jungle Dutch", creator:"FX Official", type:"remix", typeLabel:"REMIX", genre:"jungledutch", genreLabel:"Jungle Dutch", price:350000, rating:5.0, sales:0, bpm:"", key:"", date:"2026-08-18", featured:true, desc:"Style Party Jungle Dutch.", license:""},
  {id:4, title:"Jengat", creator:"FX Official", type:"remix", typeLabel:"REMIX", genre:"jengat", genreLabel:"Jengat", price:300000, rating:5.0, sales:0, bpm:"", key:"", date:"2026-08-18", featured:false, desc:"Style Jengat.", license:""},
  {id:5, title:"Funkot Horeg", creator:"FX Official", type:"remix", typeLabel:"REMIX", genre:"funkothoreg", genreLabel:"Funkot Horeg", price:350000, rating:5.0, sales:0, bpm:"", key:"", date:"2026-08-18", featured:true, desc:"Style Funkot Horeg.", license:""},
  {id:6, title:"Funkot Original", creator:"FX Official", type:"remix", typeLabel:"REMIX", genre:"funkot", genreLabel:"Funkot", price:500000, rating:5.0, sales:0, bpm:"", key:"", date:"2026-08-18", featured:false, desc:"Style Funkot Original.", license:""},
  {id:7, title:"Trap", creator:"FX Official", type:"remix", typeLabel:"REMIX", genre:"trap", genreLabel:"Trap", price:300000, rating:5.0, sales:0, bpm:"", key:"", date:"2026-08-18", featured:false, desc:"Style Trap.", license:""},
  {id:8, title:"Trap Party", creator:"FX Official", type:"remix", typeLabel:"REMIX", genre:"trapparty", genreLabel:"Trap Party", price:350000, rating:5.0, sales:0, bpm:"", key:"", date:"2026-08-18", featured:false, desc:"Style Trap Party.", license:""},
  {id:9, title:"Trap Battle", creator:"FX Official", type:"remix", typeLabel:"REMIX", genre:"trapbattle", genreLabel:"Trap Battle", price:500000, rating:5.0, sales:0, bpm:"", key:"", date:"2026-08-18", featured:false, desc:"Style Trap Battle.", license:""},
  {id:10, title:"BBHC", creator:"FX Official", type:"remix", typeLabel:"REMIX", genre:"bbhc", genreLabel:"BBHC", price:300000, rating:5.0, sales:0, bpm:"", key:"", date:"2026-08-18", featured:false, desc:"Style BBHC.", license:""},
  {id:11, title:"JJ Velocity", creator:"FX Official", type:"remix", typeLabel:"REMIX", genre:"jjvelocity", genreLabel:"JJ Velocity", price:300000, rating:5.0, sales:0, bpm:"", key:"", date:"2026-08-18", featured:false, desc:"Style JJ Velocity.", license:""},
  {id:12, title:"Custom Style", creator:"FX Official", type:"remix", typeLabel:"REMIX", genre:"custom", genreLabel:"Custom", price:500000, rating:5.0, sales:0, bpm:"", key:"", date:"2026-08-18", featured:false, desc:"Untuk Custum Style/Req Style silahkan cekout terlebih dahulu, untuk konsep style dan harga bisa di konsultasikan via Whatsapp ", license:""},
  {id:13, title:"Breakbet Clasic", creator:"FX Official", type:"remix", typeLabel:"REMIX", genre:"breakbeatclasic", genreLabel:"Breakbeat Clasic", price:700000, rating:5.0, sales:0, bpm:"", key:"", date:"2026-08-18", featured:false, desc:"Breakbeat Clasic", license:""},
];

const categories = [
  {id:"all",name:"Semua",icon:"✦",count:products.length},
  {id:"remix",name:"Remix",icon:"↯",count:products.filter(p=>p.type==="remix").length},
  {id:"flp",name:"FL Studio Project",icon:"◈",count:products.filter(p=>p.type==="flp").length}
];

let state = {
  search:"",
  category:"all",
  sort:"popular",
  maxPrice:700000,
  cart:JSON.parse(localStorage.getItem("felix-store-cart") || "[]"),
  favorites:JSON.parse(localStorage.getItem("felix-store-favorites") || "[]"),
  types:[],
  genres:[]
};

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const rupiah = n => new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0}).format(n);
const escapeHtml = s => String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));

function save(){
  localStorage.setItem("felix-store-cart",JSON.stringify(state.cart));
  localStorage.setItem("felix-store-favorites",JSON.stringify(state.favorites));
}

function coverMarkup(p, large=false){
  return `<div class="${large?'detail-cover':'cover'}">
    <div class="cover-art"><div class="cover-brand"><small>FELIK FVNKY</small><span>Felik Fvnky</span> <b>Store</b></div></div>
    ${!large ? `<div class="cover-badges"><span class="type-badge">${p.typeLabel}</span><button class="fav ${state.favorites.includes(p.id)?'active':''}" data-fav="${p.id}" aria-label="Favorit">${state.favorites.includes(p.id)?"♥":"♡"}</button></div><button class="play-preview" data-preview="${p.id}" aria-label="Preview">${playIcon()}</button>`:""}
  </div>`;
}

function renderCategories(){
  $("#categoryRow").innerHTML = categories.map(c=>`
    <button class="category-card ${state.category===c.id?'active':''}" data-category="${c.id}">
      <span class="cat-icon">${c.icon}</span><strong>${c.name}</strong><span>${c.count} products</span>
    </button>`).join("");
}

function normalizeSearch(value){
  return String(value ?? "")
    .toLocaleLowerCase("id-ID")
    .normalize("NFD")
    .replace(/[\\u0300-\\u036f]/g,"")
    .replace(/[^a-z0-9\\s]/g," ")
    .replace(/\\s+/g," ")
    .trim();
}

function filteredProducts(){
  let list = products.filter(p=>{
    const q = normalizeSearch(state.search);
    const searchable = normalizeSearch([
      p.title, p.creator, p.genre, p.genreLabel, p.type, p.typeLabel,
      p.desc, p.license, p.key, p.bpm
    ].join(" "));
    const terms = q ? q.split(" ") : [];
    const matchQ = !terms.length || terms.every(term => searchable.includes(term));
    const matchCat = state.category==="all" || p.type===state.category;
    const matchPrice = p.price<=state.maxPrice;
    const matchType = !state.types.length || state.types.includes(p.type);
    const matchGenre = !state.genres.length || state.genres.includes(p.genre);
    return matchQ && matchCat && matchPrice && matchType && matchGenre;
  });
  list.sort((a,b)=>{
    if(state.sort==="newest") return new Date(b.date)-new Date(a.date);
    if(state.sort==="price-low") return a.price-b.price;
    if(state.sort==="price-high") return b.price-a.price;
    if(state.sort==="rating") return b.rating-a.rating;
    return b.sales-a.sales;
  });
  return list;
}

function productCard(p){
  return `<article class="product-card" data-id="${p.id}">
    ${coverMarkup(p)}
    <div class="product-body">
      <h3 class="product-title" title="${escapeHtml(p.title)}">${escapeHtml(p.title)}</h3>
      <div class="creator">by ${escapeHtml(p.creator)}</div>
      <div class="product-foot">
      <strong class="price ${p.price===0?'free':''}">${p.price===0?"FREE":rupiah(p.price)}</strong>
      <div class="product-actions">
        <button class="add-btn cart-add-btn" type="button" data-add="${p.id}" title="Masukkan ke keranjang" aria-label="Masukkan ke keranjang"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 4h2l2.1 10.1a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 1.95-1.55L20.5 8H6M10 20a1 1 0 1 1-2 0m10 0a1 1 0 1 1-2 0"/></svg></button>
        <button class="add-btn order-btn" type="button" data-order="${p.id}">Pesan Sekarang</button>
      </div>
    </div>
    </div>
  </article>`;
}

function renderProducts(){
  const list = filteredProducts();
  $("#productGrid").innerHTML = list.map(productCard).join("");
  $("#emptyState").classList.toggle("hidden",list.length>0);
  $("#resultInfo").textContent = state.search ? `${list.length} hasil untuk "${state.search}"` : `${list.length} produk tersedia`;
  renderFeatured();
}

function renderFeatured(){
  $("#featuredGrid").innerHTML = products.filter(p=>p.featured).slice(0,3).map(p=>`
    <button class="featured-card" data-open="${p.id}">
      <span class="badge">${p.typeLabel}</span>
      <h3>${escapeHtml(p.title)}</h3>
      <p>${escapeHtml(p.creator)} · ${rupiah(p.price)}</p>
    </button>`).join("");
}

function renderCart(){
  const count = state.cart.reduce((sum,id)=>sum+(products.find(p=>p.id===id)?1:0),0);
  $("#cartCount").textContent=count; $("#mobileCartCount").textContent=count;
  const items = state.cart.map(id=>products.find(p=>p.id===id)).filter(Boolean);
  $("#cartItems").innerHTML = items.length ? items.map(p=>`
    <div class="cart-item">
      <div class="mini-cover"><span>Felik Fvnky</span> <b>Store</b></div>
      <div><h4>${escapeHtml(p.title)}</h4><p>${escapeHtml(p.typeLabel)}</p><strong>${rupiah(p.price)}</strong></div>
      <button class="remove-item" data-remove="${p.id}">Hapus</button>
    </div>`).join("") : `<div class="empty-state" style="padding:60px 10px;border:0"><div class="empty-icon">🛒</div><h3>Keranjang masih kosong</h3><p>Preview produk yang kamu suka lalu tambahkan ke sini.</p></div>`;
  const subtotal=items.reduce((s,p)=>s+p.price,0);
  $("#cartSubtotal").textContent=rupiah(subtotal);$("#cartTotal").textContent=rupiah(subtotal);
}

function openLayer(el){
  $("#overlay").classList.remove("hidden"); el.classList.remove("hidden");
}
function closeAll(){
  $("#overlay").classList.add("hidden");
  $$(".modal").forEach(m=>m.classList.add("hidden"));
  $("#cartDrawer").classList.remove("open");
}
function openCart(){openLayer($("#cartDrawer"));$("#cartDrawer").classList.add("open")}
function showProduct(id){
  const p=products.find(x=>x.id===id); if(!p)return;
  $("#productModalContent").innerHTML=`
    <div class="product-detail">
      ${coverMarkup(p,true)}
      <div>
        <span class="section-kicker">${p.typeLabel}</span>
        <h2>${escapeHtml(p.title)}</h2>
        <p class="creator">by ${escapeHtml(p.creator)} · ${p.sales} terjual</p>
        <div class="detail-price">${rupiah(p.price)}</div>
        <p class="detail-desc">${escapeHtml(p.desc)}</p>
        <div class="detail-tags"><span>${p.typeLabel}</span><span>Instant download</span><span>Preview tersedia</span></div>
        <button class="btn btn-primary full" data-order="${p.id}">Pesan Sekarang · ${rupiah(p.price)}</button>
      </div>
    </div>`;
  openLayer($("#productModal"));
}
function showCheckout(productId){
  const p = products.find(x => x.id === Number(productId));
  if(!p){ toast("Produk tidak ditemukan."); return; }
  showCheckoutItems([p]);
}

function showCartCheckout(){
  const items = state.cart.map(id => products.find(p => p.id === id)).filter(Boolean);
  if(!items.length){ toast("Keranjang masih kosong."); return; }
  showCheckoutItems(items);
}

function showCheckoutItems(items){
  const subtotal = items.reduce((sum,p)=>sum+p.price,0);
  const total = subtotal;

  $("#checkoutSummary").innerHTML = items.map(p => `
    <div class="checkout-product">
      <div class="mini-cover"><span>Felik Fvnky</span> <b>Store</b></div>
      <div>
        <strong>${escapeHtml(p.title)}</strong>
        <span>${escapeHtml(p.typeLabel)} · ${escapeHtml(p.creator)}</span>
        <b>${rupiah(p.price)}</b>
      </div>
    </div>`).join("") + `
    <div class="checkout-summary">
      <div><span>${items.length} produk</span><strong>${rupiah(subtotal)}</strong></div>
      <div class="checkout-total-row"><span>Total pembayaran</span><strong>${rupiah(total)}</strong></div>
    </div>`;

  $("#checkoutForm").dataset.productIds = items.map(p=>p.id).join(",");
  $("#paymentInstruction").innerHTML = getPaymentInstruction("DANA", total);
  $("#checkoutTotal").textContent = rupiah(total);
  $("#paymentMethod").value = "DANA";

  closeAll();
  openLayer($("#checkoutModal"));
}

function getPaymentInstruction(method, total){
  const details = {
    "DANA": `
      <div class="payment-detail-card payment-dana-card">
        <div class="payment-method-heading"><span class="payment-logo">D</span><div><strong>Bayar melalui DANA</strong><small>Metode utama</small></div></div>
        <p>Kirim tepat <b>${rupiah(total)}</b> ke akun DANA berikut:</p>
        <div class="payment-account-row">
          <div class="payment-account-info">
            <b>${escapeHtml(PAYMENT_DETAILS.dana)}</b>
          </div>
          <button type="button" class="copy-account-btn" data-copy-payment="${PAYMENT_DETAILS.danaNumber}">Salin Nomor DANA</button>
        </div>
        <small>Setelah pembayaran berhasil, simpan bukti pembayaran. Baru klik tombol konfirmasi WhatsApp.</small>
      </div>`,

    "QRIS": `
      <div class="payment-detail-card">
        <strong>Bayar melalui QRIS</strong>
        <p>Scan QRIS di bawah menggunakan aplikasi pembayaran kamu dengan nominal <b>${rupiah(total)}</b>.</p>
        <div class="qris-wrap"><img src="assets/qris.png" alt="QRIS Felik Fvnky Store" onerror="this.style.display='none';this.nextElementSibling.style.display='block'"><span style="display:none">Masukkan file QRIS di <code>assets/qris.png</code></span></div>
        <small>Setelah pembayaran berhasil, simpan screenshot/bukti pembayaran. Baru klik tombol konfirmasi WhatsApp.</small>
      </div>`,
    "Bank Transfer": `
      <div class="payment-detail-card">
        <strong>Bank Transfer</strong>
        <p>Transfer tepat <b>${rupiah(total)}</b> ke:</p>
        <div class="payment-account-row">
          <div class="payment-account-info">
            <b>${escapeHtml(PAYMENT_DETAILS.bank)}</b>
          </div>
          <button type="button" class="copy-account-btn" data-copy-payment="${PAYMENT_DETAILS.bankNumber}">Salin No. Rekening</button>
        </div>
        <small>Setelah transfer berhasil, simpan bukti pembayaran. Baru klik tombol konfirmasi WhatsApp.</small>
      </div>`,
    "E-Wallet": `
      <div class="payment-detail-card">
        <strong>E-Wallet</strong>
        <p>Kirim tepat <b>${rupiah(total)}</b> ke:</p>
        <div class="payment-account-row">
          <div class="payment-account-info">
            <b>${escapeHtml(PAYMENT_DETAILS.ewallet)}</b>
          </div>
          <button type="button" class="copy-account-btn" data-copy-payment="${PAYMENT_DETAILS.ewalletNumber}">Salin Nomor DANA</button>
        </div>
        <small>Setelah pembayaran berhasil, simpan bukti pembayaran. Baru klik tombol konfirmasi WhatsApp.</small>
      </div>`
  };
  return details[method] || details.QRIS;
}

const PAYMENT_DETAILS = {
  whatsapp: "6281230467508",
  qris: "assets/qris.png",
  bank: "Bank Jago 104468999416 a.n. FELIX FULVIAN ALFARIZI",
  bankNumber: "104468999416",
  dana: "DANA 082132334130 a.n. FELIX FULVIAN ALFARIZI",
  danaNumber: "082132334130",
  ewallet: "DANA 082132334130 a.n. FELIX FULVIAN ALFARIZI",
  ewalletNumber: "082132334130"
};
const DISCORD_URL = "https://discord.gg/aBFK5ZNw7h";

function buildWhatsAppMessage(items, customer, payment, note, total){
  const now = new Date();
  const dateTime = new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "2-digit", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hour12: false
  }).format(now).replace(",", " ·");
  const lines = [
    "Halo Felik Fvnky Store, saya ingin mengonfirmasi pesanan:",
    "",
    `📅 Waktu order: ${dateTime} WIB`,
    ...items.map((p,i)=>`${i+1}. ${p.title} — ${rupiah(p.price)}`),
    "",
    `💳 Total: ${rupiah(total)}`,
    `💰 Metode pembayaran: ${payment}`,
    "",
    `👤 Nama: ${customer.name}`,
    `📱 WhatsApp: ${customer.phone}`,
    `🔤 Request Inisial: ${customer.initials || "-"}`,
    `📝 Catatan: ${note || "-"}`,
    "",
    "Saya sudah menyelesaikan pembayaran dan siap mengirim bukti pembayaran.",
    "Mohon konfirmasi pesanan saya. Terima kasih!"
  ];
  return lines.join("\n");
}

function openWhatsAppOrder(){
  const form = $("#checkoutForm");
  const ids = String(form.dataset.productIds || "").split(",").filter(Boolean).map(Number);
  const items = ids.map(id=>products.find(p=>p.id===id)).filter(Boolean);
  if(!items.length){ toast("Produk tidak ditemukan."); return; }

  const data = new FormData(form);
  const name = String(data.get("name") || "").trim();
  const phone = String(data.get("phone") || "").trim();
  const initials = String(data.get("initials") || "").trim();
  const payment = String(data.get("payment") || "DANA");
  const note = String(data.get("note") || "").trim();
  if(!name || !phone){ form.reportValidity(); return; }

  const subtotal = items.reduce((s,p)=>s+p.price,0);
  const total = subtotal;
  const message = buildWhatsAppMessage(items, {name, phone}, payment, note, total);
  const url = `https://wa.me/${PAYMENT_DETAILS.whatsapp}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

function toast(msg){const el=$("#toast");el.textContent=msg;el.classList.add("show");clearTimeout(window.toastTimer);window.toastTimer=setTimeout(()=>el.classList.remove("show"),2200)}

async function copyPaymentNumber(number, button){
  const value = String(number || "").trim();
  if(!value)return;
  try{
    await navigator.clipboard.writeText(value);
  }catch(err){
    const temp=document.createElement("textarea");
    temp.value=value;
    temp.setAttribute("readonly","");
    temp.style.position="fixed";
    temp.style.opacity="0";
    document.body.appendChild(temp);
    temp.select();
    document.execCommand("copy");
    temp.remove();
  }
  const original=button.textContent;
  button.textContent="Tersalin ✓";
  button.classList.add("copied");
  toast(`Nomor ${value} berhasil disalin.`);
  setTimeout(()=>{button.textContent=original;button.classList.remove("copied")},1600);
}

function addCart(id){
  if(!state.cart.includes(id)){state.cart.push(id);save();renderCart();toast("Produk masuk ke keranjang.");}
  else toast("Produk sudah ada di keranjang.");
}
function toggleFav(id){
  state.favorites=state.favorites.includes(id)?state.favorites.filter(x=>x!==id):[...state.favorites,id];
  save();renderProducts();toast(state.favorites.includes(id)?"Ditambahkan ke favorit.":"Dihapus dari favorit.");
}

function stopPreview(){
  const player=window.previewAudio;
  if(player){
    try{player.pause();player.currentTime=0;}catch(e){}
  }
  window.previewAudio=null;
  $$(".play-preview").forEach(b=>{b.dataset.playing="0";b.innerHTML=playIcon();});
  const ui=$("#audioDock");
  const dockPlay=$("#audioDockPlay");
  if(dockPlay) dockPlay.innerHTML=playIcon();
  if(ui) ui.classList.remove("show");
}

function formatTime(seconds){
  if(!Number.isFinite(seconds)) return "0:00";
  const m=Math.floor(seconds/60);
  const s=Math.floor(seconds%60).toString().padStart(2,"0");
  return `${m}:${s}`;
}

function updateAudioDock(){
  const player=window.previewAudio;
  if(!player)return;
  const fill=$("#audioDockFill");
  const current=$("#audioDockCurrent");
  const duration=$("#audioDockDuration");
  if(fill) fill.style.width=(player.duration?`${(player.currentTime/player.duration)*100}%`:"0%");
  if(current) current.textContent=formatTime(player.currentTime);
  if(duration) duration.textContent=formatTime(player.duration);
}

function playIcon(){
  return `<svg class="icon-play" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l10-6.5L8 5.5Z"/></svg>`;
}
function pauseIcon(){
  return `<svg class="icon-pause" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h4v14H7zM13 5h4v14h-4z"/></svg>`;
}

function preview(id,button){
  const p=products.find(x=>x.id===id); if(!p)return;
  if(button.dataset.playing==="1" && window.previewAudio){
    if(window.previewAudio.paused){
      window.previewAudio.play().catch(()=>{});
      button.innerHTML=pauseIcon();
    }else{
      window.previewAudio.pause();
      button.innerHTML=playIcon();
    }
    return;
  }
  const previewUrl = window.MUSIC_LINKS?.[p.id];
  if(!previewUrl){
    toast("Preview audio produk ini belum tersedia.");
    return;
  }

  stopPreview();
  const player=$("#audioDockAudio");
  const ui=$("#audioDock");
  if(!player || !ui)return;

  player.src=previewUrl;
  player.currentTime=0;
  player.volume=.85;
  window.previewAudio=player;

  $("#audioDockTitle").textContent=p.title;
  $("#audioDockThumb").innerHTML=`<div class="dock-brand"><span>Felik Fvnky</span> <b>Store</b></div>`;
  $("#audioDockCurrent").textContent="0:00";
  $("#audioDockDuration").textContent="0:00";
  $("#audioDockFill").style.width="0%";
  $("#audioDockPlay").innerHTML=playIcon();
  ui.classList.add("show");
  button.dataset.playing="1";
  button.innerHTML=pauseIcon();

  player.onloadedmetadata=updateAudioDock;
  player.ontimeupdate=updateAudioDock;
  player.onplay=()=>{
    $("#audioDockPlay").innerHTML=pauseIcon();
    const active=$$(".play-preview").find(b=>b.dataset.playing==="1");
    if(active) active.innerHTML=pauseIcon();
  };
  player.onpause=()=>{
    $("#audioDockPlay").innerHTML=playIcon();
    const active=$$(".play-preview").find(b=>b.dataset.playing==="1");
    if(active) active.innerHTML=playIcon();
  };
  player.onended=()=>{
    $$(".play-preview").forEach(b=>{b.dataset.playing="0";b.innerHTML=playIcon();});
    $("#audioDockPlay").innerHTML=playIcon();
    updateAudioDock();
  };
  player.onerror=()=>{
    stopPreview();
    toast("File preview audio tidak ditemukan.");
  };

  player.play().then(()=>{
    toast(`Preview: ${p.title}`);
  }).catch(()=>{
    stopPreview();
    toast("Preview audio tidak dapat diputar.");
  });
}

function seekAudio(e){
  const player=window.previewAudio;
  const track=document.querySelector("#audioDockTrack");
  if(!player || !player.duration || !track)return;
  const rect=track.getBoundingClientRect();
  const clientX=e.clientX ?? (e.touches && e.touches[0] ? e.touches[0].clientX : null);
  if(clientX==null)return;
  const ratio=Math.min(1,Math.max(0,(clientX-rect.left)/rect.width));
  player.currentTime=ratio*player.duration;
  updateAudioDock();
}

let audioSeeking=false;
function startAudioSeek(e){
  if(e.pointerType !== "mouse" || e.button===0){
    audioSeeking=true;
    const track=e.currentTarget;
    try{track.setPointerCapture?.(e.pointerId);}catch(_){}
    seekAudio(e);
    e.preventDefault();
  }
}
function moveAudioSeek(e){
  if(!audioSeeking)return;
  seekAudio(e);
  e.preventDefault();
}
function endAudioSeek(){ audioSeeking=false; }

const audioTrack=$("#audioDockTrack");
if(audioTrack){
  audioTrack.addEventListener("pointerdown",startAudioSeek);
  audioTrack.addEventListener("pointermove",moveAudioSeek);
  audioTrack.addEventListener("pointerup",endAudioSeek);
  audioTrack.addEventListener("pointercancel",endAudioSeek);
  audioTrack.addEventListener("lostpointercapture",endAudioSeek);
}

document.addEventListener("click",e=>{
  const dockPlay=e.target.closest("#audioDockPlay");
  if(dockPlay){
    const player=window.previewAudio;
    if(!player)return;
    if(player.paused){
      player.play().catch(()=>{});
      dockPlay.innerHTML=pauseIcon();
      const active=$$(".play-preview").find(b=>b.dataset.playing==="1");
      if(active)active.innerHTML=pauseIcon();
    }else{
      player.pause();
      dockPlay.innerHTML=playIcon();
      const active=$$(".play-preview").find(b=>b.dataset.playing==="1");
      if(active)active.innerHTML=playIcon();
    }
    return;
  }

  const copy=e.target.closest("[data-copy-payment]");if(copy){copyPaymentNumber(copy.dataset.copyPayment,copy);return}
  const order=e.target.closest("[data-order]");if(order){showCheckout(Number(order.dataset.order));return}
  const add=e.target.closest("[data-add]");if(add){addCart(Number(add.dataset.add));return}
  const fav=e.target.closest("[data-fav]");if(fav){toggleFav(Number(fav.dataset.fav));return}
  const prev=e.target.closest("[data-preview]");if(prev){preview(Number(prev.dataset.preview),prev);return}
  const open=e.target.closest("[data-open]");if(open){showProduct(Number(open.dataset.open));return}
  const cat=e.target.closest("[data-category]");if(cat){state.category=cat.dataset.category;renderCategories();renderProducts();$("#products").scrollIntoView({behavior:"smooth"});return}
  const remove=e.target.closest("[data-remove]");if(remove){state.cart=state.cart.filter(id=>id!==Number(remove.dataset.remove));save();renderCart();return}
  if(e.target.matches("[data-close]")||e.target.closest("[data-close]"))closeAll();
});

$("#overlay").addEventListener("click",closeAll);
$("#cartBtn").addEventListener("click",openCart);
$("#mobileCartBtn").addEventListener("click",openCart);
$("#profileBtn").addEventListener("click",()=>openLayer($("#profileModal")));
$("#mobileProfileBtn").addEventListener("click",()=>openLayer($("#profileModal")));
$("#howItWorksBtn").addEventListener("click",()=>openLayer($("#howModal")));
$("#howItWorksNav")?.addEventListener("click",()=>openLayer($("#howModal")));
$("#howItWorksFooter")?.addEventListener("click",()=>openLayer($("#howModal")));
$("#checkoutBtn").addEventListener("click",showCartCheckout);
$("#sellBtn").addEventListener("click",()=>toast("Halaman seller siap dihubungkan ke upload/backend."));
$("#openSearchBtn").addEventListener("click",()=>{$("#searchInput").focus();window.scrollTo({top:0,behavior:"smooth"})});
$("#allCategoriesBtn").addEventListener("click",()=>{state.category="all";renderCategories();renderProducts();$("#products").scrollIntoView({behavior:"smooth"})});
$("#featuredBtn").addEventListener("click",()=>{state.sort="rating";$("#sortSelect").value="rating";renderProducts();$("#products").scrollIntoView({behavior:"smooth"})});
$("#filterBtn").addEventListener("click",()=>$("#filterPanel").classList.toggle("open"));
$("#clearFiltersBtn").addEventListener("click",()=>{state.types=[];state.genres=[];state.maxPrice=700000;$("#priceRange").value=700000;$("#priceValue").textContent=rupiah(700000);$$(".type-filter,.genre-filter").forEach(x=>x.checked=false);renderProducts()});
$("#resetSearchBtn").addEventListener("click",()=>{state.search="";$("#searchInput").value="";state.category="all";renderCategories();renderProducts()});
$("#sortSelect").addEventListener("change",e=>{state.sort=e.target.value;renderProducts()});
$("#priceRange").addEventListener("input",e=>{state.maxPrice=Number(e.target.value);$("#priceValue").textContent=rupiah(state.maxPrice);renderProducts()});
$$(".type-filter").forEach(x=>x.addEventListener("change",()=>{state.types=$$(".type-filter:checked").map(i=>i.value);renderProducts()}));
$$(".genre-filter").forEach(x=>x.addEventListener("change",()=>{state.genres=$$(".genre-filter:checked").map(i=>i.value);renderProducts()}));
$("#searchForm").addEventListener("submit",e=>{
  e.preventDefault();
  state.search=$("#searchInput").value;
  renderProducts();
  $("#products").scrollIntoView({behavior:"smooth",block:"start"});
});
$("#searchInput").addEventListener("input",e=>{
  state.search=e.target.value;
  renderProducts();
});
$("#searchInput").addEventListener("search",e=>{
  state.search=e.target.value;
  renderProducts();
});
document.addEventListener("keydown",e=>{if(e.key==="/"&&document.activeElement.tagName!=="INPUT"){e.preventDefault();$("#searchInput").focus()}if(e.key==="Escape")closeAll()});
$("#checkoutForm").addEventListener("submit",e=>{
  e.preventDefault();
  openWhatsAppOrder();
});
$("#paymentMethod").addEventListener("change", e=>{
  const ids = String($("#checkoutForm").dataset.productIds || "").split(",").filter(Boolean).map(Number);
  const items = ids.map(id=>products.find(p=>p.id===id)).filter(Boolean);
  if(!items.length)return;
  const subtotal = items.reduce((s,p)=>s+p.price,0);
  const total = subtotal;
  $("#paymentInstruction").innerHTML = getPaymentInstruction(e.target.value, total);
});



const consultFloat = $("#consultFloat");
const consultModal = $("#consultModal");
const discordBtn = $("#discordBtn");
const consultClose = $("#consultClose");
if(consultFloat && consultModal){
  consultFloat.addEventListener("click",()=>consultModal.classList.remove("hidden"));
}
if(consultClose && consultModal){
  consultClose.addEventListener("click",()=>consultModal.classList.add("hidden"));
}
if(discordBtn){
  discordBtn.addEventListener("click",()=>window.open(DISCORD_URL,"_blank","noopener,noreferrer"));
}
if(consultModal){
  consultModal.addEventListener("click",e=>{if(e.target===consultModal)consultModal.classList.add("hidden")});
}

renderCategories();renderProducts();renderCart();
