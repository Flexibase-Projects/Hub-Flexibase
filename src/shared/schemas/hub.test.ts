import { describe, expect, it } from "vitest";

import { DEFAULT_SYSTEM_ICON_KEY } from "@/shared/lib/hub/system-icons";
import { systemLinkSchema } from "@/shared/schemas/hub";

describe("systemLinkSchema", () => {
  const baseSystem = {
    id: "123e4567-e89b-12d3-a456-426614174000",
    title: "Central de Chamados",
    description: "Acesso rapido ao suporte interno.",
    targetUrl: "https://example.internal/helpdesk",
  };

  it("aceita iconKey valido", () => {
    const result = systemLinkSchema.safeParse({
      ...baseSystem,
      iconKey: DEFAULT_SYSTEM_ICON_KEY,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.iconKey).toBe(DEFAULT_SYSTEM_ICON_KEY);
    }
  });

  it("rejeita iconKey fora do catalogo", () => {
    const result = systemLinkSchema.safeParse({
      ...baseSystem,
      iconKey: "InvalidIcon",
    });

    expect(result.success).toBe(false);
  });
});
