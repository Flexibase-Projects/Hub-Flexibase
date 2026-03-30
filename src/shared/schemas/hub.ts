import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email("Informe um email válido."),
  password: z.string().min(6, "Informe sua senha."),
  rememberEmail: z.coerce.boolean().default(true),
});

export const loginFormSchema = z.object({
  email: z.string().trim().email("Informe um email válido."),
  password: z.string().min(6, "Informe sua senha."),
  rememberEmail: z.boolean(),
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
  description: z.string().trim().min(4, "Informe uma descrição curta."),
  targetUrl: z.string().trim().url("Informe uma URL válida."),
  imageUrl: z.string().trim().url().optional().or(z.literal("")),
  accentColor: z
    .string()
    .trim()
    .regex(/^#([A-Fa-f0-9]{6})$/, "Use uma cor hexadecimal como #0F4C81.")
    .optional()
    .or(z.literal("")),
  sortOrder: z.coerce.number().int().min(0).default(0),
  departmentIds: z.array(z.string().uuid()).min(1, "Selecione ao menos um departamento."),
});

export const bannerSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(2, "Informe um título."),
  subtitle: z.string().trim().max(120).optional().or(z.literal("")),
  body: z.string().trim().max(400).optional().or(z.literal("")),
  imageUrl: z.string().trim().url().optional().or(z.literal("")),
  tone: z.enum(["info", "success", "warning"]).default("info"),
  sortOrder: z.coerce.number().int().min(0).default(0),
});

export const noticeSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(2, "Informe um título."),
  body: z.string().trim().min(6, "Informe o comunicado."),
  severity: z.enum(["critical", "important", "info"]).default("important"),
  sortOrder: z.coerce.number().int().min(0).default(0),
});

export const documentSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(2, "Informe um título."),
  description: z.string().trim().max(240).optional().or(z.literal("")),
  category: z.string().trim().min(2, "Informe a categoria."),
  sortOrder: z.coerce.number().int().min(0).default(0),
  isRestricted: z.coerce.boolean().default(false),
  departmentIds: z.array(z.string().uuid()).default([]),
});

export const userAccessSchema = z.object({
  userId: z.string().uuid("Selecione um usuário válido."),
  roleKey: z.enum(["operator", "employee", "manager", "admin"]),
  departmentIds: z.array(z.string().uuid()).default([]),
});
