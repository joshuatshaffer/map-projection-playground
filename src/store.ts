import { makeStore } from "./Store";
import { degToRad, radToDeg } from "./utils";

export interface MapPlaygroundState {
  mapCenter: {
    /**
     * Radians north of the equator.
     */
    lat: number;

    /**
     * Radians east of the prime meridian.
     */
    lon: number;

    /**
     * Radians east of north.
     */
    heading: number;
  };
}

export const store = makeStore<MapPlaygroundState>(() => {
  const searchParams = new URLSearchParams(window.location.search);

  let lat = Number.parseFloat(searchParams.get("lat") ?? "");
  if (!Number.isFinite(lat)) {
    lat = 0;
  }

  let lon = Number.parseFloat(searchParams.get("lon") ?? "");
  if (!Number.isFinite(lon)) {
    lon = 0;
  }

  let heading = Number.parseFloat(searchParams.get("heading") ?? "");
  if (!Number.isFinite(heading)) {
    heading = 0;
  }

  return {
    mapCenter: {
      lat: degToRad(lat),
      lon: degToRad(lon),
      heading: degToRad(heading),
    },
  };
});

let timeout: number | undefined;

store.subscribe((state) => {
  if (timeout !== undefined) {
    clearTimeout(timeout);
  }

  timeout = setTimeout(() => {
    const searchParams = new URLSearchParams();
    searchParams.set("lat", radToDeg(state.mapCenter.lat).toString());
    searchParams.set("lon", radToDeg(state.mapCenter.lon).toString());
    searchParams.set("heading", radToDeg(state.mapCenter.heading).toString());

    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}?${searchParams.toString()}`
    );
  }, 500);
});
