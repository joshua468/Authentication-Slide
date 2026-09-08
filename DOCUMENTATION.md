# DOCUMENTATION — Assessment 1: The Authentication Slice

## Section 1: What This Is

This is a complete email-and-password authentication system with its own interface, ending at a placeholder dashboard. A visitor signs up, receives a six-digit code, proves they own the email, and reaches a dashboard showing their name and a sign-out button. Returning users sign in; a user who forgot their password gets a reset link, sets a new one, and signs in again. `/dashboard` is only reachable with a valid session, and signing out kills the session on the server, not just in the browser. Codes expire in the database, reset tokens are single-use, and signup/signin/resend/forgot endpoints are rate-limited. With no SMTP configured, codes and links print to the server console, so the whole flow runs with zero external services.

Everything else is deliberately absent: no landing page, dashboard features, profile editing, settings, social sign-in, or two-factor. The brief assesses one slice — ownership-proof accounts, email verification, password recovery, sessions — so the repository ships exactly that and nothing that could distract a reviewer from it.

## Section 2: How To Run It

1. **Install:** Node.js 20+ (tested on 24), local PostgreSQL 17, `npm`.
2. **Setup:** `git clone <url> && cd authentication-assessment && npm install`.
3. **Environment:** copy `.env.example` → `.env` (the file explains each entry; `.env` is git-ignored). Variables: `DATABASE_URL` (from your own Postgres; create the db once: `CREATE DATABASE authentication;`), `AUTH_SECRET` (32+ random chars via `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`), optional `SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS/EMAIL_FROM` (from your mail provider; unset = console delivery), optional `NEXTAUTH_URL` (reset-link base; unset = derived from the request).
4. **Migrate:** `npx prisma migrate deploy`.
5. **Run:** `npm run dev` → open `http://localhost:3000` (this run used `3001`).

A reviewer with a valid `.env`, an empty database, and Postgres running reaches the sign-in form in under three minutes.

## Section 3: The Flow, Step By Step

Each step states what the user does, what the frontend sends, and what the server does — with the route or file that owns it.

1. **Sign up.** User fills `name, email, password, confirm` on `/signup` → sends them to `POST /api/auth/signup`. The route (`src/app/api/auth/signup/route.ts`) rate-limits, validates with the shared zod schema, hashes the password with bcrypt cost 12, inserts a `User` row and a `VerificationCode` row (sha256 of a random 6-digit code, 10-min expiry), and emails the code. New email → `201`; duplicate → `409` (a real race is caught as Prisma `P2002`).
2. **Verify the email.** User types the code on `/verify-email` → `POST /api/auth/verify-email` (`verify-email/route.ts`) checks the latest code against `codeHash`, rejects wrong/used/expired (`400`/`410`/`410`), then sets `usedAt`, flips `isEmailVerified`, issues a session. "Request another code" → `POST /api/auth/resend-code` (30s server-side cooldown, fresh code).
3. **Sign in.** User submits email+password on `/signin` → `POST /api/auth/signin` (`signin/route.ts`) rate-limits, compares via bcrypt, issues a session. Unknown email and wrong password both answer `401 Incorrect email or password.` (no enumeration).
4. **Dashboard.** `/dashboard` without an `auth_session` cookie is `307`-redirected by `src/middleware.ts`. With any cookie, the client calls `GET /api/auth/session` (`session/route.ts`): hashes the cookie, looks up an unexpired `Session` row, and returns `user` or `{"user":null}`. The database lookup is the real gate; missing/forged cookies render nothing.
5. **Sign out.** Dashboard button → `POST /api/auth/signout` (`signout/route.ts`) deletes the session row and clears the cookie; the dashboard redirects to `/signin` from then on.
6. **Forgot / reset password.** User submits an email on `/forgot-password` → `forgot-password/route.ts` rate-limits (3/IP/60s), then applies a 60s cooldown keyed by the email (registered or not, so replies are indistinguishable), and only for a real account mints a 32-byte token (sha256 stored, 15-min expiry) and emails `/reset-password?token=...`. Unknown emails get the same `200 If that email exists…` with nothing created. The reset form → `POST /api/auth/reset-password` (`reset-password/route.ts`) rejects unknown/used/expired tokens (`400`/`410`/`410`), writes the new hash, burns the token, and deletes all of the user's sessions.

## Section 4: The Data Model

```prisma
model User {
  id              String   @id @default(cuid())
  name            String
  email           String   @unique
  passwordHash    String
  isEmailVerified Boolean  @default(false)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  verificationCodes   VerificationCode[]
  passwordResetTokens PasswordResetToken[]
  sessions            Session[]
}

model VerificationCode {
  id        String   @id @default(cuid())
  userId    String
  codeHash  String
  expiresAt DateTime
  usedAt    DateTime?
  createdAt DateTime @default(now())
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@index([userId])
}

model PasswordResetToken {
  id        String   @id @default(cuid())
  userId    String
  tokenHash String   @unique
  expiresAt DateTime
  usedAt    DateTime?
  createdAt DateTime @default(now())
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@index([userId])
}

model Session {
  id        String   @id @default(cuid())
  userId    String
  tokenHash String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@index([userId])
}
```

- **`User`** = one account. `email @unique` (one address, one identity); `passwordHash` = bcrypt output only; `isEmailVerified` defaults false (untrusted until proved).
- **`VerificationCode`** = one row per code issued. `codeHash` = sha256, never the code; `expiresAt` required (server-enforced expiry); `usedAt` nullable = "not yet used".
- **`PasswordResetToken`** = one row per reset link. Same time-limit/single-use story, plus `tokenHash @unique`.
- **`Session`** = one row per login. Cookie holds a random value; `tokenHash` stores its sha256; `expiresAt` required and every lookup filters on it.

**Which constraints make an invalid state impossible?**
`email @unique` makes two accounts on one address a database impossibility (a raced double-submit fails `P2002` → friendly `409`). `tokenHash @unique` on reset tokens and sessions rules out duplicates/collisions. `onDelete: Cascade` forbids orphaned codes/tokens/sessions pointing at a deleted user. `usedAt`+`expiresAt` are the structural statement of single-use and time-limits. `codeHash` is deliberately *not* unique — one user legitimately holds several codes over time; what must be unique is *use*, which `usedAt` enforces.

## Section 5: The Concepts

Each of the eight concepts gets the same four questions. Files are named so you can follow along.

### 5.1 Proof of Possession
- **What it is:** You act as an account only if you first show you control its registered email — by receiving and returning a secret only that inbox gets.
- **Why it is needed:** Without it, anyone can sign up under someone else's address. Every later decision (dashboard, reset) inherits the strength of this one demonstration.
- **How I implemented it:** Signup mints a 6-digit code (hash stored in `VerificationCode.codeHash`) and emails it; `verify-email/route.ts` demands it back before anything is trusted, rejecting wrong (`400`), used (`410`), and expired (`410`) codes.
- **What I chose against:** SMS/app-2FA (outside the email-only brief, and adds channels the stack doesn't own), and treating "the code was sent" as proof — possession is proven only when it comes back.

### 5.2 Password Hashing
- **What it is:** A one-way transform of the password; the original is never stored, only compared on sign-in.
- **Why it is needed:** A stolen database full of plain passwords hands the attacker every account — and, because passwords are reused, accounts elsewhere too. Hashing makes the haul expensive to reverse.
- **How I implemented it:** `src/lib/auth/password.ts` — bcrypt, cost 12: `genSalt(12)`+`hash` at signup/reset, `compare` at signin. Cost 12 slows one honest login a few milliseconds but an attacker millions of attempts.
- **What I chose against:** SHA-256 (fast = wrong tool for passwords) and Argon2 (stronger on paper, but I chose the option I fully understand in this stack and can reason about).

### 5.3 Email Verification Codes
- **What it is:** A short, time-limited, single-use code that flips the account to "verified" exactly once.
- **Why it is needed:** Without it, an intercepted code would work forever and repeatedly, and any unsigned-up account would be as trusted as its owner's.
- **How I implemented it:** Code row at signup with `expiresAt` +10 min and `usedAt` null; verify writes `usedAt` and flips `isEmailVerified`; `resend-code/route.ts` enforces a 30s server cooldown against the latest code before issuing a fresh one. `codeHash` stores sha256, so the DB holds nothing usable.
- **What I chose against:** Storing the plaintext code (dump = usable), a unique `codeHash` (one user legitimately holds several codes over time — that uniqueness would break resend), and trusting the client's countdown (server enforces, because the client's clock and honesty are out of my control).

### 5.4 Session Management
- **What it is:** A per-visit random token that stands in for the password, so the password isn't re-proven on every page.
- **Why it is needed:** Without it, either the password is re-entered constantly or stored where JavaScript/an XSS read it — and "sign out" would be meaningless.
- **How I implemented it:** Sign-in/verify/reset issue a 32-byte token; sha256 goes in `Session.tokenHash`, the raw value in an `auth_session` cookie (`src/lib/security/cookies.ts`): `httpOnly`, `SameSite=lax`, `Secure` in production, 7-day `maxAge`. Protected reads hash the cookie and match an unexpired row; signout deletes the row; reset deletes every row for the user.
- **What I chose against:** JWTs — stateless and unrevocable, so sign-out-everywhere and reset-kills-sessions couldn't exist; the one DB query per request buys immediate revocation. Also, storing the token, not its hash, in the DB (a stolen table must not be a set of working cookies).

### 5.5 Password Reset
- **What it is:** Recovery by mailed link — a random, 15-min, single-use token in the inbox; whoever presents it sets a new password and kills the old sessions.
- **Why it is needed:** Passwords get lost; a reset path that skips the proof becomes the easiest attack in the system. Done right it also removes the "I can never get back in" trap that pushes users to reuse weak passwords.
- **How I implemented it:** `forgot-password/route.ts` mints a 32-byte token (sha256 in `PasswordResetToken`, 15-min expiry) and emails the link; `reset-password/route.ts` rejects unknown (`400`)/used (`410`)/expired (`410`), then writes the new hash, burns the token, and deletes all the user's sessions.
- **What I chose against:** Signed JWTs as links (same revocation problem — a leaked link lives until expiry) and emailing the password back (it isn't stored, and emailing secrets normalises them in transit). The DB token costs one lookup and buys genuine single-use.

### 5.6 Rate Limiting
- **What it is:** Capping how many attempts one caller gets per window, refusing past the cap with `429` + `Retry-After`.
- **Why it is needed:** Without it, brute-forcing a password or a code costs the attacker nothing but time, while every guess costs my server a database query or a bcrypt compare.
- **How I implemented it:** `src/lib/security/rate-limit.ts` — fixed-window per-IP counters on signup/signin (5/60s, `429` from the 6th) and resend/forgot (3/60s); forgot-password adds a per-email cooldown (see 5.7). Evidence item 1 shows the 6th sign-in attempt refused.
- **What I chose against:** Account-only limiting (useless pre-sign-in — attackers rotate accounts; IP-first works at the door) and Redis/sliding windows (single-instance slice doesn't need the infrastructure; multi-instance is a documented limitation in Section 7).

### 5.7 Account-Enumeration Prevention
- **What it is:** Making the API answer identically whether or not an address has an account, so responses can't be used as probes.
- **Why it is needed:** Otherwise the API leaks the user list one message at a time — letting an attacker target real people or sell a confirmed-email list, and it looks innocent while doing it.
- **How I implemented it:** Signin returns the same `401` for unknown email and wrong password; forgot-password returns the same `200` either way, and its 60s cooldown is keyed by the email *string* before the lookup:
  ```ts
  const cooldown = rateLimit({ key: `forgot-password:cooldown:${email.toLowerCase()}`,
    limit: 1, windowMs: RESET_COOLDOWN_MS });
  ```
  So an unknown account's rapid repeat answers the same `429` as a real one (proven in Evidence item 4).
- **What I chose against:** Distinct messages like "no account exists" or "try signing up" — convenience that hands out precisely the information that must be withheld.

### 5.8 Database-Level Integrity
- **What it is:** Making invalid states impossible in the schema itself — constraints that hold on every write, from every path, forever.
- **Why it is needed:** Application checks live in one process at one moment and can be raced by double-clicks, retries, or future edits. A constraint keeps on enforcing when the code has a bug.
- **How I implemented it:** `email @unique` (one account per address), `tokenHash @unique` ×2 (no duplicate tokens), `onDelete: Cascade` (no orphans), required `expiresAt`, nullable `usedAt` (Section 4). Signup catches the real race as `P2002` → `409`.
- **What I chose against:** App-only uniqueness (a `select`-then-`insert` loses the race it's supposed to stop) and auto-increment integer ids (enumerable, guessable). `cuid()` ids aren't guessable and need no counter.

## Section 6: What Went Wrong

1. **Boot failures hid themselves.** *Symptom:* app wouldn't start. *Investigation:* blank `SMTP_PORT` parsed to `0` and a short `AUTH_SECRET` both failed, but the validator stopped at the first. *Cause:* fatal-fast on the first error. *Fix:* the validator accumulates and prints every failure at once.
2. **`cookies()` rejected in a client component.** *Symptom:* build failed importing `next/headers` in the sign-up form. *Investigation/Cause:* request-scoped server data was being read on the client. *Fix (architecture):* cookie reads live only in server files (`src/lib/security/cookies.ts`); client components get plain values.
3. **Portable PostgreSQL failed three ways (incomplete extract → `0xC0000142` → `psql` hung).** *Investigation:* a hand-managed Windows cluster was fighting toolchain defaults. *Fix:* use the installed PostgreSQL 17, dedicated role/db (`auth_app`/`authentication`), `postgresql` provider, regenerated migration. (Prisma's `P3019` migration/schema desync was the same story: one canonical migration fixed it.)
4. **SMTP `535 BadCredentials` even with app passwords.** *Investigation:* the failure was provider-side, not code. *Fix (documented decision):* keep SMTP wired in `.env.example` but default to console delivery, so the full flow runs without a working relay.
5. **Forgot-password leaked which emails were registered.** *Symptom:* unknown email → `200, 200`; registered → `200, 429`. *Investigation:* the cooldown ran *after* the user lookup, so unknown emails never entered it. *Fix:* key the cooldown by the email (before the lookup) and add `Retry-After` — replies are now byte-identical.
6. **A raw-SQL `now()` was read one hour in the future.** *Symptom:* a manually-seeded token with `expiresAt` a minute in the past was accepted. *Investigation:* `timestamp without time zone` + server timezone `Africa/Lagos` (+1) → Prisma reads Lagos wall time as UTC. *Cause:* app writes (UTC) are consistent; only non-app writes skew. *Fix (documented):* annotate `@db.Timestamptz(3)` + regenerate migration — recommended, not yet applied (Section 7).
7. **Middleware only checks cookie presence.** *Symptom:* a forged cookie reached `/dashboard`. *Investigation:* middleware is a convenience gate by design; the session route is the real one (returns `{"user":null}`). *Decision:* keep two layers, document that the DB check is the protection.

## Section 7: What This Slice Does Not Handle

- Real SMTP delivery — codes/links print to the console; wiring a provider is config. *(Outside the brief.)*
- Any identity except email-and-password. *(Outside the brief.)*
- Rate limiting is per-instance, in-memory — multi-instance needs a shared store (Redis). *(Add before real users / at scale.)*
- No rate limit on verify/reset — single-use + expiry protect them, but a limiter would blunt capture-replay. *(Would add before real users.)*
- Sessions are fixed 7 days, not sliding. *(Deliberate; would revisit.)*
- Expiry skew for non-application row writes — `timestamp without time zone` is correct for app rows but +1h for raw-SQL rows; fix is `@db.Timestamptz(3)`. *(Documented rather than risked mid-assessment.)*
- A forged cookie renders a blank page rather than redirecting to `/signin` (no data leaks). *(Out of time; a one-line client redirect is the obvious next edit.)*
- No GDPR export/delete, consent records, or login audit log. *(Outside the brief.)*

## Section 8: If I Built This Again

The single biggest thing I'd change is the date handling: every `DateTime` column would carry `@db.Timestamptz(3)` from the very first migration — because every other improvement is cheaper than getting timezones wrong once. That one annotation removes the only defect the app itself doesn't control (a raw-SQL `now()` read one hour in the future — Problem 6), turns "expiry is enforced by the server" into a statement with no caveat, and deletes a whole class of "worked on my machine" bugs from a security slice. Nothing else I noted comes close to a fix that costs one migration and buys certainty that time-limits mean what they say.

## Appendix: Evidence

Verbatim from real runs against the live app (`http://localhost:3001`) and the real PostgreSQL. Nothing edited.

**1 — Smoke-test transcript** (`node scripts/smoke.mjs`):

```
POST /api/auth/signup {name, email, password}              -> 201 {"message":"Check your email for a verification code."}
POST /api/auth/signup {same email again}                   -> 409 {"error":"An account with this email already exists."}
POST /api/auth/verify-email {email, wrong code}            -> 400 {"error":"Incorrect code."}
GET  /dashboard (no cookie)                                -> 307  location=/signin
POST /api/auth/signin {email, wrong password}              -> 401 {"error":"Incorrect email or password."}
POST /api/auth/signin {email, right password}              -> 200 session issued
GET  /api/auth/session (with cookie)                       -> 200 {"user":{"id":"cmtsw1scr002zv20ctmqe35ou","name":"Smoke Tester","email":"smoke.1788885180628@example.com","isEmailVerified":false}}
POST /api/auth/signin (6th attempt / 60s)                  -> 429 {"error":"Too many sign-in attempts. Try again later."} retryAfter=56
POST /api/auth/forgot-password {unknown email}             -> 200 {"message":"If that email exists, a reset link has been sent."}
POST /api/auth/forgot-password {real email}                -> 200 {"message":"If that email exists, a reset link has been sent."}
POST /api/auth/reset-password {bogus token}                -> 400 {"error":"This reset link is invalid."}
POST /api/auth/signout (with cookie)                       -> 200 {"message":"Signed out."}
GET  /api/auth/session (after signout)                     -> 200 {"user":null}
GET  /dashboard (after signout, no cookie)                 -> 307  location=/signin
```

Console-secret steps (dev-console email mode), proven with `OTP_CODE`/`RESET_TOKEN` passed back in:

```
verify-email with real code -> 200 (verified, + session)   reset with real token -> 200 "Password reset successfully."
same token again -> 410 "already been used"                old password after reset -> 401   new password -> 200
```

**2 — Full authenticated run** (fresh account `ev.1788890759028@example.com`):

```
signup -> 201   signin -> 200 {"user":{...}} Set-Cookie: auth_session=1ded1eadd1c8cd6d73bab64a7265bfb394452a92b0111a87ca9097574739d127
session (cookie) -> 200 user   dashboard (cookie) -> 200 rendered   forgot (real) -> 200   reset (bogus) -> 400 "This reset link is invalid."
```

**3 — Database rows** (live `psql`, immediately after the run; hashes truncated for display):

```
User:            cmtszdp0k0036v20cbhim0cum | Evidence Tester | ev.1788890759028@example.com | verified=false | created=2026-09-08 18:06:16.269
VerificationCode: expiresAt=2026-09-08 18:16:16.337 | usedAt=null | codeHash=15ada7536ccb...
PasswordResetToken: ev-expired-id | expiresAt=2026-09-07 19:07:02.273 | usedAt=null    cmtsze69r003cv20c0huxze5h | expiresAt=2026-09-08 18:21:38.627 | usedAt=null
Session:         expiresAt=2026-09-15 18:06:24.189 | created=2026-09-08 18:06:24.192 | tokenHash=84f8b0ab1ed4...
Counts:          users=5  codes=5  resetTokens=12  sessions=1
```

**4 — Defensive verifications.**

*Expired reset token rejected* (seeded `expiresAt = now() - 1 day`):

```
POST /api/auth/reset-password {expired token, new password} -> 410 {"error":"This reset link has expired."}
```

*Forged cookie reaches no user data:*

```
GET /dashboard (forged cookie)                    -> 200 (page shell only)
GET /api/auth/session (forged cookie)             -> 200 {"user":null}
```

*Enumeration cooldown is identical for unknown vs registered* (same unknown email twice):

```
POST /api/auth/forgot-password {unknown email}               -> 200 {"message":"If that email exists, a reset link has been sent."}
POST /api/auth/forgot-password {same email, immediately}     -> 429 {"error":"Please wait 55 seconds before requesting another reset link.","retryInSeconds":55} Retry-After: 55
```