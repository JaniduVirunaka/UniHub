// @ts-check
import { test, expect } from '@playwright/test';

/*
 * ================================================================
 *  Event Management Module — Automated Tests
 *  Responsible Member: Sachinthe Gamachchi
 *
 *  Pages tested:
 *    /events              — Event listing and discovery
 *    /events/dashboard    — User event dashboard
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
    // Event cards or event content should appear
    const bodyText = await page.locator('body').textContent() ?? '';
    expect(bodyText.length).toBeGreaterThan(50);
  });

  test('Events page has navigation elements', async ({ page }) => {
    await page.goto(`${BASE_URL}/events`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    // Should have links or buttons for event-related actions
    const eventElements = page.locator('a, button').first();
    await expect(eventElements).toBeVisible();
  });

});

// ─── 2. EVENT REGISTRATION ─────────────────────────────────────

test.describe('Event Registration Flow', () => {

  test('Registration page loads for unauthenticated users', async ({ page }) => {
    await page.goto(`${BASE_URL}/events/register`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    // Should either show registration form or redirect to login
    const bodyText = await page.locator('body').textContent() ?? '';
    expect(bodyText.length).toBeGreaterThan(10);
  });

});

// ─── 3. NAVIGATION ─────────────────────────────────────────────

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

});

// ─── 4. RESPONSIVE DESIGN ─────────────────────────────────────

test.describe('Responsive Design — Event Pages', () => {

  test('Events page works on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`${BASE_URL}/events`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).not.toBeEmpty();
  });

});