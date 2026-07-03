import puppeteer from "puppeteer";
import { execSync } from "node:child_process";

let cachedExecutablePath: string | null | undefined;

function resolveChromiumPath(): string | undefined {
  if (process.env.PUPPETEER_EXECUTABLE_PATH)
    return process.env.PUPPETEER_EXECUTABLE_PATH;
  if (cachedExecutablePath !== undefined)
    return cachedExecutablePath ?? undefined;
  try {
    const found = execSync("which chromium || which chromium-browser", {
      encoding: "utf8",
    }).trim();
    cachedExecutablePath = found || null;
  } catch {
    cachedExecutablePath = null;
  }
  return cachedExecutablePath ?? undefined;
}

export interface PdfPaperQuestion {
  order: number;
  section: string;
  type: string;
  marks: number;
  text: string;
  options?: string[] | null;
}

export interface PdfPaper {
  title: string;
  className?: string | null;
  subjectName?: string | null;
  medium: "urdu" | "english" | "dual";
  totalMarks: number;
  durationMinutes?: number | null;
  examDate?: string | null;
  instructions?: string | null;
  schoolName?: string | null;
  questions: PdfPaperQuestion[];
}

const TYPE_LABELS: Record<string, string> = {
  mcq: "Multiple Choice Questions",
  short: "Short Questions",
  long: "Long Questions",
  exercise: "Exercises",
  conceptual: "Conceptual Questions",
  past_paper: "Past Paper Questions",
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildHtml(paper: PdfPaper): string {
  const isRtl = paper.medium === "urdu";
  const dir = isRtl ? "rtl" : "ltr";
  const fontFamily = isRtl
    ? "'Noto Nastaliq Urdu', 'Jameel Noori Nastaleeq', serif"
    : "'Georgia', 'Times New Roman', serif";

  const sections = new Map<string, PdfPaperQuestion[]>();
  const sorted = [...paper.questions].sort((a, b) => a.order - b.order);
  for (const q of sorted) {
    const key = q.section?.trim() || TYPE_LABELS[q.type] || "Questions";
    if (!sections.has(key)) sections.set(key, []);
    sections.get(key)!.push(q);
  }

  let sectionIndex = 0;
  const sectionsHtml = Array.from(sections.entries())
    .map(([section, qs]) => {
      sectionIndex += 1;
      const sectionMarks = qs.reduce((sum, q) => sum + q.marks, 0);
      const letter = String.fromCharCode(64 + sectionIndex);
      const rows = qs
        .map((q, idx) => {
          const optionsHtml =
            q.options && q.options.length
              ? `<div class="options">${q.options
                  .map(
                    (opt, i) =>
                      `<span class="option">(${String.fromCharCode(
                        97 + i,
                      )}) ${escapeHtml(opt)}</span>`,
                  )
                  .join("")}</div>`
              : "";
          return `<div class="question">
            <div class="q-head">
              <span class="q-num">${idx + 1}.</span>
              <span class="q-text">${escapeHtml(q.text)}</span>
              <span class="q-marks">[${q.marks}]</span>
            </div>
            ${optionsHtml}
          </div>`;
        })
        .join("");
      return `<section class="paper-section">
        <div class="section-head">
          <span>Section ${letter}: ${escapeHtml(section)}</span>
          <span>(${sectionMarks} Marks)</span>
        </div>
        ${rows}
      </section>`;
    })
    .join("");

  const meta: string[] = [];
  if (paper.className) meta.push(`Class: ${escapeHtml(paper.className)}`);
  if (paper.subjectName) meta.push(`Subject: ${escapeHtml(paper.subjectName)}`);
  if (paper.durationMinutes)
    meta.push(`Time: ${paper.durationMinutes} min`);
  meta.push(`Total Marks: ${paper.totalMarks}`);
  if (paper.examDate) meta.push(`Date: ${escapeHtml(paper.examDate)}`);

  return `<!DOCTYPE html>
<html dir="${dir}" lang="${isRtl ? "ur" : "en"}">
<head>
<meta charset="utf-8" />
<style>
  * { box-sizing: border-box; }
  body {
    font-family: ${fontFamily};
    direction: ${dir};
    margin: 0;
    color: #111827;
    font-size: 14px;
    line-height: 1.9;
  }
  .header {
    text-align: center;
    border-bottom: 3px double #111827;
    padding-bottom: 12px;
    margin-bottom: 16px;
  }
  .school-name {
    font-size: 24px;
    font-weight: 700;
    letter-spacing: 0.5px;
  }
  .paper-title {
    font-size: 18px;
    margin-top: 4px;
    font-weight: 600;
  }
  .meta {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 8px;
    margin: 12px 0;
    font-size: 13px;
    border: 1px solid #d1d5db;
    padding: 8px 12px;
    border-radius: 6px;
  }
  .instructions {
    font-style: italic;
    font-size: 12px;
    margin-bottom: 16px;
    color: #374151;
  }
  .section-head {
    display: flex;
    justify-content: space-between;
    font-weight: 700;
    background: #f3f4f6;
    padding: 6px 10px;
    margin: 16px 0 8px;
    border-radius: 4px;
  }
  .question { margin: 8px 0; }
  .q-head { display: flex; gap: 8px; }
  .q-num { font-weight: 700; }
  .q-text { flex: 1; }
  .q-marks { color: #6b7280; font-weight: 600; }
  .options {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 24px;
    padding-${isRtl ? "right" : "left"}: 24px;
    margin-top: 4px;
  }
  .option { min-width: 40%; }
</style>
</head>
<body>
  <div class="header">
    <div class="school-name">${escapeHtml(paper.schoolName || "School")}</div>
    <div class="paper-title">${escapeHtml(paper.title)}</div>
  </div>
  <div class="meta">${meta.map((m) => `<span>${m}</span>`).join("")}</div>
  ${
    paper.instructions
      ? `<div class="instructions">${escapeHtml(paper.instructions)}</div>`
      : ""
  }
  ${sectionsHtml}
</body>
</html>`;
}

export async function renderPaperPdf(paper: PdfPaper): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: resolveChromiumPath(),
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });
  try {
    const page = await browser.newPage();
    await page.setContent(buildHtml(paper), { waitUntil: "load" });
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "18mm", bottom: "18mm", left: "16mm", right: "16mm" },
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
