import type { LayerType } from "./types";

export const PARIS_CENTER: [number, number] = [2.3522, 48.8566];

export const WALKING_SPEED_M_PER_MIN = 80;

export const DEFAULT_WALK_MINUTES = 15;

export const DEFAULT_QUERY_LIMIT = 50;

export const LAYER_METADATA: Record<
  LayerType,
  { name: string; description: string; defaultSource: string }
> = {
  cafes: {
    name: "Café Terraces",
    description: "Authorized café terraces and outdoor seating in Paris",
    defaultSource: "opendata.paris.fr — terrasses-autorisations",
  },
  museums: {
    name: "Museums & Monuments",
    description: "Municipal museums, cultural venues, and major national museums",
    defaultSource: "opendata.paris.fr — lieux-municipaux + national supplement",
  },
  metro: {
    name: "Metro Stations",
    description: "Paris Métro stations within city bounds",
    defaultSource: "data.iledefrance-mobilites.fr — arrets",
  },
  parks: {
    name: "Parks & Gardens",
    description: "Public parks, gardens, and green spaces",
    defaultSource: "opendata.paris.fr — jardins-relais + curated parks",
  },
  trees: {
    name: "Trees",
    description: "Street and alignment trees across Paris",
    defaultSource: "opendata.paris.fr — les-arbres",
  },
  bikes: {
    name: "Vélib' Stations",
    description: "Bike-sharing station locations and capacity",
    defaultSource: "opendata.paris.fr — velib-emplacement-des-stations",
  },
  accessibility: {
    name: "Accessible Places",
    description: "Locations with accessibility features (PMR, step-free access)",
    defaultSource:
      "opendata.paris.fr — accessibilite-des-hebergements + curated POIs",
  },
  noise: {
    name: "Noise Monitoring",
    description: "Road noise measurement stations with dB levels",
    defaultSource: "opendata.paris.fr — bruit-evolution",
  },
  "air-quality": {
    name: "Air Quality",
    description: "Air quality monitoring points across Paris",
    defaultSource: "opendata.paris.fr — respirons-mieux",
  },
};

export const MOOD_LAYER_MAP: Record<string, LayerType[]> = {
  romantic: ["cafes", "parks", "museums"],
  family: ["parks", "museums", "metro"],
  rainy: ["museums", "metro", "cafes"],
  photography: ["parks", "museums", "trees"],
  nightlife: ["cafes", "metro"],
  relaxing: ["parks", "trees", "cafes"],
  hidden: ["parks", "cafes", "trees"],
  food: ["cafes"],
  culture: ["museums"],
  general: ["cafes", "parks", "museums", "metro"],
};
