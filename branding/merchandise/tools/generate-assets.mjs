import fs from "node:fs";
import path from "node:path";
import sharp from "../../../node_modules/.pnpm/sharp@0.32.6/node_modules/sharp/lib/index.js";
import { chromium } from "playwright";

const root = path.resolve("branding/merchandise");
const NAVY = "#0A1E3D", GOLD = "#D4AF37", LIGHT = "#FFD97A", WHITE = "#FFFFFF";
const esc = (s) => s.replaceAll("&", "&amp;").replaceAll("'", "&apos;");
// Reuse the approved brand's embedded, licensed Cinzel/Poppins font data so
// SVG, PDF, and PNG exports render identically on systems without the fonts.
const sourceLogo = fs.readFileSync("public/branding/logo-horizontal.svg", "utf8");
const brandDefs = sourceLogo.match(/<defs>[\s\S]*?<\/defs>/)?.[0] ?? "";

const mark = (x, y, size, book = WHITE, gold = GOLD) => `<g transform="translate(${x} ${y}) scale(${size / 240})">
  <path d="M120 180C70.8 182 38 186 38 194v16c0 8 32.8 12 82 14zM120 180c49.2 2 82 6 82 14v16c0 8-32.8 12-82 14z" fill="${book}"/>
  <path d="M113 170h14l8 10h-30z" fill="${gold}"/>
  <g fill="none" stroke="${gold}" stroke-width="10" stroke-linecap="round"><path d="M120 170V29"/><path d="M120 148c24 0 24-70 24-103"/><path d="M120 158c48 0 48-64 48-95"/><path d="M120 168c72 0 72-58 72-85"/><path d="M120 148c-24 0-24-70-24-103"/><path d="M120 158c-48 0-48-64-48-95"/><path d="M120 168c-72 0-72-58-72-85"/></g>
  <g fill="${LIGHT}"><path d="M120 14.5c7.1 8.1 6.2 14.7 0 15.7-6.2-1-7.1-7.6 0-15.7z"/><path d="M144 30.5c7.1 8.1 6.2 14.7 0 15.7-6.2-1-7.1-7.6 0-15.7z"/><path d="M168 48.5c7.1 8.1 6.2 14.7 0 15.7-6.2-1-7.1-7.6 0-15.7z"/><path d="M192 68.5c7.1 8.1 6.2 14.7 0 15.7-6.2-1-7.1-7.6 0-15.7z"/><path d="M96 30.5c7.1 8.1 6.2 14.7 0 15.7-6.2-1-7.1-7.6 0-15.7z"/><path d="M72 48.5c7.1 8.1 6.2 14.7 0 15.7-6.2-1-7.1-7.6 0-15.7z"/><path d="M48 68.5c7.1 8.1 6.2 14.7 0 15.7-6.2-1-7.1-7.6 0-15.7z"/></g>
</g>`;

const svg = (w, h, body, title) => `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(title)}"><title>${esc(title)}</title>${brandDefs}${body}</svg>`;
const text = (x, y, value, size, opts = {}) => `<text x="${x}" y="${y}" text-anchor="${opts.anchor ?? "middle"}" fill="${opts.fill ?? WHITE}" font-family="${opts.family ?? "Cinzel Brand, Cinzel, Georgia, serif"}" font-size="${size}" font-weight="${opts.weight ?? 700}" letter-spacing="${opts.spacing ?? 3}">${esc(value)}</text>`;
const lockup = (w, y, symbolSize = 260, titleSize = 68) => `${mark((w-symbolSize)/2,y,symbolSize)}${text(w/2,y+symbolSize+82,"MENORAH BIBLE QUIZ",titleSize,{fill:GOLD,spacing:5})}`;

const files = new Map();
const add = (dir, name, content) => files.set(path.join(root, dir, name), content);

// Hoodie: 12x16 back, 4x4 chest, 3x3 sleeve, 3x11 type sleeve.
add("hoodie","front.svg",svg(1200,1200,lockup(1200,120,360,74),"Classic Hoodie front — centered chest logo"));
add("hoodie","back.svg",svg(3600,4800,`${text(1800,780,"LEARN GOD'S WORD",250,{fill:GOLD,spacing:10})}${text(1800,1160,"PLAY WITH PURPOSE",220,{spacing:9})}${text(1800,1540,"SHINE FOR HIS GLORY",220,{fill:LIGHT,spacing:8})}<path d="M760 1780h2080" stroke="${GOLD}" stroke-width="12"/>${text(1800,2060,"PSALM 119:105",110,{fill:GOLD,spacing:12})}${mark(1450,2320,700)}${text(1800,3260,"WWW.MENORAHBIBLEQUIZ.COM",92,{spacing:7})}`,"Classic Hoodie back typography"));
add("hoodie","left-sleeve.svg",svg(900,900,mark(110,110,680),"Classic Hoodie left sleeve Menorah symbol"));
add("hoodie","right-sleeve.svg",svg(900,3300,`${text(450,900,"MENORAH",170,{fill:GOLD,spacing:9})}${text(450,1200,"BIBLE QUIZ",150,{spacing:8})}${mark(260,1450,380)}`,"Classic Hoodie right sleeve vertical branding"));

add("tshirt","front.svg",svg(1200,1200,lockup(1200,150,320,68),"Premium T-shirt front logo"));
add("tshirt","back.svg",svg(3600,4200,`${text(1800,1300,"LEARN GOD'S WORD.",250,{fill:GOLD,spacing:9})}${text(1800,1750,"PLAY WITH PURPOSE.",230,{spacing:8})}${mark(1480,2150,640)}`,"Premium T-shirt back statement"));
add("polo","front.svg",svg(1050,1050,`${mark(100,120,330)}${text(265,560,"MENORAH",70,{fill:GOLD,spacing:4})}${text(265,650,"BIBLE QUIZ",56,{spacing:4})}`,"Polo Shirt left chest embroidery"));
add("zip-hoodie","front.svg",svg(2400,1200,`${mark(150,170,320)}${text(310,620,"MENORAH",62,{fill:GOLD,spacing:4})}${text(310,700,"BIBLE QUIZ",50,{spacing:3})}<path d="M1200 80v1040" stroke="${WHITE}" stroke-width="8" stroke-dasharray="18 18" opacity=".35"/>`,"Zip Hoodie left chest branding"));
add("zip-hoodie","back.svg",files.get(path.join(root,"hoodie","back.svg")));
add("cap","front.svg",svg(900,900,mark(90,80,720),"Baseball Cap embroidered Menorah symbol"));
add("mug","wrap.svg",svg(2700,1125,`${lockup(1200,120,300,58)}<path d="M1350 140v845" stroke="${GOLD}" stroke-width="7" opacity=".55"/>${text(2025,420,"LEARN GOD'S WORD",78,{fill:GOLD,spacing:5})}${text(2025,555,"PLAY WITH PURPOSE",66,{spacing:4})}${text(2025,690,"SHINE FOR HIS GLORY",62,{fill:LIGHT,spacing:3})}${text(2025,835,"PSALM 119:105",38,{fill:GOLD,spacing:5})}`,"Coffee Mug full wrap"));
add("stickers","round.svg",svg(1800,1800,`<circle cx="900" cy="900" r="850" fill="${NAVY}" stroke="${GOLD}" stroke-width="34"/>${mark(500,260,800)}${text(900,1280,"MENORAH",120,{fill:GOLD,spacing:8})}${text(900,1430,"BIBLE QUIZ",92,{spacing:7})}`,"Round Menorah Bible Quiz sticker"));
add("conference-banner","banner.svg",svg(7200,3000,`<rect width="7200" height="3000" fill="${NAVY}"/>${mark(360,380,1500)}${text(2250,1030,"MENORAH",330,{anchor:"start",fill:GOLD,spacing:18})}${text(2250,1430,"BIBLE QUIZ",260,{anchor:"start",spacing:16})}<path d="M2250 1610h4050" stroke="${GOLD}" stroke-width="16"/>${text(2250,1940,"LEARN GOD'S WORD  •  PLAY WITH PURPOSE",120,{anchor:"start",fill:LIGHT,spacing:7})}${text(2250,2240,"WWW.MENORAHBIBLEQUIZ.COM",82,{anchor:"start",spacing:6})}`,"Conference Banner 8 by 3.33 feet"));

const variant = (source, mode) => mode === "embroidery"
  ? source.replaceAll(WHITE,GOLD).replaceAll(LIGHT,GOLD)
  : mode === "screen-print" ? source.replaceAll(LIGHT,GOLD) : source;

for (const [file, content] of [...files]) {
  fs.mkdirSync(path.dirname(file), {recursive:true});
  fs.writeFileSync(file, content);
  const base = path.basename(file,".svg");
  if (!["back"].includes(base) || !file.includes("zip-hoodie")) {
    fs.writeFileSync(path.join(path.dirname(file),`${base}-embroidery.svg`),variant(content,"embroidery"));
    fs.writeFileSync(path.join(path.dirname(file),`${base}-screen-print.svg`),variant(content,"screen-print"));
    fs.writeFileSync(path.join(path.dirname(file),`${base}-dtg.svg`),content);
  }
}

const browser = await chromium.launch({headless:true});
for (const [file, content] of files) {
  // SVG dimensions are authored as final 300-DPI pixels (for example,
  // 3600 × 4800 = 12 × 16 inches), so rasterize at CSS/72 density and
  // attach the 300-DPI print metadata afterward.
  const img = sharp(Buffer.from(content), {density:72, limitInputPixels:false});
  const meta = await img.metadata();
  const max = 7200;
  const scale = Math.min(1, max / Math.max(meta.width,meta.height));
  await img.resize(Math.round(meta.width*scale),Math.round(meta.height*scale)).png().withMetadata({density:300}).toFile(file.replace(/\.svg$/,".png"));
  const page = await browser.newPage({viewport:{width:1200,height:1200}});
  await page.setContent(`<style>@page{size:${meta.width}px ${meta.height}px;margin:0}html,body{margin:0;background:transparent}svg{display:block;width:100%;height:100%}</style>${content}`);
  await page.pdf({path:file.replace(/\.svg$/,".pdf"),width:`${meta.width}px`,height:`${meta.height}px`,printBackground:true,preferCSSPageSize:true});
  await page.close();
}
await browser.close();

// Conventional vendor entrypoints requested by the brief.
for (const dir of ["hoodie","tshirt","polo","zip-hoodie","cap","mug","stickers","conference-banner"]) {
  const candidates=[...files.keys()].filter(f=>f.includes(`/${dir}/`));
  if (!candidates.length) continue;
  const preferred=candidates.find(f=>/back\.svg$/.test(f)) ?? candidates[0];
  fs.copyFileSync(preferred.replace(/\.svg$/,".pdf"),path.join(root,dir,"print.pdf"));
}
console.log(`Generated ${files.size} masters with SVG, 300-DPI PNG, PDF, embroidery, screen-print, and DTG variants.`);
