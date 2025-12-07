export const TEAM_ABBREVIATIONS: Record<string, string> = {
  // Group A
  México: "MEX",
  "Corea del Sur": "KOR",
  Sudáfrica: "RSA",
  "UEFA Playoff D": "E-D",

  // Group B
  Canadá: "CAN",
  Suiza: "SUI",
  Catar: "QAT",
  "UEFA Playoff A": "E-A",

  // Group C
  Brasil: "BRA",
  Marruecos: "MAR",
  Escocia: "SCO",
  Haití: "HAI",

  // Group D
  "Estados Unidos": "USA",
  Australia: "AUS",
  Paraguay: "PAR",
  "UEFA Playoff C": "E-C",

  // Group E
  Alemania: "GER",
  Ecuador: "ECU",
  "Costa de Marfil": "CIV",
  Curazao: "CUW",

  // Group F
  "Países Bajos": "NED",
  Japón: "JPN",
  Túnez: "TUN",
  "UEFA Playoff B": "E-B",

  // Group G
  Bélgica: "BEL",
  Egipto: "EGY",
  Irán: "IRN",
  "Nueva Zelanda": "NZL",

  // Group H
  España: "ESP",
  Uruguay: "URU",
  "Arabia Saudita": "KSA",
  "Cabo Verde": "CPV",

  // Group I
  Francia: "FRA",
  Senegal: "SEN",
  Noruega: "NOR",
  "FIFA Playoff 2": "F-2",

  // Group J
  Argentina: "ARG",
  Austria: "AUT",
  Argelia: "ALG",
  Jordania: "JOR",

  // Group K
  Portugal: "POR",
  Colombia: "COL",
  Uzbekistán: "UZB",
  "FIFA Playoff 1": "F-1",

  // Group L
  Inglaterra: "ENG",
  Croacia: "CRO",
  Ghana: "GHA",
  Panamá: "PAN",
};

export const getTeamAbbreviation = (name: string): string => {
  return TEAM_ABBREVIATIONS[name] || name.substring(0, 3).toUpperCase();
};
