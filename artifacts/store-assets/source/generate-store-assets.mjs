import fs from "node:fs";
import path from "node:path";
import sharp from "../../../node_modules/.pnpm/sharp@0.32.6/node_modules/sharp/lib/index.js";

const root = path.resolve("artifacts/store-assets");
const raw = path.join(root, "source/raw-screenshots");
const NAVY = "#071126";
const GOLD = "#D4AF37";
const CREAM = "#FBF6E8";
const brandSvg = fs.readFileSync("public/branding/logo-horizontal.svg", "utf8");
const fontDefs = brandSvg.match(/<defs>[\s\S]*?<\/defs>/)?.[0] ?? "";

const escapeXml = (value) => value.replaceAll("&", "&amp;").replaceAll("'", "&apos;");

function captionSvg(width, height, caption, topHeight, fontSize) {
  const words = caption.split(" ");
  const lines = [];
  let line = "";
  const maxCharacters = width > 1500 ? 34 : width > 1150 ? 27 : 25;
  for (const word of words) {
    if (`${line} ${word}`.trim().length > maxCharacters && line) {
      lines.push(line);
      line = word;
    } else line = `${line} ${word}`.trim();
  }
  if (line) lines.push(line);
  const lineHeight = fontSize * 1.08;
  const startY = Math.max(fontSize + 34, (topHeight - lines.length * lineHeight) / 2 + fontSize * 0.78);
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${fontDefs}<rect width="${width}" height="${height}" fill="${NAVY}"/><path d="M${width * .12} ${topHeight - 28}H${width * .88}" stroke="${GOLD}" stroke-width="3" opacity=".55"/>${lines.map((text, index) => `<text x="${width / 2}" y="${startY + index * lineHeight}" text-anchor="middle" font-family="Cinzel Brand,Georgia,serif" font-size="${fontSize}" font-weight="700" letter-spacing="1.5" fill="${index === lines.length - 1 && lines.length > 1 ? GOLD : CREAM}">${escapeXml(text)}</text>`).join("")}</svg>`);
}

async function storeScreenshot({ source, output, width, height, caption, topHeight, inset, fontSize, position = "top" }) {
  const screenWidth = width - inset * 2;
  const screenHeight = height - topHeight - inset;
  const screen = await sharp(path.join(raw, source))
    .resize(screenWidth, screenHeight, { fit: "cover", position, kernel: sharp.kernel.lanczos3 })
    .flatten({ background: NAVY })
    .png()
    .toBuffer();
  const border = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect x="${inset - 3}" y="${topHeight - 3}" width="${screenWidth + 6}" height="${screenHeight + 6}" rx="38" fill="none" stroke="${GOLD}" stroke-opacity=".42" stroke-width="6"/></svg>`);
  await sharp(captionSvg(width, height, caption, topHeight, fontSize))
    .composite([{ input: screen, left: inset, top: topHeight }, { input: border }])
    .flatten({ background: NAVY })
    .removeAlpha()
    .png({ compressionLevel: 9 })
    .toFile(path.join(root, output));
}

const iphone = [
  ["phone-home.png", "01-learn-gods-word.png", "Learn God’s Word Through Play"],
  ["phone-solo-quiz.png", "02-build-knowledge-daily.png", "Build Your Bible Knowledge Daily"],
  ["phone-live-battle-lobby.png", "03-compete-live.png", "Compete Live With Friends"],
  ["phone-correct-feedback.png", "04-discover-scripture.png", "Discover Scripture After Every Answer"],
  ["phone-profile.png", "05-grow-level-streak.png", "Grow Your Level and Streak"],
  ["phone-friends-battle.png", "06-play-one-device.png", "Play Together on One Device"],
  ["phone-languages.png", "07-learn-language.png", "Learn in Your Language"],
  ["phone-results.png", "08-celebrate-milestone.png", "Celebrate Every Milestone"],
];
for (const [source, file, caption] of iphone) await storeScreenshot({ source, output: `apple/iphone/${file}`, width: 1260, height: 2736, caption, topHeight: 330, inset: 54, fontSize: 76 });

const googlePhone = [
  ["phone-home.png", "01-home-dashboard.png", "Learn God’s Word Through Play"],
  ["phone-solo-quiz.png", "02-quiz-gameplay.png", "Build Your Bible Knowledge Daily"],
  ["phone-correct-feedback.png", "03-correct-scripture.png", "Discover Scripture After Every Answer"],
  ["phone-results.png", "04-results-xp.png", "Celebrate Every Milestone"],
  ["phone-live-battle-lobby.png", "05-live-battle.png", "Compete Live With Friends"],
  ["phone-friends-battle.png", "06-friends-battle.png", "Play Together on One Device"],
  ["phone-leaderboard.png", "07-leaderboard.png", "Grow Your Level and Streak"],
  ["phone-languages.png", "08-languages.png", "Learn in Your Language"],
];
for (const [source, file, caption] of googlePhone) await storeScreenshot({ source, output: `google-play/phone/${file}`, width: 1080, height: 1920, caption, topHeight: 250, inset: 42, fontSize: 61 });

// Google Play feature graphic: existing hero art and approved brand lockup only.
const hero = await sharp("public/images/menorah-hero-premium.webp").resize(560, 500, { fit: "cover", position: "right" }).toBuffer();
const logo = await sharp("public/branding/logo-horizontal.svg").resize({ width: 560 }).png().toBuffer();
const featureOverlay = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="500">${fontDefs}<defs><linearGradient id="fade" x1="0" x2="1"><stop offset="0" stop-color="${NAVY}"/><stop offset=".62" stop-color="${NAVY}" stop-opacity=".96"/><stop offset="1" stop-color="${NAVY}" stop-opacity="0"/></linearGradient></defs><rect width="700" height="500" fill="url(#fade)"/><text x="78" y="410" font-family="Poppins Brand,Poppins,sans-serif" font-size="27" font-weight="600" letter-spacing="1" fill="${CREAM}">Learn God’s Word. <tspan fill="${GOLD}">Play with Purpose.</tspan></text><g opacity=".55" fill="none" stroke="${GOLD}" stroke-width="2"><circle cx="800" cy="398" r="22"/><path d="M790 398l7 7 14-16M858 418v-38m-12 20h24M910 414l14-32 14 32m-23-12h18"/></g></svg>`);
await sharp({ create: { width: 1024, height: 500, channels: 3, background: NAVY } })
  .composite([{ input: hero, left: 464, top: 0 }, { input: featureOverlay }, { input: logo, left: 56, top: 92 }])
  .removeAlpha()
  .png({ compressionLevel: 9 })
  .toFile(path.join(root, "google-play/feature-graphic/menorah-bible-quiz-feature-1024x500.png"));

console.log("Generated Apple iPhone (8), Google phone (8), and feature graphic assets. Tablet exports remain blocked by the real tablet header layout QA noted in README.md.");
