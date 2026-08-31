const SUPABASE_URL =
  "https://ahhrhjucbdddcdlzjokg.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_EwPScyGzZsQoNPY9J7GdxA_RpqpiwlO";

const db = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);


let user = null;
let products = [];


const money = (n) =>
  "₹" + Number(n || 0).toLocaleString("en-IN");


/* =========================
   INIT
========================= */

async function init() {

  const result = await db.auth.getSession();

  user = result.data.session?.user || null;

  const loginPage =
    document.getElementById("login");

  const app =
    document.getElementById("app");


  if (!user) {

    loginPage.style.display = "flex";
    app.style.display = "none";

    return;
  }


  loginPage.style.display = "none";
  app.style.display = "block";


  document.getElementById("email").textContent =
    user.email || "";


  await load();
}


/* =========================
   LOAD PRODUCTS
========================= */

async function load() {

  if (!user) return;


  notice("Loading products...");


  const result = await db
    .from("products")
    .select("*")
    .eq("seller_id", user.id)
    .order("created_at", {
      ascending: false
    });


  if (result.error) {

    notice(
      "Product load error: " +
      result.error.message
    );

    return;
  }


  products = result.data || [];


  render();


  notice("");
}


/* =========================
   RENDER PRODUCTS
========================= */

function render() {

  const count =
    document.getElementById("count");

  const list =
    document.getElementById("list");


  count.textContent =
    products.length;


  if (!products.length) {

    list.innerHTML =
      "<p>No products yet.</p>";

    return;
  }


  list.innerHTML =
    products.map((p) => {

      const image =
        p.image_url ||
        "https://placehold.co/300x300?text=BUYZO";


      return `
        <div class="product">

          <img
            class="pic"
            src="${escapeHTML(image)}"
            alt="${escapeHTML(p.name)}"
            onerror="this.onerror=null;this.src='https://placehold.co/300x300?text=BUYZO';"
          >

          <div class="info">

            <b>
              ${escapeHTML(p.name)}
            </b>

            <small>
              ${escapeHTML(p.category || "Other")}
              • Stock: ${Number(p.stock || 0)}
            </small>

            <strong>
              ${money(p.price)}
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
   HTML SECURITY
========================= */

function escapeHTML(text) {

  return String(text ?? "").replace(
    /[&<>"']/g,

    function (char) {

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


/* =========================
   IMAGE PREVIEW
========================= */

function previewImage() {

  const input =
    document.getElementById("productImage");

  const previewBox =
    document.getElementById("previewBox");

  const preview =
    document.getElementById("imagePreview");


  const file = input.files[0];


  if (!file) {

    previewBox.style.display = "none";

    return;
  }


  if (!file.type.startsWith("image/")) {

    notice("Sirf image file select karo.");

    input.value = "";

    previewBox.style.display = "none";

    return;
  }


  if (file.size > 5 * 1024 * 1024) {

    notice("Photo 5MB se chhoti honi chahiye.");

    input.value = "";

    previewBox.style.display = "none";

    return;
  }


  const reader =
    new FileReader();


  reader.onload = function (event) {

    preview.src =
      event.target.result;

    previewBox.style.display =
      "block";
  };


  reader.readAsDataURL(file);
}


/* =========================
   REMOVE PREVIEW
========================= */

function removePreview() {

  document.getElementById(
    "productImage"
  ).value = "";


  document.getElementById(
    "previewBox"
  ).style.display = "none";
}


/* =========================
   ADD PRODUCT
========================= */

async function addProduct() {

  if (!user) {

    notice("Please login first.");

    return;
  }


  const name =
    document
      .getElementById("name")
      .value
      .trim();


  const category =
    document.getElementById(
      "category"
    ).value;


  const price =
    Number(
      document.getElementById("price").value
    );


  const oldValue =
    document.getElementById("old").value;


  const old =
    oldValue
      ? Number(oldValue)
      : null;


  const stock =
    Math.max(
      0,
      Number(
        document.getElementById("stock").value
      ) || 0
    );


  const emoji =
    document
      .getElementById("emoji")
      .value
      .trim() || "🛍️";


  const fileInput =
    document.getElementById("productImage");


  const file =
    fileInput.files[0];


  /* VALIDATION */

  if (!name) {

    notice("Product name required hai.");

    return;
  }


  if (!price || price <= 0) {

    notice("Valid selling price enter karo.");

    return;
  }


  if (!file) {

    notice(
      "Product photo select karna required hai."
    );

    return;
  }


  if (!file.type.startsWith("image/")) {

    notice("Sirf image file allowed hai.");

    return;
  }


  if (file.size > 5 * 1024 * 1024) {

    notice(
      "Photo 5MB se chhoti honi chahiye."
    );

    return;
  }


  /* DISABLE BUTTON */

  const button =
    document.querySelector(
      ".add-btn"
    );


  button.disabled = true;
  button.textContent =
    "Uploading...";


  try {

    /* =========================
       FILE PATH
    ========================= */

    const extension =
      (
        file.name
          .split(".")
          .pop() || "jpg"
      ).toLowerCase();


    const safeExtension =
      extension.replace(
        /[^a-z0-9]/g,
        ""
      ) || "jpg";


    const fileName =
      `${crypto.randomUUID()}.${safeExtension}`;


    const imagePath =
      `${user.id}/${fileName}`;


    /* =========================
       UPLOAD IMAGE
    ========================= */

    notice(
      "📸 Product photo upload ho rahi hai..."
    );


    const upload =
      await db.storage
        .from("product-images")
        .upload(
          imagePath,
          file,
          {
            cacheControl: "3600",
            contentType: file.type,
            upsert: false
          }
        );


    if (upload.error) {

      throw new Error(
        "Photo upload error: " +
        upload.error.message
      );
    }


    /* =========================
       PUBLIC URL
    ========================= */

    const publicResult =
      db.storage
        .from("product-images")
        .getPublicUrl(
          imagePath
        );


    const publicURL =
      publicResult.data.publicUrl;


    if (!publicURL) {

      throw new Error(
        "Image URL create nahi hua."
      );
    }


    /* =========================
       SAVE PRODUCT
    ========================= */

    notice(
      "💾 Product database mein save ho raha hai..."
    );


    const result =
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

        })
        .select()
        .single();


    if (result.error) {

      /* DATABASE FAIL =
         DELETE UPLOADED IMAGE */

      await db.storage
        .from("product-images")
        .remove([
          imagePath
        ]);


      throw new Error(
        "Product save error: " +
        result.error.message
      );
    }


    /* =========================
       CLEAR FORM
    ========================= */

    document.getElementById(
      "name"
    ).value = "";


    document.getElementById(
      "price"
    ).value = "";


    document.getElementById(
      "old"
    ).value = "";


    document.getElementById(
      "stock"
    ).value = "1";


    document.getElementById(
      "emoji"
    ).value = "";


    fileInput.value = "";


    document.getElementById(
      "previewBox"
    ).style.display = "none";


    notice(
      "✅ Product photo ke saath successfully add ho gaya!"
    );


    await load();

  } catch (error) {

    console.error(error);

    notice(
      "❌ " + error.message
    );

  } finally {

    button.disabled = false;

    button.textContent =
      "Upload & Add Product";
  }
}


/* =========================
   DELETE PRODUCT
========================= */

async function del(id) {

  if (!user) return;


  const product =
    products.find(
      p => Number(p.id) === Number(id)
    );


  if (!product) {

    notice("Product nahi mila.");

    return;
  }


  const confirmed =
    confirm(
      `Delete "${product.name}"?`
    );


  if (!confirmed) return;


  notice(
    "Product delete ho raha hai..."
  );


  /* DELETE DATABASE ROW */

  const result =
    await db
      .from("products")
      .delete()
      .eq("id", id)
      .eq("seller_id", user.id);


  if (result.error) {

    notice(
      "Delete error: " +
      result.error.message
    );

    return;
  }


  /* DELETE IMAGE */

  if (product.image_path) {

    const imageDelete =
      await db.storage
        .from("product-images")
        .remove([
          product.image_path
        ]);


    if (imageDelete.error) {

      console.warn(
        "Image delete error:",
        imageDelete.error.message
      );

    }
  }


  notice(
    "✅ Product deleted."
  );


  await load();
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


  if (!email || !password) {

    document.getElementById(
      "loginMsg"
    ).textContent =
      "Email aur password required hai.";

    return;
  }


  const result =
    await db.auth.signInWithPassword({

      email: email,

      password: password

    });


  if (result.error) {

    document.getElementById(
      "loginMsg"
    ).textContent =
      result.error.message;

    return;
  }


  document.getElementById(
    "loginMsg"
  ).textContent = "";


  await init();
}


/* =========================
   LOGOUT
========================= */

async function logout() {

  await db.auth.signOut();

  user = null;

  products = [];

  await init();
}


/* =========================
   NOTICE
========================= */

function notice(text) {

  const element =
    document.getElementById("notice");


  if (element) {

    element.textContent =
      text || "";
  }
}


/* =========================
   AUTH STATE
========================= */

db.auth.onAuthStateChange(
  function (event, session) {

    user =
      session?.user || null;

    if (event === "SIGNED_OUT") {

      init();

    }

  }
);


/* START */

init();
