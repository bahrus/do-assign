import { test, expect } from '@playwright/test';
test('BasicExample', async ({ page }) => {
    await page.goto('./tests/BasicExample.html');
    // wait for 3 seconds
    await page.waitForTimeout(3000);
    const editor = page.locator('#target');
    await expect(editor).toHaveAttribute('mark', 'good');
});
