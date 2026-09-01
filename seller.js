const SUPABASE_URL = "https://ahhrhjucbdddcdlzjokg.supabase.co";
const SUPABASE_KEY = "sb_publishable_EwPScyGzZsQoNPY9J7GdxA_RpqpiwlO";

const db = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

let user = null;
let products = [];
let orders = [];


/* =========================
   INIT
========================= */

async function init() {
  try {
    const { data, error } = await db.auth.getSession();

    if (error) {
      console.error(error);
      showLogin();
      return;
    }

    user = data.session?.user || null;

    if (user) {
      showApp();

      const email = document.getElementById("email");
      if (email) {
        email.textContent = user.email || "";
      }

      await load();
      await loadOrders();

    } else {
      showLogin();
    }

  } catch (err) {
    console.error("INIT ERROR:", err);
    showLogin();
  }
}


/* =========================
   SHOW LOGIN
========================= */

function showLogin() {

  const loginBox = document.getElementById("login");
  const app = document.getElementById("app");

  if (loginBox) {
    loginBox.style.display = "grid";
  }

  if (app) {
    app.style.display = "none";
  }
}


/* =========================
   SHOW APP
========================= */

function showApp() {

  const loginBox = document.getElementById("login");
  const app = document.getElementById("app");

  if (loginBox) {
    loginBox.style.display = "none";
  }

  if (app) {
    app.style.display = "block";
  }
}


/* =========================
   LOGIN
========================= */

async function login() {

  const emailInput = document.getElementById("le");
  const passwordInput = document.getElementById("lp");
  const msg = document.getElementById("loginMsg");

  const email = emailInput?.value.trim() || "";
  const password = passwordInput?.value || "";

  if (!email || !password) {

    if (msg) {
      msg.textContent =
        "Email aur password enter karo.";
    }

    return;
  }

  if (msg) {
    msg.textContent = "⏳ Login ho raha hai...";
  }

  try {

    const { data, error } =
      await db.auth.signInWithPassword({
        email: email,
        password: password
      });

    console.log("LOGIN RESULT:", data);
    console.log("LOGIN ERROR:", error);

    if (error) {

      if (msg) {
        msg.textContent =
          "❌ " + error.message;
      }

      return;
    }

    if (!data || !data.session) {

      if (msg) {
        msg.textContent =
          "❌ Login session nahi bana.";
      }

      return;
    }

    user = data.user;

    if (msg) {
      msg.textContent =
        "✅ Login successful!";
    }

    showApp();

    const emailElement =
      document.getElementById("email");

    if (emailElement) {
      emailElement.textContent =
        user.email || "";
    }

    await load();
    await loadOrders();

  } catch (err) {

    console.error("LOGIN ERROR:", err);

    if (msg) {
      msg.textContent =
        "❌ " + (err.message || "Login failed");
    }
  }
}


/* =========================
   LOGOUT
========================= */

async function logout() {

  try {

    await db.auth.signOut();

    user = null;
    products = [];
    orders = [];

    showLogin();

  } catch (err) {

    console.error("LOGOUT ERROR:", err);

  }
}


/* =========================
   LOAD PRODUCTS
========================= */

async function load() {

  if (!user) return;

  const list =
    document.getElementById("list");

  if (list) {
    list.innerHTML =
      "<p>Products loading...</p>";
  }

  const { data, error } =
    await db
      .from("products")
      .select("*")
      .eq("seller_id", user.id)
      .order("created_at", {
        ascending: false
      });

  if (error) {

    console.error("PRODUCT ERROR:", error);

    notice(
      "Products error: " +
      error.message
    );

    return;
  }

  products = data || [];

  render();
}


/* =========================
   RENDER PRODUCTS
========================= */

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
    products.map(p => {

      const img =
        p.image_url || fallback;

      return `
        <div class="product">

          <img
            class="pic"
            src="${escapeAttr(img)}"
            onerror="this.onerror=null;this.src='${fallback}'"
          >

          <div class="info">

            <b>
              ${escapeHTML(p.name)}
            </b>

            <small>
              ${escapeHTML(p.category || "Other")}
              • Stock: ${p.stock ?? 0}
            </small>

            <strong>
              ₹${Number(
                p.price || 0
              ).toLocaleString("en-IN")}
            </strong>

          </div>

          <button
            onclick="del(${Number(p.id)})"
          >
            Delete
          </button>

        </div>
      `;

    }).join("");
}


/* =========================
   ADD PRODUCT
========================= */

async function addProduct() {

  if (!user) {

    notice(
      "Pehle seller login karo."
    );

    return;
  }

  const name =
    document.getElementById("name")
      ?.value.trim();

  const category =
    document.getElementById("category")
      ?.value || "Other";

  const price =
    Number(
      document.getElementById("price")
        ?.value
    );

  const old =
    Number(
      document.getElementById("old")
        ?.value
    ) || null;

  const stock =
    Math.max(
      0,
      Number(
        document.getElementById("stock")
          ?.value
      ) || 0
    );

  const emoji =
    document.getElementById("emoji")
      ?.value || "🛍️";

  const file =
    document.getElementById("productImage")
      ?.files[0];

  if (!name || !price || !file) {

    notice(
      "Product name, price aur photo required hai."
    );

    return;
  }

  if (file.size > 5 * 1024 * 1024) {

    notice(
      "Photo 5MB se chhoti honi chahiye."
    );

    return;
  }

  notice(
    "📸 Photo upload ho rahi hai..."
  );

  try {

    const ext =
      (
        file.name.split(".").pop() ||
        "jpg"
      ).toLowerCase();

    const path =
      `${user.id}/${crypto.randomUUID()}.${ext}`;

    const upload =
      await db
        .storage
        .from("product-images")
        .upload(
          path,
          file,
          {
            contentType: file.type,
            upsert: false
          }
        );

    if (upload.error) {

      notice(
        "Photo upload error: " +
        upload.error.message
      );

      return;
    }

    const publicURL =
      db
        .storage
        .from("product-images")
        .getPublicUrl(path)
        .data
        .publicUrl;

    const { error } =
      await db
        .from("products")
        .insert({
          name: name,
          category: category,
          price: price,
          old_price: old,
          stock: stock,
          emoji: emoji,
          image_url: publicURL,
          image_path: path,
          seller_id: user.id
        });

    if (error) {

      await db
        .storage
        .from("product-images")
        .remove([path]);

      notice(
        "Product save error: " +
        error.message
      );

      return;
    }

    document.getElementById("name").value = "";
    document.getElementById("price").value = "";
    document.getElementById("old").value = "";
    document.getElementById("emoji").value = "";
    document.getElementById("stock").value = "1";
    document.getElementById("productImage").value = "";

    const preview =
      document.getElementById("imagePreview");

    if (preview) {
      preview.style.display = "none";
    }

    notice(
      "✅ Product successfully add ho gaya!"
    );

    await load();

  } catch (err) {

    console.error(err);

    notice(
      "❌ " +
      (err.message || "Product add failed")
    );
  }
}


/* =========================
   IMAGE PREVIEW
========================= */

function previewImage() {

  const file =
    document.getElementById("productImage")
      ?.files[0];

  const img =
    document.getElementById("imagePreview");

  if (!file || !img) {

    if (img) {
      img.style.display = "none";
    }

    return;
  }

  img.src =
    URL.createObjectURL(file);

  img.style.display =
    "block";
}


/* =========================
   DELETE PRODUCT
========================= */

async function del(id) {

  if (!user) return;

  if (!confirm(
    "Kya tum ye product delete karna chahte ho?"
  )) {
    return;
  }

  const product =
    products.find(
      p => Number(p.id) === Number(id)
    );

  const { error } =
    await db
      .from("products")
      .delete()
      .eq("id", id)
      .eq("seller_id", user.id);

  if (error) {

    notice(
      "Delete error: " +
      error.message
    );

    return;
  }

  if (product?.image_path) {

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
}


/* =========================
   ORDERS
========================= */

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

  const { data, error } =
    await db
      .from("orders")
      .select("*")
      .eq("seller_id", user.id)
      .order("created_at", {
        ascending: false
      });

  if (error) {

    console.error(
      "ORDERS ERROR:",
      error
    );

    if (box) {

      box.innerHTML = `
        <div class="emptyOrders">

          <h3>
            Orders load nahi ho rahe.
          </h3>

          <p>
            ${escapeHTML(error.message)}
          </p>

        </div>
      `;
    }

    return;
  }

  orders = data || [];

  renderOrders();
}


/* =========================
   RENDER ORDERS
========================= */

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

        <h3>📦 No orders yet</h3>

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
        order.status || "New";

      const total =
        Number(order.total || 0);

      return `
        <div class="orderCard">

          <div class="orderTop">

            <div>

              <h3>
                📦 Order #${
                  escapeHTML(
                    order.order_no ||
                    String(order.id)
                  )
                }
              </h3>

              <small>
                ${formatDate(
                  order.created_at
                )}
              </small>

            </div>

            <span
              class="orderStatus ${statusClass(status)}"
            >
              ${escapeHTML(status)}
            </span>

          </div>

          <div class="orderCustomer">

            <h4>👤 Customer</h4>

            <p>
              <b>Name:</b>
              ${escapeHTML(
                order.customer_name || "-"
              )}
            </p>

            <p>
              <b>Mobile:</b>
              ${escapeHTML(
                order.mobile || "-"
              )}
            </p>

            <p>
              <b>Address:</b>
              ${escapeHTML(
                order.address || "-"
              )}
            </p>

            <p>
              <b>City:</b>
              ${escapeHTML(
                order.city || "-"
              )}
            </p>

            <p>
              <b>State:</b>
              ${escapeHTML(
                order.state || "-"
              )}
            </p>

            <p>
              <b>Pincode:</b>
              ${escapeHTML(
                order.pincode || "-"
              )}
            </p>

          </div>

          <div class="orderBottom">

            <strong>
              💰 ₹${total.toLocaleString("en-IN")}
            </strong>

            <div class="orderActions">

              <button
                onclick="viewOrder(${Number(order.id)})"
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

                ${[
                  "New",
                  "Confirmed",
                  "Packed",
                  "Shipped",
                  "Delivered",
                  "Cancelled"
                ].map(s => `
                  <option
                    value="${s}"
                    ${status === s ? "selected" : ""}
                  >
                    ${s}
                  </option>
                `).join("")}

              </select>

            </div>

          </div>

        </div>
      `;

    }).join("");
}


/* =========================
   VIEW ORDER
========================= */

function viewOrder(id) {

  const order =
    orders.find(
      o => Number(o.id) === Number(id)
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

  if (!modal || !details) return;

  details.innerHTML = `

    <div class="detailBox">

      <
