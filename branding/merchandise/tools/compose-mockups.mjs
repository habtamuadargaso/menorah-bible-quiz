import fs from "node:fs";
import path from "node:path";
import sharp from "../../../node_modules/.pnpm/sharp@0.32.6/node_modules/sharp/lib/index.js";

const root=path.resolve("branding/merchandise"), mock=path.join(root,"mockups");
const layer=async(file,width,left,top,opacity=.94)=>({input:await sharp(file).resize({width}).png().toBuffer(),left,top,blend:"over",opacity});
async function compose(base,out,layers){await sharp(path.join(mock,"source",base)).composite(layers).png().withMetadata({density:144}).toFile(path.join(mock,out));}

const hoodieFront=path.join(root,"hoodie","front.png"), hoodieBack=path.join(root,"hoodie","back.png");
for(const [color,frontFile] of [["navy",hoodieFront],["black",hoodieFront],["white",path.join(root,"hoodie","front-embroidery.svg")]]){
  await compose(`${color}-hoodie-blank.png`,`${color}-hoodie.png`,[
    await layer(frontFile,120,245,390),
    await layer(hoodieBack,300,790,375)
  ]);
}
const shirtFront=path.join(root,"tshirt","front.png"), shirtBack=path.join(root,"tshirt","back.png");
for(const color of ["navy","black"]){await compose(`${color}-tshirt-blank.png`,`${color}-tshirt.png`,[await layer(shirtFront,105,255,385),await layer(shirtBack,310,795,380)]);}
await compose("baseball-cap-blank.png","baseball-cap.png",[await layer(path.join(root,"cap","front-embroidery.svg"),230,512,350)]);
await compose("coffee-mug-blank.png","coffee-mug.png",[await layer(path.join(root,"hoodie","front.png"),300,285,390)]);
await compose("conference-banner-blank.png","conference-banner.png",[await layer(path.join(root,"conference-banner","banner.png"),940,155,395)]);
console.log("Composed 8 exact-brand product mockups.");
