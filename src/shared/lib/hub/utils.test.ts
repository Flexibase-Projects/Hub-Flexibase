import {
  buildSoftDeleteWindow,
  filterVisibleDocuments,
  groupSystemsByDepartment,
  slugify,
} from "@/shared/lib/hub/utils";
import type { HubDepartment, HubDocument, HubSystemLink } from "@/shared/types/hub";

describe("hub utils", () => {
  it("slugify normaliza nomes com acentos", () => {
    expect(slugify("Tecnologia da Informação")).toBe("tecnologia-da-informacao");
  });

  it("buildSoftDeleteWindow gera um intervalo futuro", () => {
    const result = buildSoftDeleteWindow(90);

    expect(new Date(result.purgeAfterAt).getTime()).toBeGreaterThan(
      new Date(result.deletedAt).getTime()
    );
  });

  it("groupSystemsByDepartment organiza os cards por departamento", () => {
    const departments: HubDepartment[] = [
      {
        id: "dep-1",
        name: "TI",
        slug: "ti",
        description: null,
        sortOrder: 0,
        isActive: true,
      },
    ];
    const systems: HubSystemLink[] = [
      {
        id: "sys-1",
        title: "Helpdesk",
        description: "Chamados",
        targetUrl: "https://example.internal",
        imageUrl: null,
        accentColor: null,
        sortOrder: 0,
        isActive: true,
      },
    ];

    const grouped = groupSystemsByDepartment(departments, systems, [
      {
        systemLinkId: "sys-1",
        departmentId: "dep-1",
        isPrimary: true,
        sortOrder: 0,
      },
    ]);

    expect(grouped).toHaveLength(1);
    expect(grouped[0]?.items[0]?.title).toBe("Helpdesk");
  });

  it("filterVisibleDocuments respeita restrição por departamento", () => {
    const documents: HubDocument[] = [
      {
        id: "doc-1",
        title: "Manual TI",
        description: null,
        category: "Manual",
        fileName: "manual-ti.pdf",
        mimeType: "application/pdf",
        storageBucket: "hub-documents",
        storagePath: "doc-1/manual-ti.pdf",
        fileSize: 1024,
        isRestricted: true,
        sortOrder: 0,
        isActive: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: "doc-2",
        title: "Política geral",
        description: null,
        category: "Política",
        fileName: "politica.pdf",
        mimeType: "application/pdf",
        storageBucket: "hub-documents",
        storagePath: "doc-2/politica.pdf",
        fileSize: 2048,
        isRestricted: false,
        sortOrder: 1,
        isActive: true,
        createdAt: new Date().toISOString(),
      },
    ];

    const visible = filterVisibleDocuments(
      documents,
      [{ documentId: "doc-1", departmentId: "dep-ti" }],
      ["dep-ti"],
      false
    );

    expect(visible).toHaveLength(2);
  });
});
