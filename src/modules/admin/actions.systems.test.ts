import { describe, expect, it, vi, beforeEach } from "vitest";

import { DEFAULT_SYSTEM_ICON_KEY } from "@/shared/lib/hub/system-icons";

class RedirectError extends Error {
  constructor(url: string) {
    super(url);
    this.name = "RedirectError";
  }
}

const mocks = vi.hoisted(() => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  redirect: vi.fn((url: string) => {
    throw new RedirectError(String(url));
  }),
  requireAdminViewer: vi.fn(async () => undefined),
  createServerSupabaseClient: vi.fn(),
  createAdminSupabaseClient: vi.fn(() => null),
  getSupabaseEnv: vi.fn(() => ({ schema: "hub_flexibase" })),
}));

vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath,
  revalidateTag: mocks.revalidateTag,
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

vi.mock("@/modules/auth/server", () => ({
  requireAdminViewer: mocks.requireAdminViewer,
}));

vi.mock("@/shared/lib/supabase/server", () => ({
  createServerSupabaseClient: mocks.createServerSupabaseClient,
}));

vi.mock("@/shared/lib/supabase/admin", () => ({
  createAdminSupabaseClient: mocks.createAdminSupabaseClient,
}));

vi.mock("@/shared/lib/supabase/env", () => ({
  getSupabaseEnv: mocks.getSupabaseEnv,
}));

const { deleteSystemAction, restoreSystemAction, upsertSystemAction } = await import(
  "@/modules/admin/actions"
);

function createHubMock(selectedTitle = "Central de Chamados") {
  const upserts: Array<{ table: string; payload: Record<string, unknown>; options?: unknown }> = [];
  const updates: Array<{ table: string; payload: Record<string, unknown> }> = [];
  const selectCalls: Array<{ table: string; columns: string }> = [];

  const hub = {
    from(table: string) {
      if (table === "hub_system_links") {
        return {
          upsert: vi.fn(async (payload: Record<string, unknown>, options?: unknown) => {
            upserts.push({ table, payload, options });
            return { error: null };
          }),
          select: vi.fn((columns: string) => {
            selectCalls.push({ table, columns });
            return {
              eq: vi.fn(() => ({
                maybeSingle: vi.fn(async () => ({
                  data: { title: selectedTitle },
                  error: null,
                })),
              })),
            };
          }),
          update: vi.fn((payload: Record<string, unknown>) => ({
            eq: vi.fn(async () => {
              updates.push({ table, payload });
              return { error: null };
            }),
          })),
        };
      }

      if (table === "hub_system_link_departments") {
        return {
          update: vi.fn((payload: Record<string, unknown>) => ({
            eq: vi.fn(() => ({
              is: vi.fn(async () => {
                updates.push({ table, payload });
                return { error: null };
              }),
            })),
          })),
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    },
  };

  return { hub, upserts, updates, selectCalls };
}

function buildFormData(entries: Record<string, string>) {
  const formData = new FormData();

  Object.entries(entries).forEach(([key, value]) => {
    formData.set(key, value);
  });

  return formData;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("system actions", () => {
  it("upsertSystemAction persiste iconKey e soft delete limpo", async () => {
    const { hub, upserts, updates } = createHubMock();
    mocks.createServerSupabaseClient.mockResolvedValue({
      schema: () => hub,
    });

    await expect(
      upsertSystemAction(
        buildFormData({
          id: "123e4567-e89b-12d3-a456-426614174000",
          pathname: "/admin/systems",
          title: "Central de Chamados",
          description: "Acesso rapido ao suporte interno.",
          targetUrl: "https://example.internal/helpdesk",
          iconKey: "SupportAgentRounded",
        })
      )
    ).rejects.toMatchObject({
      name: "RedirectError",
      message: "/admin/systems?kind=success&message=Sistema+salvo+com+sucesso.",
    });

    expect(upserts).toHaveLength(1);
    expect(upserts[0]?.table).toBe("hub_system_links");
    expect(upserts[0]?.payload).toMatchObject({
      id: "123e4567-e89b-12d3-a456-426614174000",
      title: "Central de Chamados",
      description: "Acesso rapido ao suporte interno.",
      target_url: "https://example.internal/helpdesk",
      icon_key: "SupportAgentRounded",
      image_url: null,
      accent_color: null,
      sort_order: 0,
      is_active: true,
      deleted_at: null,
      purge_after_at: null,
    });
    expect(updates).toHaveLength(1);
    expect(updates[0]?.table).toBe("hub_system_link_departments");
    expect(updates[0]?.payload).toMatchObject({
      deleted_at: expect.any(String),
      purge_after_at: expect.any(String),
    });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin/systems");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/hub");
    expect(mocks.revalidateTag).toHaveBeenCalledWith("hub-content", "max");
  });

  it("upsertSystemAction usa o icone padrao quando o campo nao vem no form", async () => {
    const { hub, upserts } = createHubMock();
    mocks.createServerSupabaseClient.mockResolvedValue({
      schema: () => hub,
    });

    await expect(
      upsertSystemAction(
        buildFormData({
          id: "123e4567-e89b-12d3-a456-426614174000",
          pathname: "/admin/systems",
          title: "Portal Interno",
          description: "Atalho oficial do HUB.",
          targetUrl: "https://example.internal/portal",
        })
      )
    ).rejects.toMatchObject({
      name: "RedirectError",
      message: "/admin/systems?kind=success&message=Sistema+salvo+com+sucesso.",
    });

    expect(upserts[0]?.payload).toMatchObject({
      icon_key: DEFAULT_SYSTEM_ICON_KEY,
    });
  });

  it("deleteSystemAction exige confirmacao exata", async () => {
    const { hub, updates } = createHubMock("Central de Chamados");
    mocks.createServerSupabaseClient.mockResolvedValue({
      schema: () => hub,
    });

    await expect(
      deleteSystemAction(
        buildFormData({
          id: "123e4567-e89b-12d3-a456-426614174000",
          pathname: "/admin/systems",
          confirmationText: "Central de Chamados errada",
        })
      )
    ).rejects.toMatchObject({
      name: "RedirectError",
      message: "/admin/systems?kind=error&message=Digite+o+nome+do+sistema+exatamente+para+confirmar.",
    });

    expect(updates).toHaveLength(0);
  });

  it("deleteSystemAction faz soft delete ao confirmar o nome", async () => {
    const { hub, updates } = createHubMock("Central de Chamados");
    mocks.createServerSupabaseClient.mockResolvedValue({
      schema: () => hub,
    });

    await expect(
      deleteSystemAction(
        buildFormData({
          id: "123e4567-e89b-12d3-a456-426614174000",
          pathname: "/admin/systems",
          confirmationText: "Central de Chamados",
        })
      )
    ).rejects.toMatchObject({
      name: "RedirectError",
      message: "/admin/systems?kind=success&message=Sistema+excluido+com+sucesso.",
    });

    expect(updates).toHaveLength(1);
    expect(updates[0]?.table).toBe("hub_system_links");
    expect(updates[0]?.payload).toMatchObject({
      is_active: false,
      deleted_at: expect.any(String),
      purge_after_at: expect.any(String),
    });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin/systems");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/hub");
    expect(mocks.revalidateTag).toHaveBeenCalledWith("hub-content", "max");
  });

  it("restoreSystemAction limpa soft delete e reativa o sistema", async () => {
    const { hub, updates } = createHubMock();
    mocks.createServerSupabaseClient.mockResolvedValue({
      schema: () => hub,
    });

    await expect(
      restoreSystemAction(
        buildFormData({
          id: "123e4567-e89b-12d3-a456-426614174000",
          pathname: "/admin/systems",
        })
      )
    ).rejects.toMatchObject({
      name: "RedirectError",
      message: "/admin/systems?kind=success&message=Sistema+reativado.",
    });

    expect(updates).toHaveLength(1);
    expect(updates[0]?.table).toBe("hub_system_links");
    expect(updates[0]?.payload).toMatchObject({
      is_active: true,
      deleted_at: null,
      purge_after_at: null,
    });
  });
});
