// @ts-check
import { test, expect } from '@playwright/test';

/*
 * ================================================================
 *  Sport Management Module — Automated Tests
 *  Responsible Member: Chamod
 *
 *  Pages tested:
 *    /sports              — Public sports listing
 *    /student/sports      — Student sports browsing
 *    /admin/manage-sports — Admin sports management
 * ================================================================
 */

const BASE_URL = 'http://localhost:3000';

// ─── 1. PUBLIC SPORTS LISTING ──────────────────────────────────

test.describe('Sport Management — Public Listing (/sports)', () => {

  test('Sports page loads and displays content', async ({ page }) => {
    await page.goto(`${BASE_URL}/sports`, { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/sports/);
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('Sports page renders sport entries after loading', async ({ page }) => {
    await page.goto(`${BASE_URL}/sports`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    const bodyText = await page.locator('body').textContent() ?? '';
    expect(bodyText.length).toBeGreaterThan(50);
  });

  test('Sports page has clickable sport items', async ({ page }) => {
    await page.goto(`${BASE_URL}/sports`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    // Sports should have links or cards that can be clicked
    const links = page.locator('a, button, [role="button"]');
    const count = await links.count();
    expect(count).toBeGreaterThan(0);
  });

});

// ─── 2. NAVIGATION TO SPORTS ───────────────────────────────────

test.describe('Sports Navigation', () => {

  test('Sports link is accessible from home page', async ({ page }) => {
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    const sportsLink = page.locator('a[href="/sports"]').first();
    await expect(sportsLink).toBeVisible();
  });

  test('Clicking sports link navigates to /sports', async ({ page }) => {
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    const sportsLink = page.locator('a[href="/sports"]').first();
    await sportsLink.click();
    await page.waitForTimeout(1500);
    await expect(page).toHaveURL(/\/sport/);
  });

});

// ─── 3. PROTECTED SPORTS ADMIN ROUTES ──────────────────────────

test.describe('Sports Admin — Access Control', () => {

  test('Admin dashboard redirects unauthenticated users', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    const currentUrl = page.url();
    // Should redirect since admin is protected
    const redirected = currentUrl.includes('login') || currentUrl.includes('signup') || currentUrl.includes('home') || !currentUrl.includes('admin');
    expect(redirected).toBeTruthy();
  });

  test('Manage sports page is protected', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/manage-sports`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    const currentUrl = page.url();
    const redirected = currentUrl.includes('login') || currentUrl.includes('signup') || !currentUrl.includes('manage-sports');
    expect(redirected).toBeTruthy();
  });

});

// ─── 4. RESPONSIVE DESIGN ─────────────────────────────────────

test.describe('Responsive Design — Sports Pages', () => {

  test('Sports page works on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`${BASE_URL}/sports`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).not.toBeEmpty();
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5);
  });

});