# Insurance Intake Workflow V1 Design Doc

**Status:** Draft  
**Author:** Bhishma  
**Date:** 2026-07-02  
**Context:** Small internal operations workflow for insurance form intake, parsing, admin verification, and provider sharing.

---

## 1. Problem Statement

Employees need a phone-friendly workflow to capture Aadhaar and purchase-slip photos, upload them securely, extract insurance-relevant fields with an LLM, let admins verify the result, and share finalized data with insurance providers.

The v1 goal is not a full insurance platform. The goal is to replace manual document handling and repeated form filling with a small, auditable internal workflow that can expand once the flow proves useful.

**Non-goals for v1:**
- Google Sheets as the primary provider-sharing path
- Provider login accounts
- Multiple provider-specific templates
- Fully automated submission without admin verification
- A redaction pipeline beyond conservative provider-visible fields
- A separate long-running worker runtime

---

## 2. V1 Decisions

These decisions come from the simplification pass:

- Build the upload shell first: employee page, upload API, private object storage, and database records.
- Use the existing Vercel deployment shape. Do not add pg-boss or a worker process for the first slice.
- Use Vercel Blob for the first upload implementation because the app is already on Vercel.
- Keep storage wording as "private object storage" in the design so S3, R2, GCS, or Blob can be swapped later.
- Use Neon Postgres with Prisma for the committed schema.
- Use Clerk roles for employee/admin access, but wire role checks when protected routes are added.
- Use a custom external provider page later instead of Google Sheets API integration.
- Do not create formal TypeScript port interfaces for a single implementation. Keep narrow modules now; add interfaces when a second implementation exists or tests need a fake.
- Keep the backend shape as functional core plus imperative shell: pure validation/path/data helpers inside modules, SDK/database calls only at route/module edges.
- Defer Effect TS until there is a real multi-step workflow with retries, compensation, or multiple adapters. Plain async functions are enough for the upload shell.
- Use a small Postgres-backed parse job table for v1. It is durable enough for internal ops and can later be replaced by pg-boss, Vercel Workflows, or a worker without changing the admin flow.
- Store AI extraction JSON and admin-confirmed extraction JSON on the case for the first review slice. Split to separate extraction history tables only when versioning or multi-parser comparison is needed.

### Recommended V1 Stack

- **App/runtime:** Existing Next.js app on Vercel
- **Auth:** Clerk with employee/admin roles
- **Database:** Neon Postgres
- **ORM:** Prisma
- **File storage:** Private Vercel Blob for the first shell
- **Durable execution:** Postgres-backed parse jobs for v1; Vercel Cron/Workflows can call the same processor later
- **LLM parser:** Gemini behind a parser module
- **Admin UI:** Existing Ant Design patterns with editable verified fields
- **Provider sharing:** Secure tokenized external page in a later slice

### Portability Rule

Portability should be practical, not speculative:

- Vendor SDK imports live in small backend modules.
- Route handlers call domain/repository/storage functions instead of spreading SDK calls across the app.
- The first implementation can be concrete. When a second implementation appears, extract an interface at that boundary.
- Business records stay in Postgres. Workflows should pass IDs, not document bytes or raw model payloads.

Current concrete boundaries:

- `features/insurance/domain.ts`: document types, size limits, validation helpers, object path helpers
- `features/insurance/adapters/vercel-blob-storage.ts`: private object upload
- `features/insurance/adapters/prisma-case-repository.ts`: case/document/audit persistence
- `features/insurance/parser.ts`: `DocumentParser` interface and extraction schema
- `features/insurance/adapters/gemini-document-parser.ts`: Gemini implementation of document parsing
- `features/insurance/parse-job-runner.ts`: claim and process one parse job
- `app/api/insurance/uploads/route.ts`: imperative shell for request parsing, validation, upload, and persistence
- `app/api/insurance/parse-jobs/process/route.ts`: HTTP shell for processing one queued parse job

Future boundaries:

- `WorkflowRunner`: start parse jobs through an external durable runner if Postgres polling is no longer enough
- `ShareLinkRepository`: create, revoke, and read provider links
- `Authz`: central role checks once employee/admin routes expand

---

## 3. Core User Journeys

### CUJ 1: Employee Submits Documents

An employee signs in, opens the insurance upload page on a phone, captures photos or selects image/PDF documents, assigns a document type to each pending item, optionally adds a customer name/notes, and submits the stack once.

Success means:
- Each file is stored in private object storage.
- An insurance case is created.
- One document row is attached to the case per uploaded item.
- Audit events record the upload.

### CUJ 2: Employee Adds More Documents To The Same Case

After the first successful stack upload, the page keeps the current case active. Employees can add more photos/PDFs, tag them, and submit again to attach them to the same case. Starting a new case clears the current case session.

Expected document types:
- Aadhaar front
- Aadhaar back
- Purchase slip or invoice
- Other, only as a fallback

### CUJ 3: System Parses Documents

The v1 workflow:
1. Mark the case as `PARSING`
2. Load document metadata from Postgres
3. Read private documents from object storage
4. Call the configured parser with the fixed v1 field schema
5. Store raw and normalized extraction results
6. Mark the case `NEEDS_REVIEW` or `PARSE_FAILED`

### CUJ 4: Admin Verifies Extracted Data

An admin opens a queue, selects a case, compares extracted fields against uploaded documents, edits values, and marks the case verified.

### CUJ 5: Admin Finalizes and Shares With Provider

Deferred until the provider-sharing increment.

An admin finalizes verified data and creates a secure provider link. The page is read-only, revocable, and expiry-based. Providers do not need Clerk login in v1.

---

## 4. Data Model

Phase 1 should commit only the tables needed by the upload shell.

### `insurance_cases`

Represents one insurance intake.

Key fields:
- `id`
- `createdByUserId`
- `status`: `UPLOADED | PARSING | NEEDS_REVIEW | PARSE_FAILED | VERIFIED | FINALIZED | REJECTED`
- `customerName`
- `notes`
- `aiExtraction`
- `confirmedExtraction`
- `parseError`
- `parsedAt`
- `confirmedAt`
- `confirmedByUserId`
- `createdAt`
- `updatedAt`
- `verifiedAt`
- `verifiedByUserId`
- `finalizedAt`
- `finalizedByUserId`

### `insurance_documents`

Represents one uploaded source file.

Key fields:
- `id`
- `caseId`
- `type`: `AADHAAR_FRONT | AADHAAR_BACK | PURCHASE_SLIP | OTHER`
- `blobPathname`
- `blobUrl`
- `blobDownloadUrl`
- `fileName`
- `mimeType`
- `sizeBytes`
- `etag`
- `shareExternally`
- `createdAt`

Files are private by default. External pages should access documents through the app or short-lived signed URLs, not raw object locations.

### `audit_events`

Records important actions.

Key fields:
- `id`
- `caseId`
- `actorUserId`
- `actorType`: `EMPLOYEE | ADMIN | PROVIDER_LINK | SYSTEM`
- `action`
- `metadata`
- `createdAt`

### `insurance_parse_jobs`

Represents a durable parser work item.

Key fields:
- `id`
- `caseId`
- `status`: `QUEUED | RUNNING | COMPLETE | FAILED`
- `attempts`
- `error`
- `startedAt`
- `completedAt`
- `createdAt`
- `updatedAt`

### Deferred Tables

Add these only when their slices start:

- `insurance_extractions`: extraction history and multiple parser outputs
- `insurance_share_links`: hashed provider tokens, expiry, revoke state, Aadhaar sharing flag

---

## 5. Fixed Field Template

Use one generic purchase-insurance template first. Provider-specific templates can come later.

Applicant fields:
- Full name
- Aadhaar number, internal only
- Aadhaar last 4 digits
- Date of birth
- Phone number
- Address

Purchase fields:
- Merchant name
- Merchant GSTIN, if present
- Invoice number
- Invoice date
- Item description
- Item category
- Serial number / IMEI, if present
- Purchase amount
- Currency

Provider-visible fields:
- Applicant name
- Masked Aadhaar by default
- Date of birth, if required
- Phone number, if required
- Address, if required
- Purchase details
- Documents explicitly shared by admin

Full Aadhaar should be visible externally only if an admin explicitly enables it for that share link.

---

## 6. API Design

### Current Shell

`POST /api/insurance/uploads`

Responsibilities:
- Accept multipart form data
- Validate one image or PDF file
- Validate document type
- Enforce server upload size limit
- Upload file to private object storage
- Create a case, document, and audit event in Postgres when `caseId` is absent
- Append a document and audit event to an existing case when `caseId` is present
- Return case/document metadata

The route is the imperative shell. It can call pure helpers and concrete backend modules, but should not contain parser, workflow, or admin verification logic.

### Future Internal APIs

- `POST /api/insurance/cases/:id/uploads`: add more documents to an existing case
- `POST /api/insurance/cases/:id/reparse`: admin-only parse retry
- `PATCH /api/insurance/cases/:id/verification`: admin saves verified fields
- `POST /api/insurance/cases/:id/finalize`: admin creates/reissues share link
- `POST /api/insurance/share-links/:id/revoke`: admin revokes provider access

### Future External Route

`GET /share/insurance/[token]`

Responsibilities:
- Reject missing, expired, or revoked tokens
- Show only finalized verified data
- Enforce document sharing toggles
- Mask Aadhaar by default

---

## 7. Workflow Design

No durable workflow is needed for the upload shell.

When parsing starts, use Vercel Workflows if it fits the deployed app shape. The workflow should pass small IDs like `caseId` and `parseRunId`; Postgres and object storage remain the durable business record.

If Vercel Workflows becomes unsuitable, replace only the workflow module and entrypoint with a Neon job table, pg-boss worker, Inngest, Trigger.dev, or SQS/Lambda. Upload routes and repository/storage modules should not change.

---

## 8. UI Design

### Employee Upload Page

Mobile-first page with:
- Customer/context fields
- Document type selector
- Native camera/photo input plus PDF file selection
- Clear selected-file state
- Clear success/error state

### Admin Queue

Future page with:
- Case ID/customer
- Created by
- Status
- Parse status
- Missing fields
- Updated time
- Actions: review, reparse, reject

### Admin Verification Page

Future split view:
- Left: document preview tabs
- Right: editable extracted fields

Actions:
- Save verification draft
- Mark verified
- Re-run parse
- Toggle shared documents
- Finalize and create provider link
- Revoke provider link

### Provider Page

Future read-only view with:
- Case summary
- Verified applicant/purchase fields
- Shared documents
- Expiry/revoked handling

---

## 9. Security and Privacy

- Clerk protects employee/admin routes.
- Provider pages use high-entropy token links with hashed token storage.
- Provider links expire and can be revoked.
- Uploaded objects are private.
- Aadhaar images are admin-only unless explicitly shared by document toggle.
- Aadhaar number is full internally only; provider view masks by default.
- Finalization, reparse, verification, share-link, and provider-view actions write audit events.
- Avoid logging Aadhaar numbers, raw document contents, signed URLs, or provider tokens.

UIDAI guidance says entities taking Aadhaar numbers should use and store them securely and with a legally permissible purpose. That reinforces minimizing provider-visible Aadhaar data and keeping full values internal unless explicitly required.

---

## 10. Rollout Plan

### Phase 1: Upload Foundation

- Add Prisma schema for cases, documents, and audit events
- Add private object upload module
- Add case repository module
- Add employee upload page
- Add `POST /api/insurance/uploads`

### Phase 2: Case Assembly

- Let employees add documents to an existing case
- Show case upload status
- Add Clerk role checks

### Phase 3: Parsing

- Add parser module
- Add parse-run and extraction tables
- Add Vercel Workflow entrypoint
- Store raw and normalized extraction
- Add parse failure states

### Phase 4: Admin Verification

- Add admin queue
- Add verification detail page
- Add verified data storage
- Add reparse/reject actions

### Phase 5: Provider Sharing

- Add share-link table
- Add finalize action
- Add secure provider page
- Add document sharing toggles
- Add revoke/expiry behavior

---

## 11. Test Plan

### Uploads

- Accept allowed image/PDF MIME types.
- Reject oversized or unsupported files.
- Store document metadata after successful upload.
- Create an audit event for upload.
- Do not expose raw object credentials to provider pages.

### Auth and Access

- Employee can create/upload cases.
- Employee cannot verify/finalize.
- Admin can verify/finalize/revoke.
- Provider token cannot access internal APIs.

### Parsing

- Successful parser output creates an extraction and marks case `NEEDS_REVIEW`.
- Parser failure marks case `PARSE_FAILED`.
- Invalid model output is stored as failure metadata.

### Provider Sharing

- Expired/revoked links fail closed.
- Aadhaar is masked by default.
- Only explicitly shared documents are visible.

---

## 12. Observability

Use Pino for structured backend logs. In local development, logs are written to stdout and `.logs/app.ndjson`; production logs should go to stdout for the platform log drain.

Frontend intake events post to `POST /api/logs`, where they are written through the same Pino logger. The browser keeps a session `traceId` and sends it on every upload request through `x-trace-id`, so frontend events and backend upload events can be read as one trace.

Do not log Aadhaar numbers, document contents, provider tokens, raw credentials, or signed URLs.
