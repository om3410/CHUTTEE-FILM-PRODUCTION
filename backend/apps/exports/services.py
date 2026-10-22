import io
import csv
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib import colors
from openpyxl import Workbook


def generate_call_sheet_pdf(shoot_day, scenes, crew):
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    styles = getSampleStyleSheet()
    story = []

    story.append(Paragraph(f"<b>CALL SHEET - Day {shoot_day['day_number']}</b>", styles['Title']))
    story.append(Spacer(1, 12))
    story.append(Paragraph(f"<b>Date:</b> {shoot_day['shoot_date']}", styles['Normal']))
    story.append(Paragraph(f"<b>Location:</b> {shoot_day['location']}", styles['Normal']))
    story.append(Paragraph(
        f"<b>Weather:</b> {shoot_day['weather_condition']} ({shoot_day['temperature_celsius']}C)",
        styles['Normal']
    ))
    story.append(Paragraph(
        f"<b>Time:</b> {shoot_day['start_time']} - {shoot_day['end_time']}",
        styles['Normal']
    ))
    story.append(Spacer(1, 20))

    story.append(Paragraph("<b>Scenes</b>", styles['Heading2']))
    scene_data = [['#', 'Location', 'Time', 'Duration']]
    for s in scenes:
        scene_data.append([
            s['scene_number'], s['location'], s['time_of_day'],
            f"{s['duration_estimate_minutes']} min"
        ])
    t1 = Table(scene_data)
    t1.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#d13f4d')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
    ]))
    story.append(t1)
    story.append(Spacer(1, 20))

    story.append(Paragraph("<b>Crew on Set</b>", styles['Heading2']))
    crew_data = [['Name', 'Role', 'Department']]
    for c in crew:
        crew_data.append([c['full_name'], c['role'], c['department']])
    t2 = Table(crew_data)
    t2.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#d13f4d')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
    ]))
    story.append(t2)

    doc.build(story)
    buffer.seek(0)
    return buffer


def generate_csv(rows, headers):
    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(headers)
    for r in rows:
        writer.writerow([r.get(h, '') for h in headers])   # ← fixed
    buffer.seek(0)
    return buffer


def generate_excel(sheets):
    wb = Workbook()
    wb.remove(wb.active)
    for name, data in sheets.items():
        ws = wb.create_sheet(title=name[:30])
        ws.append(data['headers'])
        for r in data['rows']:
            ws.append([r.get(h, '') for h in data['headers']])   # ← fixed
    buffer = io.BytesIO()
    wb.save(buffer)
    buffer.seek(0)
    return buffer


def generate_srt(dialogues):
    def ts(sec):
        h = int(sec // 3600)
        m = int((sec % 3600) // 60)
        s = int(sec % 60)
        ms = int((sec - int(sec)) * 1000)
        return f"{h:02}:{m:02}:{s:02},{ms:03}"

    lines = []
    for i, d in enumerate(dialogues, start=1):
        lines.append(str(i))
        lines.append(f"{ts(d.get('start_seconds', i*3))} --> {ts(d.get('end_seconds', i*3 + 2.5))}")
        lines.append(f"{d.get('character_name', '')}: {d.get('text', '')}")
        lines.append("")
    return "\n".join(lines)