"""Build the one-page ATS-friendly résumé from current-resume.json.
Usage: python3 build_resume.py [output.pdf]
Requires ReportLab. The content has no fixed text coordinates or manual line breaks.
"""
import json
import sys
from html import escape
from pathlib import Path
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, KeepTogether

ROOT = Path(__file__).resolve().parent
source = json.loads((ROOT / 'current-resume.json').read_text())
output = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / 'Ryan-Baltodano-Resume.pdf'
styles = {
    'name': ParagraphStyle('name', fontName='Helvetica-Bold', fontSize=22, leading=25, spaceAfter=3),
    'headline': ParagraphStyle('headline', fontName='Helvetica-Bold', fontSize=10.3, leading=13, spaceAfter=3),
    'meta': ParagraphStyle('meta', fontName='Helvetica', fontSize=9, leading=11.5, spaceAfter=2),
    'body': ParagraphStyle('body', fontName='Helvetica', fontSize=9.6, leading=12, spaceAfter=3),
    'heading': ParagraphStyle('heading', fontName='Helvetica-Bold', fontSize=10.5, leading=13, spaceBefore=7, spaceAfter=4, keepWithNext=True),
    'role': ParagraphStyle('role', fontName='Helvetica-Bold', fontSize=9.6, leading=12, spaceBefore=3, spaceAfter=2, keepWithNext=True),
    'bullet': ParagraphStyle('bullet', fontName='Helvetica', fontSize=9.6, leading=12, leftIndent=9, firstLineIndent=-9, spaceAfter=2),
}
for style in styles.values():
    style.textColor = colors.HexColor('#24201c')

def p(text, style='body'):
    return Paragraph(text, styles[style])

def e(text):
    return escape(text)

def link(label, url):
    return f'<link href="{e(url)}" color="#4a321c">{e(label)}</link>'

story = [p(e(source['name']), 'name'), p(e(source['headline']), 'headline'),
         p(e(source['contact']).replace('rbaltodano337@gmail.com', link('rbaltodano337@gmail.com', 'mailto:rbaltodano337@gmail.com')), 'meta'),
         p(' | '.join(link(x['label'], x['url']) for x in source['links']), 'meta'),
         Spacer(1, 4), p(e(source['summary']))]
story.append(p('Independent Engineering Projects', 'heading'))
for project in source['projects']:
    story += [p(f"{link(project['name'], project['url'])} | {e(project['role'])} | {e(project['dates'])}", 'role'),
              p(e(project['context']), 'meta'),
              p('<b>Stack:</b> '+e(project['stack']), 'meta')]
    story += [p('- '+e(bullet), 'bullet') for bullet in project['bullets']]
story.append(p('Professional Experience', 'heading'))
for job in source['experience']:
    story.append(p(' | '.join(e(job[k]) for k in ['title','company','dates']), 'role'))
    if job['description']:
        story.append(p(e(job['description'])))
story.append(p('Technical & Design Skills', 'heading'))
for label, content in source['skills']:
    story.append(p(f'<b>{e(label)}:</b> {e(content)}', 'meta'))
edu = source['education']
story += [p('Education', 'heading'), p(f"<b>{e(edu['degree'])} | {e(edu['school'])} | {e(edu['year'])}</b><br/>{e(edu['detail'])}", 'meta')]

doc = SimpleDocTemplate(str(output), pagesize=(612,792), rightMargin=40, leftMargin=40,
                        topMargin=32, bottomMargin=32, title='Ryan Baltodano - Design Engineer',
                        author=source['name'], subject='Product design, frontend engineering, and applied AI',
                        creator='Ryan Baltodano résumé builder')
doc.build(story)
print(output)
