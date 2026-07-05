import assert from "node:assert/strict";
import test from "node:test";
import {
  mapAladhanTimings,
  mapOpenMeteoAirQuality,
  mapWaqiFeed,
  PARIS_COORDS,
  waqiFeedUrl,
} from "../../lib/live-api-types";

test("mapOpenMeteoAirQuality maps pm25, pm10, aqi, and coords", () => {
  const mapped = mapOpenMeteoAirQuality(
    {
      current: {
        time: "2026-07-05T05:00",
        pm2_5: 4.6,
        pm10: 7.1,
        european_aqi: 14,
      },
    },
    PARIS_COORDS
  );

  assert.ok(mapped);
  assert.equal(mapped.source, "open-meteo");
  assert.equal(mapped.pm25, 4.6);
  assert.equal(mapped.pm10, 7.1);
  assert.equal(mapped.aqi, 14);
  assert.equal(mapped.updatedAt, "2026-07-05T05:00");
  assert.deepEqual(mapped.coords, PARIS_COORDS);
});

test("mapWaqiFeed maps aqi, pm25, city, and updatedAt", () => {
  const mapped = mapWaqiFeed({
    status: "ok",
    data: {
      aqi: 42,
      city: { name: "Paris (Centre)" },
      time: { iso: "2026-07-05T07:00:00+02:00" },
      iaqi: { pm25: { v: 12 } },
    },
  });

  assert.ok(mapped);
  assert.equal(mapped.source, "waqi");
  assert.equal(mapped.aqi, 42);
  assert.equal(mapped.pm25, 12);
  assert.equal(mapped.city, "Paris (Centre)");
  assert.equal(mapped.updatedAt, "2026-07-05T07:00:00+02:00");
});

test("mapAladhanTimings maps prayer timings and date", () => {
  const mapped = mapAladhanTimings({
    code: 200,
    data: {
      timings: {
        Fajr: "04:12",
        Sunrise: "06:01",
        Dhuhr: "13:45",
        Asr: "17:30",
        Maghrib: "21:18",
        Isha: "22:55",
      },
      date: {
        readable: "05 Jul 2026",
        gregorian: { date: "05-07-2026" },
      },
    },
  });

  assert.ok(mapped);
  assert.equal(mapped.source, "aladhan");
  assert.equal(mapped.timings.Fajr, "04:12");
  assert.equal(mapped.timings.Maghrib, "21:18");
  assert.equal(mapped.date?.readable, "05 Jul 2026");
});

test("waqiFeedUrl encodes token and never returns bare key in path segment", () => {
  const url = waqiFeedUrl("abc+token/value");
  assert.match(url, /token=abc%2Btoken%2Fvalue/);
  assert.doesNotMatch(url, /abc\+token\/value/);
});

test("mappers return null for invalid upstream payloads", () => {
  assert.equal(mapOpenMeteoAirQuality(null), null);
  assert.equal(mapWaqiFeed({ status: "error" }), null);
  assert.equal(mapAladhanTimings({ code: 404 }), null);
});
