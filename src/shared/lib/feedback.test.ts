import { buildFeedbackUrl } from "@/shared/lib/feedback";

describe("feedback helpers", () => {
  it("monta a URL com mensagem codificada", () => {
    const url = buildFeedbackUrl("/admin", "success", "Tudo certo");

    expect(url).toContain("/admin?");
    expect(url).toContain("kind=success");
    expect(url).toContain("message=Tudo+certo");
  });

  it("preserva a query existente ao adicionar feedback", () => {
    const url = buildFeedbackUrl("/admin/users?q=rocha", "error", "Falhou");

    expect(url).toContain("/admin/users?");
    expect(url).toContain("q=rocha");
    expect(url).toContain("kind=error");
    expect(url).toContain("message=Falhou");
    expect(url).not.toContain("?q=rocha?kind=");
  });
});
