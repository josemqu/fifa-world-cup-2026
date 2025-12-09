export interface Country {
  name: string; // Spanish Name (current ID in many places)
  isoCode: string; // ISO 3166-1 alpha-3 or ISO 3166-2 (for Flags)
  fifaCode: string; // FIFA Trigram (for Display/Scoreboards)
  enName?: string; // English Name (for future translation)
}

export const COUNTRIES: Country[] = [
  // Group A
  { name: "México", isoCode: "MEX", fifaCode: "MEX", enName: "Mexico" },
  {
    name: "Corea del Sur",
    isoCode: "KOR",
    fifaCode: "KOR",
    enName: "South Korea",
  },
  {
    name: "Sudáfrica",
    isoCode: "ZAF",
    fifaCode: "RSA",
    enName: "South Africa",
  },

  // Group B
  { name: "Canadá", isoCode: "CAN", fifaCode: "CAN", enName: "Canada" },
  { name: "Suiza", isoCode: "CHE", fifaCode: "SUI", enName: "Switzerland" },
  { name: "Catar", isoCode: "QAT", fifaCode: "QAT", enName: "Qatar" },

  // Group C
  { name: "Brasil", isoCode: "BRA", fifaCode: "BRA", enName: "Brazil" },
  { name: "Marruecos", isoCode: "MAR", fifaCode: "MAR", enName: "Morocco" },
  { name: "Escocia", isoCode: "GB-SCT", fifaCode: "SCO", enName: "Scotland" },
  { name: "Haití", isoCode: "HTI", fifaCode: "HAI", enName: "Haiti" },

  // Group D
  {
    name: "Estados Unidos",
    isoCode: "USA",
    fifaCode: "USA",
    enName: "United States",
  },
  { name: "Australia", isoCode: "AUS", fifaCode: "AUS", enName: "Australia" },
  { name: "Paraguay", isoCode: "PRY", fifaCode: "PAR", enName: "Paraguay" },

  // Group E
  { name: "Alemania", isoCode: "DEU", fifaCode: "GER", enName: "Germany" },
  { name: "Ecuador", isoCode: "ECU", fifaCode: "ECU", enName: "Ecuador" },
  {
    name: "Costa de Marfil",
    isoCode: "CIV",
    fifaCode: "CIV",
    enName: "Ivory Coast",
  },
  { name: "Curazao", isoCode: "CUW", fifaCode: "CUW", enName: "Curaçao" },

  // Group F
  {
    name: "Países Bajos",
    isoCode: "NLD",
    fifaCode: "NED",
    enName: "Netherlands",
  },
  { name: "Japón", isoCode: "JPN", fifaCode: "JPN", enName: "Japan" },
  { name: "Túnez", isoCode: "TUN", fifaCode: "TUN", enName: "Tunisia" },

  // Group G
  { name: "Bélgica", isoCode: "BEL", fifaCode: "BEL", enName: "Belgium" },
  { name: "Egipto", isoCode: "EGY", fifaCode: "EGY", enName: "Egypt" },
  { name: "Irán", isoCode: "IRN", fifaCode: "IRN", enName: "Iran" },
  {
    name: "Nueva Zelanda",
    isoCode: "NZL",
    fifaCode: "NZL",
    enName: "New Zealand",
  },

  // Group H
  { name: "España", isoCode: "ESP", fifaCode: "ESP", enName: "Spain" },
  { name: "Uruguay", isoCode: "URY", fifaCode: "URU", enName: "Uruguay" },
  {
    name: "Arabia Saudita",
    isoCode: "SAU",
    fifaCode: "KSA",
    enName: "Saudi Arabia",
  },
  { name: "Cabo Verde", isoCode: "CPV", fifaCode: "CPV", enName: "Cape Verde" },

  // Group I
  { name: "Francia", isoCode: "FRA", fifaCode: "FRA", enName: "France" },
  { name: "Senegal", isoCode: "SEN", fifaCode: "SEN", enName: "Senegal" },
  { name: "Noruega", isoCode: "NOR", fifaCode: "NOR", enName: "Norway" },

  // Group J
  { name: "Argentina", isoCode: "ARG", fifaCode: "ARG", enName: "Argentina" },
  { name: "Austria", isoCode: "AUT", fifaCode: "AUT", enName: "Austria" },
  { name: "Argelia", isoCode: "DZA", fifaCode: "ALG", enName: "Algeria" },
  { name: "Jordania", isoCode: "JOR", fifaCode: "JOR", enName: "Jordan" },

  // Group K
  { name: "Portugal", isoCode: "PRT", fifaCode: "POR", enName: "Portugal" },
  { name: "Colombia", isoCode: "COL", fifaCode: "COL", enName: "Colombia" },
  { name: "Uzbekistán", isoCode: "UZB", fifaCode: "UZB", enName: "Uzbekistan" },

  // Group L
  { name: "Inglaterra", isoCode: "GB-ENG", fifaCode: "ENG", enName: "England" },
  { name: "Croacia", isoCode: "HRV", fifaCode: "CRO", enName: "Croatia" },
  { name: "Ghana", isoCode: "GHA", fifaCode: "GHA", enName: "Ghana" },
  { name: "Panamá", isoCode: "PAN", fifaCode: "PAN", enName: "Panama" },

  // Placeholders / Playoffs
  {
    name: "UEFA Playoff A",
    isoCode: "",
    fifaCode: "UEFA-A",
    enName: "UEFA Playoff A",
  },
  {
    name: "UEFA Playoff B",
    isoCode: "",
    fifaCode: "UEFA-B",
    enName: "UEFA Playoff B",
  },
  {
    name: "UEFA Playoff C",
    isoCode: "",
    fifaCode: "UEFA-C",
    enName: "UEFA Playoff C",
  },
  {
    name: "UEFA Playoff D",
    isoCode: "",
    fifaCode: "UEFA-D",
    enName: "UEFA Playoff D",
  },
  {
    name: "FIFA Playoff 1",
    isoCode: "",
    fifaCode: "FIFA-1",
    enName: "FIFA Playoff 1",
  },
  {
    name: "FIFA Playoff 2",
    isoCode: "",
    fifaCode: "FIFA-2",
    enName: "FIFA Playoff 2",
  },
];

export const getCountryData = (name: string): Country | undefined => {
  // Try exact match first
  const exact = COUNTRIES.find((c) => c.name === name);
  if (exact) return exact;

  // Try normalized match (ignore accents and case)
  const normalize = (str: string) =>
    str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

  const normalizedName = normalize(name);
  return COUNTRIES.find((c) => normalize(c.name) === normalizedName);
};

export const getCountryIsoCode = (name: string): string => {
  const country = getCountryData(name);
  return country ? country.isoCode : "";
};

export const getCountryFifaCode = (name: string): string => {
  const country = getCountryData(name);
  return country ? country.fifaCode : name.substring(0, 3).toUpperCase();
};
