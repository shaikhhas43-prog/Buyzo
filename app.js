const SUPABASE_URL =
  "https://ahhrhjucbdddcdlzjokg.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_EwPScyGzZsQoNPY9J7GdxA_RpqpiwlO";

const WHATSAPP_NUMBER =
  "919725231594";

const db =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );


/* =========================
   GLOBAL
========================= */

let allProducts = [];
let filteredProducts = [];

let cart =
  JSON.parse(
    localStorage.getItem("buyzo_cart") || "[]"
  );

let currentOrder = null;
let placingOrder = false;


/* =========================
   START
========================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    console.log("BUYZO APP STARTED");

    loadProducts();

    updateCartCount();

    const search =
      document.getElementById("search");

    if (search) {

      search.addEventListener(
        "keydown",
        function (e) {

          if (e.key === "Enter") {
            searchProducts();
          }

        }
      );

    }


    const checkoutForm =
      document.getElementById(
        "checkoutForm"
      );

    if (checkoutForm) {

      checkoutForm.addEventListener(
        "submit",
        placeOrder
      );

    }

  }
);


/* =========================
   PRODUCTS
========================= */

async function loadProducts() {

  const grid =
    document.getElementById(
      "productGrid"
    );

  if (!grid) {

    console.error(
      "productGrid nahi mila."
    );

    return;
  }


  grid.innerHTML = `
    <div class="loading">
      Loading BUYZO products...
    </div>
  `;


  try {

    const {
      data,
      error
    } = await db
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


    console.log(
      "PRODUCT DATA:",
      data
    );

    console.log(
      "PRODUCT ERROR:",
      error
    );


    if (error) {

      console.error(
        "PRODUCT LOAD ERROR:",
        error
      );

      grid.innerHTML = `
        <div class="empty">

          <h3>
            ❌ Products load nahi ho rahe
          </h3>

          <p>
            ${escapeHTML(
              error.message
            )}
          </p>

          <button
            onclick="loadProducts()"
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
      "TOTAL PRODUCTS:",
      allProducts.length
    );


    renderProducts();


  } catch (err) {

    console.error(
      "PRODUCT EXCEPTION:",
      err
    );


    grid.innerHTML = `
      <div class="empty">

        <h3>
          ❌ Connection error
        </h3>

        <p>
          ${escapeHTML(
            err.message ||
            "Unknown error"
          )}
        </p>

        <button
          onclick="loadProducts()"
        >
          ↻ Try Again
        </button>

      </div>
    `;

  }

}


/* =========================
   CATEGORY IMAGE
========================= */

function getCategoryImage(
  category
) {

  const c =
    String(
      category || ""
    ).toLowerCase();


  if (
    c.includes("mobile")
  ) {

    return "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800";

  }


  if (
    c.includes("fashion")
  ) {

    return "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800";

  }


  if (
    c.includes("electronics")
  ) {

    return "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800";

  }


  if (
    c.includes("home")
  ) {

    return "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800";

  }


  if (
    c.includes("beauty")
  ) {

    return "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800";

  }


  if (
    c.includes("sports")
  ) {

    return "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800";

  }


  return "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800";

}


/* =========================
   PRODUCT IMAGE
========================= */

function getProductImage(
  product
) {

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


/* =========================
   RENDER PRODUCTS
========================= */

function renderProducts() {

  const grid =
    document.getElementById(
      "productGrid"
    );

  if (!grid) return;


  if (
    !filteredProducts.length
  ) {

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
      .map(
        createProductCard
      )
      .join("");

}


/* =========================
   PRODUCT CARD
========================= */

function createProductCard(
  product
) {

  const price =
    Number(
      product.price || 0
    );


  const old =
    Number(
      product.old_price || 0
    );


  const stock =
    Number(
      product.stock || 0
    );


  const image =
    getProductImage(
      product
    );


  const fallback =
    getCategoryImage(
      product.category
    );


  const discount =
    old > price
      ? Math.round(
          (
            (old - price) /
            old
          ) * 100
        )
      : 0;


  return `
    <article
      class="productCard"
    >

      <div
        class="productImage"
      >

        ${
          discount
            ? `
              <span
                class="discount"
              >
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
              fallback
            )}';
          "
        >

      </div>


      <div
        class="productBody"
      >

        <small
          class="category"
        >
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


        <div
          class="price"
        >

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


        <div
          class="stock"
        >

          ${
            stock > 0
              ? `
                ✓ In stock (${stock})
              `
              : `
                ✕ Out of stock
              `
          }

        </div>


        <button
          class="addCart"
          onclick="
            addToCart(
              ${Number(product.id)}
            )
          "
          ${
            stock <= 0
              ? "disabled"
              : ""
          }
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

function filterCat(
  category
) {

  if (
    category === "All"
  ) {

    filteredProducts =
      [...allProducts];

  } else {

    filteredProducts =
      allProducts.filter(
        product => {

          return String(
            product.category ||
            ""
          )
            .toLowerCase()
            .trim() ===
            String(
              category
            )
              .toLowerCase()
              .trim();

        }
      );

  }


  renderProducts();


  document
    .getElementById(
      "products"
    )
    ?.scrollIntoView({
      behavior: "smooth"
    });

}


/* =========================
   SEARCH
========================= */

function searchProducts() {

  const input =
    document.getElementById(
      "search"
    );


  const q =
    input?.value
      .trim()
      .toLowerCase() ||
    "";


  if (!q) {

    filteredProducts =
      [...allProducts];

  } else {

    filteredProducts =
      allProducts.filter(
        product => {

          const name =
            String(
              product.name ||
              ""
            )
              .toLowerCase();


          const category =
            String(
              product.category ||
              ""
            )
              .toLowerCase();


          return (
            name.includes(q) ||
            category.includes(q)
          );

        }
      );

  }


  renderProducts();


  document
    .getElementById(
      "products"
    )
    ?.scrollIntoView({
      behavior: "smooth"
    });

}


/* =========================
   CART
========================= */

function addToCart(
  id
) {

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
    Number(
      product.stock || 0
    );


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
      Number(
        existing.quantity
      ) >= stock
    ) {

      alert(
        "Available stock itna hi hai."
      );

      return;
    }


    existing.quantity++;

  } else {

    cart.push({

      id:
        product.id,

      name:
        product.name,

      price:
        Number(
          product.price || 0
        ),

      image_url:
        product.image_url ||
        "",

      seller_id:
        product.seller_id,

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


/* =========================
   CART COUNT
========================= */

function updateCartCount() {

  const element =
    document.getElementById(
      "cartCount"
    );


  if (!element) return;


  const count =
    cart.reduce(
      (
        sum,
        item
      ) =>
        sum +
        Number(
          item.quantity || 0
        ),
      0
    );


  element.textContent =
    count;

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
    .getElementById(
      "cartModal"
    )
    ?.classList.add(
      "show"
    );


  renderCart();

}


/* =========================
   RENDER CART
========================= */

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
    cart.map(
      item => {

        const itemTotal =
          Number(
            item.price
          ) *
          Number(
            item.quantity
          );


        total += itemTotal;


        const image =
          item.image_url ||
          getCategoryImage(
            "Fashion"
          );


        return `
          <div
            class="cartItem"
          >

            <img
              src="${escapeAttr(
                image
              )}"
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


              <div
                class="quantity"
              >

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

      }
    ).join("");


  if (totalElement) {

    totalElement.textContent =
      "₹" +
      total.toLocaleString(
        "en-IN"
      );

  }

}


/* =========================
   CHANGE QUANTITY
========================= */

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
    Number(
      item.quantity
    ) >=
      Number(
        item.stock || 0
      )
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


/* =========================
   REMOVE
========================= */

function removeFromCart(
  id
) {

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
    ?.classList.add(
      "show"
    );

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
    cart.map(
      item => {

        const itemTotal =
          Number(
            item.price
          ) *
          Number(
            item.quantity
          );


        total += itemTotal;


        return `
          <div
            class="summaryItem"
          >

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
              ×
              ₹${Number(
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

      }
    ).join("");


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


/* =========================
   GET CUSTOMER SESSION
========================= */

async function getCustomerUser() {

  try {

    const {
      data,
      error
    } =
      await db.auth.getSession();


    if (error) {

      console.error(
        "GET SESSION ERROR:",
        error
      );

    }


    let customer =
      data?.session?.user ||
      null;


    /*
      Customer login nahi hai
      to anonymous account create.
    */

    if (!customer) {

      const {
        data: anonymousData,
        error: anonymousError
      } =
        await db.auth.signInAnonymously();


      if (anonymousError) {

        console.error(
          "ANONYMOUS LOGIN ERROR:",
          anonymousError
        );


        throw new Error(
          "Customer session nahi ban pa raha. Supabase me Anonymous Sign-Ins enable karo."
        );

      }


      customer =
        anonymousData?.user ||
        null;

    }


    if (!customer?.id) {

      throw new Error(
        "Customer user ID nahi mila."
      );

    }


    console.log(
      "CUSTOMER USER:",
      customer.id
    );


    return customer;

  } catch (err) {

    console.error(
      "CUSTOMER SESSION ERROR:",
      err
    );

    throw err;

  }

}


/* =========================
   PLACE ORDER
========================= */

async function placeOrder(
  e
) {

  e.preventDefault();


  /*
    Double click se
    duplicate order na bane.
  */

  if (placingOrder) {

    return;

  }


  if (!cart.length) {

    alert(
      "Cart empty hai."
    );

    return;
  }


  const name =
    document
      .getElementById(
        "coName"
      )
      ?.value.trim() ||
    "";


  const mobile =
    document
      .getElementById(
        "coMobile"
      )
      ?.value.trim() ||
    "";


  const address =
    document
      .getElementById(
        "coAddress"
      )
      ?.value.trim() ||
    "";


  const city =
    document
      .getElementById(
        "coCity"
      )
      ?.value.trim() ||
    "";


  const state =
    document
      .getElementById(
        "coState"
      )
      ?.value.trim() ||
    "";


  const pincode =
    document
      .getElementById(
        "coPincode"
      )
      ?.value.trim() ||
    "";


  /* =========================
     VALIDATION
  ========================= */

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


  placingOrder = true;


  /* =========================
     GET CUSTOMER
  ========================= */

  let customerUser;


  try {

    customerUser =
      await getCustomerUser();

  } catch (err) {

    alert(
      err.message ||
      "Customer
