import AppsRoundedIcon from "@mui/icons-material/AppsRounded";
import CampaignRoundedIcon from "@mui/icons-material/CampaignRounded";
import ComputerRoundedIcon from "@mui/icons-material/ComputerRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import EngineeringRoundedIcon from "@mui/icons-material/EngineeringRounded";
import FactCheckRoundedIcon from "@mui/icons-material/FactCheckRounded";
import HandshakeRoundedIcon from "@mui/icons-material/HandshakeRounded";
import LanguageRoundedIcon from "@mui/icons-material/LanguageRounded";
import PaymentRoundedIcon from "@mui/icons-material/PaymentRounded";
import PrecisionManufacturingRoundedIcon from "@mui/icons-material/PrecisionManufacturingRounded";
import SafetyCheckRoundedIcon from "@mui/icons-material/SafetyCheckRounded";
import SupportAgentRoundedIcon from "@mui/icons-material/SupportAgentRounded";
import TaskRoundedIcon from "@mui/icons-material/TaskRounded";
import type { SvgIconComponent } from "@mui/icons-material";

export const SYSTEM_ICON_KEYS = [
  "AppsRounded",
  "SupportAgentRounded",
  "ComputerRounded",
  "HandshakeRounded",
  "PaymentRounded",
  "PrecisionManufacturingRounded",
  "DescriptionRounded",
  "CampaignRounded",
  "EngineeringRounded",
  "TaskRounded",
  "FactCheckRounded",
  "SafetyCheckRounded",
  "LanguageRounded",
] as const;

export type SystemIconKey = (typeof SYSTEM_ICON_KEYS)[number];

export const DEFAULT_SYSTEM_ICON_KEY: SystemIconKey = "AppsRounded";

export const SYSTEM_ICON_COMPONENTS: Record<SystemIconKey, SvgIconComponent> = {
  AppsRounded: AppsRoundedIcon,
  SupportAgentRounded: SupportAgentRoundedIcon,
  ComputerRounded: ComputerRoundedIcon,
  HandshakeRounded: HandshakeRoundedIcon,
  PaymentRounded: PaymentRoundedIcon,
  PrecisionManufacturingRounded: PrecisionManufacturingRoundedIcon,
  DescriptionRounded: DescriptionRoundedIcon,
  CampaignRounded: CampaignRoundedIcon,
  EngineeringRounded: EngineeringRoundedIcon,
  TaskRounded: TaskRoundedIcon,
  FactCheckRounded: FactCheckRoundedIcon,
  SafetyCheckRounded: SafetyCheckRoundedIcon,
  LanguageRounded: LanguageRoundedIcon,
};

const SYSTEM_ICON_LABELS: Record<SystemIconKey, string> = {
  AppsRounded: "Aplicacoes",
  SupportAgentRounded: "Suporte / Chamados",
  ComputerRounded: "TI / Computadores",
  HandshakeRounded: "Comercial / CRM",
  PaymentRounded: "Financeiro",
  PrecisionManufacturingRounded: "Producao",
  DescriptionRounded: "Documentos",
  CampaignRounded: "Marketing",
  EngineeringRounded: "Engenharia",
  TaskRounded: "Projetos / Tarefas",
  FactCheckRounded: "Checklist / Registros",
  SafetyCheckRounded: "Seguranca",
  LanguageRounded: "Sites / Web",
};

export const SYSTEM_ICON_OPTIONS = SYSTEM_ICON_KEYS.map((key) => ({
  key,
  label: SYSTEM_ICON_LABELS[key],
  Icon: SYSTEM_ICON_COMPONENTS[key],
}));

export function isSystemIconKey(value: string): value is SystemIconKey {
  return SYSTEM_ICON_KEYS.includes(value as SystemIconKey);
}

export function resolveSystemIcon(iconKey: string | null | undefined): SvgIconComponent {
  return SYSTEM_ICON_COMPONENTS[normalizeSystemIconKey(iconKey)];
}

export function normalizeSystemIconKey(iconKey: string | null | undefined): SystemIconKey {
  if (iconKey && isSystemIconKey(iconKey)) {
    return iconKey;
  }

  return DEFAULT_SYSTEM_ICON_KEY;
}
