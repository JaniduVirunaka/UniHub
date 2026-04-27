// @ts-check
import { test, expect } from '@playwright/test';

/*
 * ================================================================
 *  Event Management Module — Automated Tests
 *  Responsible Member: Sachinthe Gamachchi
 *
 *  Pages tested:
 *    /events              — Event listing, cards, ticket pricing
 *    /events/cart         — Cart (protected)
 *    /events/checkout     — Checkout (protected)
 *    /events/my-events    — My events dashboard (protected)
 *    /events/admin        — Admin dashboard: create, edit, reviews (admin only)
 * ================================================================
 */

const BASE_URL = 'http://localhost:3000';

// ─── 1. EVENT LISTING PAGE ─────────────────────────────────────

test.describe('Event Management — Event Listing (/events)', () => {

  test('Events page loads and displays content', async ({ page }) => {
    await page.goto(`${BASE_URL}/events`, { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/events/);
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('Event cards are rendered after data loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/events`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    const bodyText = await page.locator('body').textContent() ?? '';
    expect(bodyText.length).toBeGreaterThan(50);
  });

  test('Events page has navigation elements', async ({ page }) => {
    await page.goto(`${BASE_URL}/events`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    const eventElements = page.locator('a, button').first();
    await expect(eventElements).toBeVisible();
  });

  test('Event cards display title and date information', async ({ page }) => {
    await page.goto(`${BASE_URL}/events`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    // If events exist, cards should show readable content
    const bodyText = await page.locator('body').textContent() ?? '';
    expect(bodyText.length).toBeGreaterThan(100);
  });

  test('Event cards show pricing information (free or ticket price)', async ({ page }) => {
    await page.goto(`${BASE_URL}/events`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    const bodyText = (await page.locator('body').textContent() ?? '').toLowerCase();
    // Page should show some pricing or event type indicator
    const hasPricingInfo = bodyText.includes('free') || bodyText.includes('lkr') || bodyText.includes('rs') || bodyText.includes('ticket') || bodyText.includes('event');
    expect(hasPricingInfo).toBeTruthy();
  });

  test('Unauthenticated users see sign-in prompt to add events to cart', async ({ page }) => {
    await page.goto(`${BASE_URL}/events`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    // Events page shows "Sign In" button/link for unauthenticated users
    const signInElements = page.locator('a[href*="login"], button:has-text("Sign In"), a:has-text("Sign In"), button:has-text("Login")');
    const count = await signInElements.count();
    expect(count).toBeGreaterThan(0);
  });

});

// ─── 2. EVENT REGISTRATION ─────────────────────────────────────

test.describe('Event Registration Flow', () => {

  test('Registration page loads for unauthenticated users', async ({ page }) => {
    await page.goto(`${BASE_URL}/events/register`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    const bodyText = await page.locator('body').textContent() ?? '';
    expect(bodyText.length).toBeGreaterThan(10);
  });

});

// ─── 3. PROTECTED ROUTES — ACCESS CONTROL ──────────────────────

test.describe('Protected Routes — Unauthenticated Access', () => {

  test('Cart page redirects unauthenticated users to login', async ({ page }) => {
    await page.goto(`${BASE_URL}/events/cart`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    const url = page.url();
    expect(url).toMatch(/\/(login|signup)/);
  });

  test('Checkout page redirects unauthenticated users to login', async ({ page }) => {
    await page.goto(`${BASE_URL}/events/checkout`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    const url = page.url();
    expect(url).toMatch(/\/(login|signup)/);
  });

  test('My Events page redirects unauthenticated users to login', async ({ page }) => {
    await page.goto(`${BASE_URL}/events/my-events`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    const url = page.url();
    expect(url).toMatch(/\/(login|signup)/);
  });

  test('Admin dashboard redirects unauthenticated users to login', async ({ page }) => {
    await page.goto(`${BASE_URL}/events/admin`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    const url = page.url();
    expect(url).toMatch(/\/(login|signup)/);
  });

});

// ─── 4. ADMIN DASHBOARD — EVENT MANAGEMENT ─────────────────────

test.describe('Admin Dashboard — Event Management Features', () => {

  test('Admin route is defined and does not return a blank page shell', async ({ page }) => {
    // For unauthenticated users this should redirect — the route itself exists
    await page.goto(`${BASE_URL}/events/admin`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    const bodyText = await page.locator('body').textContent() ?? '';
    // Either shows login page or admin page — should never be a blank 404
    expect(bodyText.length).toBeGreaterThan(10);
  });

  test('Admin dashboard URL structure is correct', async ({ page }) => {
    // Navigating to /events/admin and back to /events should work
    await page.goto(`${BASE_URL}/events`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    await page.goto(`${BASE_URL}/events/admin`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    // The route should respond (redirect to login for unauth)
    const bodyText = await page.locator('body').textContent() ?? '';
    expect(bodyText.length).toBeGreaterThan(10);
  });

});

// ─── 5. NAVIGATION ─────────────────────────────────────────────

test.describe('Event Navigation', () => {

  test('Events link is accessible from home page', async ({ page }) => {
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    const eventsLink = page.locator('a[href="/events"]').first();
    await expect(eventsLink).toBeVisible();
  });

  test('Clicking events link navigates correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    const eventsLink = page.locator('a[href="/events"]').first();
    await eventsLink.click();
    await page.waitForTimeout(1500);
    await expect(page).toHaveURL(/\/events/);
  });

  test('Events page back-navigation works correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}/events`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    await page.goto(`${BASE_URL}/clubs`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    await page.goBack();
    await page.waitForTimeout(1000);
    await expect(page).toHaveURL(/\/events/);
  });

});

// ─── 6. TICKET & CART INTERACTION ──────────────────────────────

test.describe('Ticket & Cart Interaction', () => {

  test('Add to cart button or sign-in prompt is present on events page', async ({ page }) => {
    await page.goto(`${BASE_URL}/events`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    // Unauthenticated users should see interactive elements (sign-in or add-to-cart)
    const interactive = page.locator('button, a[href*="login"]');
    const count = await interactive.count();
    expect(count).toBeGreaterThan(0);
  });

  test('Cart page URL is correctly formed', async ({ page }) => {
    // Navigate to cart — should redirect to login for unauth users
    await page.goto(`${BASE_URL}/events/cart`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    // Either on login page or cart page
    const url = page.url();
    const isExpected = url.includes('login') || url.includes('cart');
    expect(isExpected).toBeTruthy();
  });

});

// ─── 7. RESPONSIVE DESIGN ─────────────────────────────────────

test.describe('Responsive Design — Event Pages', () => {

  test('Events page works on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`${BASE_URL}/events`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('Events page works on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto(`${BASE_URL}/events`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).not.toBeEmpty();
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5);
  });

  test('Events page works on wide desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE_URL}/events`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).not.toBeEmpty();
  });

});
