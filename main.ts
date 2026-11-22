// THE SCARLET VAULT — hand-in program (Node 22, standard library only).
// Copies this repository's game/ and screenshots/ into the output directory
// and writes /output/dossier.json with the vendored make.fun library, so the
// sealed scorer can check the entry and the judge can read its dossier.
// Run locally:  mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Serve the game:  node serve.ts  (http://localhost:8080)

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function copyTree(source, target) {
  mkdirSync(target, { recursive: true });
  cpSync(source, target, { recursive: true });
}

mkdirSync(outputDir, { recursive: true });
if (!existsSync(join(repoRoot, 'game', 'index.html'))) {
  throw new Error('game/index.html is missing — the entry is not a playable game');
}
copyTree(join(repoRoot, 'game'), join(outputDir, 'game'));
if (existsSync(join(repoRoot, 'screenshots'))) {
  copyTree(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'));
}

// Caps mirror the gate so a local run refuses what the scorer would refuse:
// at most 4 screenshots of at most 256 KiB, game/ at most 993 entries and
// 48 MiB, every game/ path at most 1000 bytes, dossier text at most 160 KiB.
const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(outputDir, 'dossier.json'), dossier);
console.log(`THE SCARLET VAULT handed in: ${outputDir}/dossier.json (${dossier.length} bytes)`);
