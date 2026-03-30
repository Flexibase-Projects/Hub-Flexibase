import { buildFeedbackUrl } from "@/shared/lib/feedback";

describe("feedback helpers", () => {
  it("monta a URL com mensagem codificada", () => {
    const url = buildFeedbackUrl("/admin", "success", "Tudo certo");

    expect(url).toContain("/admin?");
    expect(url).toContain("kind=success");
    expect(url).toContain("message=Tudo+certo");
  });
});
