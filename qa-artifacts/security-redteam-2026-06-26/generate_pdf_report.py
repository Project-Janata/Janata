#!/usr/bin/env python3
import json
import os
import textwrap
from datetime import datetime
from pathlib import Path

from PIL import Image as PILImage
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    Image,
    KeepTogether,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


REPO = Path(__file__).resolve().parents[2]
ARTIFACT_DIR = Path(__file__).resolve().parent
JSON_PATH = ARTIFACT_DIR / "deep-findings.json"
AUDIT_PATH = ARTIFACT_DIR / "npm-audit-omit-dev.json"
OUT_PDF = REPO / "output/pdf/janata-security-redteam-report-2026-06-26.pdf"
TMP_DIR = REPO / "tmp/pdfs/security-redteam-2026-06-26"


def load_json(path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def para(text, style):
    safe = (
        str(text)
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
    )
    return Paragraph(safe, style)


def bullet_list(items, style):
    out = []
    for item in items:
        out.append(Paragraph(f"- {str(item)}", style))
    return out


def page_footer(canvas, doc):
    canvas.saveState()
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(colors.HexColor("#6B7280"))
    canvas.drawString(0.72 * inch, 0.42 * inch, "Project Janatha local red-team report - confidential")
    canvas.drawRightString(7.78 * inch, 0.42 * inch, f"Page {doc.page}")
    canvas.restoreState()


def severity_color(severity):
    return {
        "Critical": colors.HexColor("#991B1B"),
        "High": colors.HexColor("#B45309"),
        "Medium": colors.HexColor("#A16207"),
        "Low": colors.HexColor("#374151"),
    }.get(severity, colors.HexColor("#111827"))


def split_image(path, max_slice_px=1500):
    image = PILImage.open(path).convert("RGB")
    width, height = image.size
    if height <= max_slice_px:
        return [path]
    TMP_DIR.mkdir(parents=True, exist_ok=True)
    pieces = []
    stem = Path(path).stem
    for idx, top in enumerate(range(0, height, max_slice_px), start=1):
        bottom = min(height, top + max_slice_px)
        piece = image.crop((0, top, width, bottom))
        piece_path = TMP_DIR / f"{stem}-part-{idx:02d}.jpg"
        piece.save(piece_path, "JPEG", quality=92)
        pieces.append(piece_path)
    return pieces


def image_flowables(path, max_width, max_height):
    flows = []
    pieces = split_image(path)
    for idx, piece in enumerate(pieces, start=1):
        img = PILImage.open(piece)
        w, h = img.size
        scale = min(max_width / w, max_height / h)
        flows.append(Image(str(piece), width=w * scale, height=h * scale))
        flows.append(Spacer(1, 0.08 * inch))
        if idx < len(pieces):
            flows.append(PageBreak())
    return flows


def audit_summary():
    if not AUDIT_PATH.exists():
        return []
    data = load_json(AUDIT_PATH)
    vulns = data.get("vulnerabilities", {})
    rows = []
    for name, item in sorted(vulns.items()):
        sev = item.get("severity", "")
        if sev not in ("critical", "high"):
            continue
        via = item.get("via", [])
        titles = []
        for v in via:
            if isinstance(v, dict):
                titles.append(v.get("title", "advisory"))
            else:
                titles.append(str(v))
        rows.append([name, sev.upper(), "; ".join(titles[:2])])
    return rows


def build_pdf():
    data = load_json(JSON_PATH)
    findings = data["findings"]
    counts = {}
    for f in findings:
        counts[f["severity"]] = counts.get(f["severity"], 0) + 1

    OUT_PDF.parent.mkdir(parents=True, exist_ok=True)
    TMP_DIR.mkdir(parents=True, exist_ok=True)

    doc = SimpleDocTemplate(
        str(OUT_PDF),
        pagesize=letter,
        rightMargin=0.62 * inch,
        leftMargin=0.62 * inch,
        topMargin=0.62 * inch,
        bottomMargin=0.65 * inch,
        title="Project Janatha Security Red-Team Report",
        author="Codex local red-team",
    )
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(name="TitleCenter", parent=styles["Title"], alignment=TA_CENTER, fontSize=22, leading=27, spaceAfter=12))
    styles.add(ParagraphStyle(name="Subtle", parent=styles["BodyText"], textColor=colors.HexColor("#4B5563"), fontSize=9, leading=12))
    styles.add(ParagraphStyle(name="Small", parent=styles["BodyText"], fontSize=8.5, leading=11))
    styles.add(ParagraphStyle(name="FindingTitle", parent=styles["Heading2"], fontSize=13.5, leading=17, spaceBefore=8, spaceAfter=6))
    styles.add(ParagraphStyle(name="EvidenceHeading", parent=styles["Heading3"], fontSize=11, leading=13, spaceBefore=8, spaceAfter=4))
    styles.add(ParagraphStyle(name="MonoSmall", parent=styles["Code"], fontName="Courier", fontSize=7.5, leading=9))

    story = []
    story.append(Paragraph("Project Janatha Security Red-Team Report", styles["TitleCenter"]))
    story.append(Paragraph("Local working tree assessment with screenshot-backed exploit proof", styles["Subtle"]))
    story.append(Spacer(1, 0.18 * inch))
    story.append(para(f"Generated: {datetime.now().isoformat(timespec='seconds')}", styles["Small"]))
    story.append(para("Scope: local v2 working tree, local Wrangler D1, local API http://127.0.0.1:8787/api, local web http://localhost:8081.", styles["Small"]))
    story.append(para("No production, preview, or third-party systems were attacked or modified. Tokens are redacted in screenshots.", styles["Small"]))
    story.append(Spacer(1, 0.18 * inch))

    count_table = [["Severity", "Count"]] + [[sev, str(counts.get(sev, 0))] for sev in ["Critical", "High", "Medium", "Low"]]
    t = Table(count_table, colWidths=[2.0 * inch, 1.0 * inch])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#111827")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#D1D5DB")),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    story.append(t)
    story.append(Spacer(1, 0.18 * inch))

    story.append(Paragraph("Reproduction", styles["Heading2"]))
    story.append(para("Start the local backend and frontend, then run:", styles["BodyText"]))
    story.append(Paragraph("QA_PASSWORD='PreviewTest2026!' node qa-artifacts/security-redteam-2026-06-26/run-deep-redteam.mjs", styles["MonoSmall"]))
    story.append(Spacer(1, 0.12 * inch))
    story.append(para("Raw evidence files: qa-artifacts/security-redteam-2026-06-26/deep-findings.json and the PNG screenshots in the same directory.", styles["Small"]))

    story.append(PageBreak())
    story.append(Paragraph("Findings Summary", styles["Heading1"]))
    summary_rows = [["ID", "Severity", "CVSS", "Finding"]]
    for f in findings:
        summary_rows.append([
            f["id"],
            f["severity"],
            f["cvss"],
            para(f["title"], styles["Small"]),
        ])
    summary = Table(summary_rows, colWidths=[0.7 * inch, 0.85 * inch, 0.55 * inch, 5.0 * inch], repeatRows=1)
    summary.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#111827")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#D1D5DB")),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    story.append(summary)

    audit_rows = audit_summary()
    if audit_rows:
        story.append(PageBreak())
        story.append(Paragraph("Dependency Audit Highlights", styles["Heading1"]))
        story.append(para("These are package advisories from npm audit and were not independently exploited in the app flow.", styles["BodyText"]))
        rows = [["Package", "Severity", "Advisory"]] + [[r[0], r[1], para(r[2], styles["Small"])] for r in audit_rows]
        table = Table(rows, colWidths=[1.4 * inch, 0.8 * inch, 4.9 * inch], repeatRows=1)
        table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#111827")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#D1D5DB")),
            ("FONTSIZE", (0, 0), (-1, -1), 8),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ]))
        story.append(table)

    for f in findings:
        story.append(PageBreak())
        title = f"{f['id']} - {f['severity']} - CVSS {f['cvss']} - {f['title']}"
        story.append(Paragraph(title, styles["FindingTitle"]))
        story.append(para(f"Affected: {f.get('affected', '')}", styles["Small"]))
        story.append(para(f"CWE: {f.get('cwe', '')}", styles["Small"]))
        story.append(Spacer(1, 0.08 * inch))
        story.append(Paragraph("Root Cause", styles["EvidenceHeading"]))
        story.append(para(f.get("rootCause", ""), styles["BodyText"]))
        story.append(Paragraph("Reproduction Steps", styles["EvidenceHeading"]))
        story.extend(bullet_list(f.get("reproduction", []), styles["Small"]))
        story.append(Paragraph("Recommended Fix", styles["EvidenceHeading"]))
        story.append(para(f.get("fix", ""), styles["BodyText"]))
        img_path = ARTIFACT_DIR / f["screenshot"]
        if img_path.exists():
            story.append(PageBreak())
            story.append(Paragraph(f"{f['id']} Screenshot Evidence", styles["FindingTitle"]))
            story.extend(image_flowables(img_path, max_width=7.1 * inch, max_height=8.7 * inch))
        else:
            story.append(Paragraph("Screenshot Evidence", styles["EvidenceHeading"]))
            story.append(para(f"Missing screenshot artifact: {f['screenshot']}", styles["Small"]))
        if f["id"] == "RT-001":
            ui_path = ARTIFACT_DIR / "02-email-spoof-admin-ui.png"
            if ui_path.exists():
                story.append(PageBreak())
                story.append(Paragraph("RT-001 Additional UI Proof - Admin Dashboard Loaded", styles["FindingTitle"]))
                story.extend(image_flowables(ui_path, max_width=7.1 * inch, max_height=8.7 * inch))

    doc.build(story, onFirstPage=page_footer, onLaterPages=page_footer)
    print(OUT_PDF)


if __name__ == "__main__":
    build_pdf()
