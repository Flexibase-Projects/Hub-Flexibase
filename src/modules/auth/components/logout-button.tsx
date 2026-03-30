import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import { Button } from "@mui/material";

import { logoutAction } from "@/modules/auth/actions";

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <Button type="submit" color="inherit" startIcon={<LogoutRoundedIcon />}>
        Sair
      </Button>
    </form>
  );
}
