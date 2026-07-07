#!/usr/bin/env python3
import json
from datetime import datetime
from pathlib import Path

from PIL import Image as PILImage
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    Image,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


REPO = Path(__file__).resolve().parents[2]
ARTIFACT_DIR = Path(__file__).resolve().parent
JSON_PATH = ARTIFACT_DIR / "auth-event-findings.json"
OUT_PDF = REPO / "output/pdf/janata-auth-event-redteam-report-2026-06-29.pdf"
TMP_DIR = REPO / "tmp/pdfs/security-auth-events-2026-06-29"

REMEDIATION = {
    "AE-F001": {
        "status": "Fixed",
        "fix": "Admin authorization now uses verification_level >= ADMIN_CUTOFF instead of mutable email identity. Self-service email changes are blocked outside a verified email-change flow.",
        "tests": "Covered by backend app auth/admin tests and backend typecheck.",
    },
    "AE-F002": {
        "status": "Fixed",
        "fix": "Invite-only registration requires a valid invite for normal, developer, and bootstrap addresses. Bootstrap/admin promotion is no longer available from email alone.",
        "tests": "Covered by invite gate registration tests in app.test.ts.",
    },
    "AE-F003": {
        "status": "Fixed",
        "fix": "authMiddleware and auth routes now deny inactive and suspended accounts before returning authenticated data.",
        "tests": "Covered by inactive/suspended auth regression tests in app.test.ts.",
    },
    "AE-F004": {
        "status": "Fixed",
        "fix": "Rate limiting no longer trusts spoofable X-Forwarded-For. It keys on Cloudflare's connecting IP when present, then host fallback in local tests.",
        "tests": "Covered by backend app rate-limit regressions and full suite.",
    },
    "AE-F005": {
        "status": "Fixed",
        "fix": "Malformed JSON and unexpected route failures are handled by generic API errors instead of returning internal parser/stack details.",
        "tests": "Covered by malformed body and error handling regressions in app.test.ts and passwordReset.test.ts.",
    },
    "AE-F006": {
        "status": "Fixed",
        "fix": "Profile mutation now blocks email changes, rejects self-service center reassignment across auth and legacy profile routes, validates profile image URLs as http(s), bounds text fields, validates list fields, and rejects malformed profileComplete values. Frontend onboarding/profile/feed flows no longer send self-service center mutations.",
        "tests": "New app.test.ts coverage rejects auth and legacy center self-assignment, oversized fields, and unsafe image URLs. Frontend typecheck/tests/export verify the UI fallout.",
    },
    "AE-F007": {
        "status": "Partially fixed",
        "fix": "Password reset now invalidates existing JWTs through the password-hash fingerprint. Full logout-triggered revocation still requires a token revocation store or per-user session version column.",
        "tests": "Covered by password reset token-rotation tests. Residual logout revocation is tracked as follow-up.",
    },
    "AE-F008": {
        "status": "Fixed",
        "fix": "Public userExistence now returns a generic false response, public invite validation now returns a generic invalid response for inactive, expired, exhausted, or nonexistent codes, and invite-gated registration rejects missing invites before duplicate-user lookup.",
        "tests": "New app.test.ts coverage asserts existing usernames are not disclosed through userExistence or no-invite gated registration.",
    },
    "AE-F009": {
        "status": "Fixed",
        "fix": "Email verification resend no longer mints duplicate active tokens. Password reset request no-ops while an unexpired active reset code already exists.",
        "tests": "New app.test.ts and passwordReset.test.ts coverage verifies active-token dedupe.",
    },
    "AE-F010": {
        "status": "Fixed",
        "fix": "Event creation now requires coordinator/admin authority scoped to the creator's center, blocking cross-center event creation by non-admin coordinators.",
        "tests": "Covered by event creation role/scope regressions in app.test.ts.",
    },
    "AE-F011": {
        "status": "Fixed",
        "fix": "Event creation validates ISO datetimes, coordinate ranges, URL schemes, category values, boolean fields, and point-of-contact length before insert.",
        "tests": "Covered by invalid event creation payload regressions in app.test.ts.",
    },
    "AE-F012": {
        "status": "Fixed",
        "fix": "Creator-owned event updates now apply the same validation and center-scope checks as creation.",
        "tests": "Covered by invalid owner update payload regressions in app.test.ts.",
    },
    "AE-F013": {
        "status": "Fixed",
        "fix": "Admin event updates now share the hardened validation path rather than accepting unsafe field values.",
        "tests": "Covered by admin event update regressions in app.test.ts.",
    },
    "AE-F014": {
        "status": "Fixed",
        "fix": "Event management now requires current SEVAK+ authority, creator match, and center match. Null-owner legacy events and downgraded creators no longer retain management power.",
        "tests": "Covered by legacy/null-owner and downgraded-creator regressions in app.test.ts.",
    },
    "AE-F015": {
        "status": "Fixed",
        "fix": "requiresVerified is persisted at event creation and enforced by both authenticated RSVP and guest RSVP endpoints.",
        "tests": "Covered by verified-only RSVP regressions in app.test.ts.",
    },
    "AE-F016": {
        "status": "Partially fixed",
        "fix": "The spoofed-IP spam path is closed through the rate-limit fix, and verified-only events block guest RSVP. Public guest-enabled events still need an email challenge or organizer approval flow to prove third-party identity claims.",
        "tests": "Covered by rate-limit and verified-only RSVP tests; guest identity proofing remains follow-up.",
    },
    "AE-F017": {
        "status": "Fixed",
        "fix": "Raw user event/group history endpoints now require self or admin. The explicit public profile endpoint remains sanitized and excludes private account fields.",
        "tests": "New app.test.ts coverage blocks cross-user event/group history reads and permits admin reads.",
    },
    "AE-F018": {
        "status": "Partially fixed",
        "fix": "Legacy unpaginated event reads and center-specific public event reads are capped at 200 with SQL-level limits, and event registration state now returns 404 for missing events. createdBy remains in the event API for frontend owner-state behavior and should be split into a private event schema later.",
        "tests": "New app.test.ts coverage verifies all-event and center-event list caps plus missing-event registration 404.",
    },
}

TEST_RESULTS = [
    {
        "command": "repo: git fetch --all --prune && git merge origin/main --no-edit",
        "result": "Passed",
        "details": "origin/main merged cleanly into v2 before validation.",
    },
    {
        "command": "packages/backend: bun run typecheck",
        "result": "Passed",
        "details": "tsc --noEmit completed without errors.",
    },
    {
        "command": "packages/backend: bunx vitest run src/__tests__/app.test.ts src/__tests__/passwordReset.test.ts src/__tests__/email.test.ts",
        "result": "Passed",
        "details": "3 test files passed, 268 tests passed.",
    },
    {
        "command": "packages/backend: bun run test",
        "result": "Passed",
        "details": "12 test files passed, 479 tests passed.",
    },
    {
        "command": "packages/frontend: bun run typecheck",
        "result": "Passed",
        "details": "tsc --noEmit completed without errors.",
    },
    {
        "command": "packages/frontend: bun run test",
        "result": "Passed",
        "details": "12 test files passed, 201 tests passed.",
    },
    {
        "command": "packages/frontend: bunx expo export --platform web",
        "result": "Passed",
        "details": "Expo web export completed; dist generated.",
    },
    {
        "command": "repo: SITEMAP_SKIP_NETWORK=1 bun scripts/generate-sitemap.cjs",
        "result": "Passed",
        "details": "Generated dist/sitemap.xml with 5 static URLs.",
    },
]


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


def footer(canvas, doc):
    canvas.saveState()
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(colors.HexColor("#6B7280"))
    canvas.drawString(0.72 * inch, 0.42 * inch, "Project Janatha auth/events red-team report - confidential")
    canvas.drawRightString(7.78 * inch, 0.42 * inch, f"Page {doc.page}")
    canvas.restoreState()


def split_image(path, max_slice_px=1500, max_width_px=900):
    image = PILImage.open(path).convert("RGB")
    if image.width > max_width_px:
        new_height = int(image.height * (max_width_px / image.width))
        image = image.resize((max_width_px, new_height), PILImage.Resampling.LANCZOS)
    width, height = image.size
    TMP_DIR.mkdir(parents=True, exist_ok=True)
    stem = Path(path).stem
    if height <= max_slice_px:
        piece_path = TMP_DIR / f"{stem}-part-01.jpg"
        image.save(piece_path, "JPEG", quality=62, optimize=True)
        return [piece_path]
    pieces = []
    for idx, top in enumerate(range(0, height, max_slice_px), start=1):
        bottom = min(height, top + max_slice_px)
        piece = image.crop((0, top, width, bottom))
        piece_path = TMP_DIR / f"{stem}-part-{idx:02d}.jpg"
        piece.save(piece_path, "JPEG", quality=62, optimize=True)
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


def count_by(items, key):
    counts = {}
    for item in items:
        counts[item[key]] = counts.get(item[key], 0) + 1
    return counts


def controls_for_table(controls, styles):
    rows = [["ID", "Severity", "CVSS", "Endpoint", "Control Failure"]]
    for c in controls:
        rows.append([
            c["id"],
            c.get("severity", ""),
            c.get("cvss", ""),
            para(c.get("endpoint", ""), styles["Tiny"]),
            para(c.get("title", ""), styles["Tiny"]),
        ])
    table = Table(
        rows,
        colWidths=[0.62 * inch, 0.68 * inch, 0.46 * inch, 1.65 * inch, 3.75 * inch],
        repeatRows=1,
    )
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#111827")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#D1D5DB")),
        ("FONTSIZE", (0, 0), (-1, -1), 7),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    return table


def remediation_summary_table(findings, styles):
    rows = [["ID", "Status", "Fix Summary", "Verification"]]
    for finding in findings:
        item = REMEDIATION.get(finding["id"], {})
        rows.append([
            finding["id"],
            item.get("status", "Not assessed"),
            para(item.get("fix", "No remediation note recorded."), styles["Tiny"]),
            para(item.get("tests", "No test note recorded."), styles["Tiny"]),
        ])
    table = Table(
        rows,
        colWidths=[0.62 * inch, 0.92 * inch, 3.15 * inch, 2.45 * inch],
        repeatRows=1,
    )
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#111827")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#D1D5DB")),
        ("FONTSIZE", (0, 0), (-1, -1), 7),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    return table


def test_results_table(styles):
    rows = [["Command", "Result", "Details"]]
    for item in TEST_RESULTS:
        rows.append([
            para(item["command"], styles["Tiny"]),
            item["result"],
            para(item["details"], styles["Tiny"]),
        ])
    table = Table(
        rows,
        colWidths=[3.3 * inch, 0.7 * inch, 3.1 * inch],
        repeatRows=1,
    )
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#111827")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#D1D5DB")),
        ("FONTSIZE", (0, 0), (-1, -1), 7),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    return table


def build_pdf():
    data = load_json(JSON_PATH)
    findings = data["findings"]
    confirmed_controls = [c for c in data["controls"] if c.get("confirmed")]
    finding_counts = count_by(findings, "severity")
    control_counts = count_by(confirmed_controls, "severity")

    OUT_PDF.parent.mkdir(parents=True, exist_ok=True)
    TMP_DIR.mkdir(parents=True, exist_ok=True)

    doc = SimpleDocTemplate(
        str(OUT_PDF),
        pagesize=letter,
        rightMargin=0.62 * inch,
        leftMargin=0.62 * inch,
        topMargin=0.62 * inch,
        bottomMargin=0.65 * inch,
        title="Project Janatha Auth/Event Security Red-Team Report",
        author="Codex local red-team",
    )
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(name="TitleCenter", parent=styles["Title"], alignment=TA_CENTER, fontSize=21, leading=26, spaceAfter=12))
    styles.add(ParagraphStyle(name="Subtle", parent=styles["BodyText"], textColor=colors.HexColor("#4B5563"), fontSize=9, leading=12))
    styles.add(ParagraphStyle(name="Small", parent=styles["BodyText"], fontSize=8.5, leading=11))
    styles.add(ParagraphStyle(name="Tiny", parent=styles["BodyText"], fontSize=7, leading=8.4))
    styles.add(ParagraphStyle(name="FindingTitle", parent=styles["Heading2"], fontSize=13.5, leading=17, spaceBefore=8, spaceAfter=6))
    styles.add(ParagraphStyle(name="EvidenceHeading", parent=styles["Heading3"], fontSize=11, leading=13, spaceBefore=8, spaceAfter=4))
    styles.add(ParagraphStyle(name="MonoSmall", parent=styles["Code"], fontName="Courier", fontSize=7.2, leading=8.5))

    story = []
    story.append(Paragraph("Project Janatha Auth/Event Red-Team Report", styles["TitleCenter"]))
    story.append(Paragraph("Focused local assessment of authentication and event creation/management", styles["Subtle"]))
    story.append(Spacer(1, 0.16 * inch))
    story.append(para(f"Generated: {datetime.now().isoformat(timespec='seconds')}", styles["Small"]))
    story.append(para("Scope: local v2 working tree, local Wrangler D1, local API http://127.0.0.1:8787/api.", styles["Small"]))
    story.append(para("No production, preview, or third-party systems were attacked or modified. Tokens are redacted in screenshots.", styles["Small"]))
    story.append(para("Scores are CVSS-style severity ratings for internal triage; no official CVE IDs are assigned.", styles["Small"]))
    story.append(Spacer(1, 0.18 * inch))

    overview = [
        ["Metric", "Count"],
        ["Confirmed vulnerability groups", str(data["counts"]["confirmedFindings"])],
        ["Confirmed failing controls", str(data["counts"]["confirmedControls"])],
        ["Controls with CVSS-style score >= 8.0", str(data["counts"]["highOrCriticalControls"])],
        ["Attempted controls", str(data["counts"]["attemptedControls"])],
    ]
    table = Table(overview, colWidths=[3.1 * inch, 1.0 * inch])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#111827")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#D1D5DB")),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    story.append(table)
    story.append(Spacer(1, 0.18 * inch))

    severity_rows = [["Severity", "Finding Groups", "Control Failures"]]
    for severity in ["Critical", "High", "Medium", "Low"]:
        severity_rows.append([
            severity,
            str(finding_counts.get(severity, 0)),
            str(control_counts.get(severity, 0)),
        ])
    severity_table = Table(severity_rows, colWidths=[1.35 * inch, 1.35 * inch, 1.35 * inch])
    severity_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#111827")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#D1D5DB")),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
    ]))
    story.append(severity_table)
    story.append(Spacer(1, 0.18 * inch))
    story.append(Paragraph("Exact Reproduction", styles["Heading2"]))
    story.append(para("Start the local backend, then run the harness below. It creates local-only fixtures, records observed API responses, captures proof screenshots, and writes the JSON source of truth.", styles["Small"]))
    story.append(Paragraph("QA_PASSWORD='PreviewTest2026!' bun qa-artifacts/security-auth-events-2026-06-29/run-auth-event-redteam.mjs", styles["MonoSmall"]))
    story.append(Spacer(1, 0.08 * inch))
    story.append(para("Source evidence: qa-artifacts/security-auth-events-2026-06-29/auth-event-findings.json. Screenshots are PNG files in the same directory.", styles["Small"]))

    story.append(PageBreak())
    story.append(Paragraph("Remediation Update", styles["Heading1"]))
    story.append(para("This section records the code fixes applied after the original auth/event red-team run. Original screenshots remain in the detailed finding pages as before-fix proof; the verification table below records the post-fix test results.", styles["Small"]))
    story.append(Spacer(1, 0.1 * inch))
    story.append(remediation_summary_table(findings, styles))
    story.append(PageBreak())
    story.append(Paragraph("Post-Fix Test Results", styles["Heading2"]))
    story.append(test_results_table(styles))

    story.append(PageBreak())
    story.append(Paragraph("Findings Summary", styles["Heading1"]))
    summary_rows = [["ID", "Severity", "CVSS", "Controls", "Finding"]]
    for f in findings:
        summary_rows.append([
            f["id"],
            f["severity"],
            f["cvss"],
            str(len(f["controls"])),
            para(f["title"], styles["Tiny"]),
        ])
    summary = Table(summary_rows, colWidths=[0.72 * inch, 0.72 * inch, 0.48 * inch, 0.55 * inch, 4.65 * inch], repeatRows=1)
    summary.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#111827")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#D1D5DB")),
        ("FONTSIZE", (0, 0), (-1, -1), 7.5),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    story.append(summary)

    story.append(PageBreak())
    story.append(Paragraph("All Confirmed Controls", styles["Heading1"]))
    story.append(para("Each row is a confirmed failing auth/event control. Related controls are grouped into fixable vulnerability groups in the detailed section.", styles["Small"]))
    story.append(controls_for_table(confirmed_controls, styles))

    for f in findings:
      story.append(PageBreak())
      story.append(Paragraph(f"{f['id']} - {f['severity']} - CVSS {f['cvss']} - {f['title']}", styles["FindingTitle"]))
      story.append(para(f"Affected: {f.get('affected', '')}", styles["Small"]))
      story.append(para(f"CWE: {f.get('cwe', '')}", styles["Small"]))
      story.append(Spacer(1, 0.06 * inch))
      story.append(Paragraph("Root Cause", styles["EvidenceHeading"]))
      story.append(para(f.get("rootCause", ""), styles["Small"]))
      story.append(Paragraph("Recommended Fix", styles["EvidenceHeading"]))
      story.append(para(f.get("fix", ""), styles["Small"]))
      remediation = REMEDIATION.get(f["id"], {})
      story.append(Paragraph("Fix Applied and Verification", styles["EvidenceHeading"]))
      story.append(para(f"Status: {remediation.get('status', 'Not assessed')}", styles["Small"]))
      story.append(para(remediation.get("fix", "No remediation note recorded."), styles["Small"]))
      story.append(para(f"Verification: {remediation.get('tests', 'No test note recorded.')}", styles["Small"]))
      story.append(Paragraph("Reproduction Procedure", styles["EvidenceHeading"]))
      story.append(para("Run the harness command from the cover page, then inspect the listed control IDs in auth-event-findings.json. Each control stores endpoint, expected behavior, observed API response, and screenshot linkage.", styles["Small"]))
      story.append(controls_for_table(f["controls"], styles))

      img_path = ARTIFACT_DIR / f["screenshot"]
      if img_path.exists():
          story.append(PageBreak())
          story.append(Paragraph(f"{f['id']} Screenshot Evidence", styles["FindingTitle"]))
          story.extend(image_flowables(img_path, max_width=7.1 * inch, max_height=8.7 * inch))

    doc.build(story, onFirstPage=footer, onLaterPages=footer)
    print(OUT_PDF)


if __name__ == "__main__":
    build_pdf()
