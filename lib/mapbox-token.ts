/** Public Mapbox token for client-side map rendering (pk.*). */
export function getMapboxPublicToken(): string | undefined {
  const token =
    process.env.NEXT_PUBLIC_MAPBOX_TOKEN?.trim() ||
    process.env.VITE_MAPBOX_TOKEN?.trim();
  return token || undefined;
}
