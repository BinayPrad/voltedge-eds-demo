// blocks/demo-register/demo-register.js
//
// Registration form for NEW demo customers, plus a Login dropdown for
// RETURNING ones — both set the same active identity that demo-cart.js
// reads from, so cart/checkout actions always track to whoever is
// currently "logged in," whether freshly registered or returning.
// Add a 1-cell block table containing just "Demo Register" to place this.

const IDENTITY_KEY = 'slimline_demo_identity';
const CUSTOMERS_KEY = 'slimline_demo_customers';

function generateFreshEmail() {
  return `demo+${Date.now()}@example.com`;
}

function getCustomers() {
  const raw = localStorage.getItem(CUSTOMERS_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveCustomer(identity) {
  const customers = getCustomers();
  const existingIndex = customers.findIndex((c) => c.email === identity.email);
  if (existingIndex >= 0) {
    customers[existingIndex] = identity; // update their saved details
  } else {
    customers.push(identity);
  }
  localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(customers));
}

function renderLoginSection(customers) {
  return customers.length
    ? `
      <div class="demo-register-login-row">
        <select class="demo-register-customer-select">
          ${customers.map((c) => `<option value="${c.email}">${c.firstName} ${c.lastName} (${c.email})</option>`).join('')}
        </select>
        <button type="button" class="button secondary demo-register-login-btn">Log In</button>
      </div>
    `
    : '<p class="demo-register-hint">No saved customers yet — register below to create one.</p>';
}

export default function decorate(block) {
  block.textContent = '';

  const wrapper = document.createElement('div');
  wrapper.className = 'demo-register-wrapper';

  const existingIdentity = localStorage.getItem(IDENTITY_KEY);
  const activeIdentity = existingIdentity ? JSON.parse(existingIdentity) : null;

  wrapper.innerHTML = `
    <div class="demo-register-login">
      <h3>Returning customer? Log in</h3>
      <div class="demo-register-login-content">${renderLoginSection(getCustomers())}</div>
    </div>

    <hr class="demo-register-divider">

    <h3>Create a new account</h3>
    <form class="demo-register-form">
      <label>First name <input type="text" name="firstName" required></label>
      <label>Last name <input type="text" name="lastName" required></label>
      <label>
        Email
        <span class="demo-register-email-row">
          <input type="email" name="email" required>
          <button type="button" class="button secondary demo-register-fresh-email">Use fresh test email</button>
        </span>
      </label>
      <label>Company <input type="text" name="company"></label>
      <button type="submit" class="button primary">Register</button>
    </form>

    <p class="demo-register-status"></p>
    <button type="button" class="demo-register-clear">Log out / clear active identity</button>
  `;

  const status = wrapper.querySelector('.demo-register-status');
  const emailInput = wrapper.querySelector('input[name="email"]');
  const loginContent = wrapper.querySelector('.demo-register-login-content');

  function showActive(id, verb = 'Registered') {
    status.textContent = `${verb} as ${id.firstName} ${id.lastName} (${id.email})`;
    status.className = 'demo-register-status success';
  }

  function refreshLoginSection() {
    loginContent.innerHTML = renderLoginSection(getCustomers());
    const loginBtn = loginContent.querySelector('.demo-register-login-btn');
    if (loginBtn) {
      loginBtn.addEventListener('click', () => {
        const select = loginContent.querySelector('.demo-register-customer-select');
        const chosen = getCustomers().find((c) => c.email === select.value);
        if (chosen) {
          localStorage.setItem(IDENTITY_KEY, JSON.stringify(chosen));
          showActive(chosen, 'Logged in');
        }
      });
    }
  }

  refreshLoginSection();

  if (activeIdentity) {
    showActive(activeIdentity, 'Logged in');
  }

  wrapper.querySelector('.demo-register-fresh-email').addEventListener('click', () => {
    emailInput.value = generateFreshEmail();
  });

  wrapper.querySelector('.demo-register-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newIdentity = {
      firstName: formData.get('firstName').trim(),
      lastName: formData.get('lastName').trim(),
      email: formData.get('email').trim(),
      company: formData.get('company').trim(),
    };
    localStorage.setItem(IDENTITY_KEY, JSON.stringify(newIdentity));
    saveCustomer(newIdentity);
    showActive(newIdentity, 'Registered');
    refreshLoginSection(); // new customer now appears in the dropdown immediately
    e.target.reset();
  });

  wrapper.querySelector('.demo-register-clear').addEventListener('click', () => {
    localStorage.removeItem(IDENTITY_KEY);
    localStorage.removeItem('slimline_demo_cart');
    status.textContent = 'Logged out. Log in as a saved customer above, or register a new one.';
    status.className = 'demo-register-status';
  });

  block.append(wrapper);
}
