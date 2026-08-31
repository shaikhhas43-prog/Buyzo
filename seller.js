const db=window.supabase.createClient("https://ahhrhjucbdddcdlzjokg.supabase.co","sb_publishable_EwPScyGzZsQoNPY9J7GdxA_RpqpiwlO");
let user=null,products=[];

async function init(){
  const s=await db.auth.getSession();
  user=s.data.session?.user||null;
  document.getElementById("login").style.display=user?"none":"grid";
  document.getElementById("app").style.display=user?"block":"none";
  if(user){document.getElementById("email").textContent=user.email||"";load();}
}
async function load(){
  if(!user)return;
  const r=await db.from("products").select("*").eq("seller_id",user.id).order("created_at",{ascending:false});
  if(r.error){notice(r.error.message);return}
  products=r.data||[];render();
}
function render(){
  document.getElementById("count").textContent=products.length;
  document.getElementById("list").innerHTML=products.map(p=>{
    const fallback="https://placehold.co/150x150/f0f1f6/171b35?text=BUYZO";
    const img=p.image_url||fallback;
    return `<div class="product"><img class="pic" src="${escapeAttr(img)}" onerror="this.onerror=null;this.src='${fallback}'">
      <div class="info"><b>${escapeHTML(p.name)}</b><small>${escapeHTML(p.category)} • Stock: ${p.stock??0}</small><strong>₹${Number(p.price||0).toLocaleString("en-IN")}</strong></div>
      <button onclick="del(${Number(p.id)})">Delete</button></div>`;
  }).join("")||"<p>No products yet.</p>";
}
async function addProduct(){
  const name=document.getElementById("name").value.trim(),category=document.getElementById("category").value;
  const price=Number(document.getElementById("price").value),old=Number(document.getElementById("old").value)||null;
  const stock=Math.max(0,Number(document.getElementById("stock").value)||0),emoji=document.getElementById("emoji").value||"🛍️";
  const file=document.getElementById("productImage").files[0];
  if(!name||!price||!file){notice("Product name, price aur photo required hai.");return}
  if(file.size>5*1024*1024){notice("Photo 5MB se chhoti honi chahiye.");return}
  notice("📸 Photo upload ho rahi hai...");
  const ext=(file.name.split(".").pop()||"jpg").toLowerCase();
  const path=`${user.id}/${crypto.randomUUID()}.${ext}`;
  const up=await db.storage.from("product-images").upload(path,file,{contentType:file.type,upsert:false});
  if(up.error){notice("Photo upload error: "+up.error.message);return}
  const publicURL=db.storage.from("product-images").getPublicUrl(path).data.publicUrl;
  const r=await db.from("products").insert({name,category,price,old_price:old,stock,emoji,image_url:publicURL,image_path:path,seller_id:user.id});
  if(r.error){await db.storage.from("product-images").remove([path]);notice("Product save error: "+r.error.message);return}
  ["name","price","old","emoji"].forEach(id=>document.getElementById(id).value="");
  document.getElementById("stock").value="1";document.getElementById("productImage").value="";
  document.getElementById("imagePreview").style.display="none";
  notice("✅ Product photo ke saath add ho gaya!");load();
}
function previewImage(){
  const file=document.getElementById("productImage").files[0],img=document.getElementById("imagePreview");
  if(!file){img.style.display="none";return}
  img.src=URL.createObjectURL(file);img.style.display="block";
}
async function del(id){
  if(!confirm("Delete this product?"))return;
  const p=products.find(x=>Number(x.id)===Number(id));
  const r=await db.from("products").delete().eq("id",id);
  if(r.error){notice(r.error.message);return}
  if(p?.image_path)await db.storage.from("product-images").remove([p.image_path]);
  notice("Product deleted.");load();
}
async function login(){
  const email=document.getElementById("le").value.trim(),password=document.getElementById("lp").value;
  const r=await db.auth.signInWithPassword({email,password});
  if(r.error){document.getElementById("loginMsg").textContent=r.error.message;return}
  init();
}
async function logout(){await db.auth.signOut();init()}
function notice(t){const e=document.getElementById("notice");if(e)e.textContent=t}
function escapeHTML(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));}
function escapeAttr(v){return escapeHTML(v).replace(/`/g,"&#096;")}
init();