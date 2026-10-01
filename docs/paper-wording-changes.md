# Paper wording changes (scope vs. system)

Source: the scope-vs-system audit (`scope-vs-system-audit.md`) and the
`feature/engineer-consultant-alignment` build pass. This list covers every audit
item that pass **deliberately did not build**. Each row has a ready-to-paste
replacement sentence and a marker so the owner can choose per item:

- `reworded in paper` — change the manuscript to the replacement sentence; no code needed.
- `build later` — keep the manuscript claim and schedule the work (listed under "Not built").

Default recommendation is shown in the **Choice** column; change it to flip.

Items the pass **did** build (so the manuscript can keep the original claim): Engineer requirement
structuring, issue reporting with ranked precedents, and milestone completion; Site Personnel
requirement submission; Consultant design files / design-review context / advisory uploads tied to a
proposal or design / on-demand validation summary; removal of "Coming soon" placeholders.

## Global

| # | Where | Replacement sentence | Choice |
|---|---|---|---|
| G1 | Every role: "AI-generated …", "AI-assisted …" | Replace "AI-generated" and "AI-assisted" with "rule-based decision support", e.g. "The system provides rule-based decision support; a person always makes the final decision." | reworded in paper |
| G2 | Limitations section | Keep the existing Limitations paragraph: AI features are deterministic, rule-based decision support (no generative model, no external AI service); they never block, approve or reject on their own. They are only available when the AI feature flag is enabled. | reworded in paper |

## Consultant

| # | Scope bullet | Replacement sentence | Choice |
|---|---|---|---|
| C1 | Proposal Review and Workflow Participation | "The Consultant can review submitted project proposals and rule-based validation summaries, record an approve / request-changes / reject decision as an advisory recommendation, and participate in or initiate relevant workflows such as document compliance review." | reworded in paper |
| C2 | Design Review (new bullet) | "The Consultant can review designs submitted for review, see the design's attached files, and approve, request changes, or reject them." | reworded in paper |
| C3 | Blueprint Review (new bullet) | "The Consultant can review project blueprints and approve, request changes, or reject them." | reworded in paper |
| C4 | Dashboard / project monitoring | "The Consultant can view the projects they are staffed on, including their status and scope, in a read-only list." (The word "monitoring" overstates a read-only list.) | reworded in paper |
| C5 | Recommendations "based on standards, historical data and external sources" | "Validation summaries are rule-based completeness checks (title, project, description and amount); they do not consult external standards or historical data." | reworded in paper (reference check for proposals: `build later`) |

## Owner

| # | Scope bullet | Replacement sentence | Choice |
|---|---|---|---|
| O1 | Dashboard: "AI-generated impact reports" | "The Owner dashboard presents executive summaries of portfolio status, reports and the audit trail to support decisions." — or, to keep the claim: "Rule-based impact summaries for the Owner are identified as future work." | reworded in paper (impact cards: `build later`) |

## IT Designer

| # | Scope bullet | Replacement sentence | Choice |
|---|---|---|---|
| I1 | Dashboard: "AI-generated impact reports" | "The IT Designer dashboard presents live account, role and audit summaries to support system oversight." (The infrastructure-health placeholder was removed.) | reworded in paper (impact cards: `build later`) |
| I2 | Approval Hierarchy: "manage the sequence of reviewers and approvers" | "The IT Designer can view the approval hierarchy of each workflow template; approval sequences are defined when a template is created through Workflow Configuration." | reworded in paper (editing UI: `build later`) |

## Admin

| # | Scope bullet | Replacement sentence | Choice |
|---|---|---|---|
| A1 | Approval Hierarchy: "view and manage … stages, designated approvers, escalation sequences" | "The Admin can view the approval hierarchy of each workflow template (stages and designated approvers); templates are defined through Workflow Configuration." | reworded in paper (editing UI / escalation sequences: `build later`) |

## Project Manager

| # | Scope bullet | Replacement sentence | Choice |
|---|---|---|---|
| P1 | Task Management: tasks "categorized and associated with milestones" | "Tasks are prioritized, tracked by status, and associated with milestones." | reworded in paper (task categories: `build later`) |
| P2 | Report Monitoring: "progress, incident, inspection and project completion reports" | "The Project Manager can monitor engineering reports of the following kinds: progress and technical reports, site and quality inspections, safety observations and non-conformance reports, and the Final Inspection report used for project closeout. Field-reported incidents are handled as Issues." | reworded in paper |
| P3 | (not in scope) Resources page | The Resources placeholder was removed from the Project Manager navigation; no wording is needed. | reworded in paper (n/a) |

## Finance Manager

| # | Scope bullet | Replacement sentence | Choice |
|---|---|---|---|
| F1 | Expenses: "AI-assisted expense anomaly detection" | "Expense review is supported by cost-reference comparison against a published cost catalog; automated expense anomaly detection is identified as future work." | reworded in paper (rule-based duplicate-payment / outlier scoring: `build later`) |

## Architect

| # | Scope bullet | Replacement sentence | Choice |
|---|---|---|---|
| R1 | Proposal Submission: recommendations "using construction standards, historical project data and relevant external sources" | "The Architect receives rule-based completeness recommendations on a submitted proposal (title, project, description and amount); they are decision support only." | reworded in paper (proposal reference check: `build later`) |
| R2 | Impact Awareness Viewing | "Impact awareness views for the Architect are identified as future work." | reworded in paper (read-only impact view: `build later`) |
| R3 | "Structural requirement requests" | Remove the phrase, or: "Architects can request reviews through the available workflow templates (Design Proposal Approval, Document Compliance Review and Change Order Request)." (No "structural requirement request" template exists.) | reworded in paper (new template: `build later`) |

## Not built in this pass

These stay unbuilt on purpose; pick `build later` above only if the manuscript must keep the claim:

- Finance expense anomaly scoring (nothing writes `anomalyScore`).
- Owner / IT Designer impact-report cards.
- Approval-hierarchy editing and escalation sequences.
- Task categories for the Project Manager.
- Architect impact view.
- Proposal reference check (standards / historical data).
