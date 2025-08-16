const { chromium } = require('playwright');

async function runTest(code) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const testFunc = eval(`(async ({page}) => {${code}})`);
  await testFunc({ page });
  const dom = await page.content();
  const screenshot = await page.screenshot({ encoding: 'base64' });
  await browser.close();
  return { dom, screenshot };
}

module.exports = { runTest };
