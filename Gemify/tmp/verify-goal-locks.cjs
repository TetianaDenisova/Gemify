const { chromium } = require(process.env.GEMIFY_PLAYWRIGHT_MODULE);
const assert = require('node:assert/strict');
const path = require('node:path');

const base = 'http://localhost:8085';

async function setPremium(page, premium) {
  await page.getByRole('tab', { name: 'Profile', exact: true }).click();
  const toggle = page.getByRole('switch', { name: 'Test Premium', exact: true });
  await toggle.waitFor();
  if ((await toggle.getAttribute('aria-checked') === 'true') !== premium) await toggle.click();
  await page.getByText(premium ? 'Premium' : 'Basic', { exact: true }).waitFor();
}

async function createDreams(page, titles) {
  return page.evaluate(async (names) => {
    const [id] = [...globalThis.__r.getModules().entries()].find(([, module]) => module.verboseName === 'src/db/index.ts');
    const db = globalThis.__r(id);
    const dreams = [];
    for (const title of names) dreams.push(await db.createDream({ title }));
    return dreams.map(({ id }) => id);
  }, titles);
}

async function main() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(base, { waitUntil: 'networkidle', timeout: 60000 });
    await setPremium(page, false);
    const orderCorrect = await page.getByText('Subscription', { exact: true }).evaluate((subscription) => {
      const account = [...document.querySelectorAll('div')].find((element) => element.textContent === 'Account' && !element.children.length);
      return Boolean(account && (subscription.compareDocumentPosition(account) & Node.DOCUMENT_POSITION_FOLLOWING));
    });
    assert(orderCorrect, 'Subscription appears before Account');
    await page.getByRole('tab', { name: 'Home', exact: true }).click();
    await page.getByRole('button', { name: 'Create a dream', exact: true }).waitFor({ timeout: 60000 });
    assert.equal(await page.getByRole('button', { name: 'Add Goal, Premium required', exact: true }).count(), 0);
    await page.getByRole('button', { name: 'Add Goal', exact: true }).click();
    await page.getByLabel('Name your dream', { exact: true }).waitFor();
    console.log('BASIC EMPTY PASS: first dream creation available');
    await page.goto(base, { waitUntil: 'networkidle' });
    const [firstId] = await createDreams(page, ['First dream']);
    await page.getByRole('tab', { name: 'Profile', exact: true }).click();
    await page.getByRole('tab', { name: 'Home', exact: true }).click();
    await page.getByRole('button', { name: 'First dream', exact: true }).waitFor();
    await page.getByRole('button', { name: 'Add Goal, Premium required', exact: true }).waitFor();
    assert.equal(await page.getByText('0%', { exact: true }).count(), 1);
    await page.getByRole('button', { name: 'First dream', exact: true }).click();
    await page.waitForURL(`**/journey-map?dreamId=${firstId}`);
    console.log('BASIC ONE PASS: first dream opens; Add Goal locked');
    await page.goto(base, { waitUntil: 'networkidle' });
    await setPremium(page, true);
    const [secondId] = await createDreams(page, ['Second dream', 'Third dream']);
    await setPremium(page, false);
    await page.getByRole('tab', { name: 'Home', exact: true }).click();
    await page.getByRole('button', { name: 'Second dream, Premium required', exact: true }).waitFor();
    await page.getByRole('button', { name: 'Third dream, Premium required', exact: true }).waitFor();
    assert.equal(await page.getByText('0%', { exact: true }).count(), 1);
    assert.equal(await page.getByRole('button', { name: 'First dream', exact: true }).count(), 1);
    await page.getByRole('button', { name: 'Second dream, Premium required', exact: true }).click();
    await page.getByText('Subscription & Account', { exact: true }).waitFor();
    assert.equal(await page.getByRole('tab', { name: 'Profile', exact: true }).getAttribute('aria-selected'), 'true');
    await page.getByRole('tab', { name: 'Home', exact: true }).click();
    await page.getByRole('button', { name: 'Add Goal, Premium required', exact: true }).click();
    await page.getByText('Subscription & Account', { exact: true }).waitFor();
    console.log('BASIC MANY PASS: extra dreams show locks; locked cards and Add Goal open Subscription');
    await setPremium(page, true);
    await page.getByRole('tab', { name: 'Home', exact: true }).click();
    await page.getByRole('button', { name: 'Second dream', exact: true }).waitFor();
    assert.equal(await page.getByText('0%', { exact: true }).count(), 3);
    await page.getByRole('button', { name: 'Add Goal', exact: true }).waitFor();
    assert.equal(await page.getByRole('button', { name: 'Add Goal, Premium required', exact: true }).count(), 0);
    await page.getByRole('button', { name: 'Second dream', exact: true }).click();
    await page.waitForURL(`**/journey-map?dreamId=${secondId}`);
    console.log('PREMIUM PASS: all rings and dream access restored; Add Goal available');
    await page.goto(base, { waitUntil: 'networkidle' });
    await setPremium(page, false);
    for (const width of [320, 390, 820, 1280]) {
      await page.setViewportSize({ width, height: width >= 820 ? 1100 : 844 });
      await page.getByRole('tab', { name: 'Home', exact: true }).click();
      await page.getByRole('button', { name: 'Third dream, Premium required', exact: true }).waitFor();
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: path.join(process.env.TEMP, `gemify-basic-dream-locks-${width}.png`), animations: 'disabled' });
      await page.getByRole('tab', { name: 'Profile', exact: true }).click();
      await page.getByText('Subscription & Account', { exact: true }).waitFor();
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: path.join(process.env.TEMP, `gemify-subscription-first-${width}.png`), animations: 'disabled' });
      console.log(`LAYOUT PASS ${width}px`);
    }
    assert.equal(errors.length, 0);
    console.log('ERRORS', JSON.stringify(errors));
  } finally { await browser.close(); }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
