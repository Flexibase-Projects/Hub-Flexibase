export interface PageFeedback {
  kind: "success" | "error" | "info";
  message: string;
}

export function buildFeedbackUrl(
  pathname: string,
  kind: PageFeedback["kind"],
  message: string
) {
  const [basePath, queryString = ""] = pathname.split("?", 2);
  const params = new URLSearchParams(queryString);
  params.set("kind", kind);
  params.set("message", message);

  return `${basePath}?${params.toString()}`;
}

export async function getPageFeedback(
  searchParamsPromise?: Promise<Record<string, string | string[] | undefined>>
): Promise<PageFeedback | null> {
  if (!searchParamsPromise) {
    return null;
  }

  const searchParams = await searchParamsPromise;
  const kindParam = searchParams.kind;
  const messageParam = searchParams.message;

  if (typeof kindParam !== "string" || typeof messageParam !== "string") {
    return null;
  }

  if (!["success", "error", "info"].includes(kindParam)) {
    return null;
  }

  return {
    kind: kindParam as PageFeedback["kind"],
    message: messageParam,
  };
}
