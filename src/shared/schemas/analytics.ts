import { z } from "zod";

import { ANALYTICS_DEVICE_TYPES } from "@/shared/types/analytics";

const sessionIdSchema = z.string().uuid("Sessao analitica invalida.");

const optionalMetricSchema = z
  .number()
  .finite("Metrica invalida.")
  .min(0, "Metrica invalida.")
  .max(600000, "Metrica invalida.")
  .nullable()
  .optional();

export const analyticsIngestSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("page_view"),
    sessionId: sessionIdSchema,
    path: z.string().trim().min(1, "Caminho invalido.").max(240),
    entryPath: z.string().trim().min(1).max(240).nullable().optional(),
    deviceType: z.enum(ANALYTICS_DEVICE_TYPES),
    userAgent: z.string().trim().max(512).nullable().optional(),
  }),
  z.object({
    type: z.literal("system_click"),
    sessionId: sessionIdSchema,
    path: z.string().trim().min(1, "Caminho invalido.").max(240),
    targetType: z.enum(["registered_system", "legacy_system"]),
    targetKey: z.string().trim().min(1, "Destino invalido.").max(120),
    targetLabel: z.string().trim().min(1, "Rotulo invalido.").max(120),
    deviceType: z.enum(ANALYTICS_DEVICE_TYPES),
    userAgent: z.string().trim().max(512).nullable().optional(),
  }),
  z.object({
    type: z.literal("performance_sample"),
    sessionId: sessionIdSchema,
    path: z.string().trim().min(1, "Caminho invalido.").max(240),
    pageLoadMs: optionalMetricSchema,
    ttfbMs: optionalMetricSchema,
    fcpMs: optionalMetricSchema,
    lcpMs: optionalMetricSchema,
    inpMs: optionalMetricSchema,
    cls: z.number().finite("CLS invalido.").min(0).max(10).nullable().optional(),
    deviceType: z.enum(ANALYTICS_DEVICE_TYPES),
    userAgent: z.string().trim().max(512).nullable().optional(),
  }),
]);
