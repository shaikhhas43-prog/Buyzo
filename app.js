const SUPABASE_URL = "https://ahhrhjucbdddcdlzjokg.supabase.co";
const SUPABASE_KEY = "sb_publishable_EwPScyGzZsQoNPY9J7GdxA_RpqpiwlO";
const WHATSAPP_NUMBER = "919725231594";

const db = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

let allProducts = [];
let filteredProducts = [];
let cart = JSON.parse(localStorage.getItem("buyzo_cart") || "[]");
let currentOrder = null;


/* =========================
   START
========================= */

document.addEventListener("DOMContentLoaded", () => {

  loadProducts();
  updateCartCount();

  const search = document.getElementById("search");

  if (search) {
    search.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        searchProducts();
      }
    });
  }

  const checkoutForm = document.getElementById("checkoutForm");

  if (checkoutForm) {
    checkoutForm.addEventListener("submit", placeOrder);
  }

});


/* =========================
   LOAD PRODUCTS
========================= */

async function loadProducts() {

  const grid = document.getElementById("productGrid");

  if (!grid) return;

  grid.innerHTML = `
    <div class="loading">
      Loading BUYZO products...
    </div>
  `;

  const { data, error } = await db
    .from("products")
    .select(`
      id,
      name,
      category,
      price,
      old_price,
      stock,
      emoji,
      image_url,
      seller_id,
      created_at
    `)
    .order("created_at", {
      ascending: false
    });

  if (error) {

    console.error("Supabase error:", error);

    grid.innerHTML = `
      <div class="empty">
        <h3>Products load nahi ho rahe.</h3>
        <p>${escapeHTML(error.message)}</p>
      </div>
    `;

    return;
  }

  allProducts = data || [];

  filteredProducts = [...allProducts];

  renderProducts();
}


/* =========================
   CATEGORY FALLBACK
========================= */

function getCategoryImage(category) {

  const c = String(category || "").toLowerCase();

  if (c.includes("mobile")) {
    return "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800";
  }

  if (c.includes("fashion")) {
    return "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800";
  }

  if (c.includes("electronics")) {
    return "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800";
  }

  if (c.includes("home")) {
    return "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800";
  }

  if (c.includes("beauty")) {
    return "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800";
  }

  if (c.includes("sports")) {
    return "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800";
  }

  return "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800";
}


/* =========================
   PRODUCT IMAGE
========================= */

function getProductImage(p) {

  const image = String(p.image_url || "").trim();

  if (image) {
    return image;
  }

  return getCategoryImage(p.category);
}


/* =========================
   RENDER PRODUCTS
========================= */

function renderProducts() {

  const grid = document.getElementById("productGrid");

  if (!grid) return;

  if (!filteredProducts.length) {

    grid.innerHTML = `
      <div class="empty">
        <h3>No products found</h3>
        <p>Abhi is category me product available nahi hai.</p>
      </div>
    `;

    return;
  }

  grid.innerHTML = filteredProducts
    .map(createProductCard)
    .join("");
}


/* =========================
   PRODUCT CARD
========================= */

function createProductCard(p) {

  const price = Number(p.price || 0);
  const old = Number(p.old_price || 0);
  const stock = Number(p.stock || 0);

  const image = getProductImage(p);

  const discount =
    old > price
      ? Math.round(((old - price) / old) * 100)
      : 0;

  return `
    <article class="productCard">

      <div class="productImage">

        ${
          discount
            ? `<span class="discount">${discount}% OFF</span>`
            : ""
        }

        <img
          src="${escapeAttr(image)}"
          alt="${escapeHTML(p.name)}"
          loading="lazy"
          onerror="this.onerror=null;this.src='${getCategoryImage(p.category)}';"
        >

      </div>

      <div class="productBody">

        <small class="category">
          ${escapeHTML(p.category || "Other")}
        </small>

        <h3>
          ${escapeHTML(p.name)}
        </h3>

        <div class="price">

          <strong>
            ₹${price.toLocaleString("en-IN")}
          </strong>

          ${
            old > price
              ? `<del>₹${old.toLocaleString("en-IN")}</del>`
              : ""
          }

        </div>

        <div class="stock">

          ${
            stock > 0
              ? `✓ In stock (${stock})`
              : `✕ Out of stock`
          }

        </div>

        <button
          class="addCart"
          onclick="addToCart(${Number(p.id)})"
          ${stock <= 0 ? "disabled" : ""}
        >

          ${
            stock <= 0
              ? "Out of Stock"
              : "🛒 Add to Cart"
          }

        </button>

      </div>

    </article>
  `;
}


/* =========================
   CATEGORY FILTER
========================= */

function filterCat(category) {

  if (category === "All") {

    filteredProducts = [...allProducts];

  } else {

    filteredProducts = allProducts.filter(p =>

      String(p.category || "")
        .toLowerCase()
        .trim() === category.toLowerCase().trim()

    );

  }

  renderProducts();

  document
    .getElementById("products")
    ?.scrollIntoView({
      behavior: "smooth"
    });
}


/* =========================
   SEARCH
========================= */

function searchProducts() {

  const input =
    document.getElementById("search");

  const q =
    input?.value.trim().toLowerCase() || "";

  if (!q) {

    filteredProducts = [...allProducts];

  } else {

    filteredProducts = allProducts.filter(p => {

      const name =
        String(p.name || "").toLowerCase();

      const category =
        String(p.category || "").toLowerCase();

      return (
        name.includes(q) ||
        category.includes(q)
      );

    });

  }

  renderProducts();

  document
    .getElementById("products")
    ?.scrollIntoView({
      behavior: "smooth"
    });
}


/* =========================
   CART
========================= */

function addToCart(id) {

  const product =
    allProducts.find(
      p => Number(p.id) === Number(id)
    );

  if (!product) return;

  const stock =
    Number(product.stock || 0);

  if (stock <= 0) {

    alert("Ye product out of stock hai.");

    return;
  }

  const existing =
    cart.find(
      item => Number(item.id) === Number(id)
    );

  if (existing) {

    if (existing.quantity >= stock) {

      alert(
        "Available stock itna hi hai."
      );

      return;
    }

    existing.quantity++;

  } else {

    cart.push({
      id: product.id,
      name: product.name,
      price: Number(product.price || 0),
      image_url: product.image_url || "",
      quantity: 1
    });

  }

  saveCart();
  updateCartCount();
  renderCart();

}


/* =========================
   CART COUNT
========================= */

function updateCartCount() {

  const element =
    document.getElementById("cartCount");

  if (!element) return;

  const count =
    cart.reduce(
      (sum, item) =>
        sum + Number(item.quantity || 0),
      0
    );

  element.textContent = count;
}


/* =========================
   SAVE CART
========================= */

function saveCart() {

  localStorage.setItem(
    "buyzo_cart",
    JSON.stringify(cart)
  );
}


/* =========================
   OPEN CART
========================= */

function openCart() {

  document
    .getElementById("cartModal")
    ?.classList.add("show");

  renderCart();
}


/* =========================
   RENDER CART
========================= */

function renderCart() {

  const box =
    document.getElementById("cartItems");

  const totalElement =
    document.getElementById("cartTotal");

  if (!box) return;

  if (!cart.length) {

    box.innerHTML = `
      <div class="empty">
        <h3>Your cart is empty 🛒</h3>
      </div>
    `;

    if (totalElement) {
      totalElement.textContent = "₹0";
    }

    return;
  }

  let total = 0;

  box.innerHTML = cart.map(item => {

    const itemTotal =
      Number(item.price) *
      Number(item.quantity);

    total += itemTotal;

    const image =
      item.image_url ||
      getCategoryImage("Fashion");

    return `
      <div class="cartItem">

        <img
          src="${escapeAttr(image)}"
          onerror="this.onerror=null;this.src='${getCategoryImage("Fashion")}'"
        >

        <div>

          <b>
            ${escapeHTML(item.name)}
          </b>

          <p>
            ₹${Number(item.price).toLocaleString("en-IN")}
          </p>

          <div class="quantity">

            <button
              onclick="changeQty(${Number(item.id)},-1)"
            >
              −
            </button>

            <span>
              ${item.quantity}
            </span>

            <button
              onclick="changeQty(${Number(item.id)},1)"
            >
              +
            </button>

          </div>

        </div>

        <button
          class="remove"
          onclick="removeFromCart(${Number(item.id)})"
        >
          ×
        </button>

      </div>
    `;

  }).join("");

  if (totalElement) {

    totalElement.textContent =
      "₹" + total.toLocaleString("en-IN");

  }

}


/* =========================
   QUANTITY
========================= */

function changeQty(id, change) {

  const item =
    cart.find(
      x => Number(x.id) === Number(id)
    );

  if (!item) return;

  item.quantity += change;

  if (item.quantity <= 0) {

    cart = cart.filter(
      x => Number(x.id) !== Number(id)
    );

  }

  saveCart();
  updateCartCount();
  renderCart();
}


/* =========================
   REMOVE
========================= */

function removeFromCart(id) {

  cart =
    cart.filter(
      x => Number(x.id) !== Number(id)
    );

  saveCart();
  updateCartCount();
  renderCart();
}


/* =========================
   CHECKOUT
========================= */

function startCheckout() {

  if (!cart.length) {

    alert("Cart empty hai.");

    return;
  }

  closeModal("cartModal");

  renderCheckoutSummary();

  document
    .getElementById("checkoutModal")
    ?.classList.add("show");
}


/* =========================
   CHECKOUT SUMMARY
========================= */

function renderCheckoutSummary() {

  const box =
    document.getElementById("checkoutItems");

  if (!box) return;

  let total = 0;

  box.innerHTML = cart.map(item => {

    const itemTotal =
      Number(item.price) *
      Number(item.quantity);

    total += itemTotal;

    return `
      <div class="summaryItem">

        <img
          src="${escapeAttr(
            item.image_url ||
            getCategoryImage("Fashion")
          )}"
        >

        <div>

          <b>
            ${escapeHTML(item.name)}
          </b>

          <br>

          ${item.quantity}
          × ₹${Number(item.price).toLocaleString("en-IN")}

        </div>

        <strong>
          ₹${itemTotal.toLocaleString("en-IN")}
        </strong>

      </div>
    `;

  }).join("");

  document.getElementById(
    "checkoutSubtotal"
  ).textContent =
    "₹" + total.toLocaleString("en-IN");

  document.getElementById(
    "checkoutTotal"
  ).textContent =
    "₹" + total.toLocaleString("en-IN");
}


/* =========================
   PLACE ORDER
========================= */

function placeOrder(e) {

  e.preventDefault();

  const name =
    document.getElementById("coName")
      .value.trim();

  const mobile =
    document.getElementById("coMobile")
      .value.trim();

  const address =
    document.getElementById("coAddress")
      .value.trim();

  const city =
    document.getElementById("coCity")
      .value.trim();

  const state =
    document.getElementById("coState")
      .value.trim();

  const pincode =
    document.getElementById("coPincode")
      .value.trim();


  if (!/^\d{10}$/.test(mobile)) {

    alert(
      "10 digit mobile number enter karo."
    );

    return;
  }


  if (!/^\d{6}$/.test(pincode)) {

    alert(
      "6 digit pincode enter karo."
    );

    return;
  }


  const total =
    cart.reduce(
      (sum, item) =>
        sum +
        Number(item.price) *
        Number(item.quantity),
      0
    );


  currentOrder = {

    orderId:
      "BZ" +
      Date.now()
        .toString()
        .slice(-8),

    name,
    mobile,
    address,
    city,
    state,
    pincode,

    payment:
      "Cash on Delivery",

    items:
      JSON.parse(
        JSON.stringify(cart)
      ),

    total

  };


  closeModal("checkoutModal");


  const successText =
    document.getElementById(
      "successText"
    );

  if (successText) {

    successText.textContent =
      `Order #${currentOrder.orderId} — Total ₹${total.toLocaleString("en-IN")}.`;

  }


  document
    .getElementById("successModal")
    ?.classList.add("show");
}


/* =========================
   WHATSAPP ORDER
========================= */

function sendOrderWhatsApp() {

  if (!currentOrder) return;

  const order = currentOrder;


  const items =
    order.items.map(item =>

      `• ${item.name} × ${item.quantity} = ₹${(
        Number(item.price) *
        Number(item.quantity)
      ).toLocaleString("en-IN")}`

    ).join("\n");


  const message =
`*BUYZO NEW ORDER 📦*

Order ID: ${order.orderId}

*Customer Details*
Name: ${order.name}
Mobile: ${order.mobile}

*Delivery Address*
${order.address}
${order.city}, ${order.state}
Pincode: ${order.pincode}

*Payment:* Cash on Delivery

*Products*
${items}

*Total: ₹${order.total.toLocaleString("en-IN")}*`;


  window.location.href =
    "https://wa.me/" +
    WHATSAPP_NUMBER +
    "?text=" +
    encodeURIComponent(message);
}


/* =========================
   FINISH ORDER
========================= */

function finishOrder() {

  cart = [];

  saveCart();

  updateCartCount();

  currentOrder = null;

  closeModal("successModal");
}


/* =========================
   ACCOUNT
========================= */

function openAccount() {

  document
    .getElementById("accountModal")
    ?.classList.add("show");

  loginForm();
}


function loginForm() {

  const form =
    document.getElementById(
      "accountForm"
    );

  if (!form) return;


  form.innerHTML = `

    <input
      id="accountEmail"
      type="email"
      placeholder="Email"
    >

    <input
      id="accountPassword"
      type="password"
      placeholder="Password"
    >

    <button
      type="button"
      class="orange wide"
      onclick="doLogin()"
    >
      Login
    </button>

  `;


  setTab("login");
}


function signupForm() {

  const form =
    document.getElementById(
      "accountForm"
    );

  if (!form) return;


  form.innerHTML = `

    <input
      id="accountEmail"
      type="email"
      placeholder="Email"
    >

    <input
      id="accountPassword"
      type="password"
      placeholder="Password (minimum 6 characters)"
    >

    <button
      type="button"
      class="orange wide"
      onclick="doSignup()"
    >
      Create Account
    </button>

  `;


  setTab("signup");
}


function setTab(tab) {

  document
    .getElementById("loginTab")
    ?.classList.toggle(
      "selected",
      tab === "login"
    );

  document
    .getElementById("signupTab")
    ?.classList.toggle(
      "selected",
      tab === "signup"
    );
}


/* =========================
   LOGIN
========================= */

async function doLogin() {

  const email =
    document
      .getElementById("accountEmail")
      ?.value.trim();

  const password =
    document
      .getElementById("accountPassword")
      ?.value;


  const msg =
    document.getElementById(
      "accountMsg"
    );


  const { error } =
    await db.auth.signInWithPassword({
      email,
      password
    });


  if (error) {

    if (msg) {
      msg.textContent =
        error.message;
    }

    return;
  }


  if (msg) {

    msg.textContent =
      "Login successful ✅";

  }


  setTimeout(() => {

    closeModal("accountModal");

  }, 500);
}


/* =========================
   SIGN UP
========================= */

async function doSignup() {

  const email =
    document
      .getElementById("accountEmail")
      ?.value.trim();

  const password =
    document
      .getElementById("accountPassword")
      ?.value;


  const msg =
    document.getElementById(
      "accountMsg"
    );


  if (!email || !password) {

    if (msg) {
      msg.textContent =
        "Email aur password required hai.";
    }

    return;
  }


  if (password.length < 6) {

    if (msg) {
      msg.textContent =
        "Password minimum 6 characters ka hona chahiye.";
    }

    return;
  }


  const { error } =
    await db.auth.signUp({
      email,
      password
    });


  if (error) {

    if (msg) {
      msg.textContent =
        error.message;
    }

    return;
  }


  if (msg) {

    msg.textContent =
      "Account created. Email verify karo.";

  }
}


/* =========================
   CLOSE MODAL
========================= */

function closeModal(id) {

  document
    .getElementById(id)
    ?.classList.remove("show");
}


/* =========================
   SECURITY
========================= */

function escapeHTML(value) {

  return String(value ?? "")
    .replace(
      /[&<>"']/g,
      function (char) {

        return {
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#039;"
        }[char];

      }
    );
}


function escapeAttr(value) {

  return escapeHTML(value)
    .replace(/`/g, "&#096;");
}
