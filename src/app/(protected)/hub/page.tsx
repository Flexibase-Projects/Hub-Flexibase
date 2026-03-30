import BusinessRoundedIcon from "@mui/icons-material/BusinessRounded";
import CampaignRoundedIcon from "@mui/icons-material/CampaignRounded";
import ConstructionRoundedIcon from "@mui/icons-material/ConstructionRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import FolderRoundedIcon from "@mui/icons-material/FolderRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import HomeWorkRoundedIcon from "@mui/icons-material/HomeWorkRounded";
import LanRoundedIcon from "@mui/icons-material/LanRounded";
import ListAltRoundedIcon from "@mui/icons-material/ListAltRounded";
import ManageAccountsRoundedIcon from "@mui/icons-material/ManageAccountsRounded";
import PrecisionManufacturingRoundedIcon from "@mui/icons-material/PrecisionManufacturingRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import RuleFolderRoundedIcon from "@mui/icons-material/RuleFolderRounded";
import SupportAgentRoundedIcon from "@mui/icons-material/SupportAgentRounded";
import VerifiedUserRoundedIcon from "@mui/icons-material/VerifiedUserRounded";
import WarehouseRoundedIcon from "@mui/icons-material/WarehouseRounded";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  Stack,
  Typography,
} from "@mui/material";

import { requireViewer } from "@/modules/auth/server";
import { BannerCarousel } from "@/modules/hub/components/banner-carousel";
import { getHubHomeData } from "@/modules/hub/queries";
import { getPageFeedback } from "@/shared/lib/feedback";
import { filterVisibleDocuments, formatBytes, formatDate } from "@/shared/lib/hub/utils";
import { PageFeedbackAlert } from "@/shared/ui/components/page-feedback";

interface HubPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const indexedSystems = [
  {
    title: "Chamado de Manutenção",
    href: "http://192.168.1.251/manu/",
    icon: <ConstructionRoundedIcon />,
  },
  {
    title: "Chamado de TI",
    href: "http://192.168.1.251/desk/index.php",
    icon: <SupportAgentRoundedIcon />,
  },
  {
    title: "CRM Nectar",
    href: "https://app.nectarcrm.com.br/crm/?language=pt-BR",
    icon: <GroupsRoundedIcon />,
  },
  {
    title: "Custos e Manutenções",
    href: "http://192.168.1.251/custos/",
    icon: <ReceiptLongRoundedIcon />,
  },
  {
    title: "Focco Produção",
    href: "http://192.168.1.99/proweb/Authentication/Login",
    icon: <PrecisionManufacturingRoundedIcon />,
  },
  {
    title: "Focco Teste",
    href: "http://192.168.1.99/tesweb/Authentication/Login",
    icon: <WarehouseRoundedIcon />,
  },
  {
    title: "Focco Web",
    href: "http://192.168.1.68:8080/f3iConnect/app/login.faces;jsessionid=73370BF61D5ABA520351E1CC10E4BC6B",
    icon: <LanRoundedIcon />,
  },
  {
    title: "Gestão de Arquivos",
    href: "http://192.168.1.251/docs/knowledgebase.php",
    icon: <FolderRoundedIcon />,
  },
  {
    title: "Marketing",
    href: "http://192.168.1.251/marketing/",
    icon: <CampaignRoundedIcon />,
  },
  {
    title: "PCM Soluções",
    href: "https://192.168.1.2/",
    icon: <HomeWorkRoundedIcon />,
  },
  {
    title: "Projetos Executivos",
    href: "http://192.168.1.251/exec/",
    icon: <ManageAccountsRoundedIcon />,
  },
  {
    title: "Registro de Ocorrências",
    href: "http://192.168.1.251/registro/",
    icon: <RuleFolderRoundedIcon />,
  },
  {
    title: "RH-Documentos",
    href: "http://192.168.1.251/docs/knowledgebase.php?category=36",
    icon: <DescriptionRoundedIcon />,
  },
  {
    title: "Segurança de Trabalho",
    href: "http://192.168.1.251/segra/knowledgebase.php",
    icon: <VerifiedUserRoundedIcon />,
  },
  {
    title: "Site Flexibase",
    href: "https://flexibase.com.br/",
    icon: <BusinessRoundedIcon />,
  },
  {
    title: "Solicitação de Projetos",
    href: "http://192.168.1.251/projetos/",
    icon: <ListAltRoundedIcon />,
  },
].sort((left, right) => left.title.localeCompare(right.title, "pt-BR"));

export default async function HubPage({ searchParams }: HubPageProps) {
  const viewer = await requireViewer();
  const feedback = await getPageFeedback(searchParams);
  const hubData = await getHubHomeData(viewer);
  const visibleDocuments = filterVisibleDocuments(
    hubData.documents,
    hubData.documentDepartmentMap,
    viewer.departmentIds,
    viewer.isAdmin
  );

  return (
    <Stack spacing={4}>
      <PageFeedbackAlert feedback={feedback} />

      {hubData.loadError ? <Alert severity="warning">{hubData.loadError}</Alert> : null}

      <Stack spacing={1}>
        <Typography variant="h4">Hub principal</Typography>
        <Typography color="text.secondary">
          Comunicados, sistemas por departamento e documentos internos em uma unica navegacao.
        </Typography>
      </Stack>

      <BannerCarousel banners={hubData.banners} />

      <Stack spacing={2}>
        <Typography variant="h4">Sistemas internos</Typography>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "repeat(2, minmax(0, 1fr))",
              sm: "repeat(4, minmax(0, 1fr))",
              lg: "repeat(8, minmax(0, 1fr))",
            },
            gap: 1.5,
          }}
        >
          {indexedSystems.map((system) => (
            <Button
              key={system.title}
              component="a"
              href={system.href}
              target="_blank"
              rel="noreferrer"
              variant="outlined"
              startIcon={system.icon}
              sx={{
                minHeight: 56,
                borderRadius: 4,
                justifyContent: "flex-start",
                px: 1.75,
                py: 1.25,
                color: "text.primary",
                borderColor: "divider",
                backgroundColor: "background.paper",
                textTransform: "none",
                fontWeight: 600,
                boxShadow: "0 10px 24px rgba(15,76,129,0.06)",
              }}
            >
              {system.title}
            </Button>
          ))}
        </Box>
      </Stack>

      <Stack spacing={2}>
        <Typography variant="h4">Documentos</Typography>
        {visibleDocuments.length === 0 ? (
          <Box
            sx={{
              minHeight: 120,
              borderRadius: 4,
              border: "1px solid",
              borderColor: "divider",
              background:
                "linear-gradient(180deg, rgba(15,76,129,0.03) 0%, rgba(15,76,129,0.01) 100%)",
            }}
          />
        ) : (
          <Grid container spacing={2}>
            {visibleDocuments.map((document) => (
              <Grid key={document.id} size={{ xs: 12, md: 6 }}>
                <Card>
                  <CardContent>
                    <Stack spacing={2}>
                      <Stack
                        direction={{ xs: "column", sm: "row" }}
                        justifyContent="space-between"
                        spacing={1}
                      >
                        <Stack spacing={1}>
                          <Chip
                            size="small"
                            label={document.isRestricted ? "Restrito por area" : "Liberado"}
                            color={document.isRestricted ? "warning" : "success"}
                          />
                          <Typography variant="h5">{document.title}</Typography>
                        </Stack>
                        <Typography color="text.secondary">
                          {formatDate(document.createdAt)}
                        </Typography>
                      </Stack>
                      <Typography color="text.secondary">
                        {document.description || `Categoria: ${document.category}`}
                      </Typography>
                      <Divider />
                      <Stack
                        direction={{ xs: "column", sm: "row" }}
                        justifyContent="space-between"
                        spacing={1}
                      >
                        <Stack spacing={0.5}>
                          <Typography variant="body2" color="text.secondary">
                            {document.fileName}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {formatBytes(document.fileSize)}
                          </Typography>
                        </Stack>
                        <Button
                          href={`/api/documents/${document.id}/download`}
                          variant="contained"
                          startIcon={<DescriptionRoundedIcon />}
                        >
                          Baixar documento
                        </Button>
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Stack>
    </Stack>
  );
}
