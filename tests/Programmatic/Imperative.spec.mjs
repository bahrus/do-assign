import { test, expect } from '@playwright/test';
test('Programmatic>Imperative', async ({ page }) => {
    await page.goto('./tests/Programmatic/Imperative.html');
    await page.waitForTimeout(2500);
    const target = page.locator('#target');
    await expect(target).toHaveAttribute('mark', 'good');
});
