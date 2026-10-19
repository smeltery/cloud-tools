import sharp from "sharp";
import { readFile, writeFile } from "node:fs/promises";

const illustration = (
  await readFile("client/public/conversion.svg", "utf8")
).replace(
  '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="420" viewBox="0 0 600 420">',
  '<svg x="590" y="140" width="570" height="399" viewBox="0 0 600 420">',
);
const technologies = [
  { slug: "nextdotjs", name: "Next.js", color: "#172b43", x: 64 },
  { slug: "typescript", name: "TypeScript", color: "#3178c6", x: 226 },
  { slug: "bun", name: "Bun", color: "#172b43", x: 426 },
  { slug: "terraform", name: "Terraform", color: "#7047b8", x: 558 },
];
const technologyMarks = await Promise.all(
  technologies.map(async ({ slug, name, color, x }) => {
    const mark = await readFile(
      `client/public/brands/technology/${slug}.svg`,
      "utf8",
    );
    const paths = mark.replace(/<svg[^>]*>|<\/svg>|<title>.*?<\/title>/g, "");
    return `<g transform="translate(${x} 570)"><svg width="30" height="30" viewBox="0 0 24 24" fill="${color}">${paths}</svg><text x="42" y="21" font-size="17" fill="#52677d">${name}</text></g>`;
  }),
);
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
<rect width="1200" height="630" fill="#f7fbff"/>
<g transform="translate(62 48)"><path d="M8 31h23a9 9 0 0 0 0-18h-2A12 12 0 0 0 6 12a10 10 0 0 0 2 19Z" fill="none" stroke="#2767c7" stroke-width="2.5"/></g>
<g font-family="Arial,sans-serif" fill="#172b43"><text x="118" y="78" font-size="28" font-weight="bold">cloud tools.</text><text x="1138" y="77" font-size="13" text-anchor="end" fill="#52677d">Six focused tools. Built to self-host.</text>
<text x="62" y="215" font-size="64" font-weight="bold" letter-spacing="-3">A new format.</text>
<text x="62" y="295" font-family="Georgia,serif" font-style="italic" font-size="72" letter-spacing="-3" fill="#386b9f">A lighter file.</text>
<text x="62" y="375" font-family="Georgia,serif" font-style="italic" font-size="72" letter-spacing="-3" fill="#386b9f">Back to your day.</text>
<text x="64" y="435" font-size="21" fill="#52677d">Convert, compress, and carry on.</text>
<rect x="64" y="467" width="300" height="44" rx="22" fill="#172b43"/><text x="214" y="495" font-size="14" text-anchor="middle" fill="white">Images · Audio · Video · Documents</text>
${illustration}
<path d="M64 553h1074" stroke="#d9e5ef"/>
${technologyMarks.join("")}<text x="1138" y="589" text-anchor="end" font-size="13" fill="#52677d">smeltery / cloud tools</text></g></svg>`;
await writeFile("client/public/og.svg", svg);
await sharp(Buffer.from(svg)).png().toFile("client/public/og.png");
console.log("Generated 1200×630 social preview.");
