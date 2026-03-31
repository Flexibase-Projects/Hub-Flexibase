"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import HelpOutlineRoundedIcon from "@mui/icons-material/HelpOutlineRounded";
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
import { useForm, useWatch } from "react-hook-form";

import { signInAction, type LoginActionState } from "@/modules/auth/actions";
import { loginFormSchema } from "@/shared/schemas/hub";

const REMEMBER_LOGIN_KEY = "cdt-login-remember-30d";
const REMEMBER_LOGIN_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

type LoginFormValues = {
  email: string;
  password: string;
  rememberLogin: boolean;
};

type RememberedLogin = {
  email: string;
  password: string;
  expiresAt: number;
};

const initialState: LoginActionState = {
  status: "idle",
};

interface LoginFormProps {
  onShowAbout: () => void;
}

export function LoginForm({ onShowAbout }: LoginFormProps) {
  const [state, formAction, pending] = useActionState(signInAction, initialState);
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberLogin: false,
    },
  });

  const {
    control,
    register,
    setValue,
    formState: { errors },
  } = form;

  useEffect(() => {
    const rememberedLoginRaw = window.localStorage.getItem(REMEMBER_LOGIN_KEY);

    if (!rememberedLoginRaw) {
      return;
    }

    try {
      const rememberedLogin = JSON.parse(rememberedLoginRaw) as RememberedLogin;

      if (
        !rememberedLogin.email ||
        !rememberedLogin.password ||
        typeof rememberedLogin.expiresAt !== "number" ||
        rememberedLogin.expiresAt <= Date.now()
      ) {
        window.localStorage.removeItem(REMEMBER_LOGIN_KEY);
        return;
      }

      setValue("email", rememberedLogin.email);
      setValue("password", rememberedLogin.password);
      setValue("rememberLogin", true);
    } catch {
      window.localStorage.removeItem(REMEMBER_LOGIN_KEY);
    }
  }, [setValue]);

  const rememberLogin = useWatch({
    control,
    name: "rememberLogin",
  });
  const email = useWatch({
    control,
    name: "email",
  });
  const password = useWatch({
    control,
    name: "password",
  });

  useEffect(() => {
    if (!rememberLogin) {
      window.localStorage.removeItem(REMEMBER_LOGIN_KEY);
    }
  }, [rememberLogin]);

  function handleSubmitCapture() {
    if (!rememberLogin || !email || !password) {
      window.localStorage.removeItem(REMEMBER_LOGIN_KEY);
      return;
    }

    const rememberedLogin: RememberedLogin = {
      email,
      password,
      expiresAt: Date.now() + REMEMBER_LOGIN_DURATION_MS,
    };

    window.localStorage.setItem(REMEMBER_LOGIN_KEY, JSON.stringify(rememberedLogin));
  }

  return (
    <Box component="form" action={formAction} onSubmitCapture={handleSubmitCapture}>
      <Stack spacing={3}>
        <Stack spacing={1}>
          <Typography variant="h3">Bem-vindo(a)</Typography>
          <Typography color="text.secondary">Acesse sua conta para continuar</Typography>
        </Stack>

        {state.status === "error" ? <Alert severity="error">{state.message}</Alert> : null}

        <TextField
          label="Email"
          placeholder="voce@flexibase.com.br"
          autoComplete="username"
          type="email"
          disabled={pending}
          error={Boolean(errors.email)}
          helperText={errors.email?.message}
          {...register("email")}
        />

        <TextField
          label="Senha"
          autoComplete="current-password"
          type="password"
          disabled={pending}
          error={Boolean(errors.password)}
          helperText={errors.password?.message}
          {...register("password")}
        />

        <Stack spacing={1.5}>
          <Button
            type="submit"
            size="large"
            variant="contained"
            startIcon={<LoginRoundedIcon />}
            disabled={pending}
            fullWidth
            sx={{ minHeight: 52 }}
          >
            {pending ? "Acessando..." : "Acessar sistema"}
          </Button>

          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <FormControlLabel
              control={<Checkbox disabled={pending} {...register("rememberLogin")} />}
              label="Manter conectado por 30d"
              sx={{ mx: 0 }}
            />
          </Box>

          <Button
            type="button"
            variant="text"
            color="inherit"
            startIcon={<HelpOutlineRoundedIcon />}
            onClick={onShowAbout}
            disabled={pending}
            sx={{ alignSelf: "center" }}
          >
            O que e este sistema?
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
