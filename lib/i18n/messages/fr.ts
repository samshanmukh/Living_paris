import type { Messages } from "../types";

export const fr: Messages = {
  language: {
    label: "Langue",
    english: "Anglais",
    french: "Français",
  },
  brand: {
    eyebrow: "Living Paris",
    title: "Compagnon urbain guidé par la conversation",
  },
  status: {
    checking: "connexion au backend",
    worker: "API Worker en ligne",
    local: "repli backend local",
    offline: "backend déconnecté",
    mapReady: "carte 3D prête",
    mapLoading: "chargement de la carte",
  },
  chat: {
    panelEyebrow: "Demandez à la ville",
    panelTitle: "Interface de chat",
    newChat: "Nouveau chat",
    thinking: "Interrogation du backend spatial...",
    examples: "Exemples",
    placeholder: "Décrivez l'expérience que vous souhaitez...",
    send: "Envoyer le message",
  },
  messages: {
    loading:
      "Chargement des jeux de données parisiens. Décrivez une expérience et j'interrogerai le backend spatial, le planificateur d'itinéraires et les couches 3D.",
    reset:
      "Nouveau chat démarré. Choisissez une option courante ou décrivez ce que vous voulez faire à Paris.",
    backendError:
      "Je n'ai pas encore pu joindre le backend spatial. La carte statique reste disponible pendant le démarrage de l'API.",
    queryFailed:
      "La requête backend a échoué. Vérifiez que le serveur Next tourne, puis réessayez.",
  },
  commonOptions: [
    {
      label: "Lieux à voir",
      userText: "Montrez-moi des lieux à voir près du centre de Paris.",
      apiText:
        "Show me places to see near central Paris: museums, parks, and scenic viewpoints.",
    },
    {
      label: "Cafés",
      userText: "Trouvez de bons cafés à proximité avec une courte marche.",
      apiText: "Find good cafes nearby with a short walk.",
    },
    {
      label: "Musées",
      userText: "Montrez-moi des musées et lieux d'art à visiter aujourd'hui.",
      apiText: "Show me museums and art places I can visit today.",
    },
    {
      label: "Plan pluie",
      userText: "Il pleut. Trouvez des lieux couverts et des arrêts métro pratiques.",
      apiText: "It is raining. Find indoor places and metro-friendly stops.",
    },
    {
      label: "Itinéraire accessible",
      userText: "Trouvez des lieux accessibles et un itinéraire sans marches.",
      apiText: "Find accessible places and build a step-free walking route.",
    },
    {
      label: "Pépites locales",
      userText: "Montrez-moi des lieux calmes que les touristes manquent.",
      apiText: "Show me quiet local places tourists usually miss.",
    },
  ],
  promptChips: [
    {
      label: "Soirée romantique",
      userText: "Planifiez une soirée romantique pour moins de 60 EUR.",
      apiText: "Plan a romantic evening under EUR 60.",
    },
    {
      label: "Jour de pluie",
      userText: "Il pleut et j'ai deux heures avant mon train.",
      apiText: "It is raining and I have two hours before my train.",
    },
    {
      label: "Pépites cachées",
      userText: "Montrez-moi des lieux calmes que les touristes manquent.",
      apiText: "Show me quiet local places tourists miss.",
    },
    {
      label: "Itinéraire accessible",
      userText: "Je suis aveugle près de la Tour Eiffel. Emmenez-moi au Trocadéro.",
      apiText: "I am blind near the Eiffel Tower. Take me to Trocadero.",
    },
  ],
  layers: {
    route: "Itinéraire",
    places: "Lieux",
    signals: "Signaux",
    senses: "Sens",
  },
  experience: {
    panelLabel: "Expérience en cours",
    datasets: "jeux de données",
    workerBackend: "Cloudflare Worker",
    localBackend: "FileDataStore",
    backendMatches: "résultats backend",
    queryRadius: "rayon de requête",
    queryTime: "temps de requête",
    minWalk: "min à pied",
    indoor: "intérieur",
    accessible: "accessible",
  },
  intent: {
    mode: "mode",
    layers: "couches",
    mood: "humeur",
    walk: "marche",
    budget: "budget",
    access: "accès",
    weather: "météo",
    initializing: "initialisation",
    sceneDefaults: "scène par défaut",
    general: "général",
    auto: "auto",
    rainAware: "adapté pluie",
    stepFree: "sans marches",
  },
  scenes: {
    "borrowed-senses": {
      label: "Sens empruntés",
      headline: "Paris devient un maillage sensoriel vivant.",
      command: "I am blind near the Eiffel Tower. Take me to Trocadero.",
    },
    "rainy-day": {
      label: "Jour de pluie",
      headline: "La ville se reshape autour de la météo et du temps.",
      command: "It is raining and I have two hours before my train.",
    },
    "date-night": {
      label: "Soirée en amoureux",
      headline: "Les recommandations deviennent une chorégraphie urbaine.",
      command: "Plan a cinematic date night under 60 euros.",
    },
    "hidden-gems": {
      label: "Pépites cachées",
      headline: "La ville évidente s'efface ; la ville cachée s'illumine.",
      command: "Show me quiet local places tourists miss.",
    },
  },
};
