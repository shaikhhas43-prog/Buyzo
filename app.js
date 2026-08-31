const products=[
{name:"Smart Watch",price:"₹1,999",icon:"⌚"},
{name:"Men's Casual Shirt",price:"₹699",icon:"👕"},
{name:"Running Shoes",price:"₹1,299",icon:"👟"},
{name:"Wireless Headphones",price:"₹1,499",icon:"🎧"},
{name:"Phone Case",price:"₹299",icon:"📱"},
{name:"Backpack",price:"₹899",icon:"🎒"}
];
let cart=0;
function render(list=products){document.getElementById("products").innerHTML=list.map(p=>`<article class="card"><div class="pic">${p.icon}</div><h3>${p.name}</h3><div class="price">${p.price}</div><button class="add" onclick="addCart()">Add to Cart</button></article>`).join("")}
function addCart(){document.getElementById("cartCount").textContent=++cart}
function searchProducts(){const q=document.getElementById("search").value.toLowerCase();render(q?products.filter(p=>p.name.toLowerCase().includes(q)):products)}
function openAuth(){document.getElementById("auth").style.display="flex";showLogin()}
function closeAuth(){document.getElementById("auth").style.display="none"}
function showLogin(){document.getElementById("loginTab").classList.add("active");document.getElementById("signupTab").classList.remove("active");document.getElementById("message").textContent="";document.getElementById("authForm").innerHTML=`<div class="field"><label>Mobile or Email</label><input required placeholder="Enter mobile/email"></div><div class="field"><label>Password</label><input required type="password" placeholder="Enter password"></div><button class="submit">Login</button>`}
function showSignup(){document.getElementById("signupTab").classList.add("active");document.getElementById("loginTab").classList.remove("active");document.getElementById("message").textContent="";document.getElementById("authForm").innerHTML=`<div class="field"><label>Full Name</label><input required placeholder="Your name"></div><div class="field"><label>Mobile or Email</label><input required placeholder="Enter mobile/email"></div><div class="field"><label>Create Password</label><input required type="password" placeholder="Create password"></div><button class="submit">Create Account</button>`}
function submitAuth(e){e.preventDefault();document.getElementById("message").textContent="Demo account screen ready. Real account/database will be connected in the next phase."}
render();
