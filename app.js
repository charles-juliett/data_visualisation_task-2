/* ---------- Products ---------- */
// Each product draws its own small SVG picture in its glaze colour.
const SHAPES = {
  mug: c => `<svg viewBox="0 0 100 100" aria-hidden="true">
    <rect x="22" y="28" width="46" height="52" rx="6" fill="${c}"/>
    <path d="M68 40h8a10 10 0 0 1 0 24h-8" fill="none" stroke="${c}" stroke-width="7"/>
    <rect x="22" y="28" width="46" height="8" rx="4" fill="#fff" opacity="0.3"/></svg>`,
  bowl: c => `<svg viewBox="0 0 100 100" aria-hidden="true">
    <path d="M12 42h76a38 34 0 0 1-76 0z" fill="${c}"/>
    <rect x="34" y="76" width="32" height="8" rx="3" fill="${c}"/>
    <ellipse cx="50" cy="42" rx="38" ry="5" fill="#fff" opacity="0.3"/></svg>`,
  vase: c => `<svg viewBox="0 0 100 100" aria-hidden="true">
    <path d="M42 12h16v22c0 8 20 14 20 34 0 14-8 20-28 20s-28-6-28-20c0-20 20-26 20-34z" fill="${c}"/>
    <rect x="40" y="10" width="20" height="5" rx="2" fill="#fff" opacity="0.3"/></svg>`,
  plate: c => `<svg viewBox="0 0 100 100" aria-hidden="true">
    <ellipse cx="50" cy="58" rx="42" ry="16" fill="${c}"/>
    <ellipse cx="50" cy="56" rx="28" ry="9" fill="#fff" opacity="0.3"/></svg>`,
  teapot: c => `<svg viewBox="0 0 100 100" aria-hidden="true">
    <ellipse cx="46" cy="58" rx="30" ry="24" fill="${c}"/>
    <path d="M74 50l16-14" stroke="${c}" stroke-width="7" stroke-linecap="round"/>
    <path d="M18 48c-14 0-14 20 2 22" fill="none" stroke="${c}" stroke-width="6"/>
    <rect x="30" y="30" width="32" height="8" rx="4" fill="${c}"/>
    <circle cx="46" cy="27" r="4" fill="${c}"/></svg>`,
  jug: c => `<svg viewBox="0 0 100 100" aria-hidden="true">
    <path d="M28 20h38l-4 12c14 10 14 36 6 50H26c-8-14-8-40 6-50z" fill="${c}"/>
    <path d="M70 38c18 0 18 28 0 28" fill="none" stroke="${c}" stroke-width="7"/>
    <rect x="26" y="18" width="42" height="6" rx="3" fill="#fff" opacity="0.3"/></svg>`
};

const PRODUCTS = [
  { id: 1, name: "Morning mug",    price: 18.00, glaze: "#2446c9", shape: "mug",    note: "350 ml, cobalt glaze" },
  { id: 2, name: "Noodle bowl",    price: 24.50, glaze: "#2f8f83", shape: "bowl",   note: "Deep, with a foot ring" },
  { id: 3, name: "Bud vase",       price: 32.00, glaze: "#7a5cc4", shape: "vase",   note: "Fits a few stems" },
  { id: 4, name: "Dinner plate",   price: 21.00, glaze: "#5a6f80", shape: "plate",  note: "27 cm, speckled grey" },
  { id: 5, name: "Teapot",         price: 56.00, glaze: "#c47a2c", shape: "teapot", note: "Holds 800 ml, with strainer" },
  { id: 6, name: "Milk jug",       price: 15.50, glaze: "#c04a64", shape: "jug",    note: "250 ml, rose glaze" }
];

/* ---------- Cart ---------- */
class Cart {
  constructor(products, storageKey = "blue-kiln-cart") {
    this.products = products;
    this.storageKey = storageKey;
    this.items = new Map(); // product id -> quantity
    this.load();
  }

  add(id) {
    this.items.set(id, (this.items.get(id) || 0) + 1);
    this.save();
  }

  // Change quantity by +1 or -1. The product is removed when it reaches 0.
  change(id, delta) {
    const next = (this.items.get(id) || 0) + delta;
    if (next <= 0) this.items.delete(id);
    else this.items.set(id, next);
    this.save();
  }

  clear() {
    this.items.clear();
    this.save();
  }

  lines() {
    return [...this.items].map(([id, qty]) => {
      const product = this.products.find(p => p.id === id);
      return { product, qty, sum: product.price * qty };
    });
  }

  get count() {
    let n = 0;
    for (const qty of this.items.values()) n += qty;
    return n;
  }

  get total() {
    return this.lines().reduce((sum, l) => sum + l.sum, 0);
  }

  save() {
    try { localStorage.setItem(this.storageKey, JSON.stringify([...this.items])); } catch (e) { /* storage unavailable */ }
  }

  load() {
    try {
      const saved = JSON.parse(localStorage.getItem(this.storageKey) || "[]");
      for (const [id, qty] of saved) {
        if (this.products.some(p => p.id === id) && qty > 0) this.items.set(id, qty);
      }
    } catch (e) { /* ignore broken data */ }
  }
}

/* ---------- Rendering ---------- */
const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const cart = new Cart(PRODUCTS);

const productsEl = document.getElementById("products");
const itemsEl = document.getElementById("cart-items");
const emptyEl = document.getElementById("empty");
const totalEl = document.getElementById("total");
const countEl = document.getElementById("cart-count");
const clearBtn = document.getElementById("clear");

function renderProducts() {
  productsEl.innerHTML = PRODUCTS.map(p => `
    <article class="product">
      <div class="art">${SHAPES[p.shape](p.glaze)}</div>
      <div class="info">
        <h3>${p.name}</h3>
        <p class="note">${p.note}</p>
        <span class="price">${money.format(p.price)}</span>
        <button type="button" class="add" data-add="${p.id}" aria-label="Add ${p.name} to cart">Add to cart</button>
      </div>
    </article>`).join("");
}

function renderCart() {
  const lines = cart.lines();
  emptyEl.hidden = lines.length > 0;
  clearBtn.disabled = lines.length === 0;
  countEl.textContent = cart.count;
  totalEl.textContent = money.format(cart.total);

  itemsEl.innerHTML = lines.map(({ product: p, qty, sum }) => `
    <li>
      <div>
        <div class="item-name">${p.name}</div>
        <div class="item-unit">${money.format(p.price)} each</div>
        <div class="qty">
          <button type="button" data-dec="${p.id}" aria-label="Remove one ${p.name}">−</button>
          <span aria-label="Quantity">${qty}</span>
          <button type="button" data-inc="${p.id}" aria-label="Add one ${p.name}">+</button>
        </div>
      </div>
      <div class="item-line">${money.format(sum)}</div>
    </li>`).join("");
}

productsEl.addEventListener("click", e => {
  const btn = e.target.closest("[data-add]");
  if (!btn) return;
  cart.add(Number(btn.dataset.add));
  renderCart();
});

itemsEl.addEventListener("click", e => {
  const inc = e.target.closest("[data-inc]");
  const dec = e.target.closest("[data-dec]");
  if (inc) cart.change(Number(inc.dataset.inc), +1);
  else if (dec) cart.change(Number(dec.dataset.dec), -1);
  else return;
  renderCart();
});

clearBtn.addEventListener("click", () => {
  cart.clear();
  renderCart();
});

renderProducts();
renderCart();
