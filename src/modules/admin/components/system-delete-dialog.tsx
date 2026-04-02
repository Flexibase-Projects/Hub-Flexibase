"use client";

import { useEffect, useState } from "react";

import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

interface SystemDeleteDialogProps {
  open: boolean;
  systemId: string;
  systemTitle: string;
  pathname: string;
  action: (formData: FormData) => void | Promise<void>;
  onClose: () => void;
}

export function SystemDeleteDialog({
  open,
  systemId,
  systemTitle,
  pathname,
  action,
  onClose,
}: SystemDeleteDialogProps) {
  const [confirmationText, setConfirmationText] = useState("");

  useEffect(() => {
    if (open) {
      setConfirmationText("");
    }
  }, [open, systemId]);

  const isConfirmed = confirmationText.trim() === systemTitle;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Excluir sistema</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <DialogContentText>
            Esta acao exclui o sistema de forma logica no banco e o remove da home. Para
            continuar, digite o nome exato abaixo.
          </DialogContentText>

          <Stack spacing={0.5}>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              {systemTitle}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Confirmar nome do sistema antes de excluir.
            </Typography>
          </Stack>

          <TextField
            autoFocus
            fullWidth
            label="Digite o nome do sistema"
            value={confirmationText}
            onChange={(event) => setConfirmationText(event.target.value)}
            error={confirmationText.length > 0 && !isConfirmed}
            helperText={
              confirmationText.length > 0 && !isConfirmed
                ? "O texto precisa ser identico ao nome do sistema."
                : "A confirmacao final permanece desabilitada ate a correspondencia exata."
            }
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Box component="form" action={action}>
          <input type="hidden" name="pathname" value={pathname} />
          <input type="hidden" name="id" value={systemId} />
          <input type="hidden" name="confirmationText" value={confirmationText} />
          <Button type="submit" color="error" variant="contained" disabled={!isConfirmed}>
            Confirmar exclusao
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
}
