// ===============================
// BUYZO MAIN WEBSITE
// ===============================

const db = window.supabase.createClient(
  "https://ahhrhjucbdddcdlzjokg.supabase.co",
  "sb_publishable_EwPScyGzZsQoNPY9J7GdxA_RpqpiwlO"
);

let allProducts = [];
let filteredProducts = [];
let cart = JSON.parse(localStorage.getItem("buyzo_cart") || "[]");

// ===============================
// START
// ===============================

document.addEventListener("DOMContentLoaded", () => {
  loadProducts();
  updateCartCount();

  const search = document.getElementById("search");

  if (search) {
    search.addEventListener("keydown", e => {
      if (e.key === "Enter") {
        searchProducts();
      }
    });
  }
});


// ===============================
// LOAD PRODUCTS FROM SUPABASE
// ===============================

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

    console.error("Product loading error:", error);

    grid.innerHTML = `
      <div class="empty">
        Products load nahi ho rahe.<br>
        Please refresh the page.
      </div>
    `;

    return;
  }

  allProducts = data || [];

  filteredProducts = [...allProducts];

  renderProducts();
}


// ===============================
// RENDER PRODUCTS
// ===============================

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
    .map(product => createProductCard(product))
    .join("");
}


// ===============================
// PRODUCT CARD
// ===============================

function createProductCard(p) {

  const price = Number(p.price || 0);

  const oldPrice = Number(p.old_price || 0);

  const stock = Number(p.stock ?? 0);

  const image = p.image_url
    ? p.image_url
    : `https://placehold.co/500x500?text=${encodeURIComponent(
        p.emoji || "BUYZO"
      )}`;

  const discount =
    oldPrice > price
      ? Math.round(((oldPrice - price) / oldPrice) * 100)
      : 0;

  const disabled = stock <= 0;

  return `
    <article class="productCard">

      <div class="productImage">

        ${
          discount > 0
            ? `<span class="discount">${discount}% OFF</span>`
            : ""
        }

        <img
          src="${escapeHTML(image)}"
          alt="${escapeHTML(p.name)}"
          loading="lazy"
          onerror="this.onerror=null;this.src='https://placehold.co/500x500?text=BUYZO';"
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
            oldPrice > price
              ? `<del>₹${oldPrice.toLocaleString("en-IN")}</del>`
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
          onclick="addToCart(${p.id})"
          ${disabled ? "disabled" : ""}
        >
          ${
            disabled
              ? "Out of Stock"
              : "🛒 Add to Cart"
          }
        </button>

      </div>

    </article>
  `;
}


// ===============================
// CATEGORY FILTER
// ===============================

function filterCat(category) {

  if (category === "All") {

    filteredProducts = [...allProducts];

  } else {

    filteredProducts = allProducts.filter(
      p =>
        String(p.category || "")
          .toLowerCase() === category.toLowerCase()
    );

  }

  renderProducts();

  const products = document.getElementById("products");

  if (products) {

    products.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });

  }
}


// ===============================
// SEARCH
// ===============================

function searchProducts() {

  const input =
    document.getElementById("search");

  const query =
    input?.value.trim().toLowerCase() || "";

  if (!query) {

    filteredProducts = [...allProducts];

    renderProducts();

    return;
  }

  filteredProducts = allProducts.filter(p => {

    const name =
      String(p.name || "").toLowerCase();

    const category =
      String(p.category || "").toLowerCase();

    return (
      name.includes(query) ||
      category.includes(query)
    );

  });

  renderProducts();

  document
    .getElementById("products")
    ?.scrollIntoView({
      behavior: "smooth"
    });
}


// ===============================
// CART
// ===============================

function addToCart(id) {

  const product =
    allProducts.find(p => p.id === id);

  if (!product) return;

  if (Number(product.stock || 0) <= 0) {

    alert("Ye product out of stock hai.");

    return;
  }

  const existing =
    cart.find(item => item.id === id);

  if (existing) {

    if (
      existing.quantity <
      Number(product.stock || 0)
    ) {

      existing.quantity++;

    } else {

      alert("Available stock itna hi hai.");

      return;
    }

  } else {

    cart.push({
      id: product.id,
      name: product.name,
      price: Number(product.price || 0),
      image_url: product.image_url,
      quantity: 1
    });

  }

  saveCart();

  updateCartCount();

  alert("Product cart me add ho gaya ✅");
}


// ===============================
// CART COUNT
// ===============================

function updateCartCount() {

  const count =
    document.getElementById("cartCount");

  if (!count) return;

  const total =
    cart.reduce(
      (sum, item) =>
        sum + Number(item.quantity || 0),
      0
    );

  count.textContent = total;
}


// ===============================
// OPEN CART
// ===============================

function openCart() {

  const modal =
    document.getElementById("cartModal");

  if (!modal) return;

  modal.classList.add("show");

  renderCart();
}


// ===============================
// RENDER CART
// ===============================

function renderCart() {

  const box =
    document.getElementById("cartItems");

  const totalEl =
    document.getElementById("cartTotal");

  if (!box) return;

  if (!cart.length) {

    box.innerHTML = `
      <div class="empty">
        <h3>Your cart is empty 🛒</h3>
        <p>Products add karo.</p>
      </div>
    `;

    if (totalEl) {
      totalEl.textContent = "₹0";
    }

    return;
  }

  let total = 0;

  box.innerHTML =
    cart.map(item => {

      const itemTotal =
        Number(item.price) *
        Number(item.quantity);

      total += itemTotal;

      const image =
        item.image_url ||
        "https://placehold.co/100x100?text=BUYZO";

      return `
        <div class="cartItem">

          <img
            src="${escapeHTML(image)}"
            onerror="this.src='https://placehold.co/100x100?text=BUYZO'"
          >

          <div>
            <b>${escapeHTML(item.name)}</b>

            <p>
              ₹${Number(item.price).toLocaleString("en-IN")}
            </p>

            <div class="quantity">

              <button onclick="changeQty(${item.id}, -1)">
                −
              </button>

              <span>
                ${item.quantity}
              </span>

              <button onclick="changeQty(${item.id}, 1)">
                +
              </button>

            </div>

          </div>

          <button
            class="remove"
            onclick="removeFromCart(${item.id})"
          >
            ×
          </button>

        </div>
      `;

    }).join("");

  if (totalEl) {

    totalEl.textContent =
      "₹" + total.toLocaleString("en-IN");

  }
}


// ===============================
// CHANGE QUANTITY
// ===============================

function changeQty(id, change) {

  const item =
    cart.find(i => i.id === id);

  if (!item) return;

  item.quantity += change;

  if (item.quantity <= 0) {

    cart =
      cart.filter(i => i.id !== id);

  }

  saveCart();

  updateCartCount();

  renderCart();
}


// ===============================
// REMOVE CART ITEM
// ===============================

function removeFromCart(id) {

  cart =
    cart.filter(item => item.id !== id);

  saveCart();

  updateCartCount();

  renderCart();
}


// ===============================
// SAVE CART
// ===============================

function saveCart() {

  localStorage.setItem(
    "buyzo_cart",
    JSON.stringify(cart)
  );
}


// ===============================
// ACCOUNT
// ===============================

function openAccount() {

  const modal =
    document.getElementById("accountModal");

  if (!modal) return;

  modal.classList.add("show");

  loginForm();
}


// ===============================
// LOGIN FORM
// ===============================

function loginForm() {

  const form =
    document.getElementById("accountForm");

  if (!form) return;

  form.innerHTML = `

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


// ===============================
// SIGNUP FORM
// ===============================

function signupForm() {

  const form =
    document.getElementById("accountForm");

  if (!form) return;

  form.innerHTML = `

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
      onclick="doSignup()"
    >
      Create Account
    </button>

  `;

  setTab("signup");
}


// ===============================
// TAB
// ===============================

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


// ===============================
// LOGIN
// ===============================

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
    document.getElementById("accountMsg");

  const { error } =
    await db.auth.signInWithPassword({
      email,
      password
    });

  if (error) {

    if (msg) {
      msg.textContent = error.message;
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


// ===============================
// SIGNUP
// ===============================

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
    document.getElementById("accountMsg");

  if (!email || !password) {

    if (msg) {
      msg.textContent =
        "Email aur password required hai.";
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


// ===============================
// CHECKOUT
// ===============================

function checkout() {

  if (!cart.length) {

    alert("Cart empty hai.");

    return;
  }

  alert(
    "Checkout system next step me connect kar sakte hain."
  );
}


// ===============================
// MODAL
// ===============================

function closeModal(id) {

  const modal =
    document.getElementById(id);

  if (modal) {
    modal.classList.remove("show");
  }
}


// ===============================
// HTML SECURITY
// ===============================

function escapeHTML(text) {

  return String(text ?? "").replace(
    /[&<>"']/g,
    char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[char])
  );
}
