// Unit tests for the auth service (js/auth.js).
import "./_setup.mjs";
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { resetStorage } from "./_setup.mjs";
import {
  registerUser,
  loginUser,
  findUser,
  getSession,
  clearSession,
  isLoggedIn,
} from "../js/auth.js";

beforeEach(() => resetStorage());

test("register then login with the same credentials succeeds", async () => {
  await registerUser({ email: "ann@example.com", password: "pw123456", name: "Ann" });
  const user = await loginUser({ email: "ann@example.com", password: "pw123456" });
  assert.equal(user.name, "Ann");
  assert.equal(isLoggedIn(), true);
  assert.equal(getSession().email, "ann@example.com");
});

test("email lookup is case-insensitive", async () => {
  await registerUser({ email: "Ann@Example.com", password: "pw123456", name: "Ann" });
  assert.ok(findUser("ann@example.COM"));
  const user = await loginUser({ email: "ANN@example.com", password: "pw123456" });
  assert.equal(user.email, "Ann@Example.com");
});

test("duplicate email is rejected", async () => {
  await registerUser({ email: "a@b.com", password: "pw123456", name: "A" });
  await assert.rejects(
    () => registerUser({ email: "A@B.com", password: "other123", name: "B" }),
    /already exists/i
  );
});

test("wrong password is rejected", async () => {
  await registerUser({ email: "a@b.com", password: "correct1", name: "A" });
  await assert.rejects(
    () => loginUser({ email: "a@b.com", password: "wrongone" }),
    /incorrect password/i
  );
});

test("unknown email is rejected", async () => {
  await assert.rejects(
    () => loginUser({ email: "ghost@b.com", password: "whatever" }),
    /no account/i
  );
});

test("password is never stored in plain text", async () => {
  await registerUser({ email: "a@b.com", password: "sup3rSecret!", name: "A" });
  const raw = localStorage.getItem("sate_taipan_users");
  assert.ok(raw && !raw.includes("sup3rSecret!"));
  const user = findUser("a@b.com");
  assert.ok(user.passwordHash && user.salt);
});

test("logout clears the session", async () => {
  await registerUser({ email: "a@b.com", password: "pw123456", name: "A" });
  await loginUser({ email: "a@b.com", password: "pw123456" });
  clearSession();
  assert.equal(isLoggedIn(), false);
  assert.equal(getSession(), null);
});
