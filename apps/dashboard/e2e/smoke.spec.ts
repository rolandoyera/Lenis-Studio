import { expect, test } from "@playwright/test";

test("unauthenticated dashboard access is routed to login", async ({
  page,
}) => {
  await page.goto("/dashboard/home");

  await expect(page).toHaveURL(/\/auth\/login/);
});

test("login page renders", async ({ page }) => {
  await page.goto("/auth/login");

  await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
});
