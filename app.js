const SUPABASE_URL="https://ahhrhjucbdddcdlzjokg.supabase.co";
const SUPABASE_KEY="sb_publishable_EwPScyGzZsQoNPY9J7GdxA_RpqpiwlO";
const WHATSAPP_NUMBER = "919725231594"; // <-- yahan apna WhatsApp number daalo

const db=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
let allProducts=[],filteredProducts=[];
let cart=JSON.parse(localStorage.getItem("buyzo_cart")||"[]");
let currentOrder=null;

document.addEventListener("DOMContentLoaded",()=>{
  loadProducts();updateCartCount();
  document.getElementById("search")?.addEventListener("keydown",e=>{if(e.key==="Enter")searchProducts()});
  document.getElementById("checkoutForm")?.addEventListener("submit",placeOrder);
});

async function loadProducts(){
 const grid=document.getElementById("productGrid"); if(!grid)return;
 grid.innerHTML='<div class="loading">Loading BUYZO products...</div>';
 const {data,error}=await db.from("products").select("id,name,category,price,old_price,stock,emoji,image_url,seller_id,created_at").order("created_at",{ascending:false});
 if(error){console.error(error);grid.innerHTML=`<div class="empty"><h3>Products load nahi ho rahe.</h3><p>${escapeHTML(error.message)}</p></div>`;return}
 allProducts=data||[];filteredProducts=[...allProducts];renderProducts();
}
function renderProducts(){
 const grid=document.getElementById("productGrid");if(!grid)return;
 if(!filteredProducts.length){grid.innerHTML='<div class="empty"><h3>No products found</h3><p>Abhi is category me product available nahi hai.</p></div>';return}
 grid.innerHTML=filteredProducts.map(createProductCard).join("");
}
function createProductCard(p){
 const price=Number(p.price||0),oldPrice=Number(p.old_price||0),stock=Number(p.stock??0);
 const image=(p.image_url||"").trim(),fallback=`https://placehold.co/700x700/f0f1f6/171b35?text=${encodeURIComponent(p.emoji||"BUYZO")}`;
 const discount=oldPrice>price?Math.round(((oldPrice-price)/oldPrice)*100):0;
 return `<article class="productCard"><div class="productImage">${discount>0?`<span class="discount">${discount}% OFF</span>`:""}<img src="${escapeAttr(image||fallback)}" alt="${escapeHTML(p.name)}" loading="lazy" onerror="this.onerror=null;this.src='${fallback}'"></div><div class="productBody"><small class="category">${escapeHTML(p.category||"Other")}</small><h3>${escapeHTML(p.name)}</h3><div class="price"><strong>₹${price.toLocaleString("en-IN")}</strong>${oldPrice>price?`<del>₹${oldPrice.toLocaleString("en-IN")}</del>`:""}</div><div class="stock">${stock>0?`✓ In stock (${stock})`:"✕ Out of stock"}</div><button class="addCart" onclick="addToCart(${Number(p.id)})" ${stock<=0?"disabled":""}>${stock<=0?"Out of Stock":"🛒 Add to Cart"}</button></div></article>`;
}
function filterCat(category){filteredProducts=category==="All"?[...allProducts]:allProducts.filter(p=>String(p.category||"").toLowerCase()===category.toLowerCase());renderProducts();document.getElementById("products")?.scrollIntoView({behavior:"smooth"})}
function searchProducts(){const q=document.getElementById("search")?.value.trim().toLowerCase()||"";filteredProducts=!q?[...allProducts]:allProducts.filter(p=>String(p.name||"").toLowerCase().includes(q)||String(p.category||"").toLowerCase().includes(q));renderProducts();document.getElementById("products")?.scrollIntoView({behavior:"smooth"})}

function addToCart(id){
 const p=allProducts.find(x=>Number(x.id)===Number(id));if(!p)return;
 const stock=Number(p.stock||0);if(stock<=0){alert("Ye product out of stock hai.");return}
 const item=cart.find(x=>Number(x.id)===Number(id));
 if(item){if(item.quantity>=stock){alert("Available stock itna hi hai.");return}item.quantity++}
 else cart.push({id:p.id,name:p.name,price:Number(p.price||0),image_url:p.image_url||"",quantity:1});
 saveCart();updateCartCount();renderCart();
}
function updateCartCount(){const el=document.getElementById("cartCount");if(el)el.textContent=cart.reduce((s,i)=>s+Number(i.quantity||0),0)}
function saveCart(){localStorage.setItem("buyzo_cart",JSON.stringify(cart))}
function openCart(){document.getElementById("cartModal")?.classList.add("show");renderCart()}
function renderCart(){
 const box=document.getElementById("cartItems"),totalEl=document.getElementById("cartTotal");if(!box)return;
 if(!cart.length){box.innerHTML='<div class="empty"><h3>Your cart is empty 🛒</h3><p>Products add karo.</p></div>';if(totalEl)totalEl.textContent="₹0";return}
 let total=0;
 box.innerHTML=cart.map(item=>{
  total+=Number(item.price)*Number(item.quantity);const fallback="https://placehold.co/100x100/f0f1f6/171b35?text=BUYZO";
  return `<div class="cartItem"><img src="${escapeAttr(item.image_url||fallback)}" onerror="this.onerror=null;this.src='${fallback}'"><div><b>${escapeHTML(item.name)}</b><p>₹${Number(item.price).toLocaleString("en-IN")}</p><div class="quantity"><button onclick="changeQty(${Number(item.id)},-1)">−</button><span>${item.quantity}</span><button onclick="changeQty(${Number(item.id)},1)">+</button></div></div><button class="remove" onclick="removeFromCart(${Number(item.id)})">×</button></div>`;
 }).join("");
 if(totalEl)totalEl.textContent="₹"+total.toLocaleString("en-IN");
}
function changeQty(id,change){const item=cart.find(i=>Number(i.id)===Number(id));if(!item)return;item.quantity+=change;if(item.quantity<=0)cart=cart.filter(i=>Number(i.id)!==Number(id));saveCart();updateCartCount();renderCart()}
function removeFromCart(id){cart=cart.filter(i=>Number(i.id)!==Number(id));saveCart();updateCartCount();renderCart()}

function startCheckout(){
 if(!cart.length){alert("Cart empty hai.");return}
 closeModal("cartModal");renderCheckoutSummary();document.getElementById("checkoutModal")?.classList.add("show");
}
function renderCheckoutSummary(){
 const box=document.getElementById("checkoutItems");if(!box)return;let total=0;
 box.innerHTML=cart.map(item=>{const t=Number(item.price)*Number(item.quantity);total+=t;const img=item.image_url||"https://placehold.co/100x100/f0f1f6/171b35?text=BUYZO";return `<div class="summaryItem"><img src="${escapeAttr(img)}"><div><b>${escapeHTML(item.name)}</b><br>${item.quantity} × ₹${Number(item.price).toLocaleString("en-IN")}</div><strong>₹${t.toLocaleString("en-IN")}</strong></div>`}).join("");
 document.getElementById("checkoutSubtotal").textContent="₹"+total.toLocaleString("en-IN");
 document.getElementById("checkoutTotal").textContent="₹"+total.toLocaleString("en-IN");
}
function placeOrder(e){
 e.preventDefault();
 const name=document.getElementById("coName").value.trim(),mobile=document.getElementById("coMobile").value.trim(),address=document.getElementById("coAddress").value.trim(),city=document.getElementById("coCity").value.trim(),state=document.getElementById("coState").value.trim(),pincode=document.getElementById("coPincode").value.trim();
 if(!/^\d{10}$/.test(mobile)){alert("10 digit mobile number enter karo.");return}
 if(!/^\d{6}$/.test(pincode)){alert("6 digit pincode enter karo.");return}
 let total=cart.reduce((s,i)=>s+Number(i.price)*Number(i.quantity),0);
 currentOrder={orderId:"BZ"+Date.now().toString().slice(-8),name,mobile,address,city,state,pincode,payment:"Cash on Delivery",items:JSON.parse(JSON.stringify(cart)),total};
 closeModal("checkoutModal");document.getElementById("successText").textContent=`Order #${currentOrder.orderId} — Total ₹${total.toLocaleString("en-IN")}.`;
 document.getElementById("successModal")?.classList.add("show");
}
function sendOrderWhatsApp(){
 if(!currentOrder)return;
 const o=currentOrder;
 const items=o.items.map(i=>`• ${i.name} × ${i.quantity} = ₹${(Number(i.price)*Number(i.quantity)).toLocaleString("en-IN")}`).join("\n");
 const msg=`*BUYZO NEW ORDER*\n\nOrder ID: ${o.orderId}\nName: ${o.name}\nMobile: ${o.mobile}\nAddress: ${o.address}, ${o.city}, ${o.state} - ${o.pincode}\nPayment: ${o.payment}\n\n*Items:*\n${items}\n\n*Total: ₹${o.total.toLocaleString("en-IN")}*`;
 const number=WHATSAPP_NUMBER.replace(/\D/g,"");
 if(number.length<10||number.includes("919XXXXXXXXX")){alert("Pehle app.js me WHATSAPP_NUMBER me apna number daalo.");return}
 window.open("https://wa.me/"+number+"?text="+encodeURIComponent(msg),"_blank");
}
function finishOrder(){cart=[];saveCart();updateCartCount();currentOrder=null;closeModal("successModal")}
function openAccount(){document.getElementById("accountModal")?.classList.add("show");loginForm()}
function loginForm(){const form=document.getElementById("accountForm");if(!form)return;form.innerHTML=`<input id="accountEmail" type="email" placeholder="Email" required><input id="accountPassword" type="password" placeholder="Password" required><button type="button" class="orange wide" onclick="doLogin()">Login</button>`;setTab("login")}
function signupForm(){const form=document.getElementById("accountForm");if(!form)return;form.innerHTML=`<input id="accountEmail" type="email" placeholder="Email" required><input id="accountPassword" type="password" placeholder="Password (minimum 6 characters)" required><button type="button" class="orange wide" onclick="doSignup()">Create Account</button>`;setTab("signup")}
function setTab(type){document.getElementById("loginTab")?.classList.toggle("selected",type==="login");document.getElementById("signupTab")?.classList.toggle("selected",type==="signup")}
async function doLogin(){const email=document.getElementById("accountEmail")?.value.trim(),password=document.getElementById("accountPassword")?.value,msg=document.getElementById("accountMsg");const {error}=await db.auth.signInWithPassword({email,password});if(error){if(msg)msg.textContent=error.message;return}if(msg)msg.textContent="Login successful ✅";setTimeout(()=>closeModal("accountModal"),500)}
async function doSignup(){const email=document.getElementById("accountEmail")?.value.trim(),password=document.getElementById("accountPassword")?.value,msg=document.getElementById("accountMsg");if(!email||!password){if(msg)msg.textContent="Email aur password required hai.";return}if(password.length<6){if(msg)msg.textContent="Password minimum 6 characters ka hona chahiye.";return}const {error}=await db.auth.signUp({email,password});if(error){if(msg)msg.textContent=error.message;return}if(msg)msg.textContent="Account created. Email verify karo."}
function closeModal(id){document.getElementById(id)?.classList.remove("show")}
function escapeHTML(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function escapeAttr(v){return escapeHTML(v).replace(/`/g,"&#096;")}
