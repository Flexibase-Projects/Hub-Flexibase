import { expect, test } from "@playwright/test";

test("renderiza a tela de login", async ({ page }) => {
  await page.goto("/login");

  await expect(page.getByText(/Conectar conta|Configuracao pendente/)).toBeVisible();
});

test("renderiza a tela de recuperacao via suporte", async ({ page }) => {
  await page.goto("/forgot-password");

  await expect(page.getByText("Recuperacao via suporte")).toBeVisible();
});
