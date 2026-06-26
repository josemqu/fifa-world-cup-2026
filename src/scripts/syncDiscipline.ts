import "./loadEnv";
import fs from "fs";
import path from "path";
import { API_TEAM_TO_ID } from "../services/teamMapping";

// Map ID to Spanish Name
const ID_TO_LOCAL_NAME: Record<string, string> = {
  "A1": "México",
  "A2": "Corea del Sur",
  "A3": "Sudáfrica",
  "A4": "República Checa",
  "B1": "Canadá",
  "B2": "Suiza",
  "B3": "Catar",
  "B4": "Bosnia y Herzegovina",
  "C1": "Brasil",
  "C2": "Marruecos",
  "C3": "Escocia",
  "C4": "Haití",
  "D1": "Estados Unidos",
  "D2": "Australia",
  "D3": "Paraguay",
  "D4": "Turquía",
  "E1": "Alemania",
  "E2": "Ecuador",
  "E3": "Costa de Marfil",
  "E4": "Curazao",
  "F1": "Países Bajos",
  "F2": "Japón",
  "F3": "Túnez",
  "F4": "Suecia",
  "G1": "Bélgica",
  "G2": "Egipto",
  "G3": "Irán",
  "G4": "Nueva Zelanda",
  "H1": "España",
  "H2": "Uruguay",
  "H3": "Arabia Saudita",
  "H4": "Cabo Verde",
  "I1": "Francia",
  "I2": "Senegal",
  "I3": "Noruega",
  "I4": "Iraq",
  "J1": "Argentina",
  "J2": "Austria",
  "J3": "Argelia",
  "J4": "Jordania",
  "K1": "Portugal",
  "K2": "Colombia",
  "K3": "Uzbekistán",
  "K4": "RD Congo",
  "L1": "Inglaterra",
  "L2": "Croacia",
  "L3": "Ghana",
  "L4": "Panamá",
};

async function main() {
  const token = process.env.FIFA_GAMEDAY_TOKEN;

  if (!token) {
    console.error("❌ Error: FIFA_GAMEDAY_TOKEN is not defined in .env.local.");
    process.exit(1);
  }

  console.log("🔄 Fetching live discipline stats from FIFA Gameday API...");
  
  try {
    const url = "https://gameday-prod.fifa.mangodev.co.uk/1-0/stories?query=(and%20resourceStatus==%60urn:gd:resourceStatus:active%60%20_externalId~%60urn:gd:story:classification:gct_discipline:competitionId:285023:(.*):rank_asc:page:1%60)&skip=2&limit=1&sort=tags.name==urn:gd:tag:story:fifa:column_number:asc";

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });

    if (!response.ok) {
      throw new Error(`FIFA API responded with status ${response.status}: ${response.statusText}`);
    }

    const json = await response.json();
    const item = json.items?.[0];

    if (!item || !item._externalId || !item._externalId.includes("yellow_cards")) {
      throw new Error("Did not retrieve the yellow_cards story at skip=2");
    }

    const mappedStats: Record<string, any> = {};

    item.actors.forEach((actor: any) => {
      const engName = actor.name.eng;
      const spaName = actor.name.spa;

      let teamId = API_TEAM_TO_ID[engName] || API_TEAM_TO_ID[spaName];
      if (!teamId) {
        // Try fuzzy match
        for (const [key, id] of Object.entries(API_TEAM_TO_ID)) {
          if (engName.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(engName.toLowerCase())) {
            teamId = id;
            break;
          }
        }
      }

      if (!teamId) {
        console.warn(`⚠️ Warning: Could not map team ${engName}`);
        return;
      }

      const localName = ID_TO_LOCAL_NAME[teamId];
      if (!localName) return;

      let yellow = 0;
      let red = 0;
      let indirectRed = 0;

      actor.tags.forEach((tag: any) => {
        if (tag.name === 'urn:gd:tag:football:stats:yellow_cards') {
          yellow = Number(tag.value);
        } else if (tag.name === 'urn:gd:tag:football:stats:red_cards') {
          red = Number(tag.value);
        } else if (tag.name === 'urn:gd:tag:football:stats:indirect_red_cards') {
          indirectRed = Number(tag.value);
        }
      });

      const fairPlay = -(yellow * 1 + indirectRed * 3 + red * 4);

      mappedStats[localName] = {
        teamId,
        yellow,
        red,
        indirectRed,
        fairPlay
      };
    });

    // Verify and fill any missing teams from existing file if possible
    const outputPath = path.resolve(process.cwd(), "src/data/fallbackDiscipline.json");
    let existingData = {};
    if (fs.existsSync(outputPath)) {
      existingData = JSON.parse(fs.readFileSync(outputPath, "utf-8"));
    }

    Object.keys(ID_TO_LOCAL_NAME).forEach((id) => {
      const name = ID_TO_LOCAL_NAME[id];
      if (!mappedStats[name]) {
        if ((existingData as any)[name]) {
          mappedStats[name] = (existingData as any)[name];
          console.log(`ℹ️ Mapped missing team from existing fallback: ${name}`);
        } else {
          mappedStats[name] = {
            teamId: id,
            yellow: 0,
            red: 0,
            indirectRed: 0,
            fairPlay: 0
          };
          console.warn(`⚠️ Warning: Missing team initialized with zeros: ${name}`);
        }
      }
    });

    fs.writeFileSync(outputPath, JSON.stringify(mappedStats, null, 2), "utf-8");
    console.log(`✅ Success! Saved ${Object.keys(mappedStats).length} teams to src/data/fallbackDiscipline.json`);
    process.exit(0);
  } catch (error: any) {
    console.error("❌ Error running sync-discipline:", error.message || error);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("❌ Critical error:", err);
  process.exit(1);
});
