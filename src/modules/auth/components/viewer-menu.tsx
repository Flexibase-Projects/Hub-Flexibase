"use client";

import AdminPanelSettingsRoundedIcon from "@mui/icons-material/AdminPanelSettingsRounded";
import ArrowDropDownRoundedIcon from "@mui/icons-material/ArrowDropDownRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import {
  Box,
  Button,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
} from "@mui/material";
import { useState } from "react";

import { logoutAction } from "@/modules/auth/actions";
import type { ViewerContext } from "@/shared/types/hub";

interface ViewerMenuProps {
  viewer: ViewerContext;
}

export function ViewerMenu({ viewer }: ViewerMenuProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  return (
    <>
      {viewer.isAdmin ? (
        <AdminPanelSettingsRoundedIcon
          fontSize="small"
          sx={{ color: "rgba(255,255,255,0.88)" }}
          aria-label="Administrador do sistema"
        />
      ) : null}

      <Button
        variant="outlined"
        color="inherit"
        startIcon={<PersonRoundedIcon />}
        endIcon={<ArrowDropDownRoundedIcon />}
        onClick={(event) => setAnchorEl(event.currentTarget)}
        sx={{
          borderColor: "rgba(255,255,255,0.28)",
          color: "common.white",
          minWidth: "fit-content",
        }}
      >
        {viewer.displayName}
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: {
            sx: {
              mt: 1,
              minWidth: 220,
              borderRadius: 2,
            },
          },
        }}
      >
        <Box component="form" action={logoutAction}>
          <MenuItem type="submit" component="button" sx={{ width: "100%" }}>
            <ListItemIcon>
              <LogoutRoundedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Sair</ListItemText>
          </MenuItem>
        </Box>
      </Menu>
    </>
  );
}
