import fs from 'node:fs';

const pages = [
  ['BALLOONS & BLISS', 'Your Celebration Guide', 'A simple plan for a beautiful, joy-filled celebration.', '', '1  START WITH THE FEELING', 'Choose three words for the day: playful, dreamy, cosy, colourful, elegant or anything that feels like you.', '', '2  PICK A SIMPLE THEME', 'Start with a favourite colour, character, flower or story. Keep the palette to two or three colours so every detail feels connected.'],
  ['BALLOONS & BLISS', 'Your Celebration Guide', 'The details that make planning feel lighter.', '', '3  BUILD YOUR TIMELINE', '6–8 weeks out: choose the venue, theme, décor and cake. 2–3 weeks out: send invites and confirm activities. 1 week out: confirm suppliers and guest numbers.', '', '4  PLAN THE MOMENTS', 'Set aside space for a welcome sign, cake photos and one activity. A little breathing room makes the celebration feel calm.', '', '5  KEEP YOUR BUDGET BRIGHT', 'Prioritise the details guests will see and remember: the entrance, cake table and photo area.'],
];
function esc(value) { return value.replaceAll('\\', '\\\\').replaceAll('(', '\\(').replaceAll(')', '\\)'); }
const objects = [null, '<< /Type /Catalog /Pages 3 0 R >>', '<< /Producer (Balloons and Bliss) >>', '', '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>']; const pageIds = [];
for (const lines of pages) {
  const content = ['BT /F1 28 Tf 54 735 Td 0.82 0.18 0.35 rg (' + esc(lines[0]) + ') Tj 0 -54 Td /F1 30 Tf 0.14 0.08 0.12 rg (' + esc(lines[1]) + ') Tj 0 -32 Td /F1 13 Tf 0.35 0.25 0.3 rg (' + esc(lines[2]) + ') Tj'];
  let y = 610;
  for (const line of lines.slice(3)) { if (!line) { y -= 22; continue; } content.push(`0 -${y === 610 ? 0 : 0} Td /F1 ${line.match(/^\d/) ? 15 : 11} Tf ${line.match(/^\d/) ? '0.82 0.18 0.35' : '0.35 0.25 0.3'} rg (${esc(line)}) Tj`); y -= line.match(/^\d/) ? 24 : 46; }
  content.push('0 -30 Td /F1 10 Tf 0.55 0.4 0.46 rg (balloonsandblisssg.com  •  Alvernia Ladies Card members enjoy 15% OFF) Tj ET');
  const stream = content.join('\n'); const contentId = objects.push(`<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`) - 1;
  const pageId = objects.push('') - 1; pageIds.push(pageId); objects[pageId] = `<< /Type /Page /Parent 3 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents ${contentId} 0 R >>`;
}
objects[3] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`;
let pdf = '%PDF-1.4\n'; const offsets = [0];
for (let i = 1; i < objects.length; i++) { offsets[i] = Buffer.byteLength(pdf); pdf += `${i} 0 obj\n${objects[i]}\nendobj\n`; }
const xref = Buffer.byteLength(pdf); pdf += `xref\n0 ${objects.length}\n0000000000 65535 f \n${offsets.slice(1).map((offset) => String(offset).padStart(10, '0') + ' 00000 n ').join('\n')}\ntrailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
fs.writeFileSync(new URL('../public/celebration-guide.pdf', import.meta.url), pdf);
