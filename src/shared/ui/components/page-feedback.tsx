import { Alert } from "@mui/material";

import type { PageFeedback } from "@/shared/lib/feedback";

interface PageFeedbackProps {
  feedback: PageFeedback | null;
}

export function PageFeedbackAlert({ feedback }: PageFeedbackProps) {
  if (!feedback) {
    return null;
  }

  return <Alert severity={feedback.kind}>{feedback.message}</Alert>;
}
