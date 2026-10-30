// blocks/demo-cart/demo-cart.js
//
// A small product list with real Add to Cart buttons (stored in
// localStorage), plus Checkout / Abandon Cart buttons that send whatever
// was actually registered (demo-register.js) and actually added to cart —
// not hardcoded demo data.
// Add a 1-cell block table containing just "Demo Cart" to place this.

const BRIDGE_URL = 'http://localhost:3001';
const IDENTITY_KEY = 'slimline_demo_identity';
const CART_KEY = 'slimline_demo_cart';

const PRODUCTS = [
  { sku: 'SW-AF-19', name: 'A-Frame Pavement Sign', price: 89.0, category: 'A Frames & Pavement Signs' },
  { sku: 'SW-CF-06', name: 'Clip Frame A1', price: 45.0, category: 'Clip Frames & Snapframes' },
  { sku: 'SW-DS-447', name: 'Digital Signage Display 43"', price: 699.0, category: 'Digital Signage Solutions' },
  { sku: 'SW-PS-17', name: 'Poster Stand Deluxe', price: 129.0, category: 'Poster Stands' },
];

function getIdentity() {
  const raw = localStorage.getItem(IDENTITY_KEY);
  return raw ? JSON.parse(raw) : null;
}

function getCart() {
  const raw = localStorage.getItem(CART_KEY);
  return raw ? JSON.parse(raw) : [];
}

function setCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function formatCartSummary(cart) {
  if (!cart.length) return '';
  return cart
    .map((i) => `${i.name} (qty ${i.quantity}, $${i.price.toFixed(2)})`)
    .join('<br>');
}

function cartTotal(cart) {
  return cart.reduce((sum, i) => sum + i.price * i.quantity, 0).toFixed(2);
}

async function sendToBridge(eventType, statusEl) {
  const identity = getIdentity();
  if (!identity || !identity.email) {
    statusEl.textContent = 'Please register first (see the registration form above).';
    statusEl.className = 'demo-cart-status error';
    return;
  }

  const cart = getCart();
  if (!cart.length) {
    statusEl.textContent = 'Your cart is empty — add a product first.';
    statusEl.className = 'demo-cart-status error';
    return;
  }

  statusEl.textContent = `Sending ${eventType}…`;
  statusEl.className = 'demo-cart-status pending';

  try {
    const response = await fetch(`${BRIDGE_URL}/api/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: identity.email,
        firstName: identity.firstName,
        lastName: identity.lastName,
        company: identity.company,
        eventType,
        productName: cart[0].name,
        productSku: cart[0].sku,
        category: cart[0].category,
        cartValue: cartTotal(cart),
        cartItemsSummary: formatCartSummary(cart),
      }),
    });

    const result = await response.json();
    statusEl.textContent = `✓ ${eventType} sent — mode: ${result.mode} (${identity.email})`;
    statusEl.className = 'demo-cart-status success';

    if (eventType === 'post_purchase') {
      setCart([]); // clear cart after a simulated purchase
      renderCartList(); // eslint-disable-line no-use-before-define
    }
  } catch (err) {
    statusEl.textContent = `✗ Failed: ${err.message}`;
    statusEl.className = 'demo-cart-status error';
  }
}

let cartListEl;
let totalEl;

function renderCartList() {
  const cart = getCart();
  cartListEl.innerHTML = cart.length
    ? cart.map((i) => `<li>${i.name} — qty ${i.quantity} — $${(i.price * i.quantity).toFixed(2)}</li>`).join('')
    : '<li class="empty">Cart is empty</li>';
  totalEl.textContent = `Total: $${cartTotal(cart)}`;
}

function addToCart(product) {
  const cart = getCart();
  const existing = cart.find((i) => i.sku === product.sku);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ ...product, quantity: 1 });
  }
  setCart(cart);
  renderCartList();
}

export default function decorate(block) {
  block.textContent = '';

  const wrapper = document.createElement('div');
  wrapper.className = 'demo-cart-wrapper';

  wrapper.innerHTML = `
    <div class="demo-cart-products">
      <h3>Products</h3>
      <ul class="demo-cart-product-list">
        ${PRODUCTS.map((p) => `
          <li>
            <span>${p.name} — $${p.price.toFixed(2)}</span>
            <button type="button" class="button secondary" data-sku="${p.sku}">Add to Cart</button>
          </li>
        `).join('')}
      </ul>
    </div>
    <div class="demo-cart-summary">
      <h3>Your Cart</h3>
      <ul class="demo-cart-list"></ul>
      <p class="demo-cart-total"></p>
      <div class="demo-cart-actions">
        <button type="button" class="button primary" data-action="checkout">Place Order</button>
        <button type="button" class="button secondary" data-action="abandon">Leave Site (Abandon Cart)</button>
      </div>
      <p class="demo-cart-status"></p>
    </div>
  `;

  cartListEl = wrapper.querySelector('.demo-cart-list');
  totalEl = wrapper.querySelector('.demo-cart-total');
  const statusEl = wrapper.querySelector('.demo-cart-status');

  wrapper.querySelectorAll('[data-sku]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const product = PRODUCTS.find((p) => p.sku === btn.dataset.sku);
      addToCart(product);
    });
  });

  wrapper.querySelector('[data-action="checkout"]').addEventListener('click', () => {
    sendToBridge('post_purchase', statusEl);
  });

  wrapper.querySelector('[data-action="abandon"]').addEventListener('click', () => {
    sendToBridge('cart_abandonment', statusEl);
  });

  renderCartList();
  block.append(wrapper);
}
