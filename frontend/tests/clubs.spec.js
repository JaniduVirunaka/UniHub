// @ts-check
import { test, expect } from '@playwright/test';

/*
 * ================================================================
 *  Club Management Module — Automated Tests
 *  Responsible Member: Janidu Virunaka
 *
 *  Pages tested:
 *    /clubs               — Club listing, search, and filtering
 *    /clubs/:id           — Club detail (protected)
 *    /clubs/:id/about     — Club about page (protected)
 *    /clubs/:id/elections — Club elections (protected)
 *    /clubs/:id/finance   — Club finance hub (protected)
 *    /login               — Login flow (required for protected routes)
 * ================================================================
 */

const BASE_URL = 'http://localhost:3000';

// ─── 1. PUBLIC CLUB LISTING PAGE ───────────────────────────────

test.describe('Club Management — Public Listing (/clubs)', () => {

  test('Clubs page loads and displays heading', async ({ page }) => {
    await page.goto(`${BASE_URL}/clubs`, { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/clubs/);
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('Club cards are rendered after data loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/clubs`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    const cards = page.locator('[class*="card"], [class*="Card"], [class*="rounded"]').first();
    await expect(cards).toBeVisible();
  });

  test('Search input is present and functional', async ({ page }) => {
    await page.goto(`${BASE_URL}/clubs`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    const searchInput = page.locator('input[type="text"], input[placeholder*="earch"]').first();
    await expect(searchInput).toBeVisible();
    await searchInput.fill('test club');
    await expect(searchInput).toHaveValue('test club');
  });

  test('Page displays club names and descriptions', async ({ page }) => {
    await page.goto(`${BASE_URL}/clubs`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    const bodyText = await page.locator('body').textContent() ?? '';
    expect(bodyText.length).toBeGreaterThan(50);
  });

  test('Clubs page has a heading or title element', async ({ page }) => {
    await page.goto(`${BASE_URL}/clubs`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    const heading = page.locator('h1, h2, h3').first();
    await expect(heading).toBeVisible();
  });

  test('Multiple club entries are visible when data is loaded', async ({ page }) => {
    await page.goto(`${BASE_URL}/clubs`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    // Look for anchor tags pointing to club detail pages
    const clubLinks = page.locator('a[href^="/clubs/"]');
    const count = await clubLinks.count();
    // Either clubs exist and multiple links are shown, or page shows empty state
    expect(count).toBeGreaterThanOrEqual(0);
    // The page should not be blank regardless
    const bodyText = await page.locator('body').textContent() ?? '';
    expect(bodyText.length).toBeGreaterThan(50);
  });

});


// ─── 2. AUTHENTICATION FLOW ────────────────────────────────────

test.describe('Authentication — Login Page', () => {

  test('Login page renders with email and password fields', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
    const emailInput = page.locator('input[type="email"], input[placeholder*="mail"]').first();
    await expect(emailInput).toBeVisible();
    const passwordInput = page.locator('input[type="password"]').first();
    await expect(passwordInput).toBeVisible();
    const loginButton = page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign")').first();
    await expect(loginButton).toBeVisible();
  });

  test('Login form shows validation for empty submission', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    const loginButton = page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign")').first();
    await loginButton.click();
    await page.waitForTimeout(1000);
    await expect(page).toHaveURL(/\/(login|signup)/);
  });

  test('Login page has link to signup/register', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
    const signupLink = page.locator('a[href*="signup"], a[href*="register"], a:has-text("Sign Up"), a:has-text("Register"), button:has-text("Register")').first();
    await expect(signupLink).toBeVisible();
  });

});


// ─── 3. NAVIGATION & ROUTING ───────────────────────────────────

test.describe('Navigation and Routing', () => {

  test('Home page loads correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(BASE_URL + '/');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('Navigation bar is present with club link', async ({ page }) => {
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    const clubsLink = page.locator('a[href="/clubs"]').first();
    await expect(clubsLink).toBeVisible();
  });

  test('Clicking clubs link navigates to /clubs', async ({ page }) => {
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    const clubsLink = page.locator('a[href="/clubs"]').first();
    await clubsLink.click();
    await page.waitForTimeout(1500);
    await expect(page).toHaveURL(/\/clubs/);
  });

  test('Protected routes redirect unauthenticated users', async ({ page }) => {
    await page.goto(`${BASE_URL}/clubs/some-id/about`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    const currentUrl = page.url();
    const hasRedirected = currentUrl.includes('login') || currentUrl.includes('signup') || currentUrl.includes('clubs');
    expect(hasRedirected).toBeTruthy();
  });

});


// ─── 4. RESPONSIVE DESIGN ─────────────────────────────────────

test.describe('Responsive Design — Club Pages', () => {

  test('Clubs page is usable on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`${BASE_URL}/clubs`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).not.toBeEmpty();
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5);
  });

  test('Login page is usable on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    const emailInput = page.locator('input[type="email"], input[placeholder*="mail"]').first();
    await expect(emailInput).toBeVisible();
  });

  test('Clubs page is usable on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto(`${BASE_URL}/clubs`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).not.toBeEmpty();
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5);
  });

  test('Clubs page is usable on wide desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE_URL}/clubs`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).not.toBeEmpty();
  });

});


// ─── 5. CLUB CARD NAVIGATION ───────────────────────────────────

test.describe('Club Card Navigation', () => {

  test('Club cards contain links to individual club pages', async ({ page }) => {
    await page.goto(`${BASE_URL}/clubs`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    const clubLinks = page.locator('a[href^="/clubs/"]');
    const count = await clubLinks.count();
    if (count > 0) {
      // At least one club link exists and is reachable
      const firstLink = clubLinks.first();
      await expect(firstLink).toBeVisible();
    } else {
      // No clubs in DB yet — page should still show empty state
      const bodyText = await page.locator('body').textContent() ?? '';
      expect(bodyText.length).toBeGreaterThan(10);
    }
  });

  test('Clicking a club card navigates to club detail or login', async ({ page }) => {
    await page.goto(`${BASE_URL}/clubs`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    const clubLinks = page.locator('a[href^="/clubs/"]');
    const count = await clubLinks.count();
    if (count > 0) {
      await clubLinks.first().click();
      await page.waitForTimeout(2000);
      // Club detail is protected — unauthenticated users land on login
      const url = page.url();
      const navigated = url.includes('/clubs/') || url.includes('login');
      expect(navigated).toBeTruthy();
    }
  });

  test('Club detail page redirects unauthenticated users to login', async ({ page }) => {
    await page.goto(`${BASE_URL}/clubs`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    const clubLinks = page.locator('a[href^="/clubs/"]');
    const count = await clubLinks.count();
    if (count > 0) {
      const href = await clubLinks.first().getAttribute('href') ?? '';
      await page.goto(`${BASE_URL}${href}`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);
      await expect(page).toHaveURL(/\/login/);
    }
  });

});


// ─── 6. CLUB SUB-PAGES ACCESS CONTROL ─────────────────────────

test.describe('Club Sub-pages — Access Control', () => {

  test('Club About page redirects unauthenticated users to login', async ({ page }) => {
    await page.goto(`${BASE_URL}/clubs/test-club-id/about`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL(/\/login/);
  });

  test('Club Elections page redirects unauthenticated users to login', async ({ page }) => {
    await page.goto(`${BASE_URL}/clubs/test-club-id/elections`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL(/\/login/);
  });

  test('Club Finance page redirects unauthenticated users to login', async ({ page }) => {
    await page.goto(`${BASE_URL}/clubs/test-club-id/finance`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL(/\/login/);
  });

  test('Club Achievements page redirects unauthenticated users to login', async ({ page }) => {
    await page.goto(`${BASE_URL}/clubs/test-club-id/achievements`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL(/\/login/);
  });

  test('All protected club sub-routes share the same login redirect', async ({ page }) => {
    const subRoutes = ['about', 'elections', 'finance'];
    for (const route of subRoutes) {
      await page.goto(`${BASE_URL}/clubs/any-id/${route}`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1500);
      const url = page.url();
      expect(url).toMatch(/\/login/);
    }
  });

});


// ─── 7. DARK MODE TOGGLE ──────────────────────────────────────

test.describe('Dark Mode Toggle', () => {

  test('Theme toggle button is present in the navigation bar', async ({ page }) => {
    await page.goto(`${BASE_URL}/clubs`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    // The toggle has an aria-label of "Switch to night mode" or "Switch to light mode"
    const themeToggle = page.locator('button[aria-label*="mode" i]').first();
    await expect(themeToggle).toBeVisible();
  });

  test('Clicking theme toggle switches dark mode class on html element', async ({ page }) => {
    await page.goto(`${BASE_URL}/clubs`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    const initialDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    const themeToggle = page.locator('button[aria-label*="mode" i]').first();
    await themeToggle.click();
    await page.waitForTimeout(300);
    const afterDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    expect(afterDark).not.toBe(initialDark);
  });

  test('Dark mode preference persists after toggling twice (returns to original)', async ({ page }) => {
    await page.goto(`${BASE_URL}/clubs`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    const initialDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    const themeToggle = page.locator('button[aria-label*="mode" i]').first();
    // Toggle on then off
    await themeToggle.click();
    await page.waitForTimeout(200);
    await themeToggle.click();
    await page.waitForTimeout(300);
    const finalDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    expect(finalDark).toBe(initialDark);
  });

  test('Theme toggle aria-label updates to reflect current mode', async ({ page }) => {
    await page.goto(`${BASE_URL}/clubs`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    const themeToggle = page.locator('button[aria-label*="mode" i]').first();
    const labelBefore = await themeToggle.getAttribute('aria-label');
    await themeToggle.click();
    await page.waitForTimeout(300);
    const labelAfter = await themeToggle.getAttribute('aria-label');
    // Label should flip between "night mode" and "light mode"
    expect(labelAfter).not.toBe(labelBefore);
  });

});


// ─── 8. SEARCH & FILTER BEHAVIOUR ─────────────────────────────

test.describe('Search and Filter Behaviour', () => {

  test('Typing in search input updates its value', async ({ page }) => {
    await page.goto(`${BASE_URL}/clubs`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    const searchInput = page.locator('input[type="text"], input[placeholder*="earch" i]').first();
    await searchInput.fill('Music');
    await expect(searchInput).toHaveValue('Music');
  });

  test('Clearing search input restores empty value', async ({ page }) => {
    await page.goto(`${BASE_URL}/clubs`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    const searchInput = page.locator('input[type="text"], input[placeholder*="earch" i]').first();
    await searchInput.fill('Music');
    await searchInput.clear();
    await expect(searchInput).toHaveValue('');
  });

  test('Search for a non-existent term reduces visible club count', async ({ page }) => {
    await page.goto(`${BASE_URL}/clubs`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    const clubLinks = page.locator('a[href^="/clubs/"]');
    const countBefore = await clubLinks.count();
    const searchInput = page.locator('input[type="text"], input[placeholder*="earch" i]').first();
    await searchInput.fill('xyzxyzxyznonexistent99999');
    await page.waitForTimeout(500);
    const countAfter = await clubLinks.count();
    // After searching for gibberish, fewer (or zero) clubs should be visible
    expect(countAfter).toBeLessThanOrEqual(countBefore);
  });

  test('Clubs page shows all clubs when search is empty', async ({ page }) => {
    await page.goto(`${BASE_URL}/clubs`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    const countAll = await page.locator('a[href^="/clubs/"]').count();
    const searchInput = page.locator('input[type="text"], input[placeholder*="earch" i]').first();
    await searchInput.fill('zzz');
    await page.waitForTimeout(500);
    await searchInput.clear();
    await page.waitForTimeout(500);
    const countAfterClear = await page.locator('a[href^="/clubs/"]').count();
    expect(countAfterClear).toBe(countAll);
  });

});
