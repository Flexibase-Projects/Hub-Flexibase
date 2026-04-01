import { z } from "zod";

import { DOCUMENT_CATEGORIES } from "@/shared/lib/hub/constants";

export const loginSchema = z.object({
  email: z.string().trim().email("Informe um email valido."),
  password: z.string().min(6, "Informe sua senha."),
  rememberLogin: z.coerce.boolean().default(false),
});

export const loginFormSchema = z.object({
  email: z.string().trim().email("Informe um email valido."),
  password: z.string().min(6, "Informe sua senha."),
  rememberLogin: z.boolean(),
});

export const departmentSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2, "Informe o nome do departamento."),
  description: z.string().trim().max(240).optional().or(z.literal("")),
  sortOrder: z.coerce.number().int().min(0).default(0),
});

export const systemLinkSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(2, "Informe o nome do sistema."),
  description: z.string().trim().min(4, "Informe uma descricao curta."),
  targetUrl: z.string().trim().url("Informe uma URL valida."),
});

export const bannerSchema = z.object({
  id: z.string().uuid().optional(),
  existingStoragePath: z.string().trim().optional().or(z.literal("")),
});

export const noticeSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(2, "Informe um titulo."),
  body: z.string().trim().min(6, "Informe o comunicado."),
  severity: z.enum(["critical", "important", "info"]).default("important"),
  sortOrder: z.coerce.number().int().min(0).default(0),
});

export const documentSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(2, "Informe um titulo."),
  description: z.string().trim().max(240).optional().or(z.literal("")),
  category: z.enum(DOCUMENT_CATEGORIES, {
    message: "Selecione uma categoria valida.",
  }),
});

export const userAccessSchema = z.object({
  userId: z.string().uuid("Selecione um usuario valido."),
  isAdmin: z.coerce.boolean().default(false),
});
