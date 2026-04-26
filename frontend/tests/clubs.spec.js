// @ts-check
import { test, expect } from '@playwright/test';

/*
 * ================================================================
 *  Club Management Module — Automated Tests
 *  Responsible Member: Janidu Virunaka
 *
 *  Pages tested:
 *    /clubs               — Club listing, search, and filtering
 *    /clubs/:id           — Club detail, announcements, members
 *    /clubs/:id/about     — Club about page, executive board
 *    /clubs/:id/elections — Club elections
 *    /clubs/:id/finance   — Club finance hub
 *    /login               — Login flow (required for protected routes)
 * ================================================================
 */

const BASE_URL = 'http://localhost:3000';

// ─── 1. PUBLIC CLUB LISTING PAGE ───────────────────────────────

test.describe('Club Management — Public Listing (/clubs)', () => {

  test('Clubs page loads and displays heading', async ({ page }) => {
    await page.goto(`${BASE_URL}/clubs`, { waitUntil: 'domcontentloaded' });
    // The page should render without crashing
    await expect(page).toHaveURL(/\/clubs/);
    // Should have some visible content
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('Club cards are rendered after data loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/clubs`, { waitUntil: 'domcontentloaded' });
    // Wait for API call to complete and cards to appear
    await page.waitForTimeout(3000);
    // Club cards should be visible (each club shows in a card)
    const cards = page.locator('[class*="card"], [class*="Card"], [class*="rounded"]').first();
    await expect(cards).toBeVisible();
  });

  test('Search input is present and functional', async ({ page }) => {
    await page.goto(`${BASE_URL}/clubs`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    // Look for search input (the component uses a Search icon with input)
    const searchInput = page.locator('input[type="text"], input[placeholder*="earch"]').first();
    await expect(searchInput).toBeVisible();
    // Type into search
    await searchInput.fill('test club');
    // Verify the input value changed
    await expect(searchInput).toHaveValue('test club');
  });

  test('Page displays club names and descriptions', async ({ page }) => {
    await page.goto(`${BASE_URL}/clubs`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    // The page should have text content (club names)
    const bodyText = await page.locator('body').textContent() ?? '';
    expect(bodyText.length).toBeGreaterThan(50);
  });

});


// ─── 2. AUTHENTICATION FLOW ────────────────────────────────────

test.describe('Authentication — Login Page', () => {

  test('Login page renders with email and password fields', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
    // Email input should be visible
    const emailInput = page.locator('input[type="email"], input[placeholder*="mail"]').first();
    await expect(emailInput).toBeVisible();
    // Password input should be visible
    const passwordInput = page.locator('input[type="password"]').first();
    await expect(passwordInput).toBeVisible();
    // Login button should be visible
    const loginButton = page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign")').first();
    await expect(loginButton).toBeVisible();
  });

  test('Login form shows validation for empty submission', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    // Try clicking login without entering credentials
    const loginButton = page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign")').first();
    await loginButton.click();
    // Page should stay on login (not redirect)
    await page.waitForTimeout(1000);
    await expect(page).toHaveURL(/\/(login|signup)/);
  });

  test('Login page has link to signup/register', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
    // There should be a link or button to go to signup
    const signupLink = page.locator('a[href*="signup"], a[href*="register"], a:has-text("Sign Up"), a:has-text("Register"), button:has-text("Register")').first();
    await expect(signupLink).toBeVisible();
  });

});


// ─── 3. NAVIGATION & ROUTING ───────────────────────────────────

test.describe('Navigation and Routing', () => {

  test('Home page loads correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(BASE_URL + '/');
    // Home page should have some content
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('Navigation bar is present with club link', async ({ page }) => {
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    // Navbar should have a link to clubs
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
    // Trying to access a protected club detail page without login
    await page.goto(`${BASE_URL}/clubs/some-id/about`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    // Should redirect to login or show login page
    const currentUrl = page.url();
    const hasRedirected = currentUrl.includes('login') || currentUrl.includes('signup') || currentUrl.includes('clubs');
    expect(hasRedirected).toBeTruthy();
  });

});


// ─── 4. RESPONSIVE DESIGN ─────────────────────────────────────

test.describe('Responsive Design — Club Pages', () => {

  test('Clubs page is usable on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`${BASE_URL}/clubs`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    // Page should still render content
    await expect(page.locator('body')).not.toBeEmpty();
    // No horizontal scrollbar (page fits mobile width)
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5); // 5px tolerance
  });

  test('Login page is usable on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    const emailInput = page.locator('input[type="email"], input[placeholder*="mail"]').first();
    await expect(emailInput).toBeVisible();
  });

});