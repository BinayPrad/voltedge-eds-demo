// blocks/demo-register/demo-register.js
//
// A simple registration form. Whatever the visitor actually types gets
// stored in localStorage, so later blocks (like demo-cart) can use the
// real captured identity instead of hardcoded demo data.
// Add a 1-cell block table containing just "Demo Register" to place this.

const IDENTITY_KEY = 'slimline_demo_identity';

export default function decorate(block) {
  block.textContent = '';

  const wrapper = document.createElement('div');
  wrapper.className = 'demo-register-wrapper';

  const existing = localStorage.getItem(IDENTITY_KEY);
  const identity = existing ? JSON.parse(existing) : null;

  wrapper.innerHTML = `
    <h3>Create your account</h3>
    <form class="demo-register-form">
      <label>First name <input type="text" name="firstName" required></label>
      <label>Last name <input type="text" name="lastName" required></label>
      <label>Email <input type="email" name="email" required></label>
      <label>Company <input type="text" name="company"></label>
      <button type="submit" class="button primary">Register</button>
    </form>
    <p class="demo-register-status"></p>
  `;

  const status = wrapper.querySelector('.demo-register-status');

  if (identity) {
    status.textContent = `Registered as ${identity.firstName} ${identity.lastName} (${identity.email})`;
    status.className = 'demo-register-status success';
  }

  wrapper.querySelector('form').addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newIdentity = {
      firstName: formData.get('firstName').trim(),
      lastName: formData.get('lastName').trim(),
      email: formData.get('email').trim(),
      company: formData.get('company').trim(),
    };
    localStorage.setItem(IDENTITY_KEY, JSON.stringify(newIdentity));
    status.textContent = `Registered as ${newIdentity.firstName} ${newIdentity.lastName} (${newIdentity.email})`;
    status.className = 'demo-register-status success';
  });

  block.append(wrapper);
}
