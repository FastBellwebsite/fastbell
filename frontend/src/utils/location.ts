import { Store, UserLocation } from '@/types';

export const DEFAULT_CAMPUS_LOCATION: UserLocation = {
  latitude: 11.1271,
  longitude: 76.9966,
  address: 'SNS College of Technology Campus',
  locality: 'SNS Campus',
  city: 'Coimbatore',
  state: 'Tamil Nadu',
  postalCode: '641049'
};

export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  if (lat1 === lat2 && lon1 === lon2) return 0;

  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export function getNearbyStores(
  userLocation: UserLocation | { latitude?: number; longitude?: number } | null | undefined,
  stores: Store[],
  maxRadiusKm = 6
): Store[] {
  const userLat = userLocation?.latitude ?? DEFAULT_CAMPUS_LOCATION.latitude;
  const userLon = userLocation?.longitude ?? DEFAULT_CAMPUS_LOCATION.longitude;

  return stores.filter(store => {
    const storeLat = store.latitude ?? DEFAULT_CAMPUS_LOCATION.latitude;
    const storeLon = store.longitude ?? DEFAULT_CAMPUS_LOCATION.longitude;
    const allowedRadius = store.serviceRadiusKm ?? maxRadiusKm;

    const distance = calculateDistanceKm(
      userLat,
      userLon,
      storeLat,
      storeLon
    );

    return distance <= allowedRadius;
  });
}

export function getDistanceToStore(
  userLocation: UserLocation | { latitude?: number; longitude?: number } | null | undefined,
  store: Store
): number {
  const userLat = userLocation?.latitude ?? DEFAULT_CAMPUS_LOCATION.latitude;
  const userLon = userLocation?.longitude ?? DEFAULT_CAMPUS_LOCATION.longitude;
  const storeLat = store.latitude ?? DEFAULT_CAMPUS_LOCATION.latitude;
  const storeLon = store.longitude ?? DEFAULT_CAMPUS_LOCATION.longitude;

  return calculateDistanceKm(userLat, userLon, storeLat, storeLon);
}

export function getCurrentLocation(): Promise<UserLocation> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      position => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      },
      error => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            reject(new Error('Location permission was denied.'));
            break;
          case error.POSITION_UNAVAILABLE:
            reject(new Error('Your current location is unavailable.'));
            break;
          case error.TIMEOUT:
            reject(new Error('Location request timed out.'));
            break;
          default:
            reject(new Error('Unable to determine your location.'));
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 300000
      }
    );
  });
}
