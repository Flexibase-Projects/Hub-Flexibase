import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { SystemDeleteDialog } from "@/modules/admin/components/system-delete-dialog";

describe("SystemDeleteDialog", () => {
  it("bloqueia a exclusao ate a confirmacao exata", async () => {
    const user = userEvent.setup();
    const action = vi.fn();
    const onClose = vi.fn();

    render(
      <SystemDeleteDialog
        open
        systemId="123e4567-e89b-12d3-a456-426614174000"
        systemTitle="Central de Chamados"
        pathname="/admin/systems"
        action={action}
        onClose={onClose}
      />
    );

    expect(screen.getByText("Excluir sistema")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Esta acao exclui o sistema de forma logica no banco e o remove da home. Para continuar, digite o nome exato abaixo."
      )
    ).toBeInTheDocument();

    const confirmButton = screen.getByRole("button", { name: "Confirmar exclusao" });
    expect(confirmButton).toBeDisabled();

    const input = screen.getByLabelText("Digite o nome do sistema");
    await user.type(input, "Central de Chamados");

    expect(confirmButton).toBeEnabled();
    expect(screen.getByText("Confirmar nome do sistema antes de excluir.")).toBeInTheDocument();

    const pathnameInput = document.querySelector('input[name="pathname"]');
    const idInput = document.querySelector('input[name="id"]');
    const confirmationInput = document.querySelector('input[name="confirmationText"]');

    expect(pathnameInput).toHaveAttribute("value", "/admin/systems");
    expect(idInput).toHaveAttribute("value", "123e4567-e89b-12d3-a456-426614174000");
    expect(confirmationInput).toHaveAttribute("value", "Central de Chamados");
    expect(action).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });
});
