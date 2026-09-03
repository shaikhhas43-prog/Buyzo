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


/* =====================================================
   START
===================================================== */

document.addEventListener("DOMContentLoaded", () => {

  console.log("BUYZO started");

  loadProducts();
  updateCartCount();

  const search =
    document.getElementById("search");

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


/* =====================================================
   PRODUCTS
===================================================== */

async function loadProducts() {

  const grid =
    document.getElementById("productGrid");

  if (!grid) {

    console.error(
      "productGrid element not found"
    );

    return;
  }

  grid.innerHTML = `
    <div class="loading">
      Loading BUYZO products...
    </div>
  `;

  try {

    console.log(
      "Connecting to Supabase..."
    );

    const result = await Promise.race([

      db
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
        }),

      new Promise(resolve =>
        setTimeout(() =>
          resolve({
            data: null,
            error: {
              message:
                "Supabase request timeout. Check your Supabase URL, key or RLS policy."
            }
          }),
        15000)
      )

    ]);

    const {
      data,
      error
    } = result;

    if (error) {

      console.error(
        "PRODUCT ERROR:",
        error
      );

      grid.innerHTML = `
        <div class="empty">

          <h3>
            ⚠️ Products load nahi ho rahe
          </h3>

          <p>
            ${escapeHTML(
              error.message ||
              "Unknown Supabase error"
            )}
          </p>

          <button
            onclick="loadProducts()"
            style="
              margin-top:15px;
              padding:12px 20px;
              border:0;
              border-radius:8px;
              cursor:pointer;
            "
          >
            🔄 Try Again
          </button>

        </div>
      `;

      return;
    }

    allProducts = data || [];

    filteredProducts =
      [...allProducts];

    console.log(
      "Products loaded:",
      allProducts
    );

    renderProducts();

  } catch (err) {

    console.error(
      "Unexpected product error:",
      err
    );

    grid.innerHTML = `
      <div class="empty">

        <h3>
          ⚠️ Something went wrong
        </h3>

        <p>
          ${escapeHTML(
            err.message ||
            "Unable to load products"
          )}
        </p>

        <button
          onclick="loadProducts()"
          style="
            margin-top:15px;
            padding:12px 20px;
            border:0;
            border-radius:8px;
          "
        >
          🔄 Try Again
        </button>

      </div>
    `;

  }

}


/* =====================================================
   CATEGORY IMAGE
===================================================== */

function getCategoryImage(category) {

  const c =
    String(category || "")
      .toLowerCase();

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


/* =====================================================
   PRODUCT IMAGE
===================================================== */

function getProductImage(product) {

  if (
    product &&
    product.image_url &&
    String(product.image_url).trim()
  ) {

    return product.image_url;

  }

  return getCategoryImage(
    product?.category
  );

}


/* =====================================================
   RENDER PRODUCTS
===================================================== */

function renderProducts() {

  const grid =
    document.getElementById(
      "productGrid"
    );

  if (!grid) return;

  if (!filteredProducts.length) {

    grid.innerHTML = `
      <div class="empty">

        <h3>
          🛍️ No products found
        </h3>

        <p>
          Abhi is category me product available nahi hai.
        </p>

      </div>
    `;

    return;
  }

  grid.innerHTML =
    filteredProducts
      .map(createProductCard)
      .join("");

}


/* =====================================================
   PRODUCT CARD
===================================================== */

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
            ? `
              <span class="discount">
                ${discount}% OFF
              </span>
            `
            : ""
        }

        <img
          src="${escapeAttr(image)}"
          alt="${escapeHTML(product.name)}"
          loading="lazy"
          onerror="
            this.onerror=null;
            this.src='${escapeAttr(
              getCategoryImage(
                product.category
              )
            )}';
          "
        >

      </div>

      <div class="productBody">

        <small class="category">
          ${escapeHTML(
            product.category ||
            "Other"
          )}
        </small>

        <h3>
          ${escapeHTML(
            product.name ||
            "Product"
          )}
        </h3>

        <div class="price">

          <strong>
            ₹${price.toLocaleString("en-IN")}
          </strong>

          ${
            old > price
              ? `
                <del>
                  ₹${old.toLocaleString("en-IN")}
                </del>
              `
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


/* =====================================================
   CATEGORY FILTER
===================================================== */

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

        String(category || "")
          .toLowerCase()
          .trim()

      );

  }

  renderProducts();

  document
    .getElementById("products")
    ?.scrollIntoView({
      behavior: "smooth"
    });

}


/* =====================================================
   SEARCH
===================================================== */

function searchProducts() {

  const input =
    document.getElementById(
      "search"
    );

  const q =
    input?.value
      .trim()
      .toLowerCase() || "";

  if (!q) {

    filteredProducts =
      [...allProducts];

  } else {

    filteredProducts =
      allProducts.filter(product => {

        const name =
          String(
            product.name || ""
          ).toLowerCase();

        const category =
          String(
            product.category || ""
          ).toLowerCase();

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


/* =====================================================
   CART
===================================================== */

function addToCart(id) {

  const product =
    allProducts.find(
      p =>
        Number(p.id) ===
        Number(id)
    );

  if (!product) {

    alert(
      "Product nahi mila."
    );

    return;
  }

  const stock =
    Number(product.stock || 0);

  if (stock <= 0) {

    alert(
      "Product out of stock hai."
    );

    return;
  }

  const existing =
    cart.find(
      item =>
        Number(item.id) ===
        Number(id)
    );

  if (existing) {

    if (
      Number(existing.quantity) >=
      stock
    ) {

      alert(
        "Available stock itna hi hai."
      );

      return;
    }

    existing.quantity++;

  } else {

    cart.push({

      id: product.id,

      name:
        product.name,

      price:
        Number(product.price || 0),

      image_url:
        product.image_url || "",

      seller_id:
        product.seller_id || null,

      stock:
        stock,

      quantity:
        1

    });

  }

  saveCart();

  updateCartCount();

  renderCart();

}


/* =====================================================
   CART COUNT
===================================================== */

function updateCartCount() {

  const element =
    document.getElementById(
      "cartCount"
    );

  if (!element) return;

  const count =
    cart.reduce(
      (sum, item) =>
        sum +
        Number(
          item.quantity || 0
        ),
      0
    );

  element.textContent =
    count;

}


/* =====================================================
   SAVE CART
===================================================== */

function saveCart() {

  localStorage.setItem(
    "buyzo_cart",
    JSON.stringify(cart)
  );

}


/* =====================================================
   OPEN CART
===================================================== */

function openCart() {

  document
    .getElementById("cartModal")
    ?.classList.add("show");

  renderCart();

}


/* =====================================================
   RENDER CART
===================================================== */

function renderCart() {

  const box =
    document.getElementById(
      "cartItems"
    );

  const totalElement =
    document.getElementById(
      "cartTotal"
    );

  if (!box) return;

  if (!cart.length) {

    box.innerHTML = `
      <div class="empty">

        <h3>
          Your cart is empty 🛒
        </h3>

      </div>
    `;

    if (totalElement) {
      totalElement.textContent =
        "₹0";
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
        getCategoryImage(
          "Fashion"
        );

      return `
        <div class="cartItem">

          <img
            src="${escapeAttr(image)}"
            onerror="
              this.onerror=null;
              this.src='${escapeAttr(
                getCategoryImage(
                  "Fashion"
                )
              )}';
            "
          >

          <div>

            <b>
              ${escapeHTML(
                item.name
              )}
            </b>

            <p>
              ₹${Number(
                item.price
              ).toLocaleString("en-IN")}
            </p>

            <div class="quantity">

              <button
                onclick="
                  changeQty(
                    ${Number(item.id)},
                    -1
                  )
                "
              >
                −
              </button>

              <span>
                ${Number(
                  item.quantity
                )}
              </span>

              <button
                onclick="
                  changeQty(
                    ${Number(item.id)},
                    1
                  )
                "
              >
                +
              </button>

            </div>

          </div>

          <button
            class="remove"
            onclick="
              removeFromCart(
                ${Number(item.id)}
              )
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
      total.toLocaleString(
        "en-IN"
      );

  }

}


/* =====================================================
   CHANGE QUANTITY
===================================================== */

function changeQty(id, change) {

  const item =
    cart.find(
      x =>
        Number(x.id) ===
        Number(id)
    );

  if (!item) return;

  if (
    change > 0 &&
    Number(item.quantity) >=
    Number(item.stock || 0)
  ) {

    alert(
      "Available stock itna hi hai."
    );

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


/* =====================================================
   REMOVE
===================================================== */

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


/* =====================================================
   CHECKOUT
===================================================== */

function startCheckout() {

  if (!cart.length) {

    alert(
      "Cart empty hai."
    );

    return;
  }

  closeModal(
    "cartModal"
  );

  renderCheckoutSummary();

  document
    .getElementById(
      "checkoutModal"
    )
    ?.classList.add("show");

}


/* =====================================================
   CHECKOUT SUMMARY
===================================================== */

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
              getCategoryImage(
                "Fashion"
              )
            )}"
          >

          <div>

            <b>
              ${escapeHTML(
                item.name
              )}
            </b>

            <br>

            ${Number(
              item.quantity
            )}
            × ₹${Number(
              item.price
            ).toLocaleString("en-IN")}

          </div>

          <strong>
            ₹${itemTotal.toLocaleString(
              "en-IN"
            )}
          </strong>

        </div>
      `;

    }).join("");

  const subtotal =
    document.getElementById(
      "checkoutSubtotal"
    );

  const totalElement =
    document.getElementById(
      "checkoutTotal"
    );

  if (subtotal) {

    subtotal.textContent =
      "₹" +
      total.toLocaleString(
        "en-IN"
      );

  }

  if (totalElement) {

    totalElement.textContent =
      "₹" +
      total.toLocaleString(
        "en-IN"
      );

  }

}


/* =====================================================
   PLACE ORDER
===================================================== */

async function placeOrder(e) {

  e.preventDefault();

  if (!cart.length) {

    alert(
      "Cart empty hai."
    );

    return;
  }

  const name =
    document.getElementById(
      "coName"
    )?.value.trim();

  const mobile =
    document.getElementById(
      "coMobile"
    )?.value.trim();

  const address =
    document.getElementById(
      "coAddress"
    )?.value.trim();

  const city =
    document.getElementById(
      "coCity"
    )?.value.trim();

  const state =
    document.getElementById(
      "coState"
    )?.value.trim();

  const pincode =
    document.getElementById(
      "coPincode"
    )?.value.trim();


  if (
    !name ||
    !address ||
    !city ||
    !state
  ) {

    alert(
      "Saari delivery details fill karo."
    );

    return;
  }


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


  const orderId =
    "BZ" +
    Date.now()
      .toString()
      .slice(-8);


  currentOrder = {

    orderId,

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


  /*
    IMPORTANT:
    Buyer guest ho sakta hai.
    Isliye user_id ko sirf tab bhejenge
    jab Supabase Auth user logged in ho.
  */

  let authUser = null;

  try {

    const {
      data
    } =
      await db.auth.getUser();

    authUser =
      data?.user || null;

  } catch (err) {

    console.log(
      "No logged-in buyer"
    );

  }


  const rows =
    cart.map(item => {

      const row = {

        seller_id:
          item.seller_id || null,

        product_id:
          item.id,

        product_name:
          item.name,

        image_url:
          item.image_url || null,

        unit_price:
          Number(item.price),

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
          Number(item.quantity),

        payment_method:
          "Cash on Delivery",

        status:
          "New",

        order_no:
          orderId,

        total:
          Number(item.price) *
          Number(item.quantity)

      };


      /*
        user_id ONLY if buyer is logged in.
      */

      if (authUser?.id) {

        row.user_id =
          authUser.id;

      }


      return row;

    });


  console.log(
    "Saving order:",
    rows
  );


  const {
    error
  } =
    await db
      .from("orders")
      .insert(rows);


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


  /*
    STOCK UPDATE
  */

  for (const item of cart) {

    try {

      const newStock =
        Math.max(
          0,
          Number(item.stock) -
          Number(item.quantity)
        );

      await db
        .from("products")
        .update({
          stock: newStock
        })
        .eq(
          "id",
          item.id
        );

    } catch (err) {

      console.log(
        "Stock update error:",
        err
      );

    }

  }


  closeModal(
    "checkoutModal"
  );


  const successText =
    document.getElementById(
      "successText"
    );


  if (successText) {

    successText.textContent =
      `Order #${orderId} — Total ₹${total.toLocaleString(
        "en-IN"
      )}.`;

  }


  document
    .getElementById(
      "successModal"
    )
    ?.classList.add("show");

}


/* =====================================================
   WHATSAPP
===================================================== */

function sendOrderWhatsApp() {

  if (!currentOrder) return;

  const order =
    currentOrder;


  const items =
    order.items
      .map(item =>

        `• ${item.name} × ${item.quantity} = ₹${
          (
            Number(item.price) *
            Number(item.quantity)
          ).toLocaleString(
            "en-IN"
          )
        }`

      )
      .join("\n");


  const message =
`BUYZO NEW ORDER 📦

Order ID: ${order.orderId}

Customer Details
Name: ${order.name}
Mobile: ${order.mobile}

Delivery Address
${order.address}
${order.city}, ${order.state}
Pincode: ${order.pincode}

Payment: Cash on Delivery

Products
${items}

Total: ₹${order.total.toLocaleString(
  "en-IN"
)}`;


  window.location.href =
    "https://wa.me/" +
    WHATSAPP_NUMBER +
    "?text=" +
    encodeURIComponent(
      message
    );

}


/* =====================================================
   FINISH ORDER
===================================================== */

function finishOrder() {

  cart = [];

  saveCart();

  updateCartCount();

  currentOrder = null;

  closeModal(
    "successModal"
  );

}


/* =====================================================
   ACCOUNT
===================================================== */

function openAccount() {

  document
    .getElementById(
      "accountModal"
    )
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

  setTab(
    "login"
  );

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
      placeholder="Password"
    >

    <button
      type="button"
      class="orange wide"
      onclick="doSignup()"
    >
      Create Account
    </button>

  `;

  setTab(
    "signup"
  );

}


function setTab(tab) {

  document
    .getElementById(
      "loginTab"
    )
    ?.classList.toggle(
      "selected",
      tab === "login"
    );

  document
    .getElementById(
      "signupTab"
    )
    ?.classList.toggle(
      "selected",
      tab === "signup"
    );

}


/* =====================================================
   LOGIN
===================================================== */

async function doLogin() {

  const email =
    document
      .getElementById(
        "accountEmail"
      )
      ?.value.trim();

  const password =
    document
      .getElementById(
        "accountPassword"
      )
      ?.value;


  const msg =
    document.getElementById(
      "accountMsg"
    );


  const {
    error
  } =
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

    closeModal(
      "accountModal"
    );

  }, 500);

}


/* =====================================================
   SIGNUP
===================================================== */

async function doSignup() {

  const email =
    document
      .getElementById(
        "accountEmail"
      )
      ?.value.trim();

  const password =
    document
      .getElementById(
        "accountPassword"
      )
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


  const {
    error
  } =
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


/* =====================================================
   CLOSE MODAL
===================================================== */

function closeModal(id) {

  document
    .getElementById(id)
    ?.classList.remove(
      "show"
    );

}


/* =====================================================
   SECURITY
===================================================== */

function escapeHTML(value) {

  return String(
    value ?? ""
  )
    .replace(
      /[&<>"']/g,
      char => ({

        "&":
          "&amp;",

        "<":
          "&lt;",

        ">":
          "&gt;",

        '"':
          "&quot;",

        "'":
          "&#039;"

      }[char])
    );

}


function escapeAttr(value) {

  return escapeHTML(
    value
  )
    .replace(
      /`/g,
      "&#096;"
    );

}


/* =====================================================
   SUPABASE CONNECTION TEST
===================================================== */

async function testSupabase() {

  console.log(
    "Testing Supabase..."
  );

  const {
    data,
    error
  } =
    await db
      .from("products")
      .select("id")
      .limit(1);

  if (error) {

    console.error(
      "Supabase TEST FAILED:",
      error
    );

    return false;
  }

  console.log(
    "Supabase TEST OK:",
    data
  );

  return true;

}


/* =====================================================
   AUTO REFRESH PRODUCTS
===================================================== */

setInterval(() => {

  if (
    document.visibilityState ===
    "visible"
  ) {

    loadProducts();

  }

}, 60000);
