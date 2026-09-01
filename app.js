const SUPABASE_URL = "https://ahhrhjucbdddcdlzjokg.supabase.co";
const SUPABASE_KEY = "sb_publishable_EwPScyGzZsQoNPY9J7GdxA_RpqpiwlO";
const WHATSAPP_NUMBER = "919725231594";

const db = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

let allProducts = [];
let filteredProducts = [];
let cart = JSON.parse(
  localStorage.getItem("buyzo_cart") || "[]"
);
let currentOrder = null;


/* =========================
   START
========================= */

document.addEventListener("DOMContentLoaded", () => {

  loadProducts();
  updateCartCount();

  document
    .getElementById("search")
    ?.addEventListener("keydown", e => {
      if (e.key === "Enter") {
        searchProducts();
      }
    });

  document
    .getElementById("checkoutForm")
    ?.addEventListener("submit", placeOrder);
});


/* =========================
   PRODUCTS
========================= */

async function loadProducts() {

  const grid = document.getElementById("productGrid");

  if (!grid) return;

  grid.innerHTML = `
    <div class="loading">
      Loading BUYZO products...
    </div>
  `;

  try {

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

      console.error("PRODUCT ERROR:", error);

      grid.innerHTML = `
        <div class="empty">
          <h3>Products load nahi ho rahe ❌</h3>

          <p>
            ${escapeHTML(error.message)}
          </p>

          <button
            class="orange"
            onclick="loadProducts()"
          >
            Try Again
          </button>
        </div>
      `;

      return;
    }

    console.log("PRODUCTS:", data);

    allProducts = data || [];
    filteredProducts = [...allProducts];

    renderProducts();

  } catch (err) {

    console.error(err);

    grid.innerHTML = `
      <div class="empty">
        <h3>Something went wrong ❌</h3>

        <p>
          ${escapeHTML(err.message)}
        </p>

        <button
          class="orange"
          onclick="loadProducts()"
        >
          Try Again
        </button>
      </div>
    `;
  }
}


function renderProducts() {

  const grid = document.getElementById("productGrid");

  if (!grid) return;

  if (!filteredProducts.length) {

    grid.innerHTML = `
      <div class="empty">
        <h3>No products found</h3>

        <p>
          Supabase me product nahi mila.
        </p>

        <button
          class="orange"
          onclick="loadProducts()"
        >
          Refresh Products
        </button>
      </div>
    `;

    return;
  }

  grid.innerHTML =
    filteredProducts
      .map(createProductCard)
      .join("");
}


function createProductCard(p) {

  const price = Number(p.price || 0);
  const old = Number(p.old_price || 0);
  const stock = Number(p.stock ?? 0);

  const img =
    (p.image_url || "").trim();

  const fallback =
    `https://placehold.co/700x700/f0f1f6/171b35?text=${encodeURIComponent(
      p.emoji || "BUYZO"
    )}`;

  const discount =
    old > price
      ? Math.round(
          ((old - price) / old) * 100
        )
      : 0;

  return `
    <article class="productCard">

      <div class="productImage">

        ${
          discount
            ? `<span class="discount">
                ${discount}% OFF
              </span>`
            : ""
        }

        <img
          src="${escapeAttr(img || fallback)}"
          alt="${escapeHTML(p.name)}"
          loading="lazy"
          onerror="this.onerror=null;this.src='${fallback}'"
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
              ? `<del>
                  ₹${old.toLocaleString("en-IN")}
                </del>`
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
   FILTER
========================= */

function filterCat(category) {

  filteredProducts =
    category === "All"
      ? [...allProducts]
      : allProducts.filter(
          p =>
            String(p.category || "")
              .toLowerCase() ===
            category.toLowerCase()
        );

  renderProducts();

  document
    .getElementById("products")
    ?.scrollIntoView({
      behavior: "smooth"
    });
}


function searchProducts() {

  const q =
    document
      .getElementById("search")
      ?.value
      .trim()
      .toLowerCase() || "";

  filteredProducts =
    !q
      ? [...allProducts]
      : allProducts.filter(
          p =>
            String(p.name || "")
              .toLowerCase()
              .includes(q) ||

            String(p.category || "")
              .toLowerCase()
              .includes(q)
        );

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

  const p =
    allProducts.find(
      x => Number(x.id) === Number(id)
    );

  if (!p) return;

  const stock =
    Number(p.stock || 0);

  if (stock <= 0) {
    alert("Ye product out of stock hai.");
    return;
  }

  const item =
    cart.find(
      x => Number(x.id) === Number(id)
    );

  if (item) {

    if (item.quantity >= stock) {
      alert("Available stock itna hi hai.");
      return;
    }

    item.quantity++;

  } else {

    cart.push({
      id: p.id,
      name: p.name,
      price: Number(p.price || 0),
      image_url: p.image_url || "",
      quantity: 1
    });
  }

  saveCart();
  updateCartCount();
  renderCart();
}


function updateCartCount() {

  const e =
    document.getElementById("cartCount");

  if (!e) return;

  e.textContent =
    cart.reduce(
      (sum, item) =>
        sum + Number(item.quantity || 0),
      0
    );
}


function saveCart() {

  localStorage.setItem(
    "buyzo_cart",
    JSON.stringify(cart)
  );
}


function openCart() {

  document
    .getElementById("cartModal")
    ?.classList.add("show");

  renderCart();
}


function renderCart() {

  const box =
    document.getElementById("cartItems");

  const totalEl =
    document.getElementById("cartTotal");

  if (!box) return;

  if (!cart.length) {

    box.innerHTML = `
      <div class="empty">

        <h3>
          Your cart is empty 🛒
        </h3>

        <p>
          Products add karo.
        </p>

      </div>
    `;

    if (totalEl)
      totalEl.textContent = "₹0";

    return;
  }

  let total = 0;

  box.innerHTML =
    cart.map(item => {

      const t =
        Number(item.price) *
        Number(item.quantity);

      total += t;

      const fallback =
        "https://placehold.co/100x100/f0f1f6/171b35?text=BUYZO";

      return `
        <div class="cartItem">

          <img
            src="${escapeAttr(
              item.image_url || fallback
            )}"
            onerror="this.src='${fallback}'"
          >

          <div>

            <b>
              ${escapeHTML(item.name)}
            </b>

            <p>
              ₹${Number(item.price)
                .toLocaleString("en-IN")}
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

  if (totalEl) {

    totalEl.textContent =
      "₹" +
      total.toLocaleString("en-IN");
  }
}


function changeQty(id, change) {

  const item =
    cart.find(
      x => Number(x.id) === Number(id)
    );

  if (!item) return;

  item.quantity += change;

  if (item.quantity <= 0) {

    cart =
      cart.filter(
        x => Number(x.id) !== Number(id)
      );
  }

  saveCart();
  updateCartCount();
  renderCart();
}


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


function renderCheckoutSummary() {

  const box =
    document.getElementById("checkoutItems");

  if (!box) return;

  let total = 0;

  box.innerHTML =
    cart.map(item => {

      const t =
        Number(item.price) *
        Number(item.quantity);

      total += t;

      return `
        <div class="summaryItem">

          <img
            src="${escapeAttr(
              item.image_url ||
              "https://placehold.co/100x100?text=BUYZO"
            )}"
          >

          <div>

            <b>
              ${escapeHTML(item.name)}
            </b>

            <br>

            ${item.quantity}
            ×
            ₹${Number(item.price)
              .toLocaleString("en-IN")}

          </div>

          <strong>
            ₹${t.toLocaleString("en-IN")}
          </strong>

        </div>
      `;

    }).join("");

  document
    .getElementById("checkoutSubtotal")
    .textContent =
    "₹" + total.toLocaleString("en-IN");

  document
    .getElementById("checkoutTotal")
    .textContent =
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

  document
    .getElementById("successText")
    .textContent =
    `Order #${currentOrder.orderId} — Total ₹${total.toLocaleString("en-IN")}.`;

  document
    .getElementById("successModal")
    ?.classList.add("show");
}


/* =========================
   WHATSAPP
========================= */

function sendOrderWhatsApp() {

  if (!currentOrder) return;

  const o = currentOrder;

  const items =
    o.items
      .map(
        i =>
          `• ${i.name} × ${i.quantity} = ₹${(
            Number(i.price) *
            Number(i.quantity)
          ).toLocaleString("en-IN")}`
      )
      .join("\n");

  const msg = `
*BUYZO NEW ORDER* 📦

*Order ID:* ${o.orderId}

*Customer Details*
Name: ${o.name}
Mobile: ${o.mobile}

*Delivery Address*
${o.address}
${o.city}, ${o.state}
Pincode: ${o.pincode}

*Payment:* ${o.payment}

*Products*
${items}

*Total: ₹${o.total.toLocaleString("en-IN")}*
`;

  const url =
    "https://wa.me/" +
    WHATSAPP_NUMBER +
    "?text=" +
    encodeURIComponent(msg);

  window.location.href = url;
}


/* =========================
   FINISH
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

  const f =
    document.getElementById(
      "accountForm"
    );

  if (!f) return;

  f.innerHTML = `
    <input
      id="accountEmail"
      type="email"
      placeholder="Email"
      required
    >

    <input
      id="accountPassword"
      type="password"
      placeholder="Password"
      required
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

  const f =
    document.getElementById(
      "accountForm"
    );

  if (!f) return;

  f.innerHTML = `
    <input
      id="accountEmail"
      type="email"
      placeholder="Email"
      required
    >

    <input
      id="accountPassword"
      type="password"
      placeholder="Password (minimum 6 characters)"
      required
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


function setTab(type) {

  document
    .getElementById("loginTab")
    ?.classList.toggle(
      "selected",
      type === "login"
    );

  document
    .getElementById("signupTab")
    ?.classList.toggle(
      "selected",
      type === "signup"
    );
}


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

    if (msg)
      msg.textContent =
        error.message;

    return;
  }

  if (msg)
    msg.textContent =
      "Login successful ✅";

  setTimeout(
    () =>
      closeModal("accountModal"),
    500
  );
}


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

    if (msg)
      msg.textContent =
        "Email aur password required hai.";

    return;
  }

  if (password.length < 6) {

    if (msg)
      msg.textContent =
        "Password minimum 6 characters ka hona chahiye.";

    return;
  }

  const { error } =
    await db.auth.signUp({
      email,
      password
    });

  if (error) {

    if (msg)
      msg.textContent =
        error.message;

    return;
  }

  if (msg)
    msg.textContent =
      "Account created. Email verify karo.";
}


/* =========================
   MODAL
========================= */

function closeModal(id) {

  document
    .getElementById(id)
    ?.classList.remove("show");
}


/* =========================
   SECURITY HELPERS
========================= */

function escapeHTML(value) {

  return String(value ?? "")
    .replace(
      /[&<>"']/g,
      c =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#039;"
        })[c]
    );
}


function escapeAttr(value) {

  return escapeHTML(value)
    .replace(/`/g, "&#096;");
}
