import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pub = join(root, "public");
const assets = join(
  process.env.HOME ?? "",
  ".cursor/projects/Users-sarvesh-Desktop-learn-vocab/assets",
);

mkdirSync(pub, { recursive: true });

const logo = join(pub, "logo.svg");
const favicon = join(pub, "favicon.svg");
if (existsSync(logo)) {
  copyFileSync(logo, favicon);
}

const masterSrc = join(assets, "pwa-512x512.png");
const masterDest = join(pub, "pwa-512x512.png");
if (!existsSync(masterSrc)) {
  console.error("Missing generated icon:", masterSrc);
  process.exit(1);
}
copyFileSync(masterSrc, masterDest);

const also192 = join(assets, "pwa-192x192.png");
const also180 = join(assets, "apple-touch-icon.png");
if (existsSync(also192)) {
  copyFileSync(also192, join(pub, "pwa-192x192.png"));
} else {
  spawnSync(
    "sips",
    ["-z", "192", "192", masterDest, "--out", join(pub, "pwa-192x192.png")],
    { stdio: "inherit" },
  );
}
if (existsSync(also180)) {
  copyFileSync(also180, join(pub, "apple-touch-icon.png"));
} else {
  spawnSync(
    "sips",
    ["-z", "180", "180", masterDest, "--out", join(pub, "apple-touch-icon.png")],
    { stdio: "inherit" },
  );
}

console.log("PWA icons ready in public/");
