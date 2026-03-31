const AUTH_COOKIE_MARKERS = ["sb-", "supabase"];
const AUTH_COOKIE_SUFFIXES = ["auth-token", "access-token", "refresh-token"];

export function hasSupabaseAuthCookies(
  cookies: ReadonlyArray<{
    name: string;
  }>
) {
  return cookies.some(({ name }) => {
    const normalizedName = name.toLowerCase();

    return (
      AUTH_COOKIE_MARKERS.some((marker) => normalizedName.includes(marker)) &&
      AUTH_COOKIE_SUFFIXES.some((suffix) => normalizedName.includes(suffix))
    );
  });
}
