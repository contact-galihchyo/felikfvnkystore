(function(){
  const cfg=window.SUPABASE_CONFIG||{};
  const client=cfg.url&&cfg.anonKey&&window.supabase?.createClient?(window.SUPABASE_CLIENT||window.supabase.createClient(cfg.url,cfg.anonKey)):null;
  window.SUPABASE_CLIENT=client;
  const $=s=>document.querySelector(s);
  const rupiah=n=>new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(Number(n)||0);
  const labels={waiting_payment:'Menunggu Pembayaran',paid:'Pembayaran Berhasil',queued:'Masuk Antrean',processing:'Sedang Dikerjakan',revision:'Revisi',completed:'Selesai',cancelled:'Dibatalkan'};
  const statuses=Object.keys(labels);
  let categories=[];

  async function requireAdmin(){
    if(!client){location.replace('index.html');return false;}
    const {data:{session}}=await client.auth.getSession();
    if(!session){location.replace('index.html');return false;}
    const {data:isAdmin,error}=await client.rpc('is_admin');
    if(error||isAdmin!==true){await client.auth.signOut();location.replace('index.html');return false;}
    $('#adminNotice').innerHTML='<b>Supabase terhubung.</b> Login admin aktif.';
    return true;
  }

  async function load(){
    const [ordersRes,productsRes,reviewsRes,salesRes,categoriesRes]=await Promise.all([
      client.from('orders').select('*').order('created_at',{ascending:false}),
      client.from('products').select('*').order('created_at',{ascending:false}),
      client.from('reviews').select('rating,product_id'),
      client.rpc('get_product_sales'),
      client.from('categories').select('*').eq('active',true).order('created_at',{ascending:true})
    ]);
    const err=ordersRes.error||productsRes.error||reviewsRes.error||salesRes.error||categoriesRes.error;
    if(err){$('#adminNotice').innerHTML='<b>Supabase error:</b> '+err.message;return;}
    const orders=ordersRes.data||[],products=productsRes.data||[],reviews=reviewsRes.data||[],sales=salesRes.data||[];
    categories=categoriesRes.data||[];
    const paidItems=orders.filter(o=>['paid','queued','processing','revision','completed'].includes(String(o.order_status||'').toLowerCase()));
    $('#statOrders').textContent=orders.length;
    $('#statSold').textContent=paidItems.length;
    $('#statWorking').textContent=orders.filter(o=>['queued','processing','revision'].includes(o.order_status)).length;
    $('#statRating').textContent=reviews.length?(reviews.reduce((s,r)=>s+Number(r.rating||0),0)/reviews.length).toFixed(1):'0.0';
    renderCategoryOptions();
    renderCategories();
    renderOrders(orders);
    renderProducts(products,sales);
  }

  function renderCategoryOptions(){
    const sel=$('#productCategory');
    if(!sel)return;
    sel.innerHTML=categories.length?categories.map(c=>`<option value="${esc(c.id)}">${esc(c.name)}</option>`).join(''):'<option value="">Belum ada kategori</option>';
  }

  function renderCategories(){
    const el=$('#categoriesList');
    if(!el)return;
    el.innerHTML=categories.length?categories.map(c=>`<div class="product-admin-item"><div class="product-admin-main"><strong>${esc(c.name)}</strong><small>ID: ${esc(c.id)}</small></div><div class="product-admin-actions"><span class="pill">Kategori</span><button type="button" class="btn btn-danger btn-delete-category" data-category-id="${esc(c.id)}" data-category-name="${esc(c.name)}">Hapus</button></div></div>`).join(''):'Belum ada kategori.';
  }

  function renderOrders(rows){
    $('#ordersTable').innerHTML=rows.length?rows.map(o=>`<tr><td><b>${esc(o.order_code)}</b></td><td>-</td><td>${esc(o.customer_name)}</td><td>${esc(o.song_title)}</td><td>${rupiah(o.total)}</td><td><span class="pill">${labels[o.order_status]||o.order_status}</span></td><td><select data-status="${esc(o.id)}">${statuses.map(s=>`<option value="${s}" ${s===o.order_status?'selected':''}>${labels[s]}</option>`).join('')}</select></td></tr>`).join(''):'<tr><td colspan="7">Belum ada pesanan.</td></tr>';
  }

  function renderProducts(rows,sales){
    const counts={};
    (sales||[]).forEach(s=>{counts[s.product_id]=Number(s.sold_count)||0});
    $('#productsList').innerHTML=rows.length?rows.map(p=>{
      const cat=categories.find(c=>String(c.id)===String(p.category_id||p.type));
      return `<div class="product-admin-item"><div class="product-admin-main"><strong>${esc(p.title)}</strong><small>${rupiah(p.price)} · ${esc(cat?.name||p.type_label||'Tanpa kategori')} · ${p.active?'Aktif':'Nonaktif'}</small></div><div class="product-admin-actions"><span class="pill">${counts[p.id]||0} terjual</span><button type="button" class="btn btn-danger btn-delete-product" data-product-id="${esc(p.id)}" data-product-title="${esc(p.title)}">Hapus</button></div></div>`;
    }).join(''):'Belum ada produk di database.';
  }
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const slugify=s=>String(s||'').toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');

  $('#categoryForm').addEventListener('submit',async e=>{
    e.preventDefault();
    const form=e.currentTarget;
    const f=new FormData(form);
    const name=String(f.get('categoryName')||'').trim();
    const icon='◈';
    const id=slugify(name);
    if(!name||!id){alert('Nama kategori wajib diisi.');return;}
    try{
      const {data,error}=await client.rpc('admin_create_category',{p_id:id,p_name:name,p_icon:icon});
      if(error)throw error;
      form.reset();
      await load();
      $('#productCategory').value=id;
      alert('Kategori berhasil ditambahkan.');
    }catch(err){alert(err.message);}
  });

  $('#productForm').addEventListener('submit',async e=>{
    e.preventDefault();
    const form=e.currentTarget;
    const f=new FormData(form);
    const categoryId=String(f.get('categoryId')||'').trim();
    const category=categories.find(c=>String(c.id)===categoryId);
    if(!category){alert('Pilih kategori terlebih dahulu.');return;}
    const p={title:String(f.get('title')||'').trim(),creator:String(f.get('creator')||'').trim(),price:Number(f.get('price')||0),genre:String(f.get('genreLabel')||'custom').toLowerCase().replace(/[^a-z0-9]+/g,'-'),genre_label:String(f.get('genreLabel')||'Custom').trim(),preview_url:String(f.get('audioUrl')||'').trim()||null,description:String(f.get('description')||'').trim(),featured:f.get('featured')==='on',category_id:category.id,type:String(category.id),type_label:category.name,active:true};
    try{const {error}=await client.from('products').insert(p);if(error)throw error;form.reset();await load();alert('Produk berhasil ditambahkan.');}catch(err){alert(err.message);}
  });

  document.addEventListener('click',async e=>{
    const catBtn=e.target.closest('.btn-delete-category');
    if(catBtn){
      const id=String(catBtn.dataset.categoryId||'').trim();
      const name=catBtn.dataset.categoryName||id;
      if(!id)return;
      if(!confirm(`Hapus kategori \"${name}\"?\n\nKategori hanya bisa dihapus jika belum dipakai oleh produk.`))return;
      catBtn.disabled=true;
      try{
        const {error}=await client.rpc('admin_delete_category',{p_category_id:id});
        if(error)throw error;
        await load();
        alert('Kategori berhasil dihapus.');
      }catch(err){
        alert(err.message||'Kategori gagal dihapus.');
        catBtn.disabled=false;
      }
      return;
    }

    const btn=e.target.closest('.btn-delete-product');
    if(!btn)return;
    const id=Number(btn.dataset.productId);
    const title=btn.dataset.productTitle||'produk ini';
    if(!Number.isFinite(id))return;
    if(!confirm(`Hapus produk \"${title}\"?\n\nProduk akan dihapus dari katalog. Pesanan lama tetap dipertahankan.`))return;
    btn.disabled=true;
    try{
      const {error}=await client.rpc('admin_delete_product',{p_product_id:id});
      if(error)throw error;
      await load();
      alert('Produk berhasil dihapus.');
    }catch(err){
      alert(err.message||'Produk gagal dihapus.');
      btn.disabled=false;
    }
  });

  document.addEventListener('change',async e=>{
    const sel=e.target.closest('[data-status]');if(!sel)return;
    const status=sel.value,id=sel.dataset.status;
    const patch={order_status:status};
    patch.payment_status=['paid','queued','processing','revision','completed'].includes(status)?'paid':status==='cancelled'?'failed':'pending';
    try{const {error}=await client.from('orders').update(patch).eq('id',id);if(error)throw error;await load();}catch(err){alert(err.message);await load();}
  });

  $('#logoutBtn').addEventListener('click',async()=>{await client.auth.signOut();location.replace('index.html');});
  (async()=>{if(await requireAdmin())await load();})();
})();
