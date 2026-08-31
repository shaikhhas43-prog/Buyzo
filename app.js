const products=[
{name:"Smartphone Pro 5G",cat:"Mobiles",price:15999,old:18999,icon:"📱"},
{name:"Men's Premium Casual Shirt",cat:"Fashion",price:699,old:1299,icon:"👕"},
{name:"Wireless ANC Headphones",cat:"Electronics",price:1499,old:2499,icon:"🎧"},
{name:"Modern Table Lamp",cat:"Home",price:899,old:1499,icon:"💡"},
{name:"Beauty Care Combo",cat:"Beauty",price:599,old:999,icon:"💄"},
{name:"Running Sports Shoes",cat:"Sports",price:1299,old:1999,icon:"👟"},
{name:"Smart Watch Series",cat:"Electronics",price:1999,old:2999,icon:"⌚"},
{name:"Everyday Backpack",cat:"Fashion",price:899,old:1399,icon:"🎒"}
];
let cart=JSON.parse(localStorage.getItem("buyzo_cart")||"[]");
function money(n){return "₹"+n.toLocaleString("en-IN")}
function render(list=products){
 const g=document.getElementById("productGrid");
 if(!list.length){g.innerHTML='<div class="empty">No products found. Try another search.</div>';return}
 g.innerHTML=list.map((p,i)=>`<article class="card"><div class="productVisual">${p.icon}</div><h3>${p.name}</h3><div class="rating">★★★★★ <span style="color:#777">4.5</span></div><div class="price">${money(p.price)} <span class="old">${money(p.old)}</span></div><button class="add" onclick="addToCart(${i})">Add to Cart</button></article>`).join("")
}
function addToCart(i){cart.push(products[i]);saveCart();alert("Added to cart")}
function saveCart(){localStorage.setItem("buyzo_cart",JSON.stringify(cart));document.getElementById("cartCount").textContent=cart.length}
function filterCat(cat){render(cat==="All"?products:products.filter(p=>p.cat===cat));document.getElementById("products").scrollIntoView({behavior:"smooth"})}
function searchProducts(){let q=document.getElementById("search").value.toLowerCase().trim();render(q?products.filter(p=>(p.name+" "+p.cat).toLowerCase().includes(q)):products)}
function openAccount(){document.getElementById("accountModal").style.display="flex";loginForm()}
function closeModal(id){document.getElementById(id).style.display="none"}
function loginForm(){tabs(true);document.getElementById("accountForm").innerHTML=`<div class="field"><label>Mobile or Email</label><input required placeholder="Enter mobile or email"></div><div class="field"><label>Password</label><input required type="password" placeholder="Enter password"></div><button class="submit" onclick="demoLogin(event)">Login</button>`}
function signupForm(){tabs(false);document.getElementById("accountForm").innerHTML=`<div class="field"><label>Full name</label><input required placeholder="Your name"></div><div class="field"><label>Mobile or Email</label><input required placeholder="Enter mobile or email"></div><div class="field"><label>Password</label><input required type="password" placeholder="Create password"></div><button class="submit" onclick="demoSignup(event)">Create Account</button>`}
function tabs(login){document.getElementById("loginTab").classList.toggle("selected",login);document.getElementById("signupTab").classList.toggle("selected",!login)}
function demoLogin(e){e.preventDefault();document.getElementById("accountMsg").textContent="Demo login successful. Real authentication will be connected to the backend."}
function demoSignup(e){e.preventDefault();document.getElementById("accountMsg").textContent="Demo account created. Real authentication will be connected to the backend."}
function openCart(){document.getElementById("cartModal").style.display="flex";renderCart()}
function renderCart(){const el=document.getElementById("cartItems");if(!cart.length){el.innerHTML='<div class="empty">Your cart is empty.</div>';document.getElementById("cartTotal").textContent="₹0";return}el.innerHTML=cart.map((p,i)=>`<div class="cartRow"><span>${p.icon} ${p.name}</span><b>${money(p.price)} <button onclick="removeCart(${i})">×</button></b></div>`).join("");document.getElementById("cartTotal").textContent=money(cart.reduce((a,p)=>a+p.price,0))}
function removeCart(i){cart.splice(i,1);saveCart();renderCart()}
function checkout(){if(!cart.length){alert("Add a product first.");return}alert("Checkout demo ready. Payment, address and order creation will be connected in the backend phase.")}
document.getElementById("search").addEventListener("keydown",e=>{if(e.key==="Enter")searchProducts()});
render();saveCart();
