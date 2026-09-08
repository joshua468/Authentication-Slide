#!/usr/bin/env node
/**
 * End-to-end acceptance script for the Authentication slice.
 *
 * Drives every unauthenticated write endpoint plus middleware behavior and
 * prints a line per exchange. The two steps that need a secret (verify-email
 * with the real code, reset-password with the real token) accept them via the
 * OTP_CODE and RESET_TOKEN environment variables. In dev-console email mode
 * those secrets are printed to the server console (the terminal running
 * `npm run dev`); pass them in to exercise the success paths:
 *
 *   OTP_CODE=123456 RESET_TOKEN=abc... node scripts/smoke.mjs
 *
 * Usage without secrets still proves: fresh signup, duplicate rejection,
 * wrong-code rejection, anti-enumeration signin, session cookie lifecycle,
 * signout, rate limiting, middleware 307, invalid reset-link rejection.
 */

const APP_URL = process.env.APP_URL ?? "http://localhost:3001";

let failures = 0;

function print(label, status, body, extra = "") {
  const text = body && typeof body === "object" ? JSON.stringify(body) : String(body ?? "");
  console.log(`${label}  ->  ${status} ${text}${extra ? " " + extra : ""}`);
}

function assert(condition, message) {
  if (!condition) {
    failures += 1;
    console.error(`  ✗ ASSERT FAILED: ${message}`);
  }
}

async function request(pathname, { method = "GET", body, cookie } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (cookie) headers.Cookie = cookie;
  const res = await fetch(`${APP_URL}${pathname}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    redirect: "manual",
  });
  let json = null;
  try {
    json = await res.json();
  } catch {
    /* non-JSON body */
  }
  const setCookie = res.headers.get("set-cookie")?.split(";")[0] ?? "";
  return {
    status: res.status,
    json,
    setCookie,
    location: res.headers.get("location"),
    retryAfter: res.headers.get("retry-after") ?? "",
  };
}

const email = `smoke.${Date.now()}@example.com`;
const password = "Str0ng!Pass-1";
const newPassword = "N3w!Pass-123";
const wrongPassword = "Wrong!Pass-9";

console.log(`Base: ${APP_URL}\nFresh identity: ${email}\n`);

// 1. Fresh signup
{
  const r = await request("/api/auth/signup", {
    method: "POST",
    body: { name: "Smoke Tester", email, password, confirmPassword: password },
  });
  print("POST /api/auth/signup {name, email, password}", r.status, r.json);
  assert(r.status === 201, `signup should be 201, got ${r.status}`);
}

// 2. Duplicate signup rejected
{
  const r = await request("/api/auth/signup", {
    method: "POST",
    body: { name: "Smoke Tester", email, password, confirmPassword: password },
  });
  print("POST /api/auth/signup {same email again}", r.status, r.json);
  assert(r.status === 409, `duplicate signup should be 409, got ${r.status}`);
}

// 3. Wrong verification code rejected
{
  const r = await request("/api/auth/verify-email", {
    method: "POST",
    body: { email, code: "000000" },
  });
  print("POST /api/auth/verify-email {email, wrong code}", r.status, r.json);
  assert(r.status === 400, `wrong code should be 400, got ${r.status}`);
}

// 4. Real code path (requires code from the dev-server console)
if (process.env.OTP_CODE) {
  const r = await request("/api/auth/verify-email", {
    method: "POST",
    body: { email, code: process.env.OTP_CODE },
  });
  print("POST /api/auth/verify-email {email, code from console}", r.status, r.json);
  assert(r.status === 200, `verify should be 200, got ${r.status}`);

  const g = await request("/api/auth/session", { cookie: r.setCookie });
  print("GET  /api/auth/session (with cookie)", g.status, g.json);
  assert(g.status === 200 && g.json?.user?.isEmailVerified === true, "session should report verified user");

  const d = await request("/dashboard", { cookie: r.setCookie });
  print("GET  /dashboard (with cookie)", d.status, null, "(page rendered)");
}

// 5. Middleware: dashboard without cookie -> 307
{
  const r = await request("/dashboard");
  print("GET  /dashboard (no cookie)", r.status, null, `location=${r.location}`);
  assert(r.status === 307, `middleware should 307, got ${r.status}`);
}

// 6. Signin: wrong password -> 401 (same message as unknown email)
{
  const r = await request("/api/auth/signin", {
    method: "POST",
    body: { email, password: wrongPassword },
  });
  print("POST /api/auth/signin {email, wrong password}", r.status, r.json);
  assert(r.status === 401, `wrong password should be 401, got ${r.status}`);
}

// 7. Signin: correct password -> 200 + session cookie
let dashboardCookie = "";
{
  const r = await request("/api/auth/signin", {
    method: "POST",
    body: { email, password },
  });
  print("POST /api/auth/signin {email, right password}", r.status, r.json?.error ?? "session issued");
  assert(r.status === 200, `signin should be 200, got ${r.status}`);
  dashboardCookie = r.setCookie;

  const g = await request("/api/auth/session", { cookie: dashboardCookie });
  print("GET  /api/auth/session (with cookie)", g.status, g.json);
}

// 8. Rate limit: the 6th sign-in attempt within the 60-second window is 429.
//    Limiter state lives in the route's module memory, so the burst must be
//    contiguous; the two sign-ins above are within the window, so the 4th
//    extra attempt hits the cap (allowance is 5 per window).
{
  let hit429 = false;
  let last;
  for (let i = 1; i <= 5; i++) {
    last = await request("/api/auth/signin", {
      method: "POST",
      body: { email, password: wrongPassword },
    });
    if (last.status === 429) {
      hit429 = true;
      break;
    }
  }
  print("POST /api/auth/signin (burst past the 5/60s limit)", last.status, last.json, `retryAfter=${last.retryAfter || "(none)"}`);
  assert(hit429, "the sign-in burst should end in 429");
}

// 9. Anti-enumeration: forgot-password on unknown email -> 200
{
  const r = await request("/api/auth/forgot-password", {
    method: "POST",
    body: { email: "nobody@example.com" },
  });
  print("POST /api/auth/forgot-password {unknown email}", r.status, r.json);
  assert(r.status === 200, `unknown email forgot-password should be 200, got ${r.status}`);
}

// 10. Forgot-password for the real account -> 200 (token emitted to dev console)
{
  const r = await request("/api/auth/forgot-password", {
    method: "POST",
    body: { email },
  });
  print("POST /api/auth/forgot-password {real email}", r.status, r.json);
  assert(r.status === 200, `forgot-password should be 200, got ${r.status}`);
}

// 11. Invalid reset token -> 400
{
  const r = await request("/api/auth/reset-password", {
    method: "POST",
    body: { token: "not-a-real-token", password: newPassword, confirmPassword: newPassword },
  });
  print("POST /api/auth/reset-password {bogus token}", r.status, r.json);
  assert(r.status === 400, `bogus token should be 400, got ${r.status}`);
}

// 12. Real reset path (requires token from the dev-server console)
if (process.env.RESET_TOKEN) {
  const token = process.env.RESET_TOKEN;
  const first = await request("/api/auth/reset-password", {
    method: "POST",
    body: { token, password: newPassword, confirmPassword: newPassword },
  });
  print("POST /api/auth/reset-password {token, new password}", first.status, first.json);
  assert(first.status === 200, `reset should be 200, got ${first.status}`);

  const reused = await request("/api/auth/reset-password", {
    method: "POST",
    body: { token, password: newPassword, confirmPassword: newPassword },
  });
  print("POST /api/auth/reset-password {same token again}", reused.status, reused.json);
  assert(reused.status === 410, `token reuse should be 410, got ${reused.status}`);

  const old = await request("/api/auth/signin", {
    method: "POST",
    body: { email, password },
  });
  print("POST /api/auth/signin {old password after reset}", old.status, old.json);
  assert(old.status === 401, `old password should be 401, got ${old.status}`);

  const fresh = await request("/api/auth/signin", {
    method: "POST",
    body: { email, password: newPassword },
  });
  print("POST /api/auth/signin {new password after reset}", fresh.status, fresh.json?.error ?? "session issued");
  assert(fresh.status === 200, `new password should be 200, got ${fresh.status}`);
}

// 13. Signout revokes the session
{
  const r = await request("/api/auth/signout", {
    method: "POST",
    cookie: dashboardCookie,
  });
  print("POST /api/auth/signout (with cookie)", r.status, r.json);

  const g = await request("/api/auth/session", { cookie: dashboardCookie });
  print("GET  /api/auth/session (after signout)", g.status, g.json);
  assert(g.json?.user === null, "session should be null after signout");

  const d = await request("/dashboard");
  print("GET  /dashboard (after signout, no cookie)", d.status, null, `location=${d.location}`);
  assert(d.status === 307, "dashboard should 307 after signout");
}

console.log(failures === 0 ? "\nALL ASSERTIONS PASSED" : `\n${failures} ASSERTION(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);