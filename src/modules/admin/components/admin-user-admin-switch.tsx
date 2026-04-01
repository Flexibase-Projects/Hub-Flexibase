"use client";

import { Box, FormControlLabel, Switch, Typography } from "@mui/material";
import { useRef } from "react";

import { updateUserAccessAction } from "@/modules/admin/actions";

interface AdminUserAdminSwitchProps {
  userId: string;
  checked: boolean;
  pathname: string;
  query: string;
}

export function AdminUserAdminSwitch({
  userId,
  checked,
  pathname,
  query,
}: AdminUserAdminSwitchProps) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <Box
      component="form"
      ref={formRef}
      action={updateUserAccessAction}
      sx={{ display: "inline-flex" }}
    >
      <input type="hidden" name="pathname" value={pathname} />
      <input type="hidden" name="query" value={query} />
      <input type="hidden" name="userId" value={userId} />
      <FormControlLabel
        control={
          <Switch
            name="isAdmin"
            value="true"
            defaultChecked={checked}
            onChange={() => formRef.current?.requestSubmit()}
          />
        }
        label={
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {checked ? "Ativo" : "Inativo"}
          </Typography>
        }
      />
    </Box>
  );
}
