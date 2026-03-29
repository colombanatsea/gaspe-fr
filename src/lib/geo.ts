/**
 * Geographic distance utilities — Haversine formula.
 */

const EARTH_RADIUS_KM = 6371;

/** Convert degrees to radians. */
function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Calculate distance in km between two lat/lng points using Haversine formula. */
export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Available radius options in km. */
export const RADIUS_OPTIONS = [10, 25, 50, 100, 200, 500] as const;

/** Get user's current position via browser Geolocation API. Returns [lat, lng]. */
export function getCurrentPosition(): Promise<[number, number]> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Géolocalisation non disponible dans ce navigateur."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve([pos.coords.latitude, pos.coords.longitude]),
      (err) => {
        switch (err.code) {
          case err.PERMISSION_DENIED:
            reject(new Error("Accès à la géolocalisation refusé."));
            break;
          case err.POSITION_UNAVAILABLE:
            reject(new Error("Position indisponible."));
            break;
          default:
            reject(new Error("Erreur de géolocalisation."));
        }
      },
      { enableHighAccuracy: false, timeout: 10000 }
    );
  });
}
