# Portfolio and résumé audit

Reviewed and implemented November 4, 2026. Nothing was pushed, deployed, or published.

## Positioning

**Professional headline:** Design Engineer | Product Design, Frontend & Applied AI

**Summary:** Web designer with two years of professional experience and independent ownership of
AI-powered software. Combines product and interaction design with React/TypeScript frontend
development, native SwiftUI interfaces, and local model integration.

Paid titles remain Web Designer (PostcardMania), Front-End Web Development Intern (Cloud
Carpenter), and Customer Service Staff (Publix). Independent engineering is a separate résumé
section. The website explicitly distinguishes professional web design from independent products.
No seniority, employment, leadership, audience, commercial impact, or scientific discovery was added.

## What the audit found

The live site already had a distinctive field-guide identity, real screenshots, Mac recordings,
and substantial project walkthroughs. Its title, “Designer who can Build,” was less specific than
the target roles. Technical ownership, React/TypeScript, architecture, and test evidence were harder
to find than the visuals. The résumé already included both applications, but led with Angrove and
left the simulator context out of its thinking-mode bullet. Its editable source used fixed vertical
positions, making revisions fragile. There was no dedicated inVectus case-study page.

Two local website checkouts existed. The current repository is
`~/Documents/App Website/personal-site` (starting commit `328b1ce`), which matched the live site.
`~/Developer/ryanbaltodano.com` is an older version; its pre-existing pending index edit was left alone.
The live site's linked résumé was downloaded and text-extracted before editing. Employment,
titles, dates, education, contact information, and existing supported accomplishments were retained.

## Implementation

- Kept the existing palette, fonts, masthead statement, portrait, engravings, media, marginalia,
  drafting, and other visual interactions. Added direct résumé and React/TypeScript work routes
  to the opening. Contact now names Design Engineer, Product Engineer, and AI Product Engineer
  opportunities, with NYC/San Francisco relocation interests.
- Added visible stacks, independent ownership, architectural decisions, source/test links,
  experimental boundaries, and conservative availability labels to both exhibits.
- Added `invectus.html`: origin → transferred embedding insight → architecture → interface →
  implementation → evaluation → limitations. The short opening is followed by actual app captures,
  a system-boundary table, and native disclosures for deeper implementation/test evidence.
- The owner's supplemental context supplied the brother/medical-school origin. It is presented as
  an origin story, not as repository-verified research success. The résumé instead emphasizes
  architecture, semantic coverage analysis, interface engineering, and tests. Daily interview
  preparation is not presented as an accomplishment. AI-assisted development is stated openly,
  alongside responsibility for design decisions, integration, review, and verification; no claim
  says the owner manually wrote every line.
- Rebuilt the résumé as a single-column, one-page PDF using flowing ReportLab text. inVectus
  leads the independent-project section. Added explicit stacks and clarified the simulator CPU
  scope of Angrove's evaluation. Kept all three paid roles and the USF degree/security concentration.
  Removed MySQL from the skills list because it was not substantiated by the inspected current
  application code. PHP remains supported by the preserved internship history.
- Added canonical, Open Graph, Twitter, and JSON-LD metadata, a shared-palette social image,
  sitemap, and robots file. Person structured data retains the actual paid title, Web Designer.
- Fixed low-contrast status stamps, added play/pause controls to silent product films, retained
  native video controls without JavaScript, and fixed ordinary media-dialog focus return and
  keyboard containment. Reduced motion starts films paused but allows explicit playback.
- Added a repeatable browser check using the repository's existing Playwright dependency.
  No runtime dependency or framework migration was introduced.

## Verified claims and evidence

Source snapshots read: Angrove-iOS `0a56243`, inVectus `150fb67`, Angrove-Backend `68b1681`,
Angrove-Foundations `1094ac2`, angrove-website `770a432`. Pre-existing uncommitted project work
was read where relevant and preserved. Runtime/model experiments were not resumed or rerun.

| Claim used | Source inspected | Boundary |
| --- | --- | --- |
| React/TypeScript desktop UI and typed Tauri calls | [App.tsx](https://github.com/rbaltodano/inVectus/blob/main/src/App.tsx), [api.ts](https://github.com/rbaltodano/inVectus/blob/main/src/api.ts), `tsconfig.json` | Strict TS is enabled; some broad types remain. No claim of complete type safety. |
| Responsive, keyboard-resizable evidence/map workspace | [WorkspaceSplit.tsx](https://github.com/rbaltodano/inVectus/blob/main/src/WorkspaceSplit.tsx), `src/workspace-split.ts`, [tests](https://github.com/rbaltodano/inVectus/blob/main/tests/workspace-split.test.ts) | Supports pointer capture, ARIA separator values, Arrow/Home/End, and minimum-width stacking. This is specific accessibility evidence, not an app-wide conformance claim. |
| Navigation, map, loading, search-presentation regression coverage | `src/navigation.ts`, `src/map-focus.ts`, `src/search-presentation.ts`, `tests/*.test.ts` | 29 UI tests ran and passed in this task. |
| Shared Rust engine serves desktop and CLI | [Architecture](https://github.com/rbaltodano/inVectus/blob/main/docs/architecture.md), `src-tauri/src/lib.rs`, `crates/cli`, workspace manifests | Native platform support was not inferred from the web build. |
| Metadata in DuckDB; vectors in LanceDB | `crates/core/Cargo.toml`, `crates/index/Cargo.toml`, engine architecture | Core text workflows are local; optional downloads/connectors require explicit network use. |
| Compatible embedding spaces and exact/approximate retrieval routes | [search.rs](https://github.com/rbaltodano/inVectus/blob/main/crates/index/src/search.rs), `crates/core/src`, architecture | Exact re-scoring cannot retrieve candidates omitted by ANN. Similarity does not establish absence. |
| Resumable, cancellable indexing | [embed_job.rs](https://github.com/rbaltodano/inVectus/blob/main/crates/index/src/embed_job.rs), `crates/index/tests/index_flow.rs`, `src/jobs.tsx`, `src-tauri/src/lib.rs` | Flushed embedding batches survive interruption; no universal restart guarantee was added to every workflow. |
| Bookmarks and decisions survive rescans separately | [saved.rs](https://github.com/rbaltodano/inVectus/blob/main/crates/gaps/src/saved.rs), `crates/gaps/src/review.rs`, [gaps_flow.rs](https://github.com/rbaltodano/inVectus/blob/main/crates/gaps/tests/gaps_flow.rs) | Stored evidence/review mechanics, not validated research outcomes. |
| Gap scores use embedding-space structure; 2D map is for display | `crates/regions/src`, engine architecture, README | Incomplete data, vocabulary, embeddings, and clustering can create apparent gaps. |
| Real inVectus captures and reproducible fictional demo | `docs/screenshots`, [demo.md](https://github.com/rbaltodano/inVectus/blob/main/docs/demo.md), `scripts/create_demo.py` | Medical captures use 5,000 papers; Saved uses 540 fictional urban-research records. Neither proves scientific relevance or full-scale reliability. |
| Early technical evaluations document biased sample/hardware | [spike reports](https://github.com/rbaltodano/inVectus/blob/main/docs/spikes/README.md), `PROGRESS.md` | 2,000 first-in-scan records on M4 Pro; no benchmark number was generalized into a product claim. |
| Shared SwiftUI/application code across iPhone and Mac | Angrove `Shared/`, `iOS/`, `macOS/`, `Documentation/Workspace-Layout.md`, [case study](https://github.com/rbaltodano/Angrove-iOS/blob/main/Documentation/Case-Study.md) | Mac remains in development; repository changes may exceed the distributed beta. |
| Local model runtime, task queue, durable completion identities | `Shared/Features/Conversation/ModelTaskQueue.swift`, `Shared/Services/LiteRTAngroveModel.swift`, `Documentation/App-Architecture.md`, `InquiryPersistenceStoreTests`, `StreamingMessageNavigationTests` | Generation can outlive a screen; no claim that queued generation survives process termination. |
| Core ML MiniLM embeddings and source retrieval | `Shared/Services/MiniLMEmbedder.swift`, `MiniLMGroundingProvider.swift`, `OnDeviceGroundingStore.swift`, retrieval test suites | 384-dimensional embeddings; cosine relatedness ranks evidence, not factual certainty. |
| Interactive Insight Tree and vector geometry | `Shared/Features/InsightTree/InsightClusterSpatialLayout.swift`, tree view/model/camera sources, Foundations case study 01 | Spatial readability constrains visual distance; no learning-outcome claim. |
| AES-256-GCM and Keychain-managed keys | `Packages/AngroveCore/Sources/AngroveCore/LocalDataEncryption.swift`, `PersonalDataEncryptionTests`, `Documentation/Data-Encryption.md` | Implemented storage boundary; physical lock/backup-restoration validation remains pending. |
| 74/80 objective passes with thinking both on and off | [Evaluation.md](https://github.com/rbaltodano/Angrove-iOS/blob/main/Documentation/Evaluation.md), four `Documentation/Evaluation/T2-*.json` exports | Off: 37+37; on: 36+38. Simulator CPU medians 22.966/23.528s off and 43.738/47.631s on. Historical, pattern-scored development sets; not accuracy or phone-speed claims. |
| Python tooling prepares local assets | Angrove-Backend `scripts/export_on_device_grounding.py`, `scripts/export_minilm_coreml.py`, README | Offline corpus/conversion/evaluation tooling. Retired FastAPI is not described as the current production backend. |
| Product decisions and engineering limitations are documented | Foundations `case-studies/01–04`, `MODEL-INTEGRATION.md`; Angrove technical case study and evaluation report | Shelved 12B/Qwen research was read only as historical context, never promoted as the active product. |
| Product access and demos | [angrove.app](https://angrove.app), [public case study](https://angrove.app/case-study.html), [TestFlight](https://testflight.apple.com/join/qHDFeAUa) | Beta access is not an adoption metric or App Store release. |

Employment and education are preserved from the existing résumé and owner-provided background,
not independently verified against employer or university records. The origin story and daily
practice context come directly from the owner's supplemental instruction.

## Verification actually performed

- Website: `npm run build` and `npm run build:polaroid` both passed. The former builds archived
  Stageshow assets that the live page does not load; the deployed site remains static.
- JavaScript syntax checks passed for site, draft, journal, and lightbox scripts. `git diff --check`
  passed. Sitemap XML parsed; both pages have one title, canonical metadata, and valid JSON-LD.
- `scripts/check_site.mjs` passed on both pages at 1440, 768, 390, and 320px. Checks exercised all
  images, page anchors, metadata, keyboard media opening, dialog focus containment/return,
  reduced-motion manual video playback, and native case-study disclosures. No page errors or
  HTTP failures were recorded. No-JavaScript checks confirmed readable content, native video
  controls, and disclosures. A separate normal-motion homepage visit scrolled through the
  project/experience/contact sections with no page errors or console errors.
- Rendered screenshots were inspected for desktop/tablet/phone home layouts, engineering notes,
  skills, and the new case-study opening and reading layout. A final narrow-screen refinement
  stacks the case-study facts to give the text more room.
- Axe WCAG 2 A/AA and 2.1 AA checks reported zero violations on home and its image dialog at
  1440/390px; the case study reported zero at 1440/390/320px. Automated color-contrast review
  leaves some complex surfaces inconclusive. Silent video caption review is manual: `ffprobe`
  confirmed video-only tracks in both films, and text descriptions explain their actions. This
  is not a full accessibility certification or screen-reader/device test.
- inVectus: `npm run test:ui` passed all 29 tests; `npm run build` passed TypeScript and Vite.
  Native Rust/app suites and Angrove Xcode tests were inspected but not rerun for this site task.
  No CI was dispatched and no model, corpus, inference, or research probe was run.
- Every external page link on both pages returned HTTP 200, including source files, tests,
  demo instructions, angrove.app, and TestFlight. Local targets exist and internal anchors resolve.
  Email URLs were checked as strings; no email was sent.
- Final résumé: rendered with Poppler and visually inspected; confirmed one US Letter page,
  selectable text, preserved employment/education, correct title/author/subject/creator metadata,
  and six PDF link annotations (email, portfolio, GitHub profile, product site, both repositories).
  The application PDF, current App Website résumé copy, and portfolio download have identical
  SHA-256 digests. Editable sources are maintained alongside the portfolio in `resume/` and
  synchronized with `~/Documents/Job Search/Resume` and `~/Documents/App Website/Resume`.

## Remaining accuracy and verification boundaries

1. angrove.app advertises a December 15 Mac launch target, while engineering documentation
   describes Mac as in development. The portfolio and résumé use “in development.” The product
   website and its separate published résumé were not edited; reconcile those before publishing.
2. The exact contents of the distributed TestFlight binary were not independently audited.
   Development captures and implementation descriptions are explicitly distinguished from beta
   availability. No App Store release, adoption, retention, or learning outcomes are claimed.
3. Angrove's published aggregate evaluation exports are inspectable but do not include all private
   fixtures/scorers. Historical runs were verified against the recorded JSON, not reproduced.
4. inVectus calibration, candidate usefulness, Windows/Linux behavior, signed installers, and
   broad-scale performance remain limited or unverified. The public case study states this.
5. Browser checks used headless Chrome on this Mac. Safari, physical mobile devices, PDF-reader
   UI behavior outside Poppler, external ATS ingestion, and a complete screen-reader audit were
   not tested. Text extraction was verified; actual ATS scoring was not.
6. New metadata/share-image URLs will become public only after an approved publication. There
   was no post-deployment check because pushing/publishing was explicitly prohibited.
