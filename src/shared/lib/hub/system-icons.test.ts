import { describe, expect, it } from "vitest";

import {
  DEFAULT_SYSTEM_ICON_KEY,
  SYSTEM_ICON_KEYS,
  SYSTEM_ICON_OPTIONS,
  isSystemIconKey,
  resolveSystemIcon,
} from "@/shared/lib/hub/system-icons";

describe("system icons", () => {
  it("mantem um catalogo unico e sincronizado", () => {
    const keys = SYSTEM_ICON_OPTIONS.map((option) => option.key);

    expect(keys).toEqual(SYSTEM_ICON_KEYS);
    expect(new Set(keys).size).toBe(keys.length);
    expect(SYSTEM_ICON_OPTIONS.every((option) => option.label.length > 0)).toBe(true);
  });

  it("reconhece e resolve chaves validas", () => {
    expect(DEFAULT_SYSTEM_ICON_KEY).toBe("AppsRounded");
    expect(isSystemIconKey("ComputerRounded")).toBe(true);
    expect(isSystemIconKey("NopeRounded")).toBe(false);

    const defaultIcon = resolveSystemIcon(null);
    const fallbackIcon = resolveSystemIcon("NopeRounded");
    const matchedIcon = resolveSystemIcon("ComputerRounded");

    expect(defaultIcon).toBe(fallbackIcon);
    expect(matchedIcon).toBe(SYSTEM_ICON_OPTIONS.find((option) => option.key === "ComputerRounded")?.Icon);
    expect(defaultIcon).toBe(SYSTEM_ICON_OPTIONS.find((option) => option.key === DEFAULT_SYSTEM_ICON_KEY)?.Icon);
  });
});
