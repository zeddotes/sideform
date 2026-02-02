# Sideform MVP Spec (v0)

A desktop-first web app for professionals to run **1:1 encrypted video calls** while filling **structured, text-only meeting notes** side-by-side. Includes **chat** and **small file share** (<= 2MB). Notes/chat/files are **client-side encrypted** before storage (server stores ciphertext).

---

## 1) Scope

### Must-have (MVP)
- Auth: email + password signup/login
- Single-user account model (one professional = one account; no teams)
- Create “Meeting Types” (templates)
  - Sections + text-only fields
  - Freeform text blocks
- Create/schedule meetings (no client accounts)
  - Generate invite link
  - Send invite email containing link
- Join meeting room (professional + client) using Sideform video
  - 1:1 WebRTC call
  - In-room chat
  - File share (<= 2MB)
  - Timer
- Notes panel (side-by-side with call; resizable/configurable layout)
  - Autosave snapshots (append-only)
- Security
  - Client-side encryption for notes/chat/files at rest
  - Envelope encryption using KMS for DEK wrapping
  - TLS everywhere
  - Basic rate limiting + abuse controls on invite links

### Explicit non-goals (MVP)
- Offline mode
- Recording
- Screen share
- Client accounts / portal
- Calendar sync
- Reminders
- Advanced field types (only text)
- Conditional template logic
- Full audit log UI (store snapshot chain; no UI required)
- Full media end-to-end encryption beyond standard WebRTC transport encryption

---

## 2) UX / Screens

### A) Auth
- `/signup` email + password
- `/login` email + password
- `/logout`

### B) Dashboard
- List upcoming meetings (scheduled)
- “Create meeting”
- “Meeting types” manage link

### C) Meeting Types
- List meeting types
- Create/Edit meeting type
  - MeetingType name, optional description
  - Sections (ordered)
  - Each section: list of fields (ordered)
  - Field: label, placeholder, optional helper text
  - Freeform blocks: section-level “freeform text” areas (optional)

### D) Schedule Meeting
- Select MeetingType
- Enter client name + client email
- Date/time (store, display; no calendar sync)
- Create meeting -> send email invite
- Meeting details page with “Copy invite link”

### E) Meeting Room
Two-panel layout (default: video left, notes right)
- Top bar: meeting title, timer, connection status, leave button
- Video area: local/remote tiles (1:1)
- Chat pane: messages (encrypted at rest)
- File share: upload (<= 2MB) -> message shows file item (encrypted at rest)
- Notes pane:
  - Render template sections + text fields
  - Autosave snapshots every 10–15s and on blur
  - “Preview/Test mode” toggle: opens a sandbox meeting room without sending invites

---

## 3) Tech Stack (recommended for fast build)

### Frontend
- Next.js (App Router) + TypeScript
- Tailwind CSS
- WebRTC in browser
- WebSocket client for chat/presence/signaling
- Web Crypto API for encryption (AES-GCM, HKDF)
- Form state: React Hook Form (or simple controlled inputs for MVP)

### Backend API
- Node.js (Fastify or NestJS) + TypeScript
- PostgreSQL (metadata + ciphertext blobs)
- Redis (optional but recommended) for rate limiting + ephemeral room state
- WebSocket server (same app or separate) for signaling + chat transport
- Email provider: SES (or equivalent)
- Object storage for encrypted files: S3 (or equivalent)
- KMS for envelope encryption of per-meeting DEKs

### Real-time Media
- Self-hosted SFU: **mediasoup** (recommended)  
  - 1:1 now; scalable later
- STUN/TURN: coturn

### Deployment (minimal)
- Vercel (frontend) + AWS (API + SFU + TURN + Postgres)
  - API: ECS/Fargate or EC2
  - SFU: ECS/EC2 (low-latency instance)
  - TURN: EC2
  - Postgres: RDS
  - Redis: ElastiCache (optional)

---

## 4) Data Model (Postgres)

### Users
- `users`
  - `id` (uuid, pk)
  - `email` (unique)
  - `password_hash`
  - `created_at`
  - `updated_at`

### Meeting Types (templates)
- `meeting_types`
  - `id` (uuid, pk)
  - `user_id` (fk -> users)
  - `name`
  - `description` (nullable)
  - `created_at`
  - `updated_at`

- `meeting_type_sections`
  - `id` (uuid, pk)
  - `meeting_type_id` (fk)
  - `title`
  - `order_index` (int)
  - `created_at`

- `meeting_type_fields`
  - `id` (uuid, pk)
  - `section_id` (fk)
  - `label`
  - `placeholder` (nullable)
  - `helper_text` (nullable)
  - `order_index` (int)
  - `created_at`

- `meeting_type_freeform_blocks`
  - `id` (uuid, pk)
  - `section_id` (fk)
  - `label` (e.g., "Notes")
  - `placeholder` (nullable)
  - `order_index` (int)
  - `created_at`

### Meetings
- `meetings`
  - `id` (uuid, pk)
  - `user_id` (fk)
  - `meeting_type_id` (fk)
  - `title` (nullable; default from meeting type)
  - `scheduled_start` (timestamptz)
  - `scheduled_end` (timestamptz, nullable)
  - `client_name` (text)
  - `client_email` (text)
  - `invite_token_hash` (text)  // store hash only
  - `invite_expires_at` (timestamptz)
  - `status` (enum: scheduled | in_progress | ended)
  - `created_at`
  - `updated_at`

### Encryption key wrapping
- `meeting_keys`
  - `meeting_id` (pk, fk -> meetings)
  - `encrypted_dek` (bytea/text base64) // DEK encrypted by KMS key
  - `dek_kms_key_id` (text)
  - `created_at`

### Notes snapshots (append-only)
- `meeting_note_snapshots`
  - `id` (uuid, pk)
  - `meeting_id` (fk)
  - `seq` (int) // monotonically increasing
  - `ciphertext` (bytea/text base64)
  - `nonce` (bytea/text base64)
  - `aad` (jsonb) // minimal metadata used as AAD
  - `client_hash` (text) // sha256 of plaintext for integrity checks (optional)
  - `prev_snapshot_hash` (text) // hash chain (optional)
  - `created_at`

### Chat (store ciphertext only)
- `meeting_chat_messages`
  - `id` (uuid, pk)
  - `meeting_id` (fk)
  - `sender_role` (enum: professional | guest)
  - `ciphertext` (bytea/text base64)
  - `nonce` (bytea/text base64)
  - `created_at`

### Files (encrypted objects)
- `meeting_files`
  - `id` (uuid, pk)
  - `meeting_id` (fk)
  - `uploader_role` (enum: professional | guest)
  - `original_name` (text)
  - `mime_type` (text)
  - `size_bytes` (int)
  - `storage_key` (text) // S3 object key for ciphertext
  - `ciphertext_meta` (bytea/text base64) // optional: encrypted JSON metadata
  - `nonce_meta` (bytea/text base64)
  - `created_at`

---

## 5) Cryptography (MVP)

### Goals
- Notes/chat/files stored as ciphertext; server does not need plaintext.
- Key management uses KMS to avoid storing raw master keys.

### Approach: Client-side DEK + KMS envelope encryption
- On first room creation for a meeting:
  1. Client generates random `DEK` (32 bytes).
  2. Client calls backend: `POST /meetings/:id/keys/wrap` with base64(DEK).
  3. Backend uses KMS `Encrypt` to produce `encrypted_dek`.
  4. Backend stores `encrypted_dek` in `meeting_keys`.
- For all sensitive artifacts:
  - Encrypt in browser using `AES-256-GCM`:
    - `ciphertext = AESGCM(DEK, nonce, plaintext, AAD)`
    - Store `ciphertext`, `nonce`, `aad`.
- On rejoin:
  1. Client requests `encrypted_dek`.
  2. Backend calls KMS `Decrypt` and returns plaintext DEK to authenticated professional only.
     - Guest never receives DEK via API (MVP simplification).
     - Guest encryption for chat/files can be handled by professional client re-encrypting or by using a separate guest key (defer).
- Practical MVP rule:
  - Only professional client can persist encrypted notes.
  - Guest chat messages are transported in real-time; storage can be performed by professional client (proxy-save) to keep server blind.

### AAD (associated data) recommendation
Include non-secret metadata to prevent swapping attacks:
- `{ meetingId, artifactType, seq/messageId, createdAt }`

### Passwords
- `argon2id` hashing with strong parameters

---

## 6) Auth, Invites, Permissions

### Auth
- Email/password session via HTTP-only secure cookies
- CSRF protection for cookie-based auth
- Rate limit login/signup

### Invite link model
- Invite URL: `/join/<meetingId>?t=<token>`
- Store only a hash: `invite_token_hash = sha256(token)`
- Token is one-time or multi-use (MVP: multi-use until expiry)
- Expiry default: scheduled_end + 24h (or scheduled_start + 7d if no end)

### Permissions (MVP)
- Professional:
  - CRUD templates
  - CRUD meetings
  - Join room
  - Fetch encrypted artifacts + decrypt keys
- Guest:
  - Join room with invite token
  - Participate in WebRTC + chat + file upload
  - No access to dashboard, templates, or meeting list
  - No ability to fetch stored ciphertext via REST (MVP)

---

## 7) Real-time Architecture

### Components
- **SFU (mediasoup)** for forwarding media
- **Signaling server** (WebSocket) for:
  - room join/leave
  - WebRTC offer/answer/ICE exchange (or mediasoup-specific negotiation)
  - presence
  - chat message transport
  - file metadata events

### Flow (join)
1. Guest opens join link -> validates invite token -> receives room access
2. Professional joins from dashboard -> same room id
3. WebSocket establishes session
4. WebRTC negotiation via signaling to SFU
5. Chat runs over WebSocket

### TURN/STUN
- Provide STUN + TURN config to clients
- Force TURN fallback for restrictive networks

---

## 8) API Endpoints (REST)

### Auth
- `POST /auth/signup`
- `POST /auth/login`
- `POST /auth/logout`
- `GET /auth/me`

### Meeting Types
- `GET /meeting-types`
- `POST /meeting-types`
- `GET /meeting-types/:id`
- `PUT /meeting-types/:id`
- `DELETE /meeting-types/:id`

### Meetings
- `GET /meetings?from=&to=`
- `POST /meetings`
- `GET /meetings/:id`
- `PUT /meetings/:id`
- `POST /meetings/:id/send-invite`

### Invites
- `POST /meetings/:id/validate-invite` (guest uses token)
- `POST /meetings/:id/rotate-invite` (professional)

### Keys (envelope)
- `POST /meetings/:id/keys/wrap` (professional only)
- `GET /meetings/:id/keys` (professional only; returns encrypted_dek and kms key id)

### Notes snapshots
- `POST /meetings/:id/notes/snapshots` (professional only)
- `GET /meetings/:id/notes/snapshots?limit=&cursor=` (professional only)

### Files
- `POST /meetings/:id/files/presign-upload` (guest/professional)
- `POST /meetings/:id/files/commit` (guest/professional) // store metadata
- `GET /meetings/:id/files/:fileId/presign-download` (professional only in MVP)

---

## 9) WebSocket Events (signaling + chat)

### Room lifecycle
- `room:join` { meetingId, role, token? }
- `room:joined` { participantId, role, sfUConfig }
- `room:leave`
- `room:participants` { list }

### WebRTC/SFU negotiation
- `webrtc:signal` (generic) OR mediasoup-specific:
  - `sfu:getRtpCapabilities`
  - `sfu:createTransport`
  - `sfu:connectTransport`
  - `sfu:produce`
  - `sfu:consume`

### Chat
- `chat:send` { ciphertext, nonce, createdAt }
- `chat:message` { senderRole, ciphertext, nonce, createdAt }

### Files
- `file:uploaded` { fileId, originalName, sizeBytes, mimeType }

---

## 10) Notes Autosave (snapshot strategy)

### Client behavior
- Maintain form state in memory
- Every 10–15 seconds:
  - Serialize full note state as JSON
  - Encrypt with DEK (AES-GCM)
  - POST snapshot with `seq = last_seq + 1`
- Also snapshot on:
  - section blur
  - meeting end click

### Snapshot payload (plaintext before encryption)
- `{ meetingId, meetingTypeId, fields: { fieldId: stringValue }, freeform: { blockId: stringValue }, updatedAt }`

---

## 11) AI Transcription Readiness (structure only)

### Store meeting timeline metadata now (no transcription yet)
- `meeting_events` (optional MVP table)
  - join/leave timestamps
  - meeting start/end
This enables later alignment of transcript segments.

### Future drop-in
- Add `transcripts` table storing ciphertext transcript
- Add `ai_summaries` table storing ciphertext summaries
- Keep the same DEK envelope approach (or derive subkeys from DEK via HKDF)

---

## 12) Security Baseline

### App security
- TLS, HSTS, secure cookies, CSRF protection
- Input validation everywhere
- Rate limiting: login/signup/invite validation
- Content security policy (CSP) locked down
- Separate origins for API and app if needed
- Strict CORS (only app origin)

### Data security
- Postgres at-rest encryption (managed)
- Encrypted artifacts at application layer (ciphertext)
- S3 bucket encryption + store only ciphertext
- Backups enabled; ciphertext only

### Logging
- Never log plaintext notes/chat/files
- Log only request ids, meeting ids, and operational metrics

---

## 13) Deployment Topology

### Minimal AWS layout
- VPC
- RDS Postgres
- ECS service: API + WebSocket
- EC2/ECS: SFU (mediasoup)
- EC2: coturn (TURN)
- S3: encrypted file storage
- KMS: master key
- SES: sending invite emails

---

## 14) Deliverables for “codegen from zero”

### Repo structure (monorepo)
- `/apps/web` (Next.js)
- `/apps/api` (Fastify/Nest)
- `/apps/sfu` (mediasoup server)
- `/infra` (Terraform or CDK)
- `/packages/shared` (types, schemas)

### Required environment variables
Web:
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_WS_URL`
- `NEXT_PUBLIC_TURN_URLS`
- `NEXT_PUBLIC_TURN_USERNAME`
- `NEXT_PUBLIC_TURN_CREDENTIAL`

API:
- `DATABASE_URL`
- `REDIS_URL` (optional)
- `JWT_SECRET` (if using JWT; otherwise session secret)
- `COOKIE_SECRET`
- `KMS_KEY_ID`
- `S3_BUCKET_NAME`
- `AWS_REGION`
- `SES_FROM_EMAIL`
- `APP_BASE_URL` (for invite links)

SFU:
- `SFU_LISTEN_IP`
- `SFU_ANNOUNCED_IP`
- `SFU_PORT_RANGE_MIN`
- `SFU_PORT_RANGE_MAX`
- `WS_SIGNALING_URL` (if separate)

TURN:
- `TURN_PUBLIC_IP`
- `TURN_SECRET` (or static user/pass)

---

## 15) Acceptance Criteria (MVP)

- Professional can create a meeting type with sections and text fields.
- Professional can schedule a meeting and send an invite email.
- Guest can open invite link and join a 1:1 call.
- In-room chat works.
- File upload <= 2MB works; downloadable by professional.
- Notes render side-by-side; layout adjustable.
- Notes autosave snapshots; professional can rejoin and see previously entered notes.
- Database contains ciphertext for notes/chat/files; no plaintext stored.
- KMS wraps per-meeting DEK; DEK not stored unencrypted.
- Basic rate limiting prevents brute-force invite validation and login.

---
