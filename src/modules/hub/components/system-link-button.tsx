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
import { Button } from "@mui/material";

function normalizeLabel(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function pickSystemIcon(title: string): SvgIconComponent {
  const normalizedTitle = normalizeLabel(title);

  const rules: Array<{ keywords: string[]; icon: SvgIconComponent }> = [
    { keywords: ["chamado", "suporte", "help desk", "desk"], icon: SupportAgentRoundedIcon },
    { keywords: ["ti", "informatica", "sistema"], icon: ComputerRoundedIcon },
    { keywords: ["crm", "cliente", "comercial", "vendas"], icon: HandshakeRoundedIcon },
    { keywords: ["custo", "financeiro", "fatur", "pag"], icon: PaymentRoundedIcon },
    { keywords: ["focco", "producao", "fabrica", "manufact"], icon: PrecisionManufacturingRoundedIcon },
    { keywords: ["arquivo", "document", "rh"], icon: DescriptionRoundedIcon },
    { keywords: ["marketing"], icon: CampaignRoundedIcon },
    { keywords: ["pcm", "manutencao", "engenharia"], icon: EngineeringRoundedIcon },
    { keywords: ["projeto", "kanban", "atividade"], icon: TaskRoundedIcon },
    { keywords: ["registro", "ocorrencia", "checklist"], icon: FactCheckRoundedIcon },
    { keywords: ["seguranca"], icon: SafetyCheckRoundedIcon },
    { keywords: ["site", "portal", "web"], icon: LanguageRoundedIcon },
  ];

  const match = rules.find((rule) =>
    rule.keywords.some((keyword) => normalizedTitle.includes(keyword))
  );

  return match?.icon ?? AppsRoundedIcon;
}

interface SystemLinkButtonProps {
  href: string;
  title: string;
}

export function SystemLinkButton({ href, title }: SystemLinkButtonProps) {
  const Icon = pickSystemIcon(title);

  return (
    <Button
      component="a"
      href={href}
      target="_blank"
      rel="noreferrer"
      variant="outlined"
      startIcon={<Icon />}
      sx={{
        minHeight: 60,
        borderRadius: 2,
        justifyContent: "flex-start",
        px: 1.75,
        py: 1.4,
        color: "text.primary",
        borderColor: "divider",
        backgroundColor: "background.paper",
        textTransform: "none",
        fontWeight: 600,
        textAlign: "left",
      }}
    >
      {title}
    </Button>
  );
}
