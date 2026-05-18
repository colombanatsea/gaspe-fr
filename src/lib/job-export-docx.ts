/* ------------------------------------------------------------------ */
/*  Job → .docx export                                                  */
/*  Génère un document Word reproduisant la fiche offre publique du     */
/*  GASPE, prête à diffuser sur les canaux du recruteur.                */
/*                                                                      */
/*  Le module `docx` (dolanmiu/docx) est chargé en lazy import depuis   */
/*  la page /offres/export pour ne pas peser sur le bundle initial.     */
/* ------------------------------------------------------------------ */

import type { Job } from "@/data/jobs";
import type { Member } from "@/types";
import type { Paragraph as DocxParagraph, TableCell as DocxTableCell } from "docx";
import { stripHtmlPreview, decodeHtmlEntities } from "./text-preview";

const GASPE_LOGO_URL = "/assets/brand/logo-gaspe.png";

async function fetchAsArrayBuffer(url: string): Promise<ArrayBuffer | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.arrayBuffer();
  } catch {
    return null;
  }
}

/** Convertit un bloc HTML en suite de paragraphes texte (1 par <p> ou <li>). */
function htmlToParagraphLines(html: string): string[] {
  if (!html) return [];
  // Splitter sur les balises de bloc avant strip pour préserver les sauts.
  const withBreaks = html
    .replace(/<\/(p|div|li|h[1-6])>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n");
  const plain = stripHtmlPreview(withBreaks, 100_000);
  return plain
    .split(/\n+/)
    .map((s) => decodeHtmlEntities(s).trim())
    .filter(Boolean);
}

interface ExportDocxOptions {
  job: Job;
  member?: Member;
  publicUrl?: string;
}

/**
 * Génère et déclenche le téléchargement d'un .docx pour l'offre passée.
 * Importe dynamiquement la lib `docx` pour garder le bundle léger.
 */
export async function exportJobToDocx({ job, member, publicUrl }: ExportDocxOptions): Promise<void> {
  const docx = await import("docx");
  const {
    Document,
    Packer,
    Paragraph,
    TextRun,
    Table,
    TableRow,
    TableCell,
    ImageRun,
    AlignmentType,
    HeadingLevel,
    BorderStyle,
    WidthType,
  } = docx;

  const [gaspeLogoBuffer, companyLogoBuffer] = await Promise.all([
    fetchAsArrayBuffer(GASPE_LOGO_URL),
    member?.logoUrl ? fetchAsArrayBuffer(member.logoUrl) : Promise.resolve(null),
  ]);

  const teal = "1B7E8A";
  const neutral900 = "222221";
  const neutralMuted = "5C5851";
  const noBorder = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
  const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };

  // Header : table 2 colonnes (logo GASPE | logo compagnie) avec baseline.
  const headerCells: DocxTableCell[] = [];

  headerCells.push(
    new TableCell({
      width: { size: 50, type: WidthType.PERCENTAGE },
      borders: noBorders,
      children: [
        new Paragraph({
          alignment: AlignmentType.LEFT,
          children: gaspeLogoBuffer
            ? [
                new ImageRun({
                  type: "png",
                  data: gaspeLogoBuffer,
                  transformation: { width: 110, height: 36 },
                }),
              ]
            : [new TextRun({ text: "GASPE", bold: true, size: 28, color: teal })],
        }),
        new Paragraph({
          spacing: { before: 60 },
          children: [
            new TextRun({
              text: "Plateforme emploi du transport maritime côtier",
              italics: true,
              size: 16,
              color: neutralMuted,
            }),
          ],
        }),
      ],
    }),
  );

  headerCells.push(
    new TableCell({
      width: { size: 50, type: WidthType.PERCENTAGE },
      borders: noBorders,
      children: [
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: companyLogoBuffer
            ? [
                new ImageRun({
                  type: member?.logoUrl?.toLowerCase().endsWith(".jpg") || member?.logoUrl?.toLowerCase().endsWith(".jpeg")
                    ? "jpg"
                    : "png",
                  data: companyLogoBuffer,
                  transformation: { width: 90, height: 56 },
                }),
              ]
            : [new TextRun({ text: job.company, bold: true, size: 24 })],
        }),
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          spacing: { before: 60 },
          children: [new TextRun({ text: job.company, size: 18, color: neutralMuted })],
        }),
      ],
    }),
  );

  const headerTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [new TableRow({ children: headerCells })],
    borders: {
      top: noBorder,
      bottom: noBorder,
      left: noBorder,
      right: noBorder,
      insideHorizontal: noBorder,
      insideVertical: noBorder,
    },
  });

  // Méta-données : Type de contrat, Lieu, Brevet, Salaire, Prise de poste, Date limite, Référence.
  const metaPairs: Array<[string, string | undefined]> = [
    ["Localisation", job.location],
    ["Type de contrat", job.contractType],
    ["Brevet / niveau", job.brevet],
    ["Catégorie", job.category],
    ["Rémunération", job.salaryRange],
    ["Prise de poste", job.startDate],
    ["Date limite de candidature", job.applicationDeadline ? new Date(job.applicationDeadline).toLocaleDateString("fr-FR") : undefined],
    ["Référence", job.reference],
    ["Accessibilité", job.handiAccessible ? "Offre handi-accueillante" : undefined],
  ];
  const visibleMeta = metaPairs.filter(([, v]) => v && v.length > 0);

  const metaRows = visibleMeta.map(
    ([label, value]) =>
      new TableRow({
        children: [
          new TableCell({
            width: { size: 35, type: WidthType.PERCENTAGE },
            borders: noBorders,
            children: [
              new Paragraph({
                spacing: { after: 60 },
                children: [new TextRun({ text: label, bold: true, size: 18, color: neutral900 })],
              }),
            ],
          }),
          new TableCell({
            width: { size: 65, type: WidthType.PERCENTAGE },
            borders: noBorders,
            children: [
              new Paragraph({
                spacing: { after: 60 },
                children: [new TextRun({ text: String(value), size: 18, color: neutralMuted })],
              }),
            ],
          }),
        ],
      }),
  );

  const metaTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: metaRows,
    borders: {
      top: noBorder,
      bottom: noBorder,
      left: noBorder,
      right: noBorder,
      insideHorizontal: noBorder,
      insideVertical: noBorder,
    },
  });

  function section(heading: string, htmlBody: string): DocxParagraph[] {
    const lines = htmlToParagraphLines(htmlBody);
    if (lines.length === 0) return [];
    return [
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 120 },
        children: [new TextRun({ text: heading, bold: true, size: 24, color: teal })],
      }),
      ...lines.map(
        (line) =>
          new Paragraph({
            spacing: { after: 100 },
            children: [new TextRun({ text: line, size: 20, color: neutral900 })],
          }),
      ),
    ];
  }

  const contactBlock: DocxParagraph[] = [];
  if (job.contactEmail || job.contactPhone || job.applicationUrl) {
    contactBlock.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 120 },
        children: [new TextRun({ text: "Contact & candidature", bold: true, size: 24, color: teal })],
      }),
    );
    const contactName = job.contactName ?? [job.contactFirstName, job.contactLastName].filter(Boolean).join(" ");
    if (contactName) {
      contactBlock.push(
        new Paragraph({
          spacing: { after: 80 },
          children: [new TextRun({ text: contactName, bold: true, size: 20, color: neutral900 })],
        }),
      );
    }
    if (job.contactEmail) {
      contactBlock.push(
        new Paragraph({
          spacing: { after: 60 },
          children: [
            new TextRun({ text: "Email : ", size: 20, color: neutralMuted }),
            new TextRun({ text: job.contactEmail, size: 20, color: neutral900 }),
          ],
        }),
      );
    }
    if (job.contactPhone) {
      contactBlock.push(
        new Paragraph({
          spacing: { after: 60 },
          children: [
            new TextRun({ text: "Téléphone : ", size: 20, color: neutralMuted }),
            new TextRun({ text: job.contactPhone, size: 20, color: neutral900 }),
          ],
        }),
      );
    }
    if (job.applicationUrl) {
      contactBlock.push(
        new Paragraph({
          spacing: { after: 60 },
          children: [
            new TextRun({ text: "Candidature en ligne : ", size: 20, color: neutralMuted }),
            new TextRun({ text: job.applicationUrl, size: 20, color: neutral900 }),
          ],
        }),
      );
    }
  }

  const footerLines: DocxParagraph[] = [];
  footerLines.push(
    new Paragraph({
      spacing: { before: 400 },
      border: { top: { style: BorderStyle.SINGLE, size: 4, color: "E5E0D8" } },
      children: [new TextRun({ text: "", size: 2 })],
    }),
  );
  footerLines.push(
    new Paragraph({
      spacing: { before: 160 },
      children: [
        new TextRun({
          text: "Offre publiée sur le portail emploi du GASPE — Groupement des Armateurs de Services Publics Maritimes de Passages d'Eau.",
          italics: true,
          size: 16,
          color: neutralMuted,
        }),
      ],
    }),
  );
  if (publicUrl) {
    footerLines.push(
      new Paragraph({
        spacing: { before: 40 },
        children: [
          new TextRun({ text: "Fiche en ligne : ", italics: true, size: 16, color: neutralMuted }),
          new TextRun({ text: publicUrl, italics: true, size: 16, color: neutral900 }),
        ],
      }),
    );
  }
  footerLines.push(
    new Paragraph({
      spacing: { before: 40 },
      children: [
        new TextRun({ text: "Contact GASPE : contact@gaspe.fr · gaspe.fr", italics: true, size: 16, color: neutralMuted }),
      ],
    }),
  );

  const doc = new Document({
    creator: "GASPE",
    title: `${job.title} — ${job.company}`,
    description: stripHtmlPreview(job.description, 300),
    styles: {
      default: {
        document: { run: { font: "Calibri", size: 20 } },
      },
    },
    sections: [
      {
        properties: { page: { margin: { top: 720, bottom: 720, left: 720, right: 720 } } },
        children: [
          headerTable,
          new Paragraph({
            spacing: { before: 240, after: 80 },
            border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: teal } },
            children: [new TextRun({ text: "", size: 2 })],
          }),
          new Paragraph({
            spacing: { before: 240, after: 80 },
            heading: HeadingLevel.HEADING_1,
            children: [new TextRun({ text: job.title, bold: true, size: 34, color: neutral900 })],
          }),
          new Paragraph({
            spacing: { after: 240 },
            children: [
              new TextRun({ text: `${job.company} · ${job.location}`, size: 20, color: neutralMuted }),
            ],
          }),
          metaTable,
          ...section("Description du poste", job.description),
          ...section("Profil recherché", job.profile),
          ...section("Conditions", job.conditions),
          ...contactBlock,
          ...footerLines,
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const filename = `gaspe-offre-${job.slug || job.id}.docx`;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
