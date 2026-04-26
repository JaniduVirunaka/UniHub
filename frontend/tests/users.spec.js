// @ts-check
import { test, expect } from '@playwright/test';

/*
 * ================================================================
 *  User Management & Event Discovery — Automated Tests
 *  Responsible Member: Sakurani Pathirana
 *
 *  Pages tested:
 *    /signup, /register   — User registration
 *    /login               — User login
 *    /profile             — User profile management
 *    /events              — Event discovery
 * ================================================================
 */

const BASE_URL = 'http://localhost:3000';

// ─── 1. USER REGISTRATION ──────────────────────────────────────

test.describe('User Management — Registration', () => {

  test('Signup page renders with all required fields', async ({ page }) => {
    await page.goto(`${BASE_URL}/signup`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    // Should have name, email, password fields
    const inputs = page.locator('input');
    const inputCount = await inputs.count();
    expect(inputCount).toBeGreaterThanOrEqual(2);
  });

  test('Signup page has a submit button', async ({ page }) => {
    await page.goto(`${BASE_URL}/signup`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    const submitBtn = page.locator('button[type="submit"], button:has-text("Sign"), button:has-text("Register"), button:has-text("Create")').first();
    await expect(submitBtn).toBeVisible();
  });

  test('Registration form validates empty fields', async ({ page }) => {
    await page.goto(`${BASE_URL}/signup`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    const submitBtn = page.locator('button[type="submit"], button:has-text("Sign"), button:has-text("Register"), button:has-text("Create")').first();
    await submitBtn.click();
    await page.waitForTimeout(1000);
    // Should stay on signup page (not redirect)
    await expect(page).toHaveURL(/\/(signup|register)/);
  });

  test('Registration page links to login', async ({ page }) => {
    await page.goto(`${BASE_URL}/signup`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    const loginLink = page.locator('a[href*="login"], a:has-text("Login"), a:has-text("Sign In"), button:has-text("Login")').first();
    await expect(loginLink).toBeVisible();
  });

});

// ─── 2. USER LOGIN ─────────────────────────────────────────────

test.describe('User Management — Login', () => {

  test('Login page renders correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
    const emailInput = page.locator('input[type="email"], input[placeholder*="mail"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
  });

  test('Invalid login shows error feedback', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    const emailInput = page.locator('input[type="email"], input[placeholder*="mail"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    await emailInput.fill('invalid@test.com');
    await passwordInput.fill('wrongpassword');
    const loginBtn = page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign")').first();
    await loginBtn.click();
    await page.waitForTimeout(2000);
    // Should stay on login page or show error
    await expect(page).toHaveURL(/\/(login|signup)/);
  });

});

// ─── 3. PROFILE PAGE (PROTECTED) ──────────────────────────────

test.describe('User Profile — Access Control', () => {

  test('Profile page redirects unauthenticated users', async ({ page }) => {
    await page.goto(`${BASE_URL}/profile`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    // Should redirect to login since profile is protected
    const currentUrl = page.url();
    const redirected = currentUrl.includes('login') || currentUrl.includes('signup') || currentUrl.includes('home');
    expect(redirected).toBeTruthy();
  });

});

// ─── 4. EVENT DISCOVERY ────────────────────────────────────────

test.describe('Event Discovery', () => {

  test('Events page is accessible to all users', async ({ page }) => {
    await page.goto(`${BASE_URL}/events`, { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/events/);
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('Events page displays event content', async ({ page }) => {
    await page.goto(`${BASE_URL}/events`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    const bodyText = await page.locator('body').textContent() ?? '';
    expect(bodyText.length).toBeGreaterThan(50);
  });

});