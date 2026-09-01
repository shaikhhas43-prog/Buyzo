// ==============================
// BUYZO - MAIN WEBSITE
// ==============================

const SUPABASE_URL = "https://ahhrhjucbdddcdlzjokg.supabase.co";
const SUPABASE_KEY = "sb_publishable_EwPScyGzZsQoNPY9J7GdxA_RpqpiwlO";

// WhatsApp number: 91 + 10 digit mobile number, NO +
// Example: 919876543210
const WHATSAPP_NUMBER = "919XXXXXXXXX";

let db = null;
let allProducts = [];
let filteredProducts = [];
let cart = JSON.parse(localStorage.getItem("buyzo_cart") || "[]");

document.addEventListener("DOMContentLoaded", async () => {
  if (window.supabase) {
    db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    await loadProducts();
  } else {
    showError(
      "Supabase library load nahi hui. index.html me Supabase script check karo."
    );
  }

  updateCartCount();

  document.getElementById("search")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") searchProducts();
  });
});

async function loadProducts() {
  const grid = document.getElementById("productGrid");
  if (!grid || !db) return;

  grid.innerHTML = `<div class="loading">Loading BUYZO products...</div>`;

  const { data, error } = await db
    .from("products")
    .select(
      "id,name,category,price,old_price,stock,emoji,image_url,seller_id,created_at"
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Supabase products error:", error);
    grid.innerHTML = ` <div class="empty"> <h3>Products load nahi ho rahe.</h3> <p>${escapeHTML(error.message)}</p> </div>`;
    return;
  }

  allProducts = data || [];
  filteredProducts = [...allProducts];
  renderProducts();
}

function renderProducts() {
  const grid = document.getElementById("productGrid");
  if (!grid) return;

  if (!filteredProducts.length) {
    grid.innerHTML = ` <div class="empty"> <h3>No products found</h3> <p>Is category/search me abhi product available nahi hai.</p> </div>`;
    return;
  }

  grid.innerHTML = filteredProducts.map(createProductCard).join("");
}

function createProductCard(p) {
  const price = Number(p.price || 0);
  const oldPrice = Number(p.old_price || 0);
  const stock = Number(p.stock ?? 0);

  const fallback = `https://placehold.co/700x700/f0f1f6/171b35?text=${encodeURIComponent( p.emoji || "BUYZO" )}`;

  const image = String(p.image_url || "").trim() || fallback;
  const discount =
    oldPrice > price ? Math.round(((oldPrice - price) / oldPrice) * 100) : 0;

  return ` <article class="productCard"> <div class="productImage"> ${discount > 0 ? `<span class="discount">${discount}% OFF</span>` : ""} <img src="${escapeAttr(image)}" alt="${escapeHTML(p.name || "BUYZO product")}" loading="lazy" onerror="this.onerror=null;this.src='${fallback}'" > </div> <div class="productBody"> <small class="category">${escapeHTML(p.category || "Other")}</small> <h3>${escapeHTML(p.name || "Product")}</h3> <div class="price"> <strong>₹${price.toLocaleString("en-IN")}</strong> ${ oldPrice > price ? `<del>₹${oldPrice.toLocaleString("en-IN")}</del>` : "" } </div> <div class="stock"> ${stock > 0 ? `✓ In stock (${stock})` : `✕ Out of stock`} </div> <button class="addCart" onclick="addToCart(${Number(p.id)})" ${stock <= 0 ? "disabled" : ""} > ${stock <= 0 ? "Out of Stock" : "🛒 Add to Cart"} </button> </div> </article>`;
}

function filterCat(category) {
  if (category === "All") {
    filteredProducts = [...allProducts];
  } else {
    filteredProducts = allProducts.filter(
      (p) => String(p.category || "").toLowerCase() === category.toLowerCase()
    );
  }

  renderProducts();
  document.getElementById("products")?.scrollIntoView({ behavior: "smooth" });
}

function showAll() {
  filteredProducts = [...allProducts];
  renderProducts();
  document.getElementById("products")?.scrollIntoView({ behavior: "smooth" });
}

function searchProducts() {
  const q = document.getElementById("search")?.value.trim().toLowerCase() || "";

  if (!q) {
    showAll();
    return;
  }

  filteredProducts = allProducts.filter(
    (p) =>
      String(p.name || "")
        .toLowerCase()
        .includes(q) ||
      String(p.category || "")
        .toLowerCase()
        .includes(q)
  );

  renderProducts();
  document.getElementById("products")?.scrollIntoView({ behavior: "smooth" });
}

// ==============================
// CART
// ==============================

function addToCart(id) {
  const product = allProducts.find((x) => Number(x.id) === Number(id));
  if (!product) return;

  const stock = Number(product.stock || 0);

  if (stock <= 0) {
    alert("Ye product out of stock hai.");
    return;
  }

  const existing = cart.find((x) => Number(x.id) === Number(id));

  if (existing) {
    if (Number(existing.quantity) >= stock) {
      alert("Available stock itna hi hai.");
      return;
    }
    existing.quantity++;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: Number(product.price || 0),
      image_url: product.image_url || "",
      quantity: 1,
    });
  }

  saveCart();
  updateCartCount();
  alert("Product cart me add ho gaya ✅");
}

function updateCartCount() {
  const el = document.getElementById("cartCount");
  if (!el) return;

  const count = cart.reduce((sum, item) => sum + Number(item.quantity || 0), 0);

  el.textContent = count;
}

function saveCart() {
  localStorage.setItem("buyzo_cart", JSON.stringify(cart));
}

function openCart() {
  document.getElementById("cartModal")?.classList.add("show");
  renderCart();
}

function renderCart() {
  const box = document.getElementById("cartItems");
  const totalEl = document.getElementById("cartTotal");

  if (!box) return;

  if (!cart.length) {
    box.innerHTML = ` <div class="empty"> <h3>Your cart is empty 🛒</h3> <p>Products add karo.</p> </div>`;
    if (totalEl) totalEl.textContent = "₹0";
    return;
  }

  let total = 0;

  box.innerHTML = cart
    .map((item) => {
      const itemTotal = Number(item.price || 0) * Number(item.quantity || 0);

      total += itemTotal;

      const fallback = "https://placehold.co/100x100/f0f1f6/171b35?text=BUYZO";

      return ` <div class="cartItem"> <img src="${escapeAttr(item.image_url || fallback)}" onerror="this.onerror=null;this.src='${fallback}'" alt="" > <div> <b>${escapeHTML(item.name)}</b> <p>₹${Number(item.price || 0).toLocaleString("en-IN")}</p> <div class="quantity"> <button onclick="changeQty(${Number(item.id)},-1)">−</button> <span>${Number(item.quantity || 0)}</span> <button onclick="changeQty(${Number(item.id)},1)">+</button> </div> </div> <button class="remove" onclick="removeFromCart(${Number( item.id )})">×</button> </div>`;
    })
    .join("");

  if (totalEl) {
    totalEl.textContent = "₹" + total.toLocaleString("en-IN");
  }
}

function changeQty(id, change) {
  const item = cart.find((i) => Number(i.id) === Number(id));
  if (!item) return;

  if (change > 0) {
    const product = allProducts.find((p) => Number(p.id) === Number(id));
    if (product && Number(item.quantity) >= Number(product.stock || 0)) {
      alert("Available stock itna hi hai.");
      return;
    }
  }

  item.quantity += change;

  if (item.quantity <= 0) {
    cart = cart.filter((i) => Number(i.id) !== Number(id));
  }

  saveCart();
  updateCartCount();
  renderCart();
}

function removeFromCart(id) {
  cart = cart.filter((item) => Number(item.id) !== Number(id));
  saveCart();
  updateCartCount();
  renderCart();
}

// ==============================
// ACCOUNT
// ==============================

function openAccount() {
  document.getElementById("accountModal")?.classList.add("show");
  clearMessage("accountMsg");
  loginForm();
}

function loginForm() {
  const form = document.getElementById("accountForm");
  if (!form) return;

  form.innerHTML = ` <input id="accountEmail" type="email" placeholder="Email" required> <input id="accountPassword" type="password" placeholder="Password" required> <button type="button" class="orange wide" onclick="doLogin()">Login</button> `;

  setTab("login");
}

function signupForm() {
  const form = document.getElementById("accountForm");
  if (!form) return;

  form.innerHTML = ` <input id="accountEmail" type="email" placeholder="Email" required> <input id="accountPassword" type="password" placeholder="Password (minimum 6 characters)" required> <button type="button" class="orange wide" onclick="doSignup()">Create Account</button> `;

  setTab("signup");
}

function setTab(type) {
  document
    .getElementById("loginTab")
    ?.classList.toggle("selected", type === "login");

  document
    .getElementById("signupTab")
    ?.classList.toggle("selected", type === "signup");
}

async function doLogin() {
  if (!db) {
    setMessage("accountMsg", "Database connect nahi hai.");
    return;
  }

  const email = document.getElementById("accountEmail")?.value.trim();
  const password = document.getElementById("accountPassword")?.value;

  if (!email || !password) {
    setMessage("accountMsg", "Email aur password required hai.");
    return;
  }

  const { error } = await db.auth.signInWithPassword({ email, password });

  if (error) {
    setMessage("accountMsg", error.message);
    return;
  }

  setMessage("accountMsg", "Login successful ✅");

  setTimeout(() => closeModal("accountModal"), 700);
}

async function doSignup() {
  if (!db) {
    setMessage("accountMsg", "Database connect nahi hai.");
    return;
  }

  const email = document.getElementById("accountEmail")?.value.trim();
  const password = document.getElementById("accountPassword")?.value;

  if (!email || !password) {
    setMessage("accountMsg", "Email aur password required hai.");
    return;
  }

  if (password.length < 6) {
    setMessage("accountMsg", "Password minimum 6 characters ka hona chahiye.");
    return;
  }

  const { error } = await db.auth.signUp({ email, password });

  if (error) {
    setMessage("accountMsg", error.message);
    return;
  }

  setMessage("accountMsg", "Account created. Email verify karo.");
}

// ==============================
// CHECKOUT
// ==============================

function checkout() {
  if (!cart.length) {
    alert("Cart empty hai.");
    return;
  }

  closeModal("cartModal");
  renderCheckoutSummary();
  clearMessage("checkoutMsg");

  document.getElementById("checkoutModal")?.classList.add("show");
}

function renderCheckoutSummary() {
  const box = document.getElementById("checkoutSummary");
  if (!box) return;

  let total = 0;

  const rows = cart
    .map((item) => {
      const amount = Number(item.price || 0) * Number(item.quantity || 0);

      total += amount;

      return ` <div> <span>${escapeHTML(item.name)} × ${Number(item.quantity)}</span> <b>₹${amount.toLocaleString("en-IN")}</b> </div>`;
    })
    .join("");

  box.innerHTML = ` ${rows} <hr> <div> <b>Total</b> <b>₹${total.toLocaleString("en-IN")}</b> </div>`;
}

function placeOrder() {
  if (!cart.length) {
    setMessage("checkoutMsg", "Cart empty hai.");
    return;
  }

  const name = document.getElementById("customerName")?.value.trim();
  const phone = document.getElementById("customerPhone")?.value.trim();
  const address = document.getElementById("customerAddress")?.value.trim();
  const pincode = document.getElementById("customerPincode")?.value.trim();
  const payment = document.getElementById("paymentMethod")?.value;

  if (!name || !phone || !address || !pincode) {
    setMessage("checkoutMsg", "Please saari delivery details bharo.");
    return;
  }

  if (!/^[0-9]{10}$/.test(phone)) {
    setMessage("checkoutMsg", "10 digit mobile number enter karo.");
    return;
  }

  if (!/^[0-9]{6}$/.test(pincode)) {
    setMessage("checkoutMsg", "6 digit pincode enter karo.");
    return;
  }

  let total = 0;
  const productLines = cart
    .map((item) => {
      const amount = Number(item.price || 0) * Number(item.quantity || 0);

      total += amount;

      return `• ${item.name} × ${item.quantity} = ₹${amount.toLocaleString( "en-IN" )}`;
    })
    .join("\n");

  const orderId = "BZ" + Date.now().toString().slice(-8);

  const message = `🛍️ BUYZO ORDER 🆔 Order ID: ${orderId} 👤 Name: ${name} 📱 Mobile: ${phone} 📦 Products: ${productLines} 💰 Total: ₹${total.toLocaleString("en-IN")} 💳 Payment: ${payment === "cod" ? "Cash on Delivery" : "WhatsApp Order"} 📍 Address: ${address} Pincode: ${pincode}`;

  // If the WhatsApp number has not been configured,
  // show the order details instead of opening a broken link.
  if (WHATSAPP_NUMBER.includes("X")) {
    alert(
      "Order ready hai ✅\n\n" +
        message +
        "\n\napp.js me WHATSAPP_NUMBER set karna baaki hai."
    );
    return;
  }

  const url =
    "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(message);

  window.open(url, "_blank");

  // Local cart clear after sending the order.
  cart = [];
  saveCart();
  updateCartCount();
  closeModal("checkoutModal");
}

// ==============================
// MODALS / HELPERS
// ==============================

function closeModal(id) {
  document.getElementById(id)?.classList.remove("show");
}

function outsideClose(event, id) {
  if (event.target?.id === id) closeModal(id);
}

function setMessage(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function clearMessage(id) {
  setMessage(id, "");
}

function showError(text) {
  const grid = document.getElementById("productGrid");
  if (grid) {
    grid.innerHTML = ` <div class="empty"> <h3>BUYZO error</h3> <p>${escapeHTML(text)}</p> </div>`;
  }
}

function escapeHTML(value) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (char) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      }[char])
  );
}

function escapeAttr(value) {
  return escapeHTML(value).replace(/`/g, "&#096;");
}
