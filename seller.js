const db=window.supabase.createClient("https://ahhrhjucbdddcdlzjokg.supabase.co","sb_publishable_EwPScyGzZsQoNPY9J7GdxA_RpqpiwlO");
let user=null, products=[];
const money=n=>"₹"+Number(n).toLocaleString("en-IN");
async function init(){
 const s=await db.auth.getSession(); user=s.data.session?.user||null;
 if(!user){document.getElementById("login").style.display="block";document.getElementById("app").style.display="none";return}
 document.getElementById("login").style.display="none";document.getElementById("app").style.display="block";
 document.getElementById("email").textContent=user.email; load();
}
async function load(){
 const r=await db.from("products").select("*").order("created_at",{ascending:false});
 if(r.error){document.getElementById("notice").textContent=r.error.message;return}
 products=r.data||[]; render();
}
function render(){
 document.getElementById("count").textContent=products.length;
 document.getElementById("list").innerHTML=products.map(p=>`<div class="product"><div class="pic">${p.emoji||"🛍️"}</div><div class="info"><b>${p.name}</b><small>${p.category}</small><strong>${money(p.price)}</strong></div><button onclick="del(${p.id})">Delete</button></div>`).join("")||"<p>No products yet.</p>";
}
async function addProduct(){
 const name=document.getElementById("name").value.trim(), category=document.getElementById("category").value, price=Number(document.getElementById("price").value), old=Number(document.getElementById("old").value)||null, emoji=document.getElementById("emoji").value||"🛍️";
 if(!name||!price)return notice("Product name and price required.");
 const r=await db.from("products").insert({name,category,price,old_price:old,emoji});
 if(r.error)return notice(r.error.message);
 ["name","price","old","emoji"].forEach(id=>document.getElementById(id).value=""); notice("Product added successfully."); load();
}
async function del(id){
 if(!confirm("Delete this product?"))return;
 const r=await db.from("products").delete().eq("id",id);
 if(r.error)notice(r.error.message); else {notice("Product deleted.");load();}
}
async function logout(){await db.auth.signOut();init();}
function notice(t){document.getElementById("notice").textContent=t}
async function login(){
 const e=document.getElementById("le").value.trim(),p=document.getElementById("lp").value;
 const r=await db.auth.signInWithPassword({email:e,password:p});
 if(r.error) return document.getElementById("loginMsg").textContent=r.error.message;
 init();
}
init();