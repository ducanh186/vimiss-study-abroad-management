/**
 * fe-neu/tests/e2e/auth-rbac.spec.ts
 *
 * Phase 0 E2E tests — Auth + RBAC sidebar menu
 *
 * Prerequisites (both running before executing):
 *   php artisan serve --host=127.0.0.1 --port=8000
 *   npm run dev -- --port 3000  (Vite proxy → Laravel)
 *
 * Run: npx playwright test
 *
 * Selectors derived from actual component code (LoginPage.tsx / MainLayout.tsx):
 *   - Email input          : #email
 *   - Password input       : #password-input
 *   - Submit button        : text "Đăng nhập"
 *   - Logout trigger       : user-menu button (user initial avatar) → "Đăng xuất"
 *   - Router type          : HashRouter → URLs use /#/...
 */

import { test, expect, Page } from '@playwright/test';

const PASSWORD = 'password';

// ── Helper: login ─────────────────────────────────────────────────────────────
async function loginAs(page: Page, email: string) {
  await page.goto('/#/login');
  // wait for the login form to be ready
  await page.waitForSelector('#email');
  await page.fill('#email', email);
  await page.fill('#password-input', PASSWORD);
  await page.getByRole('button', { name: 'Đăng nhập' }).click();
  // Wait until we land in the app shell (URL changes from /login to /app/*)
  await expect(page).toHaveURL(/#\/app\//i, { timeout: 15_000 });
}

// ── Helper: logout ────────────────────────────────────────────────────────────
async function logout(page: Page) {
  // The user avatar button opens a dropdown that contains "Đăng xuất"
  // The avatar is a div with the user's first initial; we click the button in UserMenu
  const userMenuBtn = page.locator('button').filter({
    has: page.locator('div.rounded-full'),
  }).first();
  await userMenuBtn.click();
  await page.getByText('Đăng xuất').click();
  await expect(page).toHaveURL(/#\/login/i, { timeout: 10_000 });
}

// ── Helper: sidebar visibility ────────────────────────────────────────────────
async function expectSidebarItem(page: Page, label: string, visible: boolean) {
  const el = page.locator('aside').filter({ hasText: label }).getByText(label, { exact: true });
  if (visible) {
    await expect(el.first()).toBeVisible({ timeout: 5_000 });
  } else {
    await expect(el.first()).toHaveCount(0, { timeout: 5_000 });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST 1: Unauthenticated access to app route redirects to /login
// ─────────────────────────────────────────────────────────────────────────────
test('unauth: navigating to /#/app/dashboard redirects to /#/login', async ({ page }) => {
  await page.goto('/#/app/dashboard');
  await expect(page).toHaveURL(/#\/login/i, { timeout: 10_000 });
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST 2: Admin login + RBAC menu + logout
// ─────────────────────────────────────────────────────────────────────────────
test('admin: login → correct RBAC menu → logout', async ({ page }) => {
  await loginAs(page, 'admin@vimiss.vn');

  // admin-only item visible
  await expectSidebarItem(page, 'Báo cáo', true);
  // admin also sees Sinh viên
  await expectSidebarItem(page, 'Sinh viên', true);

  // student-only items must NOT appear
  await expectSidebarItem(page, 'Câu hỏi của tôi', false);
  await expectSidebarItem(page, 'Lịch hẹn của tôi', false);

  // mentor-only items must NOT appear
  await expectSidebarItem(page, 'Câu hỏi sinh viên', false);
  await expectSidebarItem(page, 'Quản lý lịch hẹn', false);

  // smoke nav
  await page.goto('/#/app/cases');
  await expect(page).toHaveURL(/#\/app\/cases/i);

  await logout(page);
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST 3: Director login + RBAC menu + logout
// ─────────────────────────────────────────────────────────────────────────────
test('director: login → correct RBAC menu → logout', async ({ page }) => {
  await loginAs(page, 'director@vimiss.vn');

  // director also sees Báo cáo (isAdmin || isDirector)
  await expectSidebarItem(page, 'Báo cáo', true);
  // director sees Sinh viên
  await expectSidebarItem(page, 'Sinh viên', true);

  // student/mentor-only items absent
  await expectSidebarItem(page, 'Câu hỏi của tôi', false);
  await expectSidebarItem(page, 'Lịch hẹn của tôi', false);
  await expectSidebarItem(page, 'Câu hỏi sinh viên', false);
  await expectSidebarItem(page, 'Quản lý lịch hẹn', false);

  await logout(page);
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST 4: Mentor login + RBAC menu + logout
// ─────────────────────────────────────────────────────────────────────────────
test('mentor1: login → correct RBAC menu → logout', async ({ page }) => {
  await loginAs(page, 'mentor1@vimiss.vn');

  // mentor sees their items
  await expectSidebarItem(page, 'Câu hỏi sinh viên', true);
  await expectSidebarItem(page, 'Quản lý lịch hẹn', true);
  await expectSidebarItem(page, 'Sinh viên', true);   // mentor can see students

  // Báo cáo must NOT be visible
  await expectSidebarItem(page, 'Báo cáo', false);

  // student-only hidden
  await expectSidebarItem(page, 'Câu hỏi của tôi', false);
  await expectSidebarItem(page, 'Lịch hẹn của tôi', false);

  await logout(page);
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST 5: Student login + RBAC menu + logout
// ─────────────────────────────────────────────────────────────────────────────
test('student1: login → correct RBAC menu → logout', async ({ page }) => {
  await loginAs(page, 'student1@vimiss.vn');

  // student sees their items
  await expectSidebarItem(page, 'Câu hỏi của tôi', true);
  await expectSidebarItem(page, 'Lịch hẹn của tôi', true);

  // must NOT see admin/director only
  await expectSidebarItem(page, 'Báo cáo', false);
  // must NOT see Sinh viên (admin/director/mentor only)
  await expectSidebarItem(page, 'Sinh viên', false);

  // mentor items hidden
  await expectSidebarItem(page, 'Câu hỏi sinh viên', false);
  await expectSidebarItem(page, 'Quản lý lịch hẹn', false);

  await logout(page);
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST 6: After logout /api/me returns 401 (API regression, via fetch inside page)
// ─────────────────────────────────────────────────────────────────────────────
test('session is destroyed after logout (api/me → 401)', async ({ page }) => {
  await loginAs(page, 'student2@vimiss.vn');
  await logout(page);

  // Call /api/me directly from browser context to verify session is cleared
  const status = await page.evaluate(async () => {
    const res = await fetch('/api/me', {
      headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
      credentials: 'include',
    });
    return res.status;
  });

  expect(status).toBe(401);
});
