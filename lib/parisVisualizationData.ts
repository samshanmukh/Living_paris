export type Coordinate = [number, number];

export type SenseKind = "vision" | "sound" | "route" | "alert";

export type SenseMediaImage = {
  url: string;
  alt: string;
  placeName: string;
  credit: string;
  licenseHint: string;
  streetView?: {
    coordinate: Coordinate;
    heading: number;
    pitch: number;
    fov: number;
  };
};

export type SenseAudioWaveform = {
  seed: string;
  peaks: number[];
};

export type SenseMediaAudio = {
  simulated: true;
  label: string;
  durationSeconds: number;
  sampleRateHz: number;
  loudnessDb: number;
  waveform: SenseAudioWaveform;
};

export type SenseNodeMedia = {
  image: SenseMediaImage;
  audio: SenseMediaAudio;
};

export type SenseContributor = {
  id: string;
  role: "camera" | "microphone" | "mobility-guide" | "place-steward";
  freshnessSeconds: number;
};

export type SenseNode = {
  id: string;
  name: string;
  kind: SenseKind;
  coordinate: Coordinate;
  bearing: number;
  confidence: number;
  summary: string;
  detail: string;
  contributor?: SenseContributor;
  media?: SenseNodeMedia;
};

export type SceneId = "borrowed-senses" | "rainy-day" | "date-night" | "hidden-gems";

export type SceneDefinition = {
  id: SceneId;
  label: string;
  icon: string;
  command: string;
  headline: string;
  description: string;
  center: Coordinate;
  zoom: number;
  pitch: number;
  bearing: number;
  accent: [number, number, number];
};

export type Venue = {
  id: string;
  name: string;
  coordinate: Coordinate;
  category: string;
  score: number;
  rank?: number;
  reason?: string;
  walkMinutes?: number;
  indoor?: boolean;
};

export type RiskZone = {
  id: string;
  label: string;
  coordinate: Coordinate;
  radiusMeters: number;
  color: [number, number, number, number];
};

export type SceneIntentToken = {
  label: string;
  value: string;
};

export type SceneMetric = {
  label: string;
  value: string;
  tone: "route" | "places" | "risk" | "senses";
};

export type SceneMapState = {
  sceneId: SceneId;
  status: string;
  reply: string;
  routePath: Coordinate[];
  venues: Venue[];
  riskZones: RiskZone[];
  intent: SceneIntentToken[];
  metrics: SceneMetric[];
};

export const parisCenter: Coordinate = [2.3522, 48.8566];

export const scenes: SceneDefinition[] = [
  {
    id: "borrowed-senses",
    label: "Borrowed Senses",
    icon: "Radio",
    command: "I am blind near the Eiffel Tower. Take me to Trocadero.",
    headline: "Paris becomes a live sensory mesh.",
    description:
      "Contributor phones become opt-in eyes and ears. The map shows verified sense packets, safe-route confidence, and the uncertainty fog around the user.",
    center: [2.2945, 48.8584],
    zoom: 15.15,
    pitch: 63,
    bearing: -24,
    accent: [108, 229, 255]
  },
  {
    id: "rainy-day",
    label: "Rainy Day",
    icon: "CloudRain",
    command: "It is raining and I have two hours before my train.",
    headline: "The city reshapes around weather and time.",
    description:
      "Covered passages, metro exits, indoor stops, and short dry walks are prioritized while exposed routes fade into the background.",
    center: [2.3376, 48.8718],
    zoom: 14.65,
    pitch: 58,
    bearing: 20,
    accent: [75, 141, 255]
  },
  {
    id: "date-night",
    label: "Date Night",
    icon: "Sparkles",
    command: "Plan a cinematic date night under 60 euros.",
    headline: "Recommendations become animated city choreography.",
    description:
      "The map stages a route through terraces, river edges, and night-view stops, with glowing candidates and a cinematic camera path.",
    center: [2.343, 48.8552],
    zoom: 14.55,
    pitch: 61,
    bearing: -38,
    accent: [255, 106, 169]
  },
  {
    id: "hidden-gems",
    label: "Hidden Gems",
    icon: "Map",
    command: "Show me quiet local places tourists miss.",
    headline: "The obvious city fades; the hidden city lights up.",
    description:
      "Dense tourist paths recede while tiny parks, remarkable trees, passages, and local-only clusters surface as animated discoveries.",
    center: [2.3631, 48.8655],
    zoom: 14.85,
    pitch: 62,
    bearing: 33,
    accent: [97, 240, 162]
  }
];

export const routePath: Coordinate[] = [
  [2.2945, 48.8584],
  [2.2937, 48.8589],
  [2.2927, 48.85945],
  [2.29135, 48.86013],
  [2.28972, 48.86092],
  [2.2886, 48.86162]
];

export const userPosition: Coordinate = [2.2945, 48.8584];

const commonsFilePath = (encodedFileName: string) =>
  `https://commons.wikimedia.org/wiki/Special:FilePath/${encodedFileName}?width=900`;

const commonsCredit = "Wikimedia Commons Special:FilePath";
const commonsLicenseHint = "Commons-hosted media; verify the file page attribution before reuse.";

type ParisPlaceImageKey =
  | "chatelet"
  | "fontainePalmier"
  | "fontaineInnocents"
  | "saintEustache"
  | "tourSaintJacques"
  | "pontAuChange"
  | "conciergerie"
  | "sainteChapelle"
  | "hotelDeVille"
  | "pontNeuf"
  | "vertGalant"
  | "samaritaine"
  | "eiffelTower"
  | "trocadero"
  | "birHakeim"
  | "champDeMars";

const parisPlaceImages: Record<ParisPlaceImageKey, SenseMediaImage> = {
  chatelet: {
    url: commonsFilePath(
      "Plaza_del_Ch%C3%A2telet%2C_Par%C3%ADs%2C_Francia%2C_2022-10-29%2C_DD_133.jpg"
    ),
    alt: "Place du Chatelet and Fontaine du Palmier in central Paris.",
    placeName: "Place du Chatelet",
    credit: commonsCredit,
    licenseHint: commonsLicenseHint
  },
  fontainePalmier: {
    url: commonsFilePath("Paris_1_-_Fontaine_du_Palmier.jpg"),
    alt: "Fontaine du Palmier at Place du Chatelet.",
    placeName: "Fontaine du Palmier",
    credit: commonsCredit,
    licenseHint: commonsLicenseHint
  },
  fontaineInnocents: {
    url: commonsFilePath("Fontaine_des_Innocents%2C_2011.JPG"),
    alt: "Fontaine des Innocents in Les Halles.",
    placeName: "Fontaine des Innocents",
    credit: commonsCredit,
    licenseHint: commonsLicenseHint
  },
  saintEustache: {
    url: commonsFilePath("St.-Eustache.jpg"),
    alt: "Saint-Eustache church near Les Halles.",
    placeName: "Saint-Eustache",
    credit: commonsCredit,
    licenseHint: commonsLicenseHint
  },
  tourSaintJacques: {
    url: commonsFilePath("Tour_Saint-Jacques_2008.jpg"),
    alt: "Tour Saint-Jacques near Rue de Rivoli.",
    placeName: "Tour Saint-Jacques",
    credit: commonsCredit,
    licenseHint: commonsLicenseHint
  },
  pontAuChange: {
    url: commonsFilePath("Pont_au_Change%2C_East_View_from_%C3%8Ele_de_la_Cit%C3%A9_140320_1.jpg"),
    alt: "Pont au Change from Ile de la Cite.",
    placeName: "Pont au Change",
    credit: commonsCredit,
    licenseHint: commonsLicenseHint
  },
  conciergerie: {
    url: commonsFilePath("Paris_Conciergerie_265.jpg"),
    alt: "The Conciergerie on Ile de la Cite.",
    placeName: "Conciergerie",
    credit: commonsCredit,
    licenseHint: commonsLicenseHint
  },
  sainteChapelle: {
    url: commonsFilePath("Sainte_Chapelle_-_Upper_level_1.jpg"),
    alt: "Upper chapel interior of Sainte-Chapelle.",
    placeName: "Sainte-Chapelle",
    credit: commonsCredit,
    licenseHint: commonsLicenseHint
  },
  hotelDeVille: {
    url: commonsFilePath("H%C3%B4tel_ville_fa%C3%A7ade_principale_Paris_11.jpg"),
    alt: "Main facade of Paris Hotel de Ville.",
    placeName: "Hotel de Ville",
    credit: commonsCredit,
    licenseHint: commonsLicenseHint
  },
  pontNeuf: {
    url: commonsFilePath(
      "The_western_sides_of_the_%C3%8Ele_de_la_Cit%C3%A9_and_the_Pont_Neuf%2C_14_July_2008.jpg"
    ),
    alt: "Pont Neuf and the western tip of Ile de la Cite.",
    placeName: "Pont Neuf",
    credit: commonsCredit,
    licenseHint: commonsLicenseHint
  },
  vertGalant: {
    url: commonsFilePath("Le_Vert_galant.jpg"),
    alt: "Square du Vert-Galant at the western tip of Ile de la Cite.",
    placeName: "Square du Vert-Galant",
    credit: commonsCredit,
    licenseHint: commonsLicenseHint
  },
  samaritaine: {
    url: commonsFilePath("La_Samaritaine_rue_de_la_Monnaie_2.jpg"),
    alt: "La Samaritaine on Rue de la Monnaie.",
    placeName: "La Samaritaine",
    credit: commonsCredit,
    licenseHint: commonsLicenseHint
  },
  eiffelTower: {
    url: commonsFilePath("Tour_Eiffel_Wikimedia_Commons.jpg"),
    alt: "Street-level view toward the Eiffel Tower from the surrounding plaza.",
    placeName: "Eiffel Tower",
    credit: commonsCredit,
    licenseHint: commonsLicenseHint,
    streetView: {
      coordinate: [2.29472, 48.85821],
      heading: 322,
      pitch: 8,
      fov: 78
    }
  },
  trocadero: {
    url: commonsFilePath("Trocadero_2016_%284%29.jpg"),
    alt: "Trocadero gardens facing the Eiffel Tower.",
    placeName: "Trocadero Gardens",
    credit: commonsCredit,
    licenseHint: commonsLicenseHint
  },
  birHakeim: {
    url: commonsFilePath("P1080370_Paris_VII-XV-XVI_pont_de_Bir_Hakeim_rwk.JPG"),
    alt: "Pont de Bir-Hakeim near the Eiffel Tower.",
    placeName: "Pont de Bir-Hakeim",
    credit: commonsCredit,
    licenseHint: commonsLicenseHint
  },
  champDeMars: {
    url: commonsFilePath("Champ_de_Mars_from_the_Eiffel_Tower_-_July_2006.jpg"),
    alt: "Champ de Mars park near the Eiffel Tower.",
    placeName: "Champ de Mars",
    credit: commonsCredit,
    licenseHint: commonsLicenseHint
  }
};

const makeAudio = ({
  label,
  durationSeconds,
  loudnessDb,
  seed,
  peaks
}: {
  label: string;
  durationSeconds: number;
  loudnessDb: number;
  seed: string;
  peaks: number[];
}): SenseMediaAudio => ({
  simulated: true,
  label,
  durationSeconds,
  sampleRateHz: 48_000,
  loudnessDb,
  waveform: {
    seed,
    peaks
  }
});

export const senseNodes: SenseNode[] = [
  {
    id: "eiffel-phone-1",
    name: "Eiffel Tower phone camera",
    kind: "vision",
    coordinate: [2.2945, 48.8584],
    bearing: 285,
    confidence: 0.92,
    summary: "Phone camera is live",
    detail: "User phone shows the Eiffel Tower plaza edge and a clear pedestrian line.",
    contributor: { id: "self-phone", role: "camera", freshnessSeconds: 3 },
    media: {
      image: parisPlaceImages.eiffelTower,
      audio: makeAudio({
        label: "open plaza ambience with traffic and tourist voices",
        durationSeconds: 12.4,
        loudnessDb: -17,
        seed: "eiffel-self-phone-001",
        peaks: [0.24, 0.38, 0.52, 0.47, 0.66, 0.58, 0.44, 0.3]
      })
    }
  },
  {
    id: "eiffel-sound-1",
    name: "Pont d'Iena crossing audio",
    kind: "sound",
    coordinate: [2.29265, 48.85958],
    bearing: 312,
    confidence: 0.86,
    summary: "Traffic passes left",
    detail: "Contributor detects a bus wash and crowd movement near the Pont d'Iena crossing.",
    contributor: { id: "mic-e12", role: "microphone", freshnessSeconds: 12 },
    media: {
      image: parisPlaceImages.eiffelTower,
      audio: makeAudio({
        label: "bus pass, crowd voices, and low river traffic",
        durationSeconds: 10.6,
        loudnessDb: -13,
        seed: "pont-iena-traffic-left-931",
        peaks: [0.28, 0.61, 0.78, 0.69, 0.46, 0.52, 0.37, 0.25]
      })
    }
  },
  {
    id: "eiffel-route-1",
    name: "Trocadero guide point",
    kind: "route",
    coordinate: [2.2886, 48.86162],
    bearing: 118,
    confidence: 0.89,
    summary: "Destination side is visible",
    detail: "Contributor sees a clear line through the gardens toward the Trocadero viewpoint.",
    contributor: { id: "guide-troca-4", role: "mobility-guide", freshnessSeconds: 21 },
    media: {
      image: parisPlaceImages.trocadero,
      audio: makeAudio({
        label: "tourist crowd, fountain wash, and open plaza echo",
        durationSeconds: 13.1,
        loudnessDb: -16,
        seed: "trocadero-guide-open-22a",
        peaks: [0.22, 0.33, 0.44, 0.49, 0.57, 0.4, 0.31, 0.26]
      })
    }
  },
  {
    id: "eiffel-alert-1",
    name: "Quai Branly scooter alert",
    kind: "alert",
    coordinate: [2.29725, 48.86012],
    bearing: 74,
    confidence: 0.81,
    summary: "Scooter lane is active",
    detail: "Phone contributor flags fast scooter motion along the museum-side edge.",
    contributor: { id: "cam-branly-8", role: "camera", freshnessSeconds: 18 },
    media: {
      image: parisPlaceImages.eiffelTower,
      audio: makeAudio({
        label: "scooter motor sweep with crowd bed",
        durationSeconds: 8.7,
        loudnessDb: -12,
        seed: "branly-scooter-71f",
        peaks: [0.18, 0.35, 0.82, 0.7, 0.43, 0.39, 0.3, 0.19]
      })
    }
  },
  {
    id: "eiffel-vision-2",
    name: "Champ de Mars edge",
    kind: "vision",
    coordinate: [2.29892, 48.8562],
    bearing: 45,
    confidence: 0.87,
    summary: "Park edge is open",
    detail: "Contributor camera shows a wide pedestrian edge with benches on the right.",
    contributor: { id: "cam-mars-2", role: "camera", freshnessSeconds: 26 },
    media: {
      image: parisPlaceImages.champDeMars,
      audio: makeAudio({
        label: "open park chatter with distant traffic",
        durationSeconds: 11.8,
        loudnessDb: -24,
        seed: "champ-mars-open-edge-682",
        peaks: [0.12, 0.2, 0.3, 0.28, 0.34, 0.31, 0.22, 0.17]
      })
    }
  },
  {
    id: "eiffel-route-2",
    name: "Bir-Hakeim handoff",
    kind: "route",
    coordinate: [2.28772, 48.85586],
    bearing: 20,
    confidence: 0.84,
    summary: "Bridge handoff available",
    detail: "Contributor marks the bridge approach as a stable handoff point near the Seine.",
    contributor: { id: "guide-bir-6", role: "mobility-guide", freshnessSeconds: 32 },
    media: {
      image: parisPlaceImages.birHakeim,
      audio: makeAudio({
        label: "metro rumble above, river wash, light traffic below",
        durationSeconds: 14.3,
        loudnessDb: -18,
        seed: "bir-hakeim-handoff-4dc",
        peaks: [0.2, 0.26, 0.42, 0.5, 0.45, 0.31, 0.28, 0.22]
      })
    }
  },
  {
    id: "vision-1",
    name: "Rue Berger scan",
    kind: "vision",
    coordinate: [2.34842, 48.85892],
    bearing: 112,
    confidence: 0.91,
    summary: "Crosswalk is clear",
    detail: "Two contributors confirm curb cut and open pedestrian signal.",
    contributor: { id: "cam-a17", role: "camera", freshnessSeconds: 19 },
    media: {
      image: parisPlaceImages.fontaineInnocents,
      audio: makeAudio({
        label: "soft crossing chirp with rolling suitcase wheels",
        durationSeconds: 8.4,
        loudnessDb: -21,
        seed: "rue-berger-clear-8f31",
        peaks: [0.12, 0.22, 0.18, 0.41, 0.38, 0.26, 0.34, 0.21]
      })
    }
  },
  {
    id: "sound-1",
    name: "Forum exit audio",
    kind: "sound",
    coordinate: [2.34654, 48.86101],
    bearing: 196,
    confidence: 0.84,
    summary: "Crowd noise ahead",
    detail: "Dense crowd detected near mall entrance, route shifts left.",
    contributor: { id: "mic-h21", role: "microphone", freshnessSeconds: 27 },
    media: {
      image: parisPlaceImages.saintEustache,
      audio: makeAudio({
        label: "layered voices under the Les Halles canopy",
        durationSeconds: 11.2,
        loudnessDb: -14,
        seed: "forum-exit-crowd-b9a2",
        peaks: [0.46, 0.58, 0.73, 0.69, 0.82, 0.61, 0.77, 0.55]
      })
    }
  },
  {
    id: "alert-1",
    name: "Scooter obstacle",
    kind: "alert",
    coordinate: [2.34964, 48.85756],
    bearing: 75,
    confidence: 0.88,
    summary: "Sidewalk partially blocked",
    detail: "Obstacle reported on right edge; stay left for 22 meters.",
    contributor: { id: "guide-m04", role: "mobility-guide", freshnessSeconds: 34 },
    media: {
      image: parisPlaceImages.tourSaintJacques,
      audio: makeAudio({
        label: "brief brake squeal and two bell taps",
        durationSeconds: 6.6,
        loudnessDb: -18,
        seed: "scooter-rivoli-left-44d0",
        peaks: [0.2, 0.33, 0.86, 0.48, 0.27, 0.52, 0.39, 0.18]
      })
    }
  },
  {
    id: "route-1",
    name: "Station exit guide",
    kind: "route",
    coordinate: [2.35112, 48.85678],
    bearing: 310,
    confidence: 0.79,
    summary: "Entrance verified",
    detail: "Doorway is visible, low congestion, audible crossing nearby.",
    contributor: { id: "cam-c09", role: "camera", freshnessSeconds: 42 },
    media: {
      image: parisPlaceImages.chatelet,
      audio: makeAudio({
        label: "metro stairwell hum with clear step cadence",
        durationSeconds: 9.8,
        loudnessDb: -19,
        seed: "station-exit-open-1c72",
        peaks: [0.24, 0.29, 0.35, 0.31, 0.42, 0.33, 0.28, 0.25]
      })
    }
  },
  {
    id: "vision-2",
    name: "Palmier curb check",
    kind: "vision",
    coordinate: [2.34736, 48.85764],
    bearing: 188,
    confidence: 0.93,
    summary: "Median edge visible",
    detail: "Phone camera sees the island curb and a clean gap before the theatre-side crossing.",
    contributor: { id: "cam-p31", role: "camera", freshnessSeconds: 15 },
    media: {
      image: parisPlaceImages.fontainePalmier,
      audio: makeAudio({
        label: "fountain splash masked by low taxi traffic",
        durationSeconds: 7.9,
        loudnessDb: -20,
        seed: "palmier-curb-gap-95ab",
        peaks: [0.18, 0.26, 0.32, 0.3, 0.44, 0.29, 0.22, 0.19]
      })
    }
  },
  {
    id: "sound-2",
    name: "Chatelet theatre arcade",
    kind: "sound",
    coordinate: [2.34805, 48.85772],
    bearing: 86,
    confidence: 0.82,
    summary: "Arcade echo is calm",
    detail: "Reflections under the theatre arcade are steady with no sudden crowd compression.",
    contributor: { id: "mic-t18", role: "microphone", freshnessSeconds: 31 },
    media: {
      image: parisPlaceImages.chatelet,
      audio: makeAudio({
        label: "stone arcade reverb with sparse footfalls",
        durationSeconds: 10.5,
        loudnessDb: -23,
        seed: "theatre-arcade-calm-e201",
        peaks: [0.16, 0.2, 0.24, 0.19, 0.22, 0.28, 0.21, 0.17]
      })
    }
  },
  {
    id: "route-2",
    name: "Pont au Change handrail",
    kind: "route",
    coordinate: [2.3467, 48.8566],
    bearing: 205,
    confidence: 0.87,
    summary: "Bridge edge aligned",
    detail: "Contributor confirms a continuous rail line and clear pavement toward Ile de la Cite.",
    contributor: { id: "guide-b12", role: "mobility-guide", freshnessSeconds: 24 },
    media: {
      image: parisPlaceImages.pontAuChange,
      audio: makeAudio({
        label: "river wash below regular bridge traffic",
        durationSeconds: 12,
        loudnessDb: -17,
        seed: "pont-change-rail-6a18",
        peaks: [0.28, 0.35, 0.31, 0.4, 0.46, 0.37, 0.33, 0.3]
      })
    }
  },
  {
    id: "vision-3",
    name: "Tour Saint-Jacques sightline",
    kind: "vision",
    coordinate: [2.34884, 48.85809],
    bearing: 24,
    confidence: 0.89,
    summary: "Open plaza diagonal",
    detail: "Camera frame shows a diagonal walking line with benches on the left as fixed anchors.",
    contributor: { id: "cam-j07", role: "camera", freshnessSeconds: 38 },
    media: {
      image: parisPlaceImages.tourSaintJacques,
      audio: makeAudio({
        label: "park edge birds, bus pass, then open air",
        durationSeconds: 9.1,
        loudnessDb: -25,
        seed: "tour-saint-jacques-open-52ce",
        peaks: [0.12, 0.17, 0.21, 0.48, 0.34, 0.2, 0.16, 0.14]
      })
    }
  },
  {
    id: "alert-2",
    name: "Rivoli bus wash",
    kind: "alert",
    coordinate: [2.35072, 48.85706],
    bearing: 64,
    confidence: 0.77,
    summary: "Bus lane audible right",
    detail: "Audio packet detects a close bus pass; keep the next segment tighter to the building line.",
    contributor: { id: "mic-r33", role: "microphone", freshnessSeconds: 22 },
    media: {
      image: parisPlaceImages.hotelDeVille,
      audio: makeAudio({
        label: "compressed bus hiss crossing Rue de Rivoli",
        durationSeconds: 6.2,
        loudnessDb: -11,
        seed: "rivoli-bus-wash-cc40",
        peaks: [0.21, 0.62, 0.88, 0.8, 0.54, 0.32, 0.22, 0.18]
      })
    }
  },
  {
    id: "sound-3",
    name: "Hotel de Ville plaza",
    kind: "sound",
    coordinate: [2.3525, 48.8564],
    bearing: 102,
    confidence: 0.81,
    summary: "Wide plaza echo",
    detail: "Low echo density suggests an open crossing area with no close obstacles in the frame.",
    contributor: { id: "mic-v08", role: "microphone", freshnessSeconds: 47 },
    media: {
      image: parisPlaceImages.hotelDeVille,
      audio: makeAudio({
        label: "broad plaza reflections and distant siren tail",
        durationSeconds: 13.4,
        loudnessDb: -24,
        seed: "hotel-ville-plaza-0d7b",
        peaks: [0.14, 0.18, 0.2, 0.26, 0.31, 0.24, 0.19, 0.15]
      })
    }
  },
  {
    id: "vision-4",
    name: "Conciergerie quay scan",
    kind: "vision",
    coordinate: [2.3456, 48.8564],
    bearing: 278,
    confidence: 0.86,
    summary: "Quay wall is clear",
    detail: "Contributor verifies the stone edge is continuous and the pedestrian lane is unobstructed.",
    contributor: { id: "cam-q14", role: "camera", freshnessSeconds: 29 },
    media: {
      image: parisPlaceImages.conciergerie,
      audio: makeAudio({
        label: "river edge ambience with occasional bicycle freewheel",
        durationSeconds: 8.7,
        loudnessDb: -26,
        seed: "conciergerie-quay-clear-d118",
        peaks: [0.1, 0.14, 0.19, 0.16, 0.24, 0.2, 0.13, 0.12]
      })
    }
  },
  {
    id: "route-3",
    name: "Sainte-Chapelle queue gap",
    kind: "route",
    coordinate: [2.345, 48.85528],
    bearing: 352,
    confidence: 0.74,
    summary: "Queue narrows path",
    detail: "Manual confirmation recommends a right-side bypass around the security queue.",
    contributor: { id: "guide-s19", role: "mobility-guide", freshnessSeconds: 53 },
    media: {
      image: parisPlaceImages.sainteChapelle,
      audio: makeAudio({
        label: "muffled courtyard voices and short barrier rattles",
        durationSeconds: 7.3,
        loudnessDb: -22,
        seed: "sainte-chapelle-queue-a607",
        peaks: [0.19, 0.27, 0.34, 0.29, 0.5, 0.37, 0.22, 0.18]
      })
    }
  },
  {
    id: "sound-4",
    name: "Samaritaine frontage",
    kind: "sound",
    coordinate: [2.34208, 48.85889],
    bearing: 12,
    confidence: 0.8,
    summary: "Retail doorway active",
    detail: "Audio suggests door swings and delivery cart movement near the Rue de la Monnaie frontage.",
    contributor: { id: "mic-m26", role: "microphone", freshnessSeconds: 36 },
    media: {
      image: parisPlaceImages.samaritaine,
      audio: makeAudio({
        label: "automatic doors, cart wheels, clipped conversation",
        durationSeconds: 10.1,
        loudnessDb: -18,
        seed: "samaritaine-frontage-f5be",
        peaks: [0.22, 0.31, 0.47, 0.42, 0.36, 0.51, 0.3, 0.24]
      })
    }
  },
  {
    id: "vision-5",
    name: "Pont Neuf crossing",
    kind: "vision",
    coordinate: [2.34167, 48.8575],
    bearing: 245,
    confidence: 0.9,
    summary: "Island refuge confirmed",
    detail: "Camera view confirms the island refuge and a safe pause before the second span.",
    contributor: { id: "cam-n03", role: "camera", freshnessSeconds: 18 },
    media: {
      image: parisPlaceImages.pontNeuf,
      audio: makeAudio({
        label: "open river wind with separated traffic lanes",
        durationSeconds: 12.8,
        loudnessDb: -20,
        seed: "pont-neuf-refuge-9a64",
        peaks: [0.16, 0.25, 0.33, 0.39, 0.36, 0.29, 0.24, 0.2]
      })
    }
  },
  {
    id: "route-4",
    name: "Vert-Galant quiet edge",
    kind: "route",
    coordinate: [2.34, 48.85722],
    bearing: 130,
    confidence: 0.83,
    summary: "Quiet pause available",
    detail: "Place steward marks a low-conflict pause point below bridge level for recalibration.",
    contributor: { id: "steward-g02", role: "place-steward", freshnessSeconds: 61 },
    media: {
      image: parisPlaceImages.vertGalant,
      audio: makeAudio({
        label: "low river wake and distant bridge traffic",
        durationSeconds: 14.2,
        loudnessDb: -28,
        seed: "vert-galant-pause-77fa",
        peaks: [0.08, 0.12, 0.11, 0.16, 0.19, 0.14, 0.1, 0.09]
      })
    }
  },
  {
    id: "vision-6",
    name: "Saint-Eustache south side",
    kind: "vision",
    coordinate: [2.345, 48.86333],
    bearing: 156,
    confidence: 0.88,
    summary: "Garden path visible",
    detail: "Contributor sees a continuous path edge along the church garden toward Les Halles.",
    contributor: { id: "cam-e22", role: "camera", freshnessSeconds: 45 },
    media: {
      image: parisPlaceImages.saintEustache,
      audio: makeAudio({
        label: "church-side plaza murmur with light skateboard roll",
        durationSeconds: 9.5,
        loudnessDb: -23,
        seed: "saint-eustache-path-308d",
        peaks: [0.13, 0.2, 0.28, 0.25, 0.41, 0.31, 0.22, 0.17]
      })
    }
  },
  {
    id: "alert-3",
    name: "Innocents fountain crowd split",
    kind: "alert",
    coordinate: [2.348011, 48.86065],
    bearing: 42,
    confidence: 0.8,
    summary: "Crowd splits around fountain",
    detail: "Vision packet flags crossing pedestrians on both sides; route holds for a cleaner gap.",
    contributor: { id: "cam-i11", role: "camera", freshnessSeconds: 25 },
    media: {
      image: parisPlaceImages.fontaineInnocents,
      audio: makeAudio({
        label: "fountain wash with two crossing voice clusters",
        durationSeconds: 8.9,
        loudnessDb: -17,
        seed: "innocents-crowd-split-61bc",
        peaks: [0.24, 0.34, 0.48, 0.57, 0.43, 0.52, 0.37, 0.25]
      })
    }
  },
  {
    id: "route-5",
    name: "Rue Saint-Denis tactile line",
    kind: "route",
    coordinate: [2.34918, 48.85986],
    bearing: 1,
    confidence: 0.76,
    summary: "Tactile edge intermittent",
    detail: "Manual route contributor reports a usable but broken tactile edge north of Rue Berger.",
    contributor: { id: "guide-d16", role: "mobility-guide", freshnessSeconds: 58 },
    media: {
      image: parisPlaceImages.fontaineInnocents,
      audio: makeAudio({
        label: "narrow street footsteps, scooter idle, shop door chime",
        durationSeconds: 11.7,
        loudnessDb: -16,
        seed: "saint-denis-tactile-2f90",
        peaks: [0.18, 0.29, 0.44, 0.37, 0.53, 0.46, 0.32, 0.21]
      })
    }
  }
];

export const venues: Venue[] = [
  {
    id: "venue-1",
    name: "Safe pause point",
    coordinate: [2.348, 48.85918],
    category: "verified stop",
    score: 94,
    rank: 1,
    reason: "Wide curb cut and low obstacle confidence.",
    walkMinutes: 2
  },
  {
    id: "venue-2",
    name: "Metro fallback",
    coordinate: [2.3468, 48.85823],
    category: "escape route",
    score: 88,
    rank: 2,
    reason: "Fast shelter if crowd density increases.",
    walkMinutes: 4,
    indoor: true
  },
  {
    id: "venue-3",
    name: "Calm handoff zone",
    coordinate: [2.35069, 48.85717],
    category: "low conflict",
    score: 82,
    rank: 3,
    reason: "Contributor handoff point with stable audio.",
    walkMinutes: 6
  }
];

export const riskZones: RiskZone[] = [
  {
    id: "crowd-forum",
    label: "Crowd uncertainty",
    coordinate: [2.34632, 48.86042],
    radiusMeters: 135,
    color: [255, 106, 169, 55]
  },
  {
    id: "traffic-rivoli",
    label: "Traffic sound field",
    coordinate: [2.35101, 48.85669],
    radiusMeters: 110,
    color: [255, 85, 85, 62]
  },
  {
    id: "safe-bubble",
    label: "Verified safe bubble",
    coordinate: [2.34875, 48.85863],
    radiusMeters: 170,
    color: [108, 229, 255, 42]
  }
];

const rainyRoutePath: Coordinate[] = [
  [2.3376, 48.8718],
  [2.33886, 48.87072],
  [2.34015, 48.87006],
  [2.34248, 48.87036],
  [2.34382, 48.87104],
  [2.34605, 48.87156]
];

const dateNightRoutePath: Coordinate[] = [
  [2.3372, 48.8557],
  [2.33922, 48.85666],
  [2.34167, 48.8575],
  [2.34482, 48.85823],
  [2.348, 48.8574]
];

const hiddenGemsRoutePath: Coordinate[] = [
  [2.3582, 48.8651],
  [2.3602, 48.86616],
  [2.36222, 48.8649],
  [2.36475, 48.8639],
  [2.36712, 48.86468]
];

const rainyVenues: Venue[] = [
  {
    id: "rain-1",
    name: "Galerie Vivienne",
    coordinate: [2.33902, 48.86642],
    category: "covered passage",
    score: 96,
    rank: 1,
    reason: "Covered, photogenic, and close to metro exits.",
    walkMinutes: 7,
    indoor: true
  },
  {
    id: "rain-2",
    name: "Passage des Panoramas",
    coordinate: [2.34248, 48.87036],
    category: "dry food stop",
    score: 92,
    rank: 2,
    reason: "Dense indoor options without a long exposed walk.",
    walkMinutes: 11,
    indoor: true
  },
  {
    id: "rain-3",
    name: "Grand Rex shelter",
    coordinate: [2.34605, 48.87156],
    category: "rain fallback",
    score: 84,
    rank: 3,
    reason: "Bright landmark and easy taxi or metro fallback.",
    walkMinutes: 16,
    indoor: true
  }
];

const dateNightVenues: Venue[] = [
  {
    id: "date-1",
    name: "Pont des Arts",
    coordinate: [2.3372, 48.85835],
    category: "sunset edge",
    score: 95,
    rank: 1,
    reason: "High romance score and low budget impact.",
    walkMinutes: 5
  },
  {
    id: "date-2",
    name: "Square du Vert-Galant",
    coordinate: [2.34, 48.85722],
    category: "quiet pause",
    score: 91,
    rank: 2,
    reason: "River-level pause away from heavy traffic.",
    walkMinutes: 9
  },
  {
    id: "date-3",
    name: "Left Bank terrace",
    coordinate: [2.348, 48.8574],
    category: "budget terrace",
    score: 87,
    rank: 3,
    reason: "Fits the EUR 60 constraint with a short scenic walk.",
    walkMinutes: 14
  }
];

const hiddenGemsVenues: Venue[] = [
  {
    id: "hidden-1",
    name: "Passage de l'Ancre",
    coordinate: [2.3582, 48.8651],
    category: "quiet passage",
    score: 96,
    rank: 1,
    reason: "Tourist density drops while visual character stays high.",
    walkMinutes: 4
  },
  {
    id: "hidden-2",
    name: "Square du Temple",
    coordinate: [2.3602, 48.86616],
    category: "green pause",
    score: 89,
    rank: 2,
    reason: "Small park, low noise, easy reset point.",
    walkMinutes: 8
  },
  {
    id: "hidden-3",
    name: "Marché des Enfants Rouges",
    coordinate: [2.36222, 48.8649],
    category: "local food",
    score: 86,
    rank: 3,
    reason: "Local food cluster with flexible route endings.",
    walkMinutes: 12,
    indoor: true
  },
  {
    id: "hidden-4",
    name: "Rue Charlot atelier edge",
    coordinate: [2.36712, 48.86468],
    category: "photo texture",
    score: 82,
    rank: 4,
    reason: "Narrow street texture for hidden photography spots.",
    walkMinutes: 17
  }
];

const rainyRiskZones: RiskZone[] = [
  {
    id: "rain-exposed-boulevard",
    label: "Exposed boulevard rain",
    coordinate: [2.3422, 48.87128],
    radiusMeters: 190,
    color: [75, 141, 255, 58]
  },
  {
    id: "rain-covered-passages",
    label: "Covered passage cluster",
    coordinate: [2.3404, 48.86852],
    radiusMeters: 230,
    color: [108, 229, 255, 42]
  },
  {
    id: "rain-metro-fallback",
    label: "Metro fallback field",
    coordinate: [2.34605, 48.87156],
    radiusMeters: 130,
    color: [97, 240, 162, 46]
  }
];

const dateNightRiskZones: RiskZone[] = [
  {
    id: "date-tourist-pressure",
    label: "Tourist pressure",
    coordinate: [2.34167, 48.8575],
    radiusMeters: 165,
    color: [255, 106, 169, 48]
  },
  {
    id: "date-quiet-river-pocket",
    label: "Quiet river pocket",
    coordinate: [2.34, 48.85722],
    radiusMeters: 150,
    color: [255, 195, 92, 48]
  },
  {
    id: "date-budget-envelope",
    label: "Budget-safe cluster",
    coordinate: [2.348, 48.8574],
    radiusMeters: 130,
    color: [97, 240, 162, 42]
  }
];

const hiddenGemsRiskZones: RiskZone[] = [
  {
    id: "hidden-tourist-fade",
    label: "Tourist paths faded",
    coordinate: [2.36475, 48.8639],
    radiusMeters: 210,
    color: [255, 85, 85, 38]
  },
  {
    id: "hidden-local-signal",
    label: "Local discovery signal",
    coordinate: [2.3602, 48.86616],
    radiusMeters: 220,
    color: [97, 240, 162, 52]
  },
  {
    id: "hidden-photo-texture",
    label: "Photography texture",
    coordinate: [2.36712, 48.86468],
    radiusMeters: 150,
    color: [168, 139, 255, 44]
  }
];

export const sceneMapStates: Record<SceneId, SceneMapState> = {
  "borrowed-senses": {
    sceneId: "borrowed-senses",
    status: "accessibility mesh active",
    reply:
      "I can route you toward Trocadero and borrow verified phone sensors when the route becomes uncertain.",
    routePath,
    venues,
    riskZones,
    intent: [
      { label: "mode", value: "accessible guidance" },
      { label: "radius", value: "0.5 mi" },
      { label: "handoff", value: "contributors" }
    ],
    metrics: [
      { label: "sense packets", value: "18", tone: "senses" },
      { label: "safe route", value: "804m", tone: "route" },
      { label: "confidence", value: "89%", tone: "places" }
    ]
  },
  "rainy-day": {
    sceneId: "rainy-day",
    status: "rain filter applied",
    reply:
      "Outdoor terraces fade. Covered passages, metro exits, and short indoor stops take priority.",
    routePath: rainyRoutePath,
    venues: rainyVenues,
    riskZones: rainyRiskZones,
    intent: [
      { label: "weather", value: "raining" },
      { label: "time", value: "2 hours" },
      { label: "walk", value: "mostly covered" }
    ],
    metrics: [
      { label: "covered", value: "71%", tone: "route" },
      { label: "indoor stops", value: "3", tone: "places" },
      { label: "exposure", value: "low", tone: "risk" }
    ]
  },
  "date-night": {
    sceneId: "date-night",
    status: "romantic route staged",
    reply:
      "The map keeps the walk cinematic and budget-safe: river edge, quiet pause, then a terrace finish.",
    routePath: dateNightRoutePath,
    venues: dateNightVenues,
    riskZones: dateNightRiskZones,
    intent: [
      { label: "mood", value: "romantic" },
      { label: "budget", value: "EUR 60" },
      { label: "pace", value: "scenic walk" }
    ],
    metrics: [
      { label: "budget fit", value: "EUR 54", tone: "places" },
      { label: "walk", value: "14m", tone: "route" },
      { label: "romance", value: "95", tone: "risk" }
    ]
  },
  "hidden-gems": {
    sceneId: "hidden-gems",
    status: "local signal amplified",
    reply:
      "The obvious tourist path drops back while small passages, parks, and food clusters light up.",
    routePath: hiddenGemsRoutePath,
    venues: hiddenGemsVenues,
    riskZones: hiddenGemsRiskZones,
    intent: [
      { label: "mood", value: "local" },
      { label: "crowds", value: "avoid" },
      { label: "discoveries", value: "4 stops" }
    ],
    metrics: [
      { label: "tourist density", value: "-62%", tone: "risk" },
      { label: "local stops", value: "4", tone: "places" },
      { label: "walk", value: "17m", tone: "route" }
    ]
  }
};

export function sceneMapStateById(sceneId: SceneId): SceneMapState {
  return sceneMapStates[sceneId] ?? sceneMapStates["borrowed-senses"];
}

const metersToLng = (meters: number, lat: number) =>
  meters / (111_320 * Math.cos((lat * Math.PI) / 180));

const metersToLat = (meters: number) => meters / 110_540;

export function makeCircle(center: Coordinate, radiusMeters: number, steps = 72): Coordinate[] {
  const coords: Coordinate[] = [];
  for (let i = 0; i <= steps; i += 1) {
    const angle = (i / steps) * Math.PI * 2;
    coords.push([
      center[0] + Math.cos(angle) * metersToLng(radiusMeters, center[1]),
      center[1] + Math.sin(angle) * metersToLat(radiusMeters)
    ]);
  }
  return coords;
}

export function makeSector(
  center: Coordinate,
  bearingDegrees: number,
  radiusMeters: number,
  spreadDegrees = 44,
  steps = 18
): Coordinate[] {
  const coords: Coordinate[] = [center];
  const start = bearingDegrees - spreadDegrees / 2;
  for (let i = 0; i <= steps; i += 1) {
    const bearing = ((start + (spreadDegrees * i) / steps - 90) * Math.PI) / 180;
    coords.push([
      center[0] + Math.cos(bearing) * metersToLng(radiusMeters, center[1]),
      center[1] + Math.sin(bearing) * metersToLat(radiusMeters)
    ]);
  }
  coords.push(center);
  return coords;
}

export function colorForSenseKind(kind: SenseKind): [number, number, number] {
  if (kind === "vision") return [108, 229, 255];
  if (kind === "sound") return [168, 139, 255];
  if (kind === "alert") return [255, 106, 169];
  return [97, 240, 162];
}

export function sceneById(sceneId: SceneId): SceneDefinition {
  return scenes.find((scene) => scene.id === sceneId) ?? scenes[0];
}
