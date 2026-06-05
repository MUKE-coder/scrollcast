/**
 * Phase 4 — call Gemini Imagen for every prompt; write PNGs to `public/assets/{theme}/`.
 * Content-hash cached via `manifest.json`. Stubbed in Phase 0.
 */
import "dotenv/config";

async function main() {
  if (!process.env.GEMINI_API_KEY) {
    console.warn("[assets:gen] GEMINI_API_KEY is not set in .env (required in Phase 4).");
  }
  console.log("[assets:gen] not implemented yet — lands in Phase 4.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
