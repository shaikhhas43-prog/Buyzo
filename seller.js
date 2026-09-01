const db = window.supabase.createClient(
  "https://ahhrhjucbdddcdlzjokg.supabase.co",
  "sb_publishable_EwPScyGzZsQoNPY9J7GdxA_RpqpiwlO"
);

let user = null;
let products = [];
let orders = [];


/* =========================
   INIT
========================= */

async function init() {

  const { data, error } = await db.auth.getSession();

  if (error) {
    console.error(error);
  }

  user = data?.session?.user || null;

  const loginBox = document.getElementById("login");
  const app = document.getElementById("app");

  if (loginBox) {
    loginBox.style.display = user ? "none" : "grid";
  }

  if (app) {
    app.style.display = user ? "block" : "none";
  }

  if (user) {

    const email = document.getElementById("email");

    if (email) {
      email.textContent = user.email || "";
    }

    await load();
    await loadOrders();
  }
}


/* =========================
   PRODUCTS
========================= */

async function load() {

  if (!user) return;

  const r = await db
    .from("products")
    .select("*")
    .eq("seller_id", user.id)
    .order("created_at", {
      ascending: false
    });

  if (r.error) {
    notice("Product error: " + r.error.message);
    return;
  }

  products = r.data || [];

  render();
}


function render() {

  const count = document.getElementById("count");
  const list = document.getElementById("list");

  if (count) {
    count.textContent = products.length;
  }

  if (!list) return;

  const fallback =
    "https://placehold.co/150x150/f0f1f6/171b35?text=BUYZO";

  if (!products.length) {
    list.innerHTML = "<p>No products yet.</p>";
    return;
  }

  list.innerHTML = products.map(p => {

    const img = p.image_url || fallback;

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
            ₹${Number(p.price || 0).toLocaleString("en-IN")}
          </strong>

        </div>

        <button onclick="del(${Number(p.id)})">
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
    notice("Pehle seller login karo.");
    return;
  }

  const name =
    document.getElementById("name").value.trim();

  const category =
    document.getElementById("category").value;

  const price =
    Number(document.getElementById("price").value);

  const old =
    Number(document.getElementById("old").value) || null;

  const stock =
    Math.max(
      0,
      Number(document.getElementById("stock").value) || 0
    );

  const emoji =
    document.getElementById("emoji").value || "🛍️";

  const file =
    document.getElementById("productImage").files[0];

  if (!name || !price || !file) {
    notice("Product name, price aur photo required hai.");
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    notice("Photo 5MB se chhoti honi chahiye.");
    return;
  }

  notice("📸 Photo upload ho rahi hai...");

  const ext =
    (file.name.split(".").pop() || "jpg").toLowerCase();

  const path =
    `${user.id}/${crypto.randomUUID()}.${ext}`;

  const up = await db
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

  if (up.error) {
    notice(
      "Photo upload error: " +
      up.error.message
    );
    return;
  }

  const publicURL =
    db.storage
      .from("product-images")
      .getPublicUrl(path)
      .data
      .publicUrl;

  const r = await db
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

  if (r.error) {

    await db
      .storage
      .from("product-images")
      .remove([path]);

    notice(
      "Product save error: " +
      r.error.message
    );

    return;
  }

  document.getElementById("name").value = "";
  document.getElementById("price").value = "";
  document.getElementById("old").value = "";
  document.getElementById("emoji").value = "";

  document.getElementById("stock").value = "1";

  document.getElementById("productImage").value = "";

  document.getElementById("imagePreview").style.display = "none";

  notice("✅ Product successfully add ho gaya!");

  await load();
}


/* =========================
   IMAGE PREVIEW
========================= */

function previewImage() {

  const file =
    document.getElementById("productImage").files[0];

  const img =
    document.getElementById("imagePreview");

  if (!file) {

    img.style.display = "none";

    return;
  }

  img.src =
    URL.createObjectURL(file);

  img.style.display = "block";
}


/* =========================
   DELETE PRODUCT
========================= */

async function del(id) {

  if (!confirm("Delete this product?")) {
    return;
  }

  const p =
    products.find(
      x => Number(x.id) === Number(id)
    );

  const r =
    await db
      .from("products")
      .delete()
      .eq("id", id)
      .eq("seller_id", user.id);

  if (r.error) {

    notice(
      "Delete error: " +
      r.error.message
    );

    return;
  }

  if (p?.image_path) {

    await db
      .storage
      .from("product-images")
      .remove([
        p.image_path
      ]);
  }

  notice("✅ Product deleted.");

  await load();
}


/* =========================
   LOAD ORDERS
========================= */

async function loadOrders() {

  if (!user) return;

  const box =
    document.getElementById("ordersList");

  if (box) {

    box.innerHTML = `
      <p>📦 Orders loading...</p>
    `;
  }

  const r =
    await db
      .from("orders")
      .select("*")
      .eq("seller_id", user.id)
      .order("created_at", {
        ascending: false
      });

  if (r.error) {

    console.error(r.error);

    if (box) {

      box.innerHTML = `
        <div class="emptyOrders">

          <h3>
            Orders load nahi ho rahe.
          </h3>

          <p>
            ${escapeHTML(r.error.message)}
          </p>

        </div>
      `;
    }

    return;
  }

  orders = r.data || [];

  renderOrders();
}


/* =========================
   RENDER ORDERS
========================= */

function renderOrders() {

  const box =
    document.getElementById("ordersList");

  const count =
    document.getElementById("orderCount");

  if (count) {
    count.textContent = orders.length;
  }

  if (!box) return;

  if (!orders.length) {

    box.innerHTML = `
      <div class="emptyOrders">

        <h3>
          📦 No orders yet
        </h3>

        <p>
          Customer order karega to yahan dikhega.
        </p>

      </div>
    `;

    return;
  }


  box.innerHTML = orders.map(order => {

    const status =
      order.status || "New";

    const total =
      Number(order.total || order.price || 0);

    return `

      <div class="orderCard">

        <div class="orderTop">

          <div>

            <h3>
              📦 Order #${escapeHTML(
                order.order_no ||
                String(order.id)
              )}
            </h3>

            <small>
              ${formatDate(order.created_at)}
            </small>

          </div>

          <span
            class="orderStatus ${statusClass(status)}"
          >
            ${escapeHTML(status)}
          </span>

        </div>


        <div class="orderCustomer">

          <h4>
            👤 Customer
          </h4>

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

          <p>
            <b>Product:</b>
            ${escapeHTML(
              order.product_name || "-"
            )}
          </p>

          <p>
            <b>Quantity:</b>
            ${Number(order.quantity || 1)}
          </p>

        </div>


        <div class="orderBottom">

          <div>

            <strong>
              💰 ₹${total.toLocaleString("en-IN")}
            </strong>

            <small>
              ${escapeHTML(
                order.payment_method ||
                "Cash on Delivery"
              )}
            </small>

          </div>


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

              <option
                value="New"
                ${status === "New" ? "selected" : ""}
              >
                New
              </option>

              <option
                value="Confirmed"
                ${status === "Confirmed" ? "selected" : ""}
              >
                Confirmed
              </option>

              <option
                value="Packed"
                ${status === "Packed" ? "selected" : ""}
              >
                Packed
              </option>

              <option
                value="Shipped"
                ${status === "Shipped" ? "selected" : ""}
              >
                Shipped
              </option>

              <option
                value="Delivered"
                ${status === "Delivered" ? "selected" : ""}
              >
                Delivered
              </option>

              <option
                value="Cancelled"
                ${status === "Cancelled" ? "selected" : ""}
              >
                Cancelled
              </option>

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
      x => Number(x.id) === Number(id)
    );

  if (!order) return;

  const modal =
    document.getElementById("orderModal");

  const details =
    document.getElementById("orderDetails");

  if (!modal || !details) return;

  details.innerHTML = `

    <div class="detailBox">

      <h3>
        📦 Order #${escapeHTML(
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

      <hr>

      <h4>
        🛍️ Product
      </h4>

      <p>
        ${escapeHTML(
          order.product_name || "-"
        )}
      </p>

      <p>
        <b>Quantity:</b>
        ${Number(order.quantity || 1)}
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
          order.total || order.price || 0
        ).toLocaleString("en-IN")}
      </p>

      <hr>

      <h4>
        📦 Status
      </h4>

      <p>
        ${escapeHTML(
          order.status || "New"
        )}
      </p>

    </div>

  `;

  modal.style.display = "flex";
}


/* =========================
   CLOSE MODAL
========================= */

function closeOrderModal() {

  const modal =
    document.getElementById("orderModal");

  if (modal) {
    modal.style.display = "none";
  }
}


/* =========================
   UPDATE ORDER STATUS
========================= */

async function updateOrderStatus(id, status) {

  if (!user) return;

  const r =
    await db
      .from("orders")
      .update({
        status: status
      })
      .eq("id", id)
      .eq("seller_id", user.id);

  if (r.error) {

    notice(
      "❌ Status update error: " +
      r.error.message
    );

    return;
  }

  notice(
    "✅ Order status updated: " +
    status
  );

  await loadOrders();
}


/* =========================
   LOGIN
========================= */

async function login() {

  const email =
    document
      .getElementById("le")
      .value
      .trim();

  const password =
    document
      .getElementById("lp")
      .value;

  const msg =
    document.getElementById("loginMsg");

  if (!email || !password) {

    msg.textContent =
      "Email aur password enter karo.";

    return;
  }

  msg.textContent =
    "Login ho raha hai...";

  try {

    const { data, error } =
      await db.auth.signInWithPassword({
        email: email,
        password: password
      });

    if (error) {

      console.error(
        "LOGIN ERROR:",
        error
      );

      msg.textContent =
        "❌ " + error.message;

      return;
    }

    if (!data?.session) {

      msg.textContent =
        "❌ Login session nahi bana.";

      return;
    }

    user = data.user;

    msg.textContent =
      "✅ Login successful!";

    const loginBox =
      document.getElementById("login");

    const app =
      document.getElementById("app");

    if (loginBox) {
      loginBox.style.display = "none";
    }

    if (app) {
      app.style.display = "block";
    }

    const emailBox =
      document.getElementById("email");

    if (emailBox) {
      emailBox.textContent =
        user.email || "";
    }

    await load();
    await loadOrders();

  } catch (err) {

    console.error(err);

    msg.textContent =
      "❌ " +
      (err.message || "Login failed");

  }
}


/* =========================
   LOGOUT
========================= */

async function logout() {

  await db.auth.signOut();

  user = null;
  products = [];
  orders = [];

  await init();
}


/* =========================
   NOTICE
========================= */

function notice(text) {

  const e =
    document.getElementById("notice");

  if (e) {
    e.textContent = text;
  }
}


/* =========================
   DATE
========================= */

function formatDate(date) {

  if (!date) return "";

  try {

    return new Date(date)
      .toLocaleString("en-IN");

  } catch (e) {

    return "";

  }
}


/* =========================
   STATUS CLASS
========================= */

function statusClass(status) {

  return String(status || "New")
    .toLowerCase()
    .replace(/\s+/g, "-");
}


/* =========================
   SECURITY
========================= */

function escapeHTML(value) {

  return String(value ?? "")
    .replace(
      /[&<>"']/g,
      function(char) {

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
    .replace(
      /`/g,
      "&#096;"
    );
}


/* =========================
   START
========================= */

init();
