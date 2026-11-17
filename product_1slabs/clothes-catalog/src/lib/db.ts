import fs from "fs";
import path from "path";
import { DatabaseSchema } from "@/types/store";
import { INITIAL_DATABASE } from "@/data/seed";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "database.json");

function ensureDatabaseFile(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(INITIAL_DATABASE, null, 2), "utf-8");
  }
}

export function readDb(): DatabaseSchema {
  try {
    ensureDatabaseFile();
    const raw = fs.readFileSync(DB_FILE, "utf-8");
    const parsed = JSON.parse(raw) as Partial<DatabaseSchema>;

    // Ensure backwards-compatible migration with newly added CMS & SizeGuideMaster fields
    return {
      ...INITIAL_DATABASE,
      ...parsed,
      cms: {
        ...INITIAL_DATABASE.cms,
        ...(parsed.cms || {}),
        hero: {
          ...INITIAL_DATABASE.cms.hero,
          ...(parsed.cms?.hero || {}),
          mode: "A",
        },
        brandStory: {
          ...INITIAL_DATABASE.cms.brandStory,
          ...(parsed.cms?.brandStory || {}),
        },
        dropSpotlight: {
          ...INITIAL_DATABASE.cms.dropSpotlight,
          ...(parsed.cms?.dropSpotlight || {}),
        },
        aboutPage: {
          ...INITIAL_DATABASE.cms.aboutPage,
          ...(parsed.cms?.aboutPage || {}),
        },
        deliveryDefaults: {
          ...INITIAL_DATABASE.cms.deliveryDefaults,
          ...(parsed.cms?.deliveryDefaults || {}),
        },
      },
      sizeGuideMasters:
        parsed.sizeGuideMasters && parsed.sizeGuideMasters.length > 0
          ? parsed.sizeGuideMasters
          : INITIAL_DATABASE.sizeGuideMasters,
    };
  } catch {
    return structuredClone(INITIAL_DATABASE);
  }
}

export function writeDb(data: DatabaseSchema): DatabaseSchema {
  ensureDatabaseFile();
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  return data;
}

export function updateDb(mutator: (db: DatabaseSchema) => void): DatabaseSchema {
  const db = readDb();
  mutator(db);
  return writeDb(db);
}
