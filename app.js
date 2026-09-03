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
    search.addEventListener("keydown", e => {
      if (e.key === "Enter") {
        searchProducts();
      }
    });
  }

  const checkoutForm =
    document.getElementById("checkoutForm");

  if (checkoutForm) {
    checkoutForm.addEventListener(
      "submit",
      placeOrder
    );
  }

});


/* =========================
   PRODUCTS
========================= */
async function loadProducts() {

  const grid = document.getElementById("productGrid");

  if (!grid) {
    console.error("productGrid element nahi mila.");
    return;
  }

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

    console.log("PRODUCT DATA:", data);
    console.log("PRODUCT ERROR:", error);

    if (error) {

      console.error("Products load error:", error);

      grid.innerHTML = `
        <div class="empty">
          <h3>❌ Products load nahi ho rahe</h3>
          <p>
            ${escapeHTML(error.message)}
          </p>
        </div>
      `;

      return;
    }

    allProducts = Array.isArray(data)
      ? data
      : [];

    filteredProducts = [...allProducts];

    renderProducts();

  } catch (err) {

    console.error(
      "PRODUCT EXCEPTION:",
      err
    );

    grid.innerHTML = `
      <div class="empty">
        <h3>❌ Products load error</h3>
        <p>
          ${escapeHTML(
            err.message || "Unknown error"
          )}
        </p>
      </div>
    `;
  }
}


/* =========================
   CATEGORY IMAGE
========================= */

function getCategoryImage(category) {

  const c =
    String(category || "").toLowerCase();

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

function getProductImage(product) {

  if (product.image_url) {
    return product.image_url;
  }

  return getCategoryImage(product.category);
}


/* =========================
   RENDER PRODUCTS
========================= */

function renderProducts() {

  const grid =
    document.getElementById("productGrid");

  if (!grid) return;

  if (!filteredProducts.length) {

    grid.innerHTML = `
      <div class="empty">
        <h3>No products found</h3>
        <p>Is category me product available nahi hai.</p>
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

function createProductCard(product) {

  const price =
    Number(product.price || 0);

  const old =
    Number(product.old_price || 0);

  const stock =
    Number(product.stock || 0);

  const image =
    getProductImage(product);

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
          src="${escapeAttr(image)}"
          alt="${escapeHTML(product.name)}"
          loading="lazy"
          onerror="
            this.onerror=null;
            this.src='${getCategoryImage(product.category)}';
          "
        >

      </div>

      <div class="productBody">

        <small class="category">
          ${escapeHTML(
            product.category || "Other"
          )}
        </small>

        <h3>
          ${escapeHTML(product.name)}
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
          onclick="addToCart(${Number(product.id)})"
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

    filteredProducts =
      [...allProducts];

  } else {

    filteredProducts =
      allProducts.filter(product =>
        String(product.category || "")
          .toLowerCase()
          .trim() ===
        category.toLowerCase().trim()
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

    filteredProducts =
      [...allProducts];

  } else {

    filteredProducts =
      allProducts.filter(product => {

        const name =
          String(product.name || "")
            .toLowerCase();

        const category =
          String(product.category || "")
            .toLowerCase();

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

  if (!product.seller_id) {

    alert(
      "Is product ka seller available nahi hai."
    );

    return;
  }

  const stock =
    Number(product.stock || 0);

  if (stock <= 0) {

    alert("Product out of stock hai.");

    return;
  }

  const existing =
    cart.find(
      item =>
        Number(item.id) ===
        Number(id)
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

      price:
        Number(product.price || 0),

      image_url:
        product.image_url || "",

      seller_id:
        product.seller_id,

      stock: stock,

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

  box.innerHTML =
    cart.map(item => {

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
            onerror="
              this.onerror=null;
              this.src='${getCategoryImage("Fashion")}';
            "
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
                onclick="
                  changeQty(${Number(item.id)},-1)
                "
              >
                −
              </button>

              <span>
                ${item.quantity}
              </span>

              <button
                onclick="
                  changeQty(${Number(item.id)},1)
                "
              >
                +
              </button>

            </div>

          </div>

          <button
            class="remove"
            onclick="
              removeFromCart(${Number(item.id)})
            "
          >
            ×
          </button>

        </div>
      `;

    }).join("");

  if (totalElement) {

    totalElement.textContent =
      "₹" +
      total.toLocaleString("en-IN");

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

  if (
    change > 0 &&
    item.quantity >= Number(item.stock || 0)
  ) {

    alert("Available stock itna hi hai.");

    return;
  }

  item.quantity += change;

  if (item.quantity <= 0) {

    cart =
      cart.filter(
        x =>
          Number(x.id) !==
          Number(id)
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
      item =>
        Number(item.id) !==
        Number(id)
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
    document.getElementById(
      "checkoutItems"
    );

  if (!box) return;

  let total = 0;

  box.innerHTML =
    cart.map(item => {

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
            × ₹${Number(item.price)
              .toLocaleString("en-IN")}

          </div>

          <strong>
            ₹${itemTotal
              .toLocaleString("en-IN")}
          </strong>

        </div>
      `;

    }).join("");

  document
    .getElementById("checkoutSubtotal")
    .textContent =
      "₹" +
      total.toLocaleString("en-IN");

  document
    .getElementById("checkoutTotal")
    .textContent =
      "₹" +
      total.toLocaleString("en-IN");
}
/* =========================
   PLACE ORDER
========================= */

async function placeOrder(e) {

  e.preventDefault();

  if (!cart.length) {
    alert("Cart empty hai.");
    return;
  }

  const name =
    document.getElementById("coName")
      ?.value.trim() || "";

  const mobile =
    document.getElementById("coMobile")
      ?.value.trim() || "";

  const address =
    document.getElementById("coAddress")
      ?.value.trim() || "";

  const city =
    document.getElementById("coCity")
      ?.value.trim() || "";

  const state =
    document.getElementById("coState")
      ?.value.trim() || "";

  const pincode =
    document.getElementById("coPincode")
      ?.value.trim() || "";

  /* =========================
     VALIDATION
  ========================= */

  if (!name || !address || !city || !state) {
    alert("Saari delivery details fill karo.");
    return;
  }

  if (!/^\d{10}$/.test(mobile)) {
    alert("10 digit mobile number enter karo.");
    return;
  }

  if (!/^\d{6}$/.test(pincode)) {
    alert("6 digit pincode enter karo.");
    return;
  }

  /* =========================
     GET CUSTOMER USER
  ========================= */

  let customerUser = null;

  try {

    const {
      data: sessionData,
      error: sessionError
    } = await db.auth.getSession();

    if (sessionError) {
      console.error(
        "Session error:",
        sessionError
      );
    }

    customerUser =
      sessionData?.session?.user || null;

    /*
      Agar customer login nahi hai,
      anonymous user create karo.
    */

    if (!customerUser) {

      const {
        data: anonymousData,
        error: anonymousError
      } = await db.auth.signInAnonymously();

      if (anonymousError) {

        console.error(
          "Anonymous login error:",
          anonymousError
        );

        alert(
          "Order ke liye customer session nahi ban pa raha.\n\n" +
          "Supabase me Anonymous Sign-Ins enable karo."
        );

        return;
      }

      customerUser =
        anonymousData?.user || null;
    }

    if (!customerUser?.id) {

      alert(
        "Customer User ID nahi mila. Order save nahi hua."
      );

      return;
    }

  } catch (err) {

    console.error(
      "CUSTOMER AUTH ERROR:",
      err
    );

    alert(
      "Customer session error: " +
      (err.message || "Unknown error")
    );

    return;
  }

  /* =========================
     TOTAL
  ========================= */

  const total =
    cart.reduce(
      (sum, item) =>
        sum +
        Number(item.price || 0) *
        Number(item.quantity || 0),
      0
    );

  /* =========================
     ORDER NUMBER
  ========================= */

  const orderId =
    "BZ" +
    Date.now()
      .toString()
      .slice(-8);

  /* =========================
     CURRENT ORDER
  ========================= */

  currentOrder = {

    orderId,

    user_id:
      customerUser.id,

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

  /* =========================
     CREATE ORDER ROWS
  ========================= */

  const rows =
    cart.map(item => ({

      /*
       * IMPORTANT
       * Ye missing tha.
       */
      user_id:
        customerUser.id,

      seller_id:
        item.seller_id,

      product_id:
        item.id,

      product_name:
        item.name,

      image_url:
        item.image_url || null,

      unit_price:
        Number(item.price || 0),

      customer_name:
        name,

      mobile:
        mobile,

      address:
        address,

      city:
        city,

      state:
        state,

      pincode:
        pincode,

      quantity:
        Number(item.quantity || 1),

      payment_method:
        "Cash on Delivery",

      status:
        "New",

      order_no:
        orderId,

      total:
        Number(item.price || 0) *
        Number(item.quantity || 1)

    }));

  console.log(
    "Saving orders:",
    rows
  );

  /* =========================
     SAVE ORDER
  ========================= */

  const {
    data: savedOrders,
    error
  } = await db
    .from("orders")
    .insert(rows)
    .select();

  if (error) {

    console.error(
      "ORDER SAVE ERROR:",
      error
    );

    alert(
      "Order save nahi hua:\n\n" +
      error.message
    );

    return;
  }

  console.log(
    "ORDER SAVED:",
    savedOrders
  );

  /* =========================
     SUCCESS
  ========================= */

  closeModal("checkoutModal");

  const successText =
    document.getElementById(
      "successText"
    );

  if (successText) {

    successText.textContent =
      `Order #${orderId} — Total ₹${total.toLocaleString("en-IN")}.`;

  }

  document
    .getElementById("successModal")
    ?.classList.add("show");
}

