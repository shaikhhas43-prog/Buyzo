/* =====================================================
   BUYZO SELLER PANEL
   SUPABASE + LOGIN + PRODUCTS + ORDERS
===================================================== */


/* =========================
   SUPABASE CONFIG
========================= */

const SUPABASE_URL =
  "https://ahhrhjucbdddcdlzjokg.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_EwPScyGzZsQoNPY9J7GdxA_RpqpiwlO";

const db = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);


/* =========================
   GLOBAL VARIABLES
========================= */

let user = null;
let products = [];
let orders = [];


/* =====================================================
   INIT
===================================================== */

async function init() {

  try {

    const result =
      await db.auth.getSession();

    if (result.error) {

      console.error(
        "SESSION ERROR:",
        result.error
      );

      showLogin();
      return;
    }

    user =
      result.data.session?.user || null;

    console.log(
      "CURRENT USER:",
      user
    );

    if (user) {

      showApp();

      setText(
        "email",
        user.email || ""
      );

      await load();
      await loadOrders();

    } else {

      showLogin();

    }

  } catch (error) {

    console.error(
      "INIT ERROR:",
      error
    );

    showLogin();

  }
}


/* =====================================================
   SUPABASE AUTH STATE
===================================================== */

db.auth.onAuthStateChange(
  async (event, session) => {

    console.log(
      "AUTH EVENT:",
      event
    );

    user =
      session?.user || null;

    if (user) {

      showApp();

      setText(
        "email",
        user.email || ""
      );

      /*
       * Delay loading slightly so Supabase
       * auth state completely settles.
       */

      setTimeout(async () => {

        await load();
        await loadOrders();

      }, 100);

    } else {

      products = [];
      orders = [];

      showLogin();

    }
  }
);


/* =====================================================
   SHOW LOGIN
===================================================== */

function showLogin() {

  const login =
    document.getElementById("login");

  const app =
    document.getElementById("app");

  if (login) {

    login.style.display =
      "grid";

  }

  if (app) {

    app.style.display =
      "none";

  }
}


/* =====================================================
   SHOW APP
===================================================== */

function showApp() {

  const login =
    document.getElementById("login");

  const app =
    document.getElementById("app");

  if (login) {

    login.style.display =
      "none";

  }

  if (app) {

    app.style.display =
      "block";

  }
}


/* =====================================================
   LOGIN
===================================================== */

async function login() {

  const emailInput =
    document.getElementById("le");

  const passwordInput =
    document.getElementById("lp");

  const msg =
    document.getElementById("loginMsg");

  const email =
    emailInput?.value.trim() || "";

  const password =
    passwordInput?.value || "";


  /* CHECK INPUT */

  if (!email || !password) {

    if (msg) {

      msg.textContent =
        "Email aur password enter karo.";

    }

    return;
  }


  if (msg) {

    msg.textContent =
      "⏳ Login ho raha hai...";

  }


  try {

    console.log(
      "LOGIN EMAIL:",
      email
    );


    const result =
      await db.auth.signInWithPassword({

        email: email,

        password: password

      });


    console.log(
      "LOGIN RESULT:",
      result
    );


    if (result.error) {

      console.error(
        "SUPABASE LOGIN ERROR:",
        result.error
      );


      if (msg) {

        msg.textContent =
          "❌ " +
          result.error.message;

      }

      return;
    }


    if (!result.data?.session) {

      if (msg) {

        msg.textContent =
          "❌ Login session nahi bana.";

      }

      return;
    }


    /* LOGIN SUCCESS */

    user =
      result.data.user;


    if (msg) {

      msg.textContent =
        "✅ Login successful!";

    }


    showApp();


    setText(
      "email",
      user.email || ""
    );


    await load();

    await loadOrders();


  } catch (error) {

    console.error(
      "LOGIN ERROR:",
      error
    );


    if (msg) {

      msg.textContent =
        "❌ " +
        (
          error.message ||
          "Login failed"
        );

    }

  }
}


/* =====================================================
   LOGOUT
===================================================== */

async function logout() {

  try {

    const result =
      await db.auth.signOut();


    if (result.error) {

      console.error(
        "LOGOUT ERROR:",
        result.error
      );

      notice(
        "Logout error: " +
        result.error.message
      );

      return;
    }


    user = null;

    products = [];

    orders = [];

    showLogin();


  } catch (error) {

    console.error(
      "LOGOUT ERROR:",
      error
    );

  }
}


/* =====================================================
   LOAD PRODUCTS
===================================================== */

async function load() {

  if (!user) {

    console.log(
      "No logged-in user."
    );

    return;
  }


  const list =
    document.getElementById("list");


  if (list) {

    list.innerHTML =
      "<p>Products loading...</p>";

  }


  try {

    const result =
      await db
        .from("products")
        .select("*")
        .eq(
          "seller_id",
          user.id
        )
        .order(
          "created_at",
          {
            ascending: false
          }
        );


    if (result.error) {

      console.error(
        "PRODUCT ERROR:",
        result.error
      );


      notice(
        "Products error: " +
        result.error.message
      );

      return;
    }


    products =
      result.data || [];


    render();


  } catch (error) {

    console.error(
      "LOAD PRODUCT ERROR:",
      error
    );

  }
}


/* =====================================================
   RENDER PRODUCTS
===================================================== */

function render() {

  const count =
    document.getElementById("count");

  const list =
    document.getElementById("list");


  if (count) {

    count.textContent =
      products.length;

  }


  if (!list) return;


  if (!products.length) {

    list.innerHTML =
      "<p>No products yet.</p>";

    return;
  }


  const fallback =
    "https://placehold.co/150x150/f0f1f6/171b35?text=BUYZO";


  list.innerHTML =
    products.map(product => {

      const image =
        product.image_url ||
        fallback;


      return `

        <div class="product">

          <img
            class="pic"
            src="${escapeAttr(image)}"
            onerror="
              this.onerror=null;
              this.src='${fallback}'
            "
          >

          <div class="info">

            <b>
              ${escapeHTML(
                product.name
              )}
            </b>

            <small>

              ${escapeHTML(
                product.category ||
                "Other"
              )}

              • Stock:
              ${product.stock ?? 0}

            </small>

            <strong>

              ₹${Number(
                product.price || 0
              ).toLocaleString("en-IN")}

            </strong>

          </div>


          <button
            onclick="
              del(${Number(product.id)})
            "
          >
            Delete
          </button>

        </div>

      `;

    }).join("");

}


/* =====================================================
   ADD PRODUCT
===================================================== */

async function addProduct() {

  if (!user) {

    notice(
      "Pehle seller login karo."
    );

    return;
  }


  const name =
    document
      .getElementById("name")
      ?.value
      .trim();


  const category =
    document
      .getElementById("category")
      ?.value ||
    "Other";


  const price =
    Number(
      document
        .getElementById("price")
        ?.value
    );


  const old =
    Number(
      document
        .getElementById("old")
        ?.value
    ) || null;


  const stock =
    Math.max(
      0,
      Number(
        document
          .getElementById("stock")
          ?.value
      ) || 0
    );


  const emoji =
    document
      .getElementById("emoji")
      ?.value ||
    "🛍️";


  const file =
    document
      .getElementById("productImage")
      ?.files?.[0];


  /* VALIDATION */

  if (
    !name ||
    !price ||
    !file
  ) {

    notice(
      "Product name, price aur photo required hai."
    );

    return;
  }


  if (
    file.size >
    5 * 1024 * 1024
  ) {

    notice(
      "Photo 5MB se chhoti honi chahiye."
    );

    return;
  }


  notice(
    "📸 Photo upload ho rahi hai..."
  );


  try {

    const extension =
      (
        file.name
          .split(".")
          .pop() ||
        "jpg"
      ).toLowerCase();


    const path =
      `${user.id}/${crypto.randomUUID()}.${extension}`;


    /* UPLOAD IMAGE */

    const upload =
      await db
        .storage
        .from("product-images")
        .upload(
          path,
          file,
          {
            contentType:
              file.type,

            upsert:
              false
          }
        );


    if (upload.error) {

      notice(
        "Photo upload error: " +
        upload.error.message
      );

      return;
    }


    /* PUBLIC IMAGE URL */

    const publicURL =
      db
        .storage
        .from("product-images")
        .getPublicUrl(path)
        .data
        .publicUrl;


    /* SAVE PRODUCT */

    const result =
      await db
        .from("products")
        .insert({

          name:
            name,

          category:
            category,

          price:
            price,

          old_price:
            old,

          stock:
            stock,

          emoji:
            emoji,

          image_url:
            publicURL,

          image_path:
            path,

          seller_id:
            user.id

        });


    if (result.error) {

      await db
        .storage
        .from("product-images")
        .remove([
          path
        ]);


      notice(
        "Product save error: " +
        result.error.message
      );

      return;
    }


    /* CLEAR FORM */

    clearInput("name");

    clearInput("price");

    clearInput("old");

    clearInput("emoji");

    const stockInput =
      document.getElementById(
        "stock"
      );

    if (stockInput) {

      stockInput.value =
        "1";

    }


    const imageInput =
      document.getElementById(
        "productImage"
      );

    if (imageInput) {

      imageInput.value =
        "";

    }


    const preview =
      document.getElementById(
        "imagePreview"
      );


    if (preview) {

      preview.src =
        "";

      preview.style.display =
        "none";

    }


    notice(
      "✅ Product successfully add ho gaya!"
    );


    await load();


  } catch (error) {

    console.error(
      "ADD PRODUCT ERROR:",
      error
    );


    notice(
      "❌ " +
      (
        error.message ||
        "Product add failed"
      )
    );

  }
}


/* =====================================================
   IMAGE PREVIEW
===================================================== */

function previewImage() {

  const file =
    document
      .getElementById("productImage")
      ?.files?.[0];


  const img =
    document.getElementById(
      "imagePreview"
    );


  if (!file || !img) {

    if (img) {

      img.style.display =
        "none";

    }

    return;
  }


  img.src =
    URL.createObjectURL(file);


  img.style.display =
    "block";

}


/* =====================================================
   DELETE PRODUCT
===================================================== */

async function del(id) {

  if (!user) return;


  if (
    !confirm(
      "Kya tum ye product delete karna chahte ho?"
    )
  ) {

    return;
  }


  const product =
    products.find(
      p =>
        Number(p.id) ===
        Number(id)
    );


  try {

    const result =
      await db
        .from("products")
        .delete()
        .eq(
          "id",
          id
        )
        .eq(
          "seller_id",
          user.id
        );


    if (result.error) {

      notice(
        "Delete error: " +
        result.error.message
      );

      return;
    }


    /* DELETE IMAGE */

    if (
      product?.image_path
    ) {

      await db
        .storage
        .from("product-images")
        .remove([
          product.image_path
        ]);

    }


    notice(
      "✅ Product deleted."
    );


    await load();


  } catch (error) {

    console.error(
      "DELETE ERROR:",
      error
    );

  }
}


/* =====================================================
   LOAD ORDERS
===================================================== */

async function loadOrders() {

  if (!user) return;


  const box =
    document.getElementById(
      "ordersList"
    );


  if (box) {

    box.innerHTML =
      "<p>📦 Orders loading...</p>";

  }


  try {

    const result =
      await db
        .from("orders")
        .select("*")
        .eq(
          "seller_id",
          user.id
        )
        .order(
          "created_at",
          {
            ascending: false
          }
        );


    if (result.error) {

      console.error(
        "ORDERS ERROR:",
        result.error
      );


      if (box) {

        box.innerHTML = `

          <div class="emptyOrders">

            <h3>
              Orders load nahi ho rahe.
            </h3>

            <p>
              ${escapeHTML(
                result.error.message
              )}
            </p>

          </div>

        `;

      }

      return;
    }


    orders =
      result.data || [];


    renderOrders();


  } catch (error) {

    console.error(
      "LOAD ORDERS ERROR:",
      error
    );

  }
}


/* =====================================================
   RENDER ORDERS
===================================================== */

function renderOrders() {

  const box =
    document.getElementById(
      "ordersList"
    );


  const count =
    document.getElementById(
      "orderCount"
    );


  if (count) {

    count.textContent =
      orders.length;

  }


  if (!box) return;


  if (!orders.length) {

    box.innerHTML = `

      <div class="emptyOrders">

        <h3>
          📦 No orders yet
        </h3>

        <p>
          Customer order karega
          to yahan dikhega.
        </p>

      </div>

    `;

    return;
  }


  box.innerHTML =
    orders.map(order => {

      const status =
        order.status ||
        "New";


      const total =
        Number(
          order.total ||
          0
        );


      const statuses = [
        "New",
        "Confirmed",
        "Packed",
        "Shipped",
        "Delivered",
        "Cancelled"
      ];


      return `

        <div class="orderCard">

          <div class="orderTop">

            <div>

              <h3>

                📦 Order #

                ${escapeHTML(
                  order.order_no ||
                  String(order.id)
                )}

              </h3>

              <small>

                ${formatDate(
                  order.created_at
                )}

              </small>

            </div>


            <span
              class="
                orderStatus
                ${statusClass(status)}
              "
            >

              ${escapeHTML(
                status
              )}

            </span>

          </div>


          <div class="orderCustomer">

            <h4>
              👤 Customer
            </h4>


            <p>

              <b>Name:</b>

              ${escapeHTML(
                order.customer_name ||
                "-"
              )}

            </p>


            <p>

              <b>Mobile:</b>

              ${escapeHTML(
                order.mobile ||
                "-"
              )}

            </p>


            <p>

              <b>Address:</b>

              ${escapeHTML(
                order.address ||
                "-"
              )}

            </p>


            <p>

              <b>City:</b>

              ${escapeHTML(
                order.city ||
                "-"
              )}

            </p>


            <p>

              <b>State:</b>

              ${escapeHTML(
                order.state ||
                "-"
              )}

            </p>


            <p>

              <b>Pincode:</b>

              ${escapeHTML(
                order.pincode ||
                "-"
              )}

            </p>

          </div>


          <div class="orderBottom">

            <strong>

              💰 ₹${total.toLocaleString(
                "en-IN"
              )}

            </strong>


            <div class="orderActions">

              <button
                onclick="
                  viewOrder(
                    ${Number(order.id)}
                  )
                "
              >
                View
              </button>


              <select
                onchange="
                  updateOrderStatus(
                    ${Number(order.id)},
                    this.value
                  )
                "
              >

                ${statuses.map(
                  s => `

                    <option
                      value="${s}"
                      ${
                        status === s
                          ? "selected"
                          : ""
                      }
                    >
                      ${s}
                    </option>

                  `
                ).join("")}

              </select>

            </div>

          </div>

        </div>

      `;

    }).join("");

}


/* =====================================================
   VIEW ORDER
===================================================== */

function viewOrder(id) {

  const order =
    orders.find(
      o =>
        Number(o.id) ===
        Number(id)
    );


  if (!order) return;


  const modal =
    document.getElementById(
      "orderModal"
    );


  const details =
    document.getElementById(
      "orderDetails"
    );


  if (!modal || !details) {

    return;
  }


  details.innerHTML = `

    <div class="detailBox">

      <h3>

        📦 Order #

        ${escapeHTML(
          order.order_no ||
          String(order.id)
        )}

      </h3>


      <hr>


      <h4>
        👤 Customer
      </h4>


      <p>

        <b>Name:</b>

        ${escapeHTML(
          order.customer_name ||
          "-"
        )}

      </p>


      <p>

        <b>Mobile:</b>

        ${escapeHTML(
          order.mobile ||
          "-"
        )}

      </p>


      <p>

        <b>Address:</b>

        ${escapeHTML(
          order.address ||
          "-"
        )}

      </p>


      <p>

        <b>City:</b>

        ${escapeHTML(
          order.city ||
          "-"
        )}

      </p>


      <p>

        <b>State:</b>

        ${escapeHTML(
          order.state ||
          "-"
        )}

      </p>


      <p>

        <b>Pincode:</b>

        ${escapeHTML(
          order.pincode ||
          "-"
        )}

      </p>


      <hr>


      <h4>
        💰 Payment
      </h4>


      <p>

        ${escapeHTML(
          order.payment_method ||
          "Cash on Delivery"
        )}

      </p>


      <p>

        <b>Total:</b>

        ₹${Number(
          order.total ||
          0
        ).toLocaleString(
          "en-IN"
        )}

      </p>


      <hr>


      <h4>
        📦 Status
      </h4>


      <p>

        ${escapeHTML(
          order.status ||
          "New"
        )}

      </p>


    </div>

  `;


  modal.style.display =
    "flex";

}


/* =====================================================
   CLOSE ORDER MODAL
===================================================== */

function closeOrderModal() {

  const modal =
    document.getElementById(
      "orderModal"
    );


  if (modal) {

    modal.style.display =
      "none";

  }

}


/* =====================================================
   UPDATE ORDER STATUS
===================================================== */

async function updateOrderStatus(
  id,
  status
) {

  if (!user) return;


  try {

    const result =
      await db
        .from("orders")
        .update({
          status:
            status
        })
        .eq(
          "id",
          id
        )
        .eq(
          "seller_id",
          user.id
        );


    if (result.error) {

      notice(
        "Status update error: " +
        result.error.message
      );

      return;
    }


    notice(
      "✅ Order status updated: " +
      status
    );


    await loadOrders();


  } catch (error) {

    console.error(
      "STATUS ERROR:",
      error
    );

  }
}


/* =====================================================
   NOTICE
===================================================== */

function notice(message) {

  const element =
    document.getElementById(
      "notice"
    );


  if (element) {

    element.textContent =
      message;

  }

}


/* =====================================================
   DATE FORMAT
===================================================== */

function formatDate(date) {

  if (!date) return "";


  try {

    return new Date(
      date
    ).toLocaleString(
      "en-IN"
    );

  } catch {

    return "";

  }

}


/* =====================================================
   STATUS CLASS
===================================================== */

function statusClass(status) {

  return String(
    status ||
    "New"
  )
    .toLowerCase()
    .replace(
      /\s+/g,
      "-"
    );

}


/* =====================================================
   SECURITY
===================================================== */

function escapeHTML(value) {

  return String(
    value ?? ""
  ).replace(
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
  ).replace(
    /`/g,
    "&#096;"
  );

}


/* =====================================================
   HELPER FUNCTIONS
===================================================== */

function setText(
  id,
  value
) {

  const element =
    document.getElementById(
      id
    );


  if (element) {

    element.textContent =
      value;

  }

}


function clearInput(id) {

  const element =
    document.getElementById(
      id
    );


  if (element) {

    element.value =
      "";

  }

}


/* =====================================================
   START
===================================================== */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    init();

  }
);
