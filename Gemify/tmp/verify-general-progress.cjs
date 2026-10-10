const { chromium } = require('C:/Users/48576/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright');
const assert = require('node:assert/strict');
const path = require('node:path');

async function main() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('http://localhost:8084/progress', { waitUntil: 'networkidle' });
    await page.getByText('Dream Forecast', { exact: true }).waitFor();
    await page.getByText('Your dream forecasts will appear here.', { exact: true }).waitFor();
    assert.equal(await page.getByRole('button', { name: 'Choose goal', exact: true }).count(), 0);
    await page.evaluate(async () => {
      const [id] = [...globalThis.__r.getModules().entries()].find(([, module]) => module.verboseName === 'src/db/index.ts');
      const repository = globalThis.__r(id);
      const db = await repository.getDatabase();
      const today = new Date();
      const dateKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      const names = ['Become President of Lviv', 'Become a Hollywood Star', 'Become a Millionaire', 'Build My Dream Life'];
      for (const [index, title] of names.entries()) {
        const inserted = await db.runAsync('INSERT INTO dreams (title) VALUES (?)', [title]);
        const milestone = await repository.insertMilestone(inserted.lastInsertRowId, 0, { title: 'First milestone' });
        const done = await repository.createQuest(milestone.id, 'Completed step');
        const next = await repository.createQuest(milestone.id, 'Next step');
        await repository.updateQuest(done.id, { scheduledDate: dateKey, isPlanned: true });
        await repository.setQuestDone(done.id, true);
        await repository.updateQuest(next.id, { scheduledDate: `2027-${String(index + 1).padStart(2, '0')}-18`, isPlanned: true });
      }
    });
    await page.getByRole('tab', { name: 'Home', exact: true }).click();
    await page.getByRole('tab', { name: 'Progress', exact: true }).click();
    await page.getByText('Jan 18, 2027', { exact: true }).waitFor();
    const range = page.getByRole('button', { name: 'Choose range', exact: true });
    await range.click();
    await page.getByText('Month', { exact: true }).click();
    await page.getByText('Monthly Average', { exact: true }).waitFor();
    await range.click();
    await page.getByText('6 Months', { exact: true }).click();
    await page.getByText('6-Month Average', { exact: true }).waitFor();
    for (const width of [320, 390, 820, 1280]) {
      await page.setViewportSize({ width, height: width >= 820 ? 1100 : 844 });
      await page.getByText('Dream Forecast', { exact: true }).scrollIntoViewIfNeeded();
      const card = page.getByText('Dream Forecast', { exact: true }).locator('..').locator('..');
      const cardBox = await card.boundingBox();
      assert(cardBox.x >= 0 && cardBox.x + cardBox.width <= width + 1);
      for (const [title, date] of [
        ['Become President of Lviv', 'Jan 18, 2027'],
        ['Become a Hollywood Star', 'Feb 18, 2027'],
        ['Become a Millionaire', 'Mar 18, 2027'],
        ['Build My Dream Life', 'Apr 18, 2027'],
      ]) {
        const titleBox = await card.getByText(title, { exact: true }).boundingBox();
        const dateBox = await card.getByText(date, { exact: true }).boundingBox();
        assert(titleBox.x + titleBox.width <= dateBox.x, `Title and date overlap at ${width}px`);
        assert(dateBox.x + dateBox.width <= cardBox.x + cardBox.width);
      }
      assert.equal(await card.getByRole('button').count(), 0);
      assert.equal(await card.locator('img').evaluateAll((images) => images.every((image) => image.complete && image.naturalWidth > 0)), true);
      await card.screenshot({ path: path.join(process.env.TEMP, `gemify-dream-forecast-${width}.png`), animations: 'disabled' });
      console.log(`PASS ${width}px: forecast artwork, dates with year, no overlap or menu`);
    }
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
  }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
