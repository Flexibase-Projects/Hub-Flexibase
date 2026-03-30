import { Button, Card, CardContent, Stack, Typography } from "@mui/material";

interface EmptyStateProps {
  title: string;
  description: string;
  ctaHref?: string;
  ctaLabel?: string;
}

export function EmptyState({
  title,
  description,
  ctaHref,
  ctaLabel,
}: EmptyStateProps) {
  return (
    <Card>
      <CardContent>
        <Stack spacing={2}>
          <Typography variant="h5">{title}</Typography>
          <Typography color="text.secondary">{description}</Typography>
          {ctaHref && ctaLabel ? (
            <Button href={ctaHref} variant="contained">
              {ctaLabel}
            </Button>
          ) : null}
        </Stack>
      </CardContent>
    </Card>
  );
}
