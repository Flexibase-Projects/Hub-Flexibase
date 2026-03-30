import { expect, test } from "@playwright/test";

test("renderiza a tela de login", async ({ page }) => {
  await page.goto("/login");

  await expect(
    page.getByText(/Entrar no HUB|Configuração pendente/)
  ).toBeVisible();
});

test("renderiza a tela de recuperação via suporte", async ({ page }) => {
  await page.goto("/forgot-password");

  await expect(page.getByText("Recuperação via suporte")).toBeVisible();
});
