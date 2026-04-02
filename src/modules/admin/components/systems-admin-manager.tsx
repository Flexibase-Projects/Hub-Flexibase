"use client";

import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import RestoreRoundedIcon from "@mui/icons-material/RestoreRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import VerifiedRoundedIcon from "@mui/icons-material/VerifiedRounded";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useState } from "react";

import { SystemDeleteDialog } from "@/modules/admin/components/system-delete-dialog";
import { SystemIconPicker } from "@/modules/admin/components/system-icon-picker";
import {
  DEFAULT_SYSTEM_ICON_KEY,
  normalizeSystemIconKey,
  type SystemIconKey,
} from "@/shared/lib/hub/system-icons";

type SystemFormAction = (formData: FormData) => void | Promise<void>;

export interface AdminSystemRecord {
  id: string;
  title: string;
  description: string;
  targetUrl: string;
  isActive: boolean;
  iconKey: SystemIconKey;
}

const SYSTEM_PATHNAME = "/admin/systems";

function buildSystemUrlLabel(targetUrl: string) {
  try {
    return new URL(targetUrl).hostname.replace(/^www\./, "");
  } catch {
    return targetUrl;
  }
}

interface SystemFormCardProps {
  title: string;
  submitLabel: string;
  action: SystemFormAction;
  system?: AdminSystemRecord;
}

function SystemFormCard({ title, submitLabel, action, system }: SystemFormCardProps) {
  const [iconKey, setIconKey] = useState<SystemIconKey>(
    normalizeSystemIconKey(system?.iconKey ?? DEFAULT_SYSTEM_ICON_KEY)
  );

  return (
    <Card sx={{ borderRadius: 3 }}>
      <CardContent>
        <Stack spacing={2.5}>
          <Stack spacing={0.5}>
            <Typography variant="h4">{title}</Typography>
            <Typography color="text.secondary">
              {system
                ? "Atualize os dados abaixo para manter o cadastro oficial."
                : "Crie um novo atalho interno para a home do HUB."}
            </Typography>
          </Stack>

          <Box component="form" action={action}>
            {system ? <input type="hidden" name="id" value={system.id} /> : null}
            <input type="hidden" name="pathname" value={SYSTEM_PATHNAME} />

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 5 }}>
                <TextField
                  fullWidth
                  label="Nome"
                  name="title"
                  defaultValue={system?.title ?? ""}
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, md: 7 }}>
                <TextField
                  fullWidth
                  label="URL"
                  name="targetUrl"
                  defaultValue={system?.targetUrl ?? ""}
                  required
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Descricao"
                  name="description"
                  defaultValue={system?.description ?? ""}
                  required
                  multiline
                  minRows={3}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <SystemIconPicker
                  label="Icone"
                  name="iconKey"
                  value={iconKey}
                  onChange={setIconKey}
                  helperText="Selecione o icone oficial exibido na home do HUB."
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={system ? <SaveRoundedIcon /> : <AddRoundedIcon />}
                  >
                    {submitLabel}
                  </Button>
                  {system ? (
                    <Button
                      component="a"
                      href={system.targetUrl}
                      target="_blank"
                      rel="noreferrer"
                      variant="outlined"
                      startIcon={<OpenInNewRoundedIcon />}
                    >
                      Abrir link
                    </Button>
                  ) : null}
                </Stack>
              </Grid>
            </Grid>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

interface SystemCardProps {
  system: AdminSystemRecord;
  saveAction: SystemFormAction;
  restoreAction: SystemFormAction;
  onRequestDelete: (system: AdminSystemRecord) => void;
}

function SystemCard({ system, saveAction, restoreAction, onRequestDelete }: SystemCardProps) {
  const [iconKey, setIconKey] = useState<SystemIconKey>(
    normalizeSystemIconKey(system.iconKey ?? DEFAULT_SYSTEM_ICON_KEY)
  );
  const isActive = system.isActive;

  return (
    <Card
      sx={{
        borderRadius: 3,
        borderStyle: isActive ? "solid" : "dashed",
        borderColor: isActive ? "divider" : "warning.main",
        background: isActive
          ? "linear-gradient(180deg, rgba(15,76,129,0.03) 0%, rgba(15,76,129,0.01) 100%)"
          : "linear-gradient(180deg, rgba(255,183,77,0.08) 0%, rgba(255,183,77,0.03) 100%)",
        opacity: isActive ? 1 : 0.92,
      }}
    >
      <CardContent>
        <Stack spacing={2.5}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            spacing={1}
          >
            <Stack spacing={1}>
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                <Chip
                  size="small"
                  color={isActive ? "success" : "warning"}
                  label={isActive ? "Ativo" : "Excluido"}
                  icon={isActive ? <VerifiedRoundedIcon /> : <DeleteOutlineRoundedIcon />}
                  sx={{ borderRadius: 2 }}
                />
                <Typography variant="h5">{system.title}</Typography>
              </Stack>
              <Typography color="text.secondary">{buildSystemUrlLabel(system.targetUrl)}</Typography>
            </Stack>
            <Button
              component="a"
              href={system.targetUrl}
              target="_blank"
              rel="noreferrer"
              variant="outlined"
              startIcon={<OpenInNewRoundedIcon />}
              sx={{ alignSelf: { xs: "flex-start", sm: "center" } }}
            >
              Abrir
            </Button>
          </Stack>

          <Alert severity={isActive ? "info" : "warning"} variant="outlined">
            {isActive
              ? "Este sistema aparece na home do HUB e pode ser editado ou excluido."
              : "Este sistema esta arquivado. Use reativar para trazelo de volta a home."}
          </Alert>

          <Box component="form" action={saveAction}>
            <input type="hidden" name="pathname" value={SYSTEM_PATHNAME} />
            <input type="hidden" name="id" value={system.id} />

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 5 }}>
                <TextField
                  fullWidth
                  label="Nome"
                  name="title"
                  defaultValue={system.title}
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, md: 7 }}>
                <TextField
                  fullWidth
                  label="URL"
                  name="targetUrl"
                  defaultValue={system.targetUrl}
                  required
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Descricao"
                  name="description"
                  defaultValue={system.description}
                  required
                  multiline
                  minRows={3}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <SystemIconPicker
                  label="Icone"
                  name="iconKey"
                  value={iconKey}
                  onChange={setIconKey}
                  helperText="Este icone sera usado no card correspondente da home."
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                  <Button type="submit" variant="contained" startIcon={<SaveRoundedIcon />}>
                    Salvar alteracoes
                  </Button>
                  {isActive ? (
                    <Button
                      color="error"
                      variant="outlined"
                      startIcon={<DeleteOutlineRoundedIcon />}
                      type="button"
                      onClick={() => onRequestDelete(system)}
                    >
                      Excluir
                    </Button>
                  ) : null}
                </Stack>
              </Grid>
            </Grid>
          </Box>

          {!isActive ? (
            <Box component="form" action={restoreAction}>
              <input type="hidden" name="pathname" value={SYSTEM_PATHNAME} />
              <input type="hidden" name="id" value={system.id} />
              <Button
                type="submit"
                variant="outlined"
                color="success"
                startIcon={<RestoreRoundedIcon />}
              >
                Reativar
              </Button>
            </Box>
          ) : null}
        </Stack>
      </CardContent>
    </Card>
  );
}

interface SystemsAdminManagerProps {
  systems: AdminSystemRecord[];
  saveAction: SystemFormAction;
  deleteAction: SystemFormAction;
  restoreAction: SystemFormAction;
}

export function SystemsAdminManager({
  systems,
  saveAction,
  deleteAction,
  restoreAction,
}: SystemsAdminManagerProps) {
  const [deleteTarget, setDeleteTarget] = useState<AdminSystemRecord | null>(null);

  const activeSystems = systems.filter((system) => system.isActive);
  const inactiveSystems = systems.filter((system) => !system.isActive);

  return (
    <Stack spacing={3}>
      <SystemFormCard title="Novo sistema" submitLabel="Salvar sistema" action={saveAction} />

      <Stack spacing={1}>
        <Typography variant="h4">Itens cadastrados</Typography>
        <Typography color="text.secondary">
          A lista e separada entre sistemas ativos e excluidos para evitar acoes acidentais.
        </Typography>
      </Stack>

      <Stack spacing={2}>
        <Typography variant="h5">Ativos ({activeSystems.length})</Typography>
        {activeSystems.length > 0 ? (
          <Grid container spacing={2}>
            {activeSystems.map((system) => (
              <Grid key={system.id} size={{ xs: 12, xl: 6 }}>
                <SystemCard
                  system={system}
                  saveAction={saveAction}
                  restoreAction={restoreAction}
                  onRequestDelete={setDeleteTarget}
                />
              </Grid>
            ))}
          </Grid>
        ) : (
          <Card variant="outlined">
            <CardContent>
              <Typography color="text.secondary">
                Nenhum sistema ativo encontrado. Cadastre o primeiro item acima.
              </Typography>
            </CardContent>
          </Card>
        )}
      </Stack>

      <Divider />

      <Stack spacing={2}>
        <Typography variant="h5">Excluidos ({inactiveSystems.length})</Typography>
        {inactiveSystems.length > 0 ? (
          <Grid container spacing={2}>
            {inactiveSystems.map((system) => (
              <Grid key={system.id} size={{ xs: 12, xl: 6 }}>
                <SystemCard
                  system={system}
                  saveAction={saveAction}
                  restoreAction={restoreAction}
                  onRequestDelete={setDeleteTarget}
                />
              </Grid>
            ))}
          </Grid>
        ) : (
          <Card variant="outlined">
            <CardContent>
              <Typography color="text.secondary">Nenhum sistema excluido no momento.</Typography>
            </CardContent>
          </Card>
        )}
      </Stack>

      {deleteTarget ? (
        <SystemDeleteDialog
          open={Boolean(deleteTarget)}
          systemId={deleteTarget.id}
          systemTitle={deleteTarget.title}
          pathname={SYSTEM_PATHNAME}
          action={deleteAction}
          onClose={() => setDeleteTarget(null)}
        />
      ) : null}
    </Stack>
  );
}
