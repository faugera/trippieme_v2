import type { TripRequest } from './trip-schema';

export function getLogisticsContext(trip: TripRequest) {
  const toReadyTime = (dateTime?: string, bufferMinutes = 0) => {
    if (!dateTime) return undefined;
    return new Date(new Date(dateTime).getTime() + bufferMinutes * 60_000).toISOString();
  };
  const toLeaveTime = (dateTime?: string, bufferMinutes = 0) => {
    if (!dateTime) return undefined;
    return new Date(new Date(dateTime).getTime() - bufferMinutes * 60_000).toISOString();
  };
  return {
    arrivalAvailableAt: toReadyTime(trip.arrival?.dateTime, trip.arrival?.bufferMinutes),
    departureMustLeaveAt: toLeaveTime(trip.departure?.dateTime, trip.departure?.bufferMinutes),
    firstAccommodation: trip.cities[0]?.accommodation?.address ?? trip.cities[0]?.accommodation?.label,
    finalAccommodation: trip.cities.at(-1)?.accommodation?.address ?? trip.cities.at(-1)?.accommodation?.label,
  };
}
