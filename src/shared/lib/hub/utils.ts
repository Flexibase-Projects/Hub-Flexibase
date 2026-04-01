import type {
  GroupedSystemLinks,
  HubDepartment,
  HubDocument,
  HubSystemLink,
} from "@/shared/types/hub";

export function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function buildSoftDeleteWindow(days = 90) {
  const deletedAt = new Date();
  const purgeAfterAt = new Date(
    deletedAt.getTime() + days * 24 * 60 * 60 * 1000
  );

  return {
    deletedAt: deletedAt.toISOString(),
    purgeAfterAt: purgeAfterAt.toISOString(),
  };
}

export function clearSoftDeleteWindow() {
  return {
    deletedAt: null,
    purgeAfterAt: null,
  };
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatBytes(value: number | null) {
  if (!value || value <= 0) {
    return "Arquivo sem tamanho informado";
  }

  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(
    Math.floor(Math.log(value) / Math.log(1024)),
    units.length - 1
  );

  return `${(value / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

export function groupSystemsByDepartment(
  departments: HubDepartment[],
  systems: HubSystemLink[],
  mapping: Array<{
    systemLinkId: string;
    departmentId: string;
    isPrimary: boolean;
    sortOrder: number;
  }>
): GroupedSystemLinks[] {
  const systemsMap = new Map(systems.map((item) => [item.id, item]));

  return departments
    .map((department) => {
      const items = mapping
        .filter((entry) => entry.departmentId === department.id)
        .sort((left, right) => left.sortOrder - right.sortOrder)
        .map((entry) => systemsMap.get(entry.systemLinkId))
        .filter((item): item is HubSystemLink => Boolean(item));

      return {
        department,
        items,
      };
    })
    .filter((section) => section.items.length > 0);
}

export function filterVisibleDocuments(
  documents: HubDocument[],
  mapping: Array<{
    documentId: string;
    departmentId: string;
  }>,
  departmentIds: string[],
  isAdmin: boolean
) {
  void mapping;
  void departmentIds;
  void isAdmin;

  return [...documents].sort((left, right) =>
    left.title.localeCompare(right.title, "pt-BR", { sensitivity: "base" })
  );
}
