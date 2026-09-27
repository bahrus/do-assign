import { test, expect } from '@playwright/test';
test('Programmatic>ImperativeReassign', async ({ page }) => {
    await page.goto('./tests/Programmatic/ImperativeReassign.html');
    await page.waitForTimeout(2500);
    const target = page.locator('#target');
    await expect(target).toHaveAttribute('mark', 'good');
});
