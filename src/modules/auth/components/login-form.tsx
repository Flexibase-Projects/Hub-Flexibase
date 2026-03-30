"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import LoginRoundedIcon from "@mui/icons-material/LoginRounded";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useActionState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useWatch } from "react-hook-form";

import { signInAction, type LoginActionState } from "@/modules/auth/actions";
import { loginFormSchema } from "@/shared/schemas/hub";

const REMEMBER_EMAIL_KEY = "hub-flexibase:remembered-email";

type LoginFormValues = {
  email: string;
  password: string;
  rememberEmail: boolean;
};

const initialState: LoginActionState = {
  status: "idle",
};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(signInAction, initialState);
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberEmail: true,
    },
  });

  const {
    register,
    setValue,
    formState: { errors },
  } = form;

  useEffect(() => {
    const rememberedEmail = window.localStorage.getItem(REMEMBER_EMAIL_KEY);

    if (rememberedEmail) {
      setValue("email", rememberedEmail);
      setValue("rememberEmail", true);
    }
  }, [setValue]);

  const rememberEmail = useWatch({
    control: form.control,
    name: "rememberEmail",
  });
  const email = useWatch({
    control: form.control,
    name: "email",
  });

  useEffect(() => {
    if (!rememberEmail) {
      window.localStorage.removeItem(REMEMBER_EMAIL_KEY);
      return;
    }

    if (email) {
      window.localStorage.setItem(REMEMBER_EMAIL_KEY, email);
    }
  }, [email, rememberEmail]);

  return (
    <Box component="form" action={formAction}>
      <Stack spacing={2.5}>
        <Stack spacing={1}>
          <Typography variant="h3">Entrar no HUB</Typography>
          <Typography color="text.secondary">
            Acesse sistemas, documentos e comunicados internos da Flexibase.
          </Typography>
        </Stack>

        {state.status === "error" ? <Alert severity="error">{state.message}</Alert> : null}

        <TextField
          label="Email"
          placeholder="voce@flexibase.com.br"
          autoComplete="email"
          type="email"
          error={Boolean(errors.email)}
          helperText={errors.email?.message}
          {...register("email")}
        />

        <TextField
          label="Senha"
          autoComplete="current-password"
          type="password"
          error={Boolean(errors.password)}
          helperText={errors.password?.message}
          {...register("password")}
        />

        <FormControlLabel
          control={<Checkbox defaultChecked {...register("rememberEmail")} />}
          label="Lembrar meu email neste computador"
        />

        <Button
          type="submit"
          size="large"
          variant="contained"
          startIcon={<LoginRoundedIcon />}
          disabled={pending}
        >
          {pending ? "Entrando..." : "Entrar"}
        </Button>
      </Stack>
    </Box>
  );
}
