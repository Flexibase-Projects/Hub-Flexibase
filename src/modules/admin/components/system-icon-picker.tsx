"use client";

import { Box, FormControl, InputLabel, MenuItem, Select, Stack, Typography } from "@mui/material";
import type { SelectChangeEvent } from "@mui/material/Select";

import {
  SYSTEM_ICON_OPTIONS,
  normalizeSystemIconKey,
  resolveSystemIcon,
  type SystemIconKey,
} from "@/shared/lib/hub/system-icons";

interface SystemIconPickerProps {
  label: string;
  name: string;
  value: SystemIconKey;
  onChange: (value: SystemIconKey) => void;
  helperText?: string;
}

export function SystemIconPicker({
  label,
  name,
  value,
  onChange,
  helperText,
}: SystemIconPickerProps) {
  const normalizedValue = normalizeSystemIconKey(value);
  const Icon = resolveSystemIcon(normalizedValue);
  const selectedOption =
    SYSTEM_ICON_OPTIONS.find((option) => option.key === normalizedValue) ?? SYSTEM_ICON_OPTIONS[0];

  return (
    <Stack spacing={1.5}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          p: 1.5,
          borderRadius: 2,
          border: "1px solid",
          borderColor: "divider",
          background:
            "linear-gradient(180deg, rgba(15,76,129,0.05) 0%, rgba(15,76,129,0.02) 100%)",
        }}
      >
        <Box
          sx={{
            width: 44,
            height: 44,
            display: "grid",
            placeItems: "center",
            borderRadius: 2,
            bgcolor: "background.paper",
            border: "1px solid",
            borderColor: "divider",
            color: "primary.main",
            flexShrink: 0,
          }}
        >
          <Icon fontSize="small" />
        </Box>
        <Stack spacing={0.2}>
          <Typography variant="body2" sx={{ fontWeight: 700 }}>
            {selectedOption.label}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Chave do icone: {normalizedValue}
          </Typography>
        </Stack>
      </Box>

      <FormControl fullWidth size="small">
        <InputLabel id={`${name}-label`}>{label}</InputLabel>
        <Select
          labelId={`${name}-label`}
          name={name}
          label={label}
          value={normalizedValue}
          onChange={(event: SelectChangeEvent) =>
            onChange(normalizeSystemIconKey(event.target.value))
          }
        >
          {SYSTEM_ICON_OPTIONS.map((option) => {
            const OptionIcon = option.Icon;

            return (
              <MenuItem key={option.key} value={option.key}>
                <Stack direction="row" spacing={1.25} alignItems="center">
                  <OptionIcon fontSize="small" />
                  <Typography variant="body2">{option.label}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {option.key}
                  </Typography>
                </Stack>
              </MenuItem>
            );
          })}
        </Select>
      </FormControl>

      {helperText ? (
        <Typography variant="caption" color="text.secondary">
          {helperText}
        </Typography>
      ) : null}
    </Stack>
  );
}
