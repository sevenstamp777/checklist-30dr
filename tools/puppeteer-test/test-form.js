const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const url = process.env.FORM_URL || 'https://checklist.transformandovidas.net.br/';
const allowLiveTest = process.env.ALLOW_LIVE_TEST === '1';
const isProduction = url.includes('transformandovidas.net.br');

(async () => {
  const email = `pipeline-test-${Date.now()}@example.org`;
  const phone = '5511999999999';
  const name = 'Pipeline Test';
  const screenshotsDir = path.join(__dirname, 'screenshots');

  if (isProduction && !allowLiveTest) {
    console.log('PRODUCTION URL detected. Set ALLOW_LIVE_TEST=1 to actually submit.');
    console.log('Running in DRY-RUN mode: navigating + screenshot only (no data sent).');
  }

  fs.mkdirSync(screenshotsDir, { recursive: true });

  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  page.setDefaultNavigationTimeout(60000);
  try {
    console.log('navigating to', url);
    await page.goto(url, { waitUntil: 'networkidle2' });

    if (isProduction && !allowLiveTest) {
      await page.screenshot({ path: path.join(screenshotsDir, 'form-test-dryrun.png'), fullPage: true });
      console.log('dry-run complete. screenshot: screenshots/form-test-dryrun.png');
      return;
    }

    // wait for form
    await page.waitForSelector('#sp-form-254764 form.sp-element-container', { timeout: 30000 });
    // fill fields
    await page.type('input[name="sform[Tm9tZQ==]"]', name, { delay: 50 });
    await page.type('input[name="sform[email]"]', email, { delay: 50 });
    await page.type('input[name="sform[phone]"]', phone, { delay: 50 });
    // click submit
    await Promise.all([
      page.click('button.sp-button'),
      page.waitForTimeout(2000)
    ]);
    // wait for success message or redirect
    const success = await Promise.race([
      page.waitForSelector('.sp-message-success', { timeout: 15000 }).then(() => 'success'),
      page.waitForNavigation({ timeout: 15000 }).then(() => page.url())
    ]).catch(() => null);
    // save screenshot
    await page.screenshot({ path: path.join(screenshotsDir, 'form-test-result.png'), fullPage: true });
    console.log('test-result:', success || 'no success/redirect detected');
    console.log('used-email:', email);
  } catch (err) {
    console.error('error during test:', err.message);
    await page.screenshot({ path: path.join(screenshotsDir, 'form-test-error.png'), fullPage: true }).catch(() => {});
  } finally {
    await browser.close();
  }
})();
