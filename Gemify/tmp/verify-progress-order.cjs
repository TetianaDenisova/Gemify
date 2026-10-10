const { chromium } = require(process.env.GEMIFY_PLAYWRIGHT_MODULE);
const assert = require('node:assert/strict');
const path = require('node:path');

async function main() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('http://localhost:8084/progress', { waitUntil: 'networkidle' });
    const heading = page.getByText('Quest & Habit Completion', { exact: true });
    const goalPicker = page.getByRole('button', { name: 'Choose goal', exact: true });
    await heading.waitFor();
    await page.getByText('Your journey starts here', { exact: true }).waitFor();
    await goalPicker.waitFor();
    const emptyOrder = await heading.evaluate((title) => {
      const picker = document.querySelector('[aria-label="Choose goal"]');
      return Boolean(picker && (title.compareDocumentPosition(picker) & Node.DOCUMENT_POSITION_FOLLOWING));
    });
    assert(emptyOrder);
    console.log('EMPTY PROGRESS PASS: completion heading before dropdown and empty state');
    await page.evaluate(async () => {
      const [id] = [...globalThis.__r.getModules().entries()].find(([, module]) => module.verboseName === 'src/db/index.ts');
      const db = globalThis.__r(id);
      const dream = await db.createDream({ title: 'Progress order dream' });
      const milestone = await db.insertMilestone(dream.id, 0, { title: 'First milestone' });
      const done = await db.createQuest(milestone.id, 'Completed step');
      const next = await db.createQuest(milestone.id, 'Next step');
      await db.updateQuest(done.id, { scheduledDate: '2026-10-10', isPlanned: true });
      await db.updateQuest(next.id, { scheduledDate: '2026-10-11', isPlanned: true });
      await db.setQuestDone(done.id, true);
    });
    await page.getByRole('tab', { name: 'Home', exact: true }).click();
    await page.getByRole('tab', { name: 'Progress', exact: true }).click();
    const rangePicker = page.getByRole('button', { name: 'Choose range', exact: true });
    await rangePicker.waitFor();
    await rangePicker.click();
    await page.getByText('Month', { exact: true }).click();
    await rangePicker.getByText('Month', { exact: true }).waitFor();
    await page.getByText('Monthly Average', { exact: true }).waitFor();
    await rangePicker.click();
    await page.getByText('Week', { exact: true }).click();
    await page.getByText('Weekly Average', { exact: true }).waitFor();
    const forecast = page.getByText('You’re on track to reach your goal', { exact: true });
    await forecast.waitFor();
    const titleColor = await heading.evaluate((title) => getComputedStyle(title).color);
    assert.equal(titleColor, 'rgb(245, 184, 75)');
    const sameCard = await heading.evaluate((title) => {
      const card = title.parentElement;
      return Boolean(card.querySelector('svg')) && !card.contains(document.querySelector('[aria-label="Choose range"]')) && !card.contains(document.querySelector('[aria-label="Choose goal"]'));
    });
    assert(sameCard, 'Gold title belongs to chart card; both dropdowns are outside');
    for (const width of [320, 390, 820, 1280]) {
      await page.setViewportSize({ width, height: width >= 820 ? 1100 : 844 });
      await page.waitForLoadState('networkidle');
      const titleBox = await heading.boundingBox();
      const goalBox = await goalPicker.boundingBox();
      const rangeBox = await rangePicker.boundingBox();
      const summaryBox = await page.getByText('Weekly Average', { exact: true }).boundingBox();
      const forecastBox = await forecast.boundingBox();
      assert(rangeBox.y < titleBox.y && titleBox.y < summaryBox.y && summaryBox.y < goalBox.y && goalBox.y < forecastBox.y);
      const percentagesFit = await page.getByText('100%', { exact: true }).evaluateAll((labels) => labels.every((label) => label.scrollWidth <= label.clientWidth));
      assert(percentagesFit, 'Chart percentages fit');
      assert(titleBox.x >= 0 && titleBox.x + titleBox.width <= width + 1);
      await page.screenshot({ path: path.join(process.env.TEMP, `gemify-progress-order-${width}.png`), animations: 'disabled' });
      console.log(`PROGRESS PASS ${width}px: chart, dreams dropdown, then forecast`);
    }
    assert.equal(errors.length, 0);
    console.log('ERRORS', JSON.stringify(errors));
  } finally { await browser.close(); }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
