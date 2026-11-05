# Design engineering résumé

Updated November 4, 2026 for Design Engineer, Product Engineer, and AI Product Engineer applications.
Paid employment, dates, degree, and contact details are preserved from the previous linked résumé.
Independent projects are explicitly identified; inVectus leads with React/TypeScript evidence.

Editable sources: `current-resume.json` and `build_resume.py`. The builder uses flowing text,
standard PDF fonts, one column, and actual link annotations. Requires Python 3 and ReportLab.

```sh
python3 -m venv .venv
.venv/bin/pip install reportlab
.venv/bin/python build_resume.py
pdfinfo Ryan-Baltodano-Resume.pdf
pdftoppm -png -singlefile Ryan-Baltodano-Resume.pdf resume-preview
```

Check that the result remains one page, inspect its rendering, and check extracted text after edits.
The downloadable portfolio PDF is `../personal-site/assets/Ryan-Baltodano-Resume.pdf` relative to
`~/Documents/App Website/Resume`. The website repository maintains identical editable sources
in `resume/`. The application copy is `~/Documents/Job Search/Resume/Ryan-Baltodano-Resume.pdf`.
For the website's source, build directly to `../assets/Ryan-Baltodano-Resume.pdf` from `resume/`.
Keep these current copies synchronized. Older September HTML/DOCX sources are historical.
The Angrove product site's existing PDF is a separate published copy; it was not changed or published
as part of this portfolio task.

See `PORTFOLIO-AUDIT.md` in the portfolio repository for evidence, scope, and verification details.
