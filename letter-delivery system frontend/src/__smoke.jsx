import { renderToString } from 'react-dom/server';
import { createElement } from 'react';
import { MemoryRouter } from 'react-router-dom';

export async function run() {
  globalThis.window = globalThis.window || {
    location: { protocol: 'http:', host: 'localhost' },
    matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }),
    addEventListener() {},
    removeEventListener() {},
  };
  globalThis.sessionStorage = globalThis.sessionStorage || {
    getItem: () => null,
    setItem() {},
    removeItem() {},
  };
  globalThis.navigator = globalThis.navigator || { clipboard: { writeText: () => Promise.resolve() } };

  const [{ default: DeliveryPersonHomepage }, { default: AdministrationPage }, { AuthContext }] =
    await Promise.all([
      import('./DeliveryPersonHomepage.jsx'),
      import('./AdministrationPage.jsx'),
      import('./contexts/AuthContext.js'),
    ]);

  const authValue = {
    user: { role: 'ADMIN', displayName: 'Smoke Admin', username: 'smoke' },
    isAuthenticated: true,
    isLoading: false,
    logout: async () => {},
  };

  const lengths = {};
  for (const [name, Page] of [
    ['DeliveryPersonHomepage', DeliveryPersonHomepage],
    ['AdministrationPage', AdministrationPage],
  ]) {
    const html = renderToString(
      createElement(
        MemoryRouter,
        null,
        createElement(
          AuthContext.Provider,
          { value: authValue },
          createElement(Page)
        )
      )
    );
    lengths[name] = html.length;
  }

  const deliveryHtml = renderToString(
    createElement(
      MemoryRouter,
      null,
      createElement(
        AuthContext.Provider,
        { value: authValue },
        createElement(DeliveryPersonHomepage)
      )
    )
  );
  const adminHtml = renderToString(
    createElement(
      MemoryRouter,
      null,
      createElement(
        AuthContext.Provider,
        { value: authValue },
        createElement(AdministrationPage)
      )
    )
  );

  const checks = {
    'delivery: page wrapper': deliveryHtml.includes('class="delivery-page"'),
    'delivery: title Delivery': deliveryHtml.includes('>Delivery<'),
    'delivery: card': deliveryHtml.includes('class="delivery-card"'),
    'delivery: accent stripe': deliveryHtml.includes('delivery-card-accent'),
    'delivery: name input': deliveryHtml.includes('id="deliveryPersonName"'),
    'delivery: phone input': deliveryHtml.includes('id="phone"'),
    'delivery: email input': deliveryHtml.includes('id="email"'),
    'delivery: position select': deliveryHtml.includes('id="recipientPosition"'),
    'delivery: position placeholder': deliveryHtml.includes('>Select position<'),
    'delivery: position optgroups': deliveryHtml.includes('<optgroup'),
    'delivery: no organization field': !deliveryHtml.includes('id="organizationName"'),
    'delivery: no subject field': !deliveryHtml.toLowerCase().includes('subject'),
    'delivery: no reference input': !deliveryHtml.includes('id="trackingNumber"'),
    'delivery: no chips': !deliveryHtml.includes('delivery-chip'),
    'delivery: optional labels': (deliveryHtml.match(/delivery-optional/g) || []).length === 2,
    'delivery: required asterisks': (deliveryHtml.match(/delivery-required/g) || []).length === 2,
    'delivery: submit button': deliveryHtml.includes('Deliver letter'),

    'admin: page wrapper': adminHtml.includes('class="admin-page"'),
    'admin: title': adminHtml.includes('>Administration<'),
    'admin: add employee': adminHtml.includes('Add Employee'),
    'admin: logout': adminHtml.includes('Logout'),
    'admin: tabs': adminHtml.includes('admin-tab-active'),
    'admin: search': adminHtml.includes('id="searchEntities"'),
    'admin: status filter': adminHtml.includes('id="statusFilter"'),
    'admin: table': adminHtml.includes('class="admin-table"'),
    'admin: stats': adminHtml.includes('admin-stats'),
    'admin: signed in': adminHtml.includes('Smoke Admin'),
  };

  let failed = 0;
  for (const [label, ok] of Object.entries(checks)) {
    if (!ok) failed += 1;
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`);
  }
  console.log(`\nlengths: ${JSON.stringify(lengths)}`);
  console.log(failed === 0 ? '\nALL CHECKS PASSED' : `\n${failed} CHECK(S) FAILED`);
  if (failed > 0) {
    throw new Error(`${failed} smoke check(s) failed`);
  }
}

run().catch((err) => {
  console.error('SMOKE ERROR:', err);
  if (globalThis.process) {
    globalThis.process.exitCode = 1;
  }
});
