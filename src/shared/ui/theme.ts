"use client";

import { alpha, createTheme } from "@mui/material/styles";

export const appTheme = createTheme({
  cssVariables: true,
  shape: {
    borderRadius: 4,
  },
  palette: {
    mode: "light",
    primary: {
      main: "#0F4C81",
      dark: "#09365B",
      light: "#D7E7F5",
    },
    secondary: {
      main: "#F59E0B",
      dark: "#C97A00",
      light: "#FEF3C7",
    },
    success: {
      main: "#18794E",
    },
    warning: {
      main: "#C87000",
    },
    error: {
      main: "#B42318",
    },
    background: {
      default: "#F3F6FA",
      paper: "#FFFFFF",
    },
    text: {
      primary: "#10243E",
      secondary: "#516275",
    },
  },
  typography: {
    fontFamily: "var(--font-body), sans-serif",
    h1: {
      fontFamily: "var(--font-display), sans-serif",
      fontWeight: 700,
      letterSpacing: "-0.03em",
    },
    h2: {
      fontFamily: "var(--font-display), sans-serif",
      fontWeight: 700,
      letterSpacing: "-0.03em",
    },
    h3: {
      fontFamily: "var(--font-display), sans-serif",
      fontWeight: 700,
      letterSpacing: "-0.02em",
    },
    h4: {
      fontFamily: "var(--font-display), sans-serif",
      fontWeight: 700,
    },
    button: {
      fontWeight: 700,
      textTransform: "none",
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          border: `1px solid ${alpha("#0F4C81", 0.08)}`,
          boxShadow: "0 14px 32px rgba(15, 76, 129, 0.08)",
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: "8px",
          paddingInline: 18,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: "8px",
        },
      },
    },
  },
});
