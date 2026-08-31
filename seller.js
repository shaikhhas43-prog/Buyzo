const db = window.supabase.createClient(
  "https://ahhrhjucbdddcdlzjokg.supabase.co",
  "sb_publishable_EwPScyGzZsQoNPY9J7GdxA_RpqpiwlO"
);

let user = null;
let products = [];

const money = n =>
  "₹" + Number(n || 0).toLocaleString("en-IN");

async function init() {
  const s = await db.auth.getSession();
  user = s.data.session?.user || null;

  document.getElementById("login").style.display =
    user ? "none" : "block";

  document.getElementById("app").style.display =
    user ? "block" : "none";

  if (user) {
    document.getElementById("email").textContent =
      user.email;

    load();
  }
}

async function load() {
  const r = await db
    .from("products")
    .select("*")
    .eq("seller_id", user.id)
    .order("created_at", { ascending: false });

  if (r.error) {
    notice(r.error.message);
    return;
  }

  products = r.data || [];
  render();
}

function render() {
  document.getElementById("count").textContent =
    products.length;

  document.getElementById("list").innerHTML =
    products.map(p => `
      <div class="product">

        <img
          class="pic"
          src="${p.image_url || "https://placehold.co/150x150?text=BUYZO"}"
          onerror="this.src='https://placehold.co/150x150?text=BUYZO'"
        >

        <div class="info">
          <b>${escapeHTML(p.name)}</b>

          <small>
            ${escapeHTML(p.category)}
            • Stock: ${p.stock ?? 0}
          </small>

          <strong>
            ${money(p.price)}
          </strong>
        </div>

        <button onclick="del(${p.id})">
          Delete
        </button>

      </div>
    `).join("") || "<p>No products yet.</p>";
}

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

async function addProduct() {

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
    document.getElementById("emoji")?.value || "🛍️";

  const file =
    document.getElementById("productImage").files[0];

  if (!name || !price || !file) {
    notice(
      "Product name, price aur photo required hai."
    );
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    notice("Photo 5MB se chhoti honi chahiye.");
    return;
  }

  notice("📸 Photo upload ho rahi hai...");

  const extension =
    (file.name.split(".").pop() || "jpg").toLowerCase();

  const imagePath =
    `${user.id}/${crypto.randomUUID()}.${extension}`;

  const upload =
    await db.storage
      .from("product-images")
      .upload(
        imagePath,
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
    db.storage
      .from("product-images")
      .getPublicUrl(imagePath)
      .data.publicUrl;

  notice("💾 Product save ho raha hai...");

  const r =
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
        image_path: imagePath,
        seller_id: user.id
      });

  if (r.error) {

    await db.storage
      .from("product-images")
      .remove([imagePath]);

    notice(
      "Product save error: " +
      r.error.message
    );

    return;
  }

  document.getElementById("name").value = "";
  document.getElementById("price").value = "";
  document.getElementById("old").value = "";
  document.getElementById("stock").value = "1";

  if (document.getElementById("emoji")) {
    document.getElementById("emoji").value = "";
  }

  document.getElementById("productImage").value = "";

  if (document.getElementById("imagePreview")) {
    document.getElementById("imagePreview").style.display =
      "none";
  }

  notice("✅ Product photo ke saath add ho gaya!");

  load();
}

async function del(id) {

  if (!confirm("Delete this product?")) {
    return;
  }

  const product =
    products.find(p => p.id === id);

  const r =
    await db
      .from("products")
      .delete()
      .eq("id", id);

  if (r.error) {
    notice(r.error.message);
    return;
  }

  if (product?.image_path) {

    await db.storage
      .from("product-images")
      .remove([product.image_path]);

  }

  notice("Product deleted.");

  load();
}

async function login() {

  const e =
    document.getElementById("le").value.trim();

  const p =
    document.getElementById("lp").value;

  const r =
    await db.auth.signInWithPassword({
      email: e,
      password: p
    });

  if (r.error) {

    document.getElementById("loginMsg").textContent =
      r.error.message;

    return;
  }

  init();
}

async function logout() {

  await db.auth.signOut();

  init();
}

function notice(text) {

  const el =
    document.getElementById("notice");

  if (el) {
    el.textContent = text;
  }
}

init();
