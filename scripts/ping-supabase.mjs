import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno desde .env manualmente si no están en process.env
const envPath = path.resolve(__dirname, "../.env");
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Error: Faltan las variables VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY.");
  process.exit(1);
}

async function pingSupabase() {
  console.log("📡 Enviando consulta preventiva a Supabase...");
  console.log(`🔗 Destino: ${supabaseUrl}`);

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/patients?select=id&limit=1`, {
      method: "GET",
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
      },
    });

    if (response.ok) {
      console.log(`✅ ¡Éxito! Supabase respondió con código HTTP ${response.status}.`);
      console.log("🚀 El contador de inactividad de Supabase ha sido reiniciado correctamente.");
    } else {
      console.warn(`⚠️ Supabase respondió con código ${response.status}: ${response.statusText}`);
      console.log("ℹ️ Aun así, la petición llegó al API Gateway de Supabase.");
    }
  } catch (error) {
    console.error("❌ Error de conexión al consultar Supabase:", error.message);
    process.exit(1);
  }
}

pingSupabase();
