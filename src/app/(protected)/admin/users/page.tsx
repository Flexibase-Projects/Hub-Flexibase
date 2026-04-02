import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import {
  Alert,
  Button,
  Checkbox,
  InputAdornment,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";

import { requireAdminViewer } from "@/modules/auth/server";
import { getAdminDashboardData } from "@/modules/admin/queries";
import { getPageFeedback } from "@/shared/lib/feedback";
import { formatDate } from "@/shared/lib/hub/utils";
import { PageFeedbackAlert } from "@/shared/ui/components/page-feedback";

interface UsersAdminPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function getSearchValue(value: string | string[] | undefined) {
  return typeof value === "string" ? value.trim() : "";
}

export default async function UsersAdminPage({
  searchParams,
}: UsersAdminPageProps) {
  await requireAdminViewer();
  const params = await searchParams;
  const data = await getAdminDashboardData();
  const feedback = await getPageFeedback(Promise.resolve(params));
  const query = getSearchValue(params.q).toLowerCase();
  const pageWarning = data.authUsersError ?? data.loadError;
  const users = data.adminUsers.filter((user) => {
    if (!query) {
      return true;
    }

    return (
      user.fullName.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query)
    );
  });

  return (
    <Stack spacing={4}>
      <Stack spacing={1}>
        <Typography variant="h3">Usuarios</Typography>
        <Typography color="text.secondary">
          Lista completa do Supabase Auth com busca e um unico controle de permissao administrativa.
        </Typography>
      </Stack>

      <PageFeedbackAlert feedback={feedback} />
      {pageWarning ? <Alert severity="warning">{pageWarning}</Alert> : null}

      <form method="get">
        <TextField
          fullWidth
          name="q"
          defaultValue={query}
          placeholder="Buscar por nome ou email"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchRoundedIcon />
              </InputAdornment>
            ),
          }}
        />
      </form>

      <Paper variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nome</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Criado em</TableCell>
              <TableCell>Ultimo acesso</TableCell>
              <TableCell align="center">Admin</TableCell>
              <TableCell align="right">Acao</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6}>
                  <Alert severity="info">
                    Nenhum usuario encontrado ou a listagem do Supabase Auth nao esta disponivel.
                  </Alert>
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id} hover>
                  <TableCell>{user.fullName}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{formatDate(user.createdAt)}</TableCell>
                  <TableCell>
                    {user.lastSignInAt ? formatDate(user.lastSignInAt) : "Nunca acessou"}
                  </TableCell>
                  <TableCell align="center">
                    <form action="/api/admin/users/access" method="post">
                      <input type="hidden" name="pathname" value="/admin/users" />
                      <input type="hidden" name="userId" value={user.id} />
                      <input type="hidden" name="query" value={query} />
                      <Checkbox
                        name="isAdmin"
                        value="true"
                        defaultChecked={user.isAdmin}
                        inputProps={{ "aria-label": `Permissao admin de ${user.fullName}` }}
                      />
                      <Button type="submit" size="small" variant="contained">
                        Salvar
                      </Button>
                    </form>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" color="text.secondary">
                      {user.isAdmin ? "Ativo" : "Desativado"}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Paper>
    </Stack>
  );
}
