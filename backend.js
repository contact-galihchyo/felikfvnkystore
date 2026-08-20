/* Felik Fvnky Store - Supabase order/status layer */
(function(){
  const CFG = window.SUPABASE_CONFIG || {};
  const client = CFG.url && CFG.anonKey && window.supabase?.createClient
    ? (window.SUPABASE_CLIENT || window.supabase.createClient(CFG.url, CFG.anonKey))
    : null;
  window.SUPABASE_CLIENT = client;

  const $ = s => document.querySelector(s);
  const esc = s => String(s ?? "").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
  const rupiah = n => new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0}).format(Number(n)||0);
  const demoKey = "felix-store-orders-v2";
  const readDemo = () => JSON.parse(localStorage.getItem(demoKey)||"[]");
  const writeDemo = v => localStorage.setItem(demoKey,JSON.stringify(v));
  const code = () => `FK-${crypto.randomUUID().replace(/-/g,"").slice(0,8).toUpperCase()}`;
  const statusLabel = status => ({waiting_payment:"Menunggu Pembayaran",paid:"Pembayaran Berhasil",queued:"Masuk Antrean",processing:"Sedang Dikerjakan",revision:"Revisi",completed:"Selesai",cancelled:"Dibatalkan"})[status] || status;
  const statusSteps = status => {
    const order=["waiting_payment","paid","queued","processing","revision","completed"];
    const idx=order.indexOf(status);
    return order.map((s,i)=>`<div class="order-step ${idx>=0&&i<idx?'done ':''}${s===status?'current':''}"><span>${idx>=0&&i<idx?'✓':i+1}</span><strong>${statusLabel(s)}</strong></div>`).join("");
  };
  function setMessage(text){const el=$("#orderLookupResult");if(el)el.innerHTML=text;}

  function normalizeOrder(row){
    if(!row) return null;
    return {
      ...row,
      code: row.order_code || row.code,
      product_title: row.product_title || "Jasa Remix",
      style_label: row.style_label || "Remix",
      status: row.order_status || row.status,
      reviewed: !!row.has_review
    };
  }

  function renderOrder(raw){
    const order=normalizeOrder(raw);
    if(!order)return "";
    const canRate = order.status === "completed" && !order.reviewed;
    return `<div class="order-result-card">
      <div class="order-result-head"><div><span class="section-kicker">KODE PESANAN</span><h3>${esc(order.code)}</h3></div><span class="order-status ${esc(order.status)}">${statusLabel(order.status)}</span></div>
      <div class="order-product-row"><div><strong>${esc(order.product_title)}</strong><span>${esc(order.style_label||"Remix")}</span></div><strong>${rupiah(order.total)}</strong></div>
      <div class="order-data-grid"><div><small>Nama</small><strong>${esc(order.customer_name||"-")}</strong></div><div><small>Judul Lagu</small><strong>${esc(order.song_title||"-")}</strong></div><div><small>Inisial</small><strong>${esc(order.initials||"-")}</strong></div><div><small>WhatsApp</small><strong>${esc(order.customer_phone||"-")}</strong></div></div>
      <div class="order-timeline">${statusSteps(order.status)}</div>
      ${canRate?`<div class="rating-box"><h4>Pesanan sudah selesai 🎉</h4><p>Kasih rating untuk style remix ini.</p><div class="stars" data-review-stars="${esc(order.order_id||order.id||order.code)}">${[1,2,3,4,5].map(n=>`<button type="button" data-star="${n}" aria-label="${n} bintang">★</button>`).join("")}</div><textarea rows="3" placeholder="Tulis ulasan (opsional)"></textarea><button class="btn btn-primary full" data-submit-review="${esc(order.order_id||order.id||order.code)}" data-order-code="${esc(order.code)}">Kirim Rating</button></div>`:""}
      <a class="btn btn-ghost full" target="_blank" rel="noopener" href="https://wa.me/${window.PAYMENT_DETAILS?.whatsapp||'6281230467508'}?text=${encodeURIComponent(`Halo Felik Fvnky Store, saya ingin menanyakan pesanan ${order.code}.`)}">Hubungi via WhatsApp</a>
    </div>`;
  }

  async function findOrder(codeValue){
    const c=String(codeValue||"").trim().toUpperCase(); if(!c)return null;
    if(client){
      const {data,error}=await client.rpc("get_order_status",{p_order_code:c});
      if(error)throw error;
      return data?.[0]||null;
    }
    return readDemo().find(o=>(o.order_code||o.code)===c)||null;
  }

  function resetOrderLookup(){
    const input=$("#orderCodeInput");
    if(input) input.value="";
    setMessage('<div class="empty-state"><h3>Belum ada pesanan yang dicek</h3><p>Masukkan kode pesanan yang kamu terima setelah checkout.</p></div>');
  }

  async function lookup(){
    const input=$("#orderCodeInput"); const c=String(input?.value||"").trim().toUpperCase();
    if(!c){setMessage('<div class="empty-state"><h3>Masukkan kode pesanan</h3><p>Contoh: FK-8A29K9</p></div>');return;}
    try{const order=await findOrder(c);setMessage(order?renderOrder(order):'<div class="empty-state"><h3>Pesanan tidak ditemukan</h3><p>Periksa kembali kode pesanan kamu.</p></div>');}
    catch(e){console.error(e);setMessage(`<div class="empty-state"><h3>Gagal memuat pesanan</h3><p>${esc(e.message||"Coba lagi.")}</p></div>`);}
  }

  async function createOrder(payload){
    if(client){
      const {data,error}=await client.rpc("create_order",{
        p_product_id:payload.product_id,
        p_customer_name:payload.customer_name,
        p_customer_phone:payload.phone,
        p_song_title:payload.song_title,
        p_initials:payload.initials||null,
        p_payment_method:payload.payment_method||"DANA",
        p_note:payload.note||null
      });
      if(error)throw error;
      const r=data?.[0];
      if(!r)throw new Error("Pesanan tidak berhasil dibuat.");
      return {...payload,order_id:r.order_id,order_code:r.order_code,code:r.order_code,total:r.total,order_status:"waiting_payment",created_at:new Date().toISOString()};
    }
    const order={...payload,order_code:code(),code:code(),order_status:"waiting_payment",created_at:new Date().toISOString()};
    const all=readDemo();all.unshift(order);writeDemo(all);return order;
  }

  async function submitReview(codeValue, stars, text){
    if(client){
      const {error}=await client.rpc("submit_review",{p_order_code:String(codeValue).trim().toUpperCase(),p_rating:Number(stars),p_review:text||null});
      if(error)throw error; return;
    }
    const all=readDemo();const idx=all.findIndex(o=>(o.order_code||o.code)===codeValue);if(idx<0)throw new Error("Order tidak ditemukan");
    if(all[idx].order_status!=="completed")throw new Error("Pesanan belum selesai.");
    if(all[idx].reviewed)throw new Error("Pesanan ini sudah diberi rating.");
    all[idx].reviewed=true;all[idx].review={rating:stars,review:text||""};writeDemo(all);
  }

  async function handleCheckoutSubmit(e){
    e.preventDefault();
    const form=e.currentTarget;
    const ids=String(form.dataset.productIds||"").split(",").filter(Boolean).map(Number);
    const items=ids.map(id=>window.FELIK_PRODUCTS?.find(p=>p.id===id)).filter(Boolean);
    if(!items.length){window.toast?.("Produk tidak ditemukan.");return;}
    const fd=new FormData(form);
    const payload={
      product_id:items[0].id,
      product_title:items.map(p=>p.title).join(", "),
      style_label:items.map(p=>p.genreLabel||p.title).join(", "),
      total:items.reduce((s,p)=>s+p.price,0),
      customer_name:String(fd.get("name")||"").trim(),
      phone:String(fd.get("phone")||"").trim(),
      song_title:String(fd.get("song_title")||"").trim(),
      initials:String(fd.get("initials")||"").trim(),
      payment_method:String(fd.get("payment")||"DANA"),
      note:String(fd.get("note")||"").trim()
    };
    if(!payload.customer_name||!payload.phone||!payload.song_title||!payload.initials){form.reportValidity();return;}
    try{
      const order=await createOrder(payload);
      form.dataset.lastOrderCode=order.order_code;
      const message=["Halo Felik Fvnky Store, saya sudah membuat pesanan remix.","",`🔖 Kode Pesanan: ${order.order_code}`,`🎧 Style: ${order.style_label}`,`🎵 Judul Lagu: ${order.song_title}`,`🔤 Inisial: ${order.initials}`,`👤 Nama: ${order.customer_name}`,`📱 WhatsApp: ${order.phone}`,`💳 Metode: ${order.payment_method}`,`💰 Total: ${rupiah(order.total)}`,"","Saya akan mengirim bukti pembayaran melalui WhatsApp setelah pembayaran."] .join("\n");
      const wa=`https://wa.me/${window.PAYMENT_DETAILS?.whatsapp||'6281230467508'}?text=${encodeURIComponent(message)}`;
      window.open(wa,"_blank","noopener,noreferrer"); window.closeAll?.();
      const input=$("#orderCodeInput");if(input)input.value=order.order_code;
      setMessage(`<div class="success-order"><strong>Pesanan dibuat!</strong><span>Kode pesanan kamu:</span><b>${order.order_code}</b><small>Simpan kode ini untuk melihat status pesanan.</small><button class="btn btn-primary full" id="lookupNewOrder">Lihat Pesanan</button></div>`);
      window.openLayer?.($("#ordersModal"));
    }catch(err){console.error(err);window.toast?.(err.message||"Pesanan gagal dibuat.");}
  }

  window.FELIK_BACKEND={client,handleCheckoutSubmit,lookup,resetOrderLookup,submitReview,statusLabel};
  document.addEventListener("click",async e=>{
    if(e.target.closest("#orderLookupBtn")){await lookup();return;}
    if(e.target.closest("#lookupNewOrder")){await lookup();return;}
    const star=e.target.closest("[data-star]");
    if(star){const wrap=star.closest(".stars");wrap.dataset.value=star.dataset.star;wrap.querySelectorAll("button").forEach((b,i)=>b.classList.toggle("active",i<Number(star.dataset.star)));return;}
    const review=e.target.closest("[data-submit-review]");
    if(review){const wrap=review.closest(".rating-box");const stars=Number(wrap?.querySelector(".stars")?.dataset.value||0);if(!stars){window.toast?.("Pilih rating dulu.");return;}const text=wrap.querySelector("textarea")?.value||"";try{await submitReview(review.dataset.orderCode,stars,text);window.toast?.("Rating berhasil dikirim!");await lookup();}catch(err){console.error(err);window.toast?.(err.message||"Gagal mengirim rating.");}}
  });
  window.addEventListener("DOMContentLoaded",()=>{
    const lookupBtn=$("#ordersNavBtn"),mobile=$("#mobileOrdersBtn");
    [lookupBtn,mobile].forEach(b=>b?.addEventListener("click",()=>{
      resetOrderLookup();
      window.openLayer?.($("#ordersModal"));
    }));
    const form=$("#orderLookupForm");
    form?.addEventListener("submit",async e=>{
      e.preventDefault();
      await lookup();
    });
  });
})();
