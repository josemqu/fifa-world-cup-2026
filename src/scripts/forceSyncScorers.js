const fs = require('fs');
const mongoose = require('mongoose');

// Helper to parse scorers
function parseScorerString(scorerStr) {
  if (!scorerStr || scorerStr === "null") return [];
  const matches = [];
  const regex = /["“”]([^"“”]+)["“”]/g;
  let match;
  while ((match = regex.exec(scorerStr)) !== null) {
    matches.push(match[1].trim());
  }

  if (matches.length === 0) {
    const clean = scorerStr.replace(/[{}]/g, "").trim();
    if (clean && clean !== "null") {
      matches.push(clean);
    }
  }

  return matches.map((s) => {
    const scorerRegex = /^(.*?)\s+(\d+(?:\'\+\d+)?')\s*(?:\((p|OG)\))?$/i;
    const parts = s.match(scorerRegex);
    if (parts) {
      return {
        name: parts[1].trim(),
        minute: parts[2],
        isPenalty: parts[3]?.toLowerCase() === "p",
        isOwnGoal: parts[3]?.toUpperCase() === "OG",
      };
    } else {
      return {
        name: s,
        minute: "",
        isPenalty: false,
        isOwnGoal: false,
      };
    }
  });
}

// Map team names to match IDs
const INITIAL_GROUPS = [
  {
    name: "A",
    teams: ["México", "Sudáfrica", "Corea del Sur", "República Checa"],
    matches: [
      { id: "MA1", home: "México", away: "Sudáfrica" },
      { id: "MA2", home: "Corea del Sur", away: "República Checa" },
      { id: "MA3", home: "México", away: "Corea del Sur" },
      { id: "MA4", home: "República Checa", away: "Sudáfrica" },
      { id: "MA5", home: "República Checa", away: "México" },
      { id: "MA6", home: "Sudáfrica", away: "Corea del Sur" }
    ]
  },
  {
    name: "B",
    teams: ["Canadá", "Bosnia y Herzegovina", "Egipto", "Omán"],
    matches: [
      { id: "MB1", home: "Canadá", away: "Bosnia y Herzegovina" },
      { id: "MB2", home: "Egipto", away: "Omán" },
      { id: "MB3", home: "Canadá", away: "Egipto" },
      { id: "MB4", home: "Omán", away: "Bosnia y Herzegovina" },
      { id: "MB5", home: "Omán", away: "Canadá" },
      { id: "MB6", home: "Bosnia y Herzegovina", away: "Egipto" }
    ]
  },
  {
    name: "C",
    teams: ["Estados Unidos", "Paraguay", "Senegal", "Uzbekistán"],
    matches: [
      { id: "MC1", home: "Estados Unidos", away: "Paraguay" },
      { id: "MC2", home: "Senegal", away: "Uzbekistán" },
      { id: "MC3", home: "Estados Unidos", away: "Senegal" },
      { id: "MC4", home: "Uzbekistán", away: "Paraguay" },
      { id: "MC5", home: "Uzbekistán", away: "Estados Unidos" },
      { id: "MC6", home: "Paraguay", away: "Senegal" }
    ]
  },
  {
    name: "D",
    teams: ["Ecuador", "Escocia", "Australia", "Turquía"],
    matches: [
      { id: "MD1", home: "Ecuador", away: "Escocia" },
      { id: "MD2", home: "Australia", away: "Turquía" },
      { id: "MD3", home: "Ecuador", away: "Australia" },
      { id: "MD4", home: "Turquía", away: "Escocia" },
      { id: "MD5", home: "Turquía", away: "Ecuador" },
      { id: "MD6", home: "Escocia", away: "Australia" }
    ]
  },
  {
    name: "E",
    teams: ["Francia", "Costa Rica", "Catar", "Suiza"],
    matches: [
      { id: "ME1", home: "Francia", away: "Costa Rica" },
      { id: "ME2", home: "Catar", away: "Suiza" },
      { id: "ME3", home: "Francia", away: "Catar" },
      { id: "ME4", home: "Suiza", away: "Costa Rica" },
      { id: "ME5", home: "Suiza", away: "Francia" },
      { id: "ME6", home: "Costa Rica", away: "Catar" }
    ]
  },
  {
    name: "F",
    teams: ["Bélgica", "Honduras", "Marruecos", "Panamá"],
    matches: [
      { id: "MF1", home: "Bélgica", away: "Honduras" },
      { id: "MF2", home: "Marruecos", away: "Panamá" },
      { id: "MF3", home: "Bélgica", away: "Marruecos" },
      { id: "MF4", home: "Panamá", away: "Honduras" },
      { id: "MF5", home: "Panamá", away: "Bélgica" },
      { id: "MF6", home: "Honduras", away: "Marruecos" }
    ]
  },
  {
    name: "G",
    teams: ["Países Bajos", "Camerún", "Japón", "Nueva Zelanda"],
    matches: [
      { id: "MG1", home: "Países Bajos", away: "Camerún" },
      { id: "MG2", home: "Japón", away: "Nueva Zelanda" },
      { id: "MG3", home: "Países Bajos", away: "Japón" },
      { id: "MG4", home: "Nueva Zelanda", away: "Camerún" },
      { id: "MG5", home: "Nueva Zelanda", away: "Países Bajos" },
      { id: "MG6", home: "Camerún", away: "Japón" }
    ]
  },
  {
    name: "H",
    teams: ["Croacia", "Túnez", "Portugal", "Chile"],
    matches: [
      { id: "MH1", home: "Croacia", away: "Túnez" },
      { id: "MH2", home: "Portugal", away: "Chile" },
      { id: "MH3", home: "Croacia", away: "Portugal" },
      { id: "MH4", home: "Chile", away: "Túnez" },
      { id: "MH5", home: "Chile", away: "Croacia" },
      { id: "MH6", home: "Túnez", away: "Portugal" }
    ]
  },
  {
    name: "I",
    teams: ["Inglaterra", "Argelia", "Uruguay", "Rumania"],
    matches: [
      { id: "MI1", home: "Inglaterra", away: "Argelia" },
      { id: "MI2", home: "Uruguay", away: "Rumania" },
      { id: "MI3", home: "Inglaterra", away: "Uruguay" },
      { id: "MI4", home: "Rumania", away: "Argelia" },
      { id: "MI5", home: "Rumania", away: "Inglaterra" },
      { id: "MI6", home: "Argelia", away: "Uruguay" }
    ]
  },
  {
    name: "J",
    teams: ["Italia", "Ghana", "Alemania", "Curazao"],
    matches: [
      { id: "MJ1", home: "Italia", away: "Ghana" },
      { id: "MJ2", home: "Alemania", away: "Curazao" },
      { id: "MJ3", home: "Italia", away: "Alemania" },
      { id: "MJ4", home: "Curazao", away: "Ghana" },
      { id: "MJ5", home: "Curazao", away: "Italia" },
      { id: "MJ6", home: "Ghana", away: "Alemania" }
    ]
  },
  {
    name: "K",
    teams: ["Argentina", "Angola", "España", "Albania"],
    matches: [
      { id: "MK1", home: "Argentina", away: "Angola" },
      { id: "MK2", home: "España", away: "Albania" },
      { id: "MK3", home: "Argentina", away: "España" },
      { id: "MK4", home: "Albania", away: "Angola" },
      { id: "MK5", home: "Albania", away: "Argentina" },
      { id: "MK6", home: "Angola", away: "España" }
    ]
  },
  {
    name: "L",
    teams: ["Brasil", "Mali", "Dinamarca", "Arabia Saudita"],
    matches: [
      { id: "ML1", home: "Brasil", away: "Mali" },
      { id: "ML2", home: "Dinamarca", away: "Arabia Saudita" },
      { id: "ML3", home: "Brasil", away: "Dinamarca" },
      { id: "ML4", home: "Arabia Saudita", away: "Mali" },
      { id: "ML5", home: "Arabia Saudita", away: "Brasil" },
      { id: "ML6", home: "Mali", away: "Dinamarca" }
    ]
  }
];

// Helper to normalize team names for matching
function cleanName(n) {
  if (!n) return "";
  return n.toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\b(de|y|el|la|las|los|del)\b/g, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

function resolveTeamId(name) {
  if (!name) return null;
  const cn = cleanName(name);

  // Mappings
  const map = {
    mexico: "MEX",
    southafrica: "RSA",
    sudafrica: "RSA",
    southkorea: "KOR",
    coreadelsur: "KOR",
    czechrepublic: "CZE",
    republicacheca: "CZE",
    czechia: "CZE",
    canada: "CAN",
    bosniaandherzegovina: "BIH",
    bosniayherzegovina: "BIH",
    egypt: "EGY",
    egipto: "EGY",
    oman: "OMA",
    unitedstates: "USA",
    estadosunidos: "USA",
    usa: "USA",
    paraguay: "PAR",
    senegal: "SEN",
    uzbekistan: "UZB",
    ecuador: "ECU",
    scotland: "SCO",
    escocia: "SCO",
    australia: "AUS",
    turkey: "TUR",
    turquia: "TUR",
    france: "FRA",
    francia: "FRA",
    costarica: "CRC",
    qatar: "QAT",
    catar: "QAT",
    switzerland: "SUI",
    suiza: "SUI",
    belgium: "BEL",
    belgica: "BEL",
    honduras: "HON",
    morocco: "MAR",
    marruecos: "MAR",
    panama: "PAN",
    netherlands: "NED",
    paisesbajos: "NED",
    cameroon: "CMR",
    camerun: "CMR",
    japan: "JPN",
    japon: "JPN",
    newzealand: "NZL",
    nuevazelandia: "NZL",
    croatia: "CRO",
    croacia: "CRO",
    tunisia: "TUN",
    tunez: "TUN",
    portugal: "POR",
    chile: "CHI",
    england: "ENG",
    inglaterra: "ENG",
    algeria: "ALG",
    argelia: "ALG",
    uruguay: "URU",
    romania: "ROU",
    rumania: "ROU",
    italy: "ITA",
    italia: "ITA",
    ghana: "GHA",
    germany: "GER",
    alemania: "GER",
    curacao: "CUW",
    curazao: "CUW",
    argentina: "ARG",
    angola: "ANG",
    spain: "ESP",
    espana: "ESP",
    albania: "ALB",
    brazil: "BRA",
    brasil: "BRA",
    mali: "MLI",
    denmark: "DEN",
    dinamarca: "DEN",
    saudiarabia: "KSA",
    arabiasaudita: "KSA",
    colombia: "COL"
  };

  return map[cn] || null;
}

function findGroupMatchId(homeTeamId, awayTeamId) {
  const allGroupMatches = INITIAL_GROUPS.flatMap((g) =>
    g.matches.map((m) => ({
      id: m.id,
      homeTeamId: resolveTeamId(m.home),
      awayTeamId: resolveTeamId(m.away),
    }))
  );

  const match = allGroupMatches.find(
    (m) => m.homeTeamId === homeTeamId && m.awayTeamId === awayTeamId
  );
  return match ? match.id : null;
}

async function main() {
  const envPath = './.env.local';
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const match = line.match(/^\s*([^#\s][^=]*)\s*=\s*(.*)$/);
      if (match) {
        let key = match[1].trim();
        let val = match[2].trim();
        if (val.startsWith('"') && val.endsWith('"')) {
          val = val.slice(1, -1);
        }
        process.env[key] = val;
      }
    });
  }

  const email = process.env.WORLDCUP_API_EMAIL;
  const password = process.env.WORLDCUP_API_PASSWORD;
  const dbUri = process.env.MONGODB_URI;

  console.log('Connecting to MongoDB...');
  await mongoose.connect(dbUri);
  console.log('Connected.');

  // LiveScore Schema definition
  const LiveScoreSchema = new mongoose.Schema(
    {
      matchId: { type: String, required: true, unique: true },
      externalId: { type: Number },
      homeTeamName: { type: String, required: true },
      awayTeamName: { type: String, required: true },
      homeScore: { type: Number, default: null },
      awayScore: { type: Number, default: null },
      homePenalties: { type: Number, default: null },
      awayPenalties: { type: Number, default: null },
      homeScorers: { type: [mongoose.Schema.Types.Mixed], default: [] },
      awayScorers: { type: [mongoose.Schema.Types.Mixed], default: [] },
      status: { type: String, default: "scheduled" },
      elapsed: { type: Number, default: null },
      stage: { type: String, required: true },
      groupId: { type: String },
      manualOverride: { type: Boolean, default: false },
      lastSyncAt: { type: Date, default: Date.now },
    }
  );

  const LiveScore = mongoose.models.LiveScore || mongoose.model("LiveScore", LiveScoreSchema);

  const baseUrl = "https://worldcup26.ir";
  const defaultHeaders = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "*/*"
  };
  
  console.log('Authenticating with worldcup26.ir...');
  const authRes = await fetch(`${baseUrl}/auth/authenticate`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      ...defaultHeaders
    },
    body: JSON.stringify({ email, password }),
  });
  const authData = await authRes.json();
  const token = authData.token;
  
  console.log('Fetching all games...');
  const gamesRes = await fetch(`${baseUrl}/get/games`, {
    headers: { 
      Authorization: `Bearer ${token}`,
      ...defaultHeaders
    }
  });
  const gamesData = await gamesRes.json();
  const games = gamesData.games || [];
  console.log(`Fetched ${games.length} games.`);

  let updatedCount = 0;

  for (const game of games) {
    const homeTeamId = resolveTeamId(game.home_team_name_en);
    const awayTeamId = resolveTeamId(game.away_team_name_en);

    if (!homeTeamId || !awayTeamId) {
      continue;
    }

    const isGroup = game.type === "group";
    const stage = isGroup ? "group" : "knockout";
    
    let matchId = null;
    if (stage === "group") {
      matchId = findGroupMatchId(homeTeamId, awayTeamId);
      if (!matchId) {
        matchId = findGroupMatchId(awayTeamId, homeTeamId);
      }
    } else {
      matchId = game.id;
    }

    if (!matchId) {
      console.warn(`Could not resolve matchId for Game ID ${game.id} (${game.home_team_name_en} vs ${game.away_team_name_en})`);
      continue;
    }

    const homeScorers = parseScorerString(game.home_scorers);
    const awayScorers = parseScorerString(game.away_scorers);

    console.log(`Updating Match ${matchId} (${game.home_team_name_en} vs ${game.away_team_name_en}): ${homeScorers.length} home, ${awayScorers.length} away scorers.`);
    
    await LiveScore.findOneAndUpdate(
      { matchId },
      {
        $set: {
          homeScorers,
          awayScorers,
          lastSyncAt: new Date()
        }
      }
    );
    updatedCount++;
  }

  console.log(`Finished. Updated ${updatedCount} matches with scorers.`);
  await mongoose.disconnect();
}

main().catch(err => {
  console.error(err);
  mongoose.disconnect();
});
