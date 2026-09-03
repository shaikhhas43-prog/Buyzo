/* =========================================================
   BUYZO CUSTOMER APP.JS
   Product + Cart + Checkout + Orders + Account
========================================================= */

const SUPABASE_URL =
  "https://ahhrhjucbdddcdlzjokg.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_EwPScyGzZsQoNPY9J7GdxA_RpqpiwlO";

const WHATSAPP_NUMBER =
  "919725231594";


/* =========================================================
   SUPABASE
========================================================= */

const db = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);


/* =========================================================
   GLOBAL
========================================================= */

let allProducts = [];
let filteredProducts = [];

let cart = JSON.parse(
  localStorage.getItem("buyzo_cart") || "[]"
);

let currentOrder = null;
let currentUser = null;


/* =========================================================
   START
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  init
);


async function init() {

  console.log("BUYZO APP STARTING...");

  try {

    const {
      data,
      error
    } = await db.auth.getSession();

    if (error) {
      console.error("Session error:", error);
    }

    currentUser =
      data?.session?.user || null;

  } catch (error) {

    console.error(
      "Session check failed:",
      error
    );

  }

  updateCartCount();

  setupSearch();

  setupCheckout();

  /*
     Products load independently.
     Even if auth/session has problem,
     products page should still attempt loading.
  */

  loadProducts();

}


/* =========================================================
   SEARCH SETUP
========================================================= */

function setupSearch() {

  const search =
    document.getElementById("search");

  if (!search) return;

  search.addEventListener(
    "keydown",
    function(e) {

      if (e.key === "Enter") {
        searchProducts();
      }

    }
  );

}


/* =========================================================
   CHECKOUT SETUP
========================================================= */

function setupCheckout() {

  const form =
    document.getElementById(
      "checkoutForm"
    );

  if (!form) return;

  form.addEventListener(
    "submit",
    placeOrder
  );

}


/* =========================================================
   AUTH SESSION
========================================================= */

async function getCurrentUser() {

  try {

    const {
      data,
      error
    } = await db.auth.getUser();

    if (error) {

      console.warn(
        "getUser:",
        error.message
      );

      return null;
    }

    currentUser =
      data?.user || null;

    return currentUser;

  } catch (error) {

    console.error(
      "getCurrentUser error:",
      error
    );

    return null;
  }

}


/* =========================================================
   ENSURE USER ID
========================================================= */

async function ensureOrderUser() {

  /*
     First check existing login.
  */

  let user =
    await getCurrentUser();

  if (user) {
    return user;
  }


  /*
     Customer is not logged in.

     Try anonymous authentication.
     Supabase Dashboard me Anonymous Sign-Ins
     enabled hona chahiye.
  */

  try {

    const {
      data,
      error
    } = await db.auth.signInAnonymously();

    if (error) {

      console.warn(
        "Anonymous login unavailable:",
        error.message
      );

      return null;
    }

    user =
      data?.user || null;

    currentUser = user;

    return user;

  } catch (error) {

    console.error(
      "Anonymous auth error:",
      error
    );

    return null;
  }

}


/* =========================================================
   PRODUCTS
========================================================= */

async function loadProducts() {

  const grid =
    document.getElementById(
      "productGrid"
    );

  if (!grid) {

    console.warn(
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

    /*
       Timeout protection.
    */

    const query =
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
        .order(
          "created_at",
          {
            ascending: false
          }
        );


    const result =
      await Promise.race([

        query,

        new Promise(resolve =>
          setTimeout(
            () =>
              resolve({
                data: null,
                error: {
                  message:
                    "Products request timeout. Supabase/RLS check karo."
                }
              }),
            15000
          )
        )

      ]);


    const {
      data,
      error
    } = result;


    if (error) {

      console.error(
        "Products error:",
        error
      );

      grid.innerHTML = `
        <div class="empty">

          <h3>
            Products load nahi ho rahe.
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
              margin-top:12px;
              padding:10px 18px;
              border:0;
              border-radius:8px;
              cursor:pointer;
            "
          >
            ↻ Try Again
          </button>

        </div>
      `;

      return;
    }


    allProducts =
      Array.isArray(data)
        ? data
        : [];

    filteredProducts =
      [...allProducts];


    console.log(
      "BUYZO PRODUCTS:",
      allProducts
    );


    renderProducts();


  } catch (error) {

    console.error(
      "loadProducts crash:",
      error
    );

    grid.innerHTML = `
      <div class="empty">

        <h3>
          Something went wrong.
        </h3>

        <p>
          ${escapeHTML(
            error.message ||
            "Products load failed"
          )}
        </p>

        <button
          onclick="loadProducts()"
          style="
            margin-top:12px;
            padding:10px 18px;
            border:0;
            border-radius:8px;
          "
        >
          ↻ Try Again
        </button>

      </div>
    `;

  }

}

window.loadProducts =
  loadProducts;


/* =========================================================
   CATEGORY IMAGE
========================================================= */

function getCategoryImage(category) {

  const c =
    String(category || "")
      .toLowerCase();


  if (c.includes("mobile")) {

    return
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800";

  }


  if (c.includes("fashion")) {

    return
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800";

  }


  if (c.includes("electronics")) {

    return
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800";

  }


  if (c.includes("home")) {

    return
      "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800";

  }


  if (c.includes("beauty")) {

    return
      "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800";

  }


  if (c.includes("sports")) {

    return
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800";

  }


  return
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800";

}


/* =========================================================
   PRODUCT IMAGE
========================================================= */

function getProductImage(product) {

  if (
    product &&
    product.image_url
  ) {

    return product.image_url;

  }

  return getCategoryImage(
    product?.category
  );

}


/* =========================================================
   RENDER PRODUCTS
========================================================= */

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
          No products found
        </h3>

        <p>
          Is category me product available nahi hai.
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


/* =========================================================
   PRODUCT CARD
========================================================= */

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
          alt="${escapeHTML(
            product.name
          )}"
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
            product.name
          )}
        </h3>


        <div class="price">

          <strong>
            ₹${price.toLocaleString(
              "en-IN"
            )}
          </strong>


          ${
            old > price
              ? `
                <del>
                  ₹${old.toLocaleString(
                    "en-IN"
                  )}
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

          onclick="
            addToCart(
              ${Number(product.id)}
            )
          "

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


/* =========================================================
   CATEGORY FILTER
========================================================= */

function filterCat(category) {

  if (
    category === "All"
  ) {

    filteredProducts =
      [...allProducts];

  } else {

    filteredProducts =
      allProducts.filter(
        product =>
          String(
            product.category || ""
          )
          .toLowerCase()
          .trim() ===
          String(category)
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

window.filterCat =
  filterCat;


/* =========================================================
   SEARCH
========================================================= */

function searchProducts() {

  const input =
    document.getElementById(
      "search"
    );

  const q =
    input?.value
      ?.trim()
      ?.toLowerCase() || "";


  if (!q) {

    filteredProducts =
      [...allProducts];

  } else {

    filteredProducts =
      allProducts.filter(
        product => {

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

        }
      );

  }


  renderProducts();


  document
    .getElementById("products")
    ?.scrollIntoView({
      behavior: "smooth"
    });

}

window.searchProducts =
  searchProducts;


/* =========================================================
   CART
========================================================= */

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


  if (!product.seller_id) {

    alert(
      "Is product ka seller available nahi hai."
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

      name: product.name,

      price:
        Number(
          product.price || 0
        ),

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


  alert(
    "✅ Product cart me add ho gaya."
  );

}

window.addToCart =
  addToCart;


/* =========================================================
   CART COUNT
========================================================= */

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

window.updateCartCount =
  updateCartCount;


/* =========================================================
   SAVE CART
========================================================= */

function saveCart() {

  localStorage.setItem(
    "buyzo_cart",
    JSON.stringify(cart)
  );

}


/* =========================================================
   OPEN CART
========================================================= */

function openCart() {

  document
    .getElementById(
      "cartModal"
    )
    ?.classList.add("show");


  renderCart();

}

window.openCart =
  openCart;


/* =========================================================
   RENDER CART
========================================================= */

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
              ).toLocaleString(
                "en-IN"
              )}
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

window.renderCart =
  renderCart;


/* =========================================================
   CHANGE QUANTITY
========================================================= */

function changeQty(
  id,
  change
) {

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


  item.quantity +=
    change;


  if (
    item.quantity <= 0
  ) {

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

window.changeQty =
  changeQty;


/* =========================================================
   REMOVE
========================================================= */

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

window.removeFromCart =
  removeFromCart;


/* =========================================================
   START CHECKOUT
========================================================= */

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

window.startCheckout =
  startCheckout;


/* =========================================================
   CHECKOUT SUMMARY
========================================================= */

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
            ).toLocaleString(
              "en-IN"
            )}

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

  const checkoutTotal =
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


  if (checkoutTotal) {

    checkoutTotal.textContent =
      "₹" +
      total.toLocaleString(
        "en-IN"
      );

  }

}


/* =========================================================
   PLACE ORDER
========================================================= */

async function placeOrder(e) {

  e.preventDefault();


  if (!cart.length) {

    alert(
      "Cart empty hai."
    );

    return;
  }


  const name =
    document
      .getElementById("coName")
      ?.value
      ?.trim() || "";


  const mobile =
    document
      .getElementById("coMobile")
      ?.value
      ?.trim() || "";


  const address =
    document
      .getElementById("coAddress")
      ?.value
      ?.trim() || "";


  const city =
    document
      .getElementById("coCity")
      ?.value
      ?.trim() || "";


  const state =
    document
      .getElementById("coState")
      ?.value
      ?.trim() || "";


  const pincode =
    document
      .getElementById("coPincode")
      ?.value
      ?.trim() || "";


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


  if (
    !/^\d{10}$/.test(
      mobile
    )
  ) {

    alert(
      "10 digit mobile number enter karo."
    );

    return;
  }


  if (
    !/^\d{6}$/.test(
      pincode
    )
  ) {

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


  /*
     IMPORTANT:
     Get a valid Supabase user.
     This fixes orders.user_id NULL.
  */

  const user =
    await ensureOrderUser();


  if (!user) {

    alert(
      "Order save nahi ho pa raha. Supabase Anonymous Sign-Ins enable karo ya Account se login karo."
    );

    return;
  }


  console.log(
    "ORDER USER ID:",
    user.id
  );


  const orderId =
    "BZ" +
    Date.now()
      .toString()
      .slice(-8);


  currentOrder = {

    orderId,

    user_id:
      user.id,

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
     CREATE ORDER ROWS
  */

  const rows =
    cart.map(item => ({

      /*
         FIX:
         user_id is now ALWAYS supplied.
      */

      user_id:
        user.id,

      seller_id:
        item.seller_id,

      product_id:
        item.id,

      product_name:
        item.name,

      image_url:
        item.image_url ||
        null,

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

    }));


  console.log(
    "SAVING ORDERS:",
    rows
  );


  /*
     INSERT ORDERS
  */

  const {
    data,
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
    data
  );


  /*
     SUCCESS
  */

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

window.placeOrder =
  placeOrder;


/* =========================================================
   WHATSAPP
========================================================= */

function sendOrderWhatsApp() {

  if (!currentOrder) return;


  const order =
    currentOrder;


  const items =
    order.items
      .map(
        item =>
          `• ${item.name} × ${item.quantity} = ₹${(
            Number(item.price) *
            Number(item.quantity)
          ).toLocaleString(
            "en-IN"
          )}`
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

window.sendOrderWhatsApp =
  sendOrderWhatsApp;


/* =========================================================
   FINISH ORDER
========================================================= */

function finishOrder() {

  cart = [];

  saveCart();

  updateCartCount();

  currentOrder = null;

  closeModal(
    "successModal"
  );

}

window.finishOrder =
  finishOrder;


/* =========================================================
   ACCOUNT
========================================================= */

function openAccount() {

  document
    .getElementById(
      "accountModal"
    )
    ?.classList.add("show");


  loginForm();

}

window.openAccount =
  openAccount;


/* =========================================================
   LOGIN FORM
========================================================= */

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

window.loginForm =
  loginForm;


/* =========================================================
   SIGNUP FORM
========================================================= */

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

window.signupForm =
  signupForm;


/* =========================================================
   ACCOUNT TABS
========================================================= */

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


/* =========================================================
   LOGIN
========================================================= */

async function doLogin() {

  const email =
    document
      .getElementById(
        "accountEmail"
      )
      ?.value
      ?.trim();


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


  if (
    !email ||
    !password
  ) {

    if (msg) {

      msg.textContent =
        "Email aur password required hai.";

    }

    return;
  }


  if (msg) {

    msg.textContent =
      "⏳ Login ho raha hai...";

  }


  const {
    data,
    error
  } =
    await db.auth.signInWithPassword({

      email,

      password

    });


  if (error) {

    console.error(
      "Login error:",
      error
    );


    if (msg) {

      msg.textContent =
        "❌ " +
        error.message;

    }

    return;
  }


  currentUser =
    data?.user || null;


  if (msg) {

    msg.textContent =
      "✅ Login successful!";

  }


  setTimeout(
    () =>
      closeModal(
        "accountModal"
      ),
    500
  );

}

window.doLogin =
  doLogin;


/* =========================================================
   SIGNUP
========================================================= */

async function doSignup() {

  const email =
    document
      .getElementById(
        "accountEmail"
      )
      ?.value
      ?.trim();


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


  if (
    !email ||
    !password
  ) {

    if (msg) {

      msg.textContent =
        "Email aur password required hai.";

    }

    return;
  }


  if (
    password.length < 6
  ) {

    if (msg) {

      msg.textContent =
        "Password minimum 6 characters ka hona chahiye.";

    }

    return;
  }


  const {
    data,
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


  currentUser =
    data?.user || null;


  if (msg) {

    msg.textContent =
      "✅ Account created. Email verify karo.";

  }

}

window.doSignup =
  doSignup;


/* =========================================================
   CLOSE MODAL
========================================================= */

function closeModal(id) {

  document
    .getElementById(id)
    ?.classList.remove(
      "show"
    );

}

window.closeModal =
  closeModal;


/* =========================================================
   AUTH STATE
========================================================= */

db.auth.onAuthStateChange(
  function(
    event,
    session
  ) {

    currentUser =
      session?.user ||
      null;


    console.log(
      "AUTH:",
      event,
      currentUser?.id
    );

  }
);


/* =========================================================
   SECURITY HELPERS
========================================================= */

function escapeHTML(value) {

  return String(
    value ?? ""
  )
    .replace(
      /[&<>"']/g,
      char =>
        ({
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


/* =========================================================
   GLOBAL ERROR HANDLER
========================================================= */

window.addEventListener(
  "error",
  function(event) {

    console.error(
      "BUYZO JS ERROR:",
      event.error ||
      event.message
    );

  }
);


window.addEventListener(
  "unhandledrejection",
  function(event) {

    console.error(
      "BUYZO PROMISE ERROR:",
      event.reason
    );

  }
);


console.log(
  "✅ BUYZO app.js loaded successfully"
);
