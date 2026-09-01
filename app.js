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
   LOAD PRODUCTS
========================= */

async function loadProducts() {

  const grid = document.getElementById("productGrid");

  if (!grid) return;

  grid.innerHTML =
    '<div class="loading">Loading BUYZO products...</div>';

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
   RENDER PRODUCTS
========================= */

function renderProducts() {

  const grid = document.getElementById("productGrid");

  if (!grid) return;

  if (!filteredProducts.length) {

    grid.innerHTML = `
      <div class="empty">
        <h3>No products found</h3>
        <p>Abhi product available nahi hai.</p>
      </div>
    `;

    return;
  }

  grid.innerHTML =
    filteredProducts
      .map(createProductCard)
      .join("");
}


/* =========================
   PRODUCT CARD
========================= */

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
      ? Math.round(((old - price) / old) * 100)
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
              : "✕ Out of stock"
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
   CATEGORY
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


/* =========================
   SEARCH
========================= */

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
      : allProducts.filter(p =>
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

      alert(
        "Available stock itna hi hai."
      );

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


/* =========================
   CART COUNT
========================= */

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
            onerror="this.onerror=null;this.src='${fallback}'"
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
      "₹" + total.toLocaleString("en-IN");

  }
}


/* =========================
   CHANGE QUANTITY
========================= */

function changeQty(id, change) {

  const item =
    cart.find(
      x => Number(x.id) === Number(id)
    );

  if (!item) return;

  if (change > 0) {

    const product =
      allProducts.find(
        p => Number(p.id) === Number(id)
      );

    if (
      product &&
      item.quantity >= Number(product.stock || 0)
    ) {

      alert("Available stock itna hi hai.");

      return;
    }
  }

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

  box.innerHTML =
    cart.map(item => {

      const t =
        Number(item.price) *
        Number(item.quantity);

      total += t;

      const img =
        item.image_url ||
        "https://placehold.co/100x100?text=BUYZO";

      return `
        <div class="summaryItem">

          <img
            src="${escapeAttr(img)}"
          >

          <div>

            <b>
              ${escapeHTML(item.name)}
            </b>

            <br>

            ${item.quantity}
            ×
            ₹${Number(item.price
