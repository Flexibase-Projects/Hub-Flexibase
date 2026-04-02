import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SystemIconPicker } from "@/modules/admin/components/system-icon-picker";

describe("SystemIconPicker", () => {
  it("mostra preview e catalogo do icone selecionado", () => {
    const onChange = vi.fn();

    render(
      <SystemIconPicker
        label="Icone"
        name="iconKey"
        value="ComputerRounded"
        onChange={onChange}
        helperText="Escolha um icone padrao para a home."
      />
    );

    expect(screen.getAllByText("TI / Computadores")).toHaveLength(2);
    expect(screen.getByText("Chave do icone: ComputerRounded")).toBeInTheDocument();
    expect(screen.getByText("Escolha um icone padrao para a home.")).toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });
});
