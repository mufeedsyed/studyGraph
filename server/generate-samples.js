import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.resolve(__dirname, '../uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

function createMinimalPdf(title, subtitle, pagesCount = 5) {
  // Generates a valid multi-page PDF specification
  let objects = [];
  let offsets = [];

  function addObject(content) {
    objects.push(content);
    return objects.length;
  }

  // Object 1: Catalog
  addObject(`<< /Type /Catalog /Pages 2 0 R >>`);

  // We will build Pages object at index 2
  let pageObjIds = [];
  for (let i = 0; i < pagesCount; i++) {
    pageObjIds.push(3 + i * 2);
  }

  const kidsStr = pageObjIds.map(id => `${id} 0 R`).join(' ');
  // Object 2: Pages root
  addObject(`<< /Type /Pages /Kids [ ${kidsStr} ] /Count ${pagesCount} >>`);

  // Build Pages and Contents
  for (let p = 1; p <= pagesCount; p++) {
    const pageIndex = p;
    const contentId = 4 + (p - 1) * 2;
    // Page Object
    addObject(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents ${contentId} 0 R /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >> /F2 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >> >>`);

    // Stream content
    const pageContent = `
BT
/F1 24 Tf
50 720 Td
(${title} - Page ${pageIndex}) Tj
0 -36 Td
/F2 14 Tf
(${subtitle}) Tj
0 -40 Td
(StudyGraph Academic Reading Environment) Tj
0 -30 Td
(Topic: Kinematics and Equations of Motion) Tj
0 -25 Td
(Formula 1: v = u + at) Tj
0 -20 Td
(Formula 2: s = ut + 0.5 * a * t^2) Tj
0 -20 Td
(Formula 3: v^2 = u^2 + 2as) Tj
0 -30 Td
(Reading notes & syllabus reference: Unit 1 Mechanics) Tj
0 -20 Td
(This is an authentic PDF rendered inside StudyGraph via PDF.js with full-screen support.) Tj
ET
`;
    const streamLen = Buffer.byteLength(pageContent);
    // Content Stream Object
    addObject(`<< /Length ${streamLen} >>\nstream\n${pageContent}\nendstream`);
  }

  // Build the complete PDF string with xref table
  let pdf = `%PDF-1.4\n`;
  let byteOffset = Buffer.byteLength(pdf);

  for (let i = 0; i < objects.length; i++) {
    offsets.push(byteOffset);
    const objStr = `${i + 1} 0 obj\n${objects[i]}\nendobj\n`;
    pdf += objStr;
    byteOffset += Buffer.byteLength(objStr);
  }

  const xrefOffset = byteOffset;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const off of offsets) {
    pdf += `${off.toString().padStart(10, '0')} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return Buffer.from(pdf);
}

// Write the sample PDFs
const pdfs = [
  { file: 'sample-handbook.pdf', title: 'Kinematics Handbook', subtitle: 'Principles of Particle Dynamics & Velocity', pages: 18 },
  { file: 'sample-lecture.pdf', title: 'Dynamics Lecture Notes', subtitle: 'Newtonian Laws, Momentum & Impulse', pages: 32 },
  { file: 'sample-java.pdf', title: 'Java Concurrency in Practice', subtitle: 'Threads, Locks, and Memory Models', pages: 42 },
  { file: 'sample-clrs.pdf', title: 'CLRS Binary Search Trees', subtitle: 'Tree Rotations, Traversals & Asymptotics', pages: 24 }
];

for (const item of pdfs) {
  const filePath = path.join(uploadsDir, item.file);
  fs.writeFileSync(filePath, createMinimalPdf(item.title, item.subtitle, item.pages));
  console.log(`Generated ${item.file} (${item.pages} pages)`);
}
