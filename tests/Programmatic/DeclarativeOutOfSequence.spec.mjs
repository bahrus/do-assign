import { test, expect } from '@playwright/test';
test('Programmatic>DeclarativeOutOfSequence', async ({ page }) => {
    await page.goto('./tests/Programmatic/DeclarativeOutOfSequence.html');
    await page.waitForTimeout(2500);
    const target = page.locator('#target');
    await expect(target).toHaveAttribute('mark', 'good');
});
