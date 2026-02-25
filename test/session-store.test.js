import { describe, it, expect, beforeEach } from "vitest";
import { createSession, getSession, destroySession, setOAuthState, getAndRemoveOAuthState } from "../lib/session-store.js";

describe("session-store", () => {
  beforeEach(() => {
    // Session store is in-memory; we can't clear it without an API, so we use unique ids per test
  });

  it("createSession returns id and stores data", () => {
    const data = { access_token: "tok", login: "alice", scope: "read:user" };
    const id = createSession(data);
    expect(typeof id).toBe("string");
    expect(id.length).toBeGreaterThan(0);
    const session = getSession(id);
    expect(session).toBeDefined();
    expect(session.access_token).toBe("tok");
    expect(session.login).toBe("alice");
    expect(session.scope).toBe("read:user");
    expect(session.created_at).toBeDefined();
  });

  it("getSession(id) returns undefined for unknown id", () => {
    expect(getSession("nonexistent")).toBeUndefined();
  });

  it("destroySession(id) removes session", () => {
    const id = createSession({ access_token: "x", login: "bob", scope: "repo" });
    expect(getSession(id)).toBeDefined();
    destroySession(id);
    expect(getSession(id)).toBeUndefined();
  });

  it("getSession after destroy returns undefined", () => {
    const id = createSession({ access_token: "y", login: "charlie", scope: "public_repo" });
    destroySession(id);
    expect(getSession(id)).toBeUndefined();
  });

  describe("OAuth state", () => {
    it("getAndRemoveOAuthState returns and removes state", () => {
      setOAuthState("oid_abc", "public_st_123");
      expect(getAndRemoveOAuthState("oid_abc")).toBe("public_st_123");
      expect(getAndRemoveOAuthState("oid_abc")).toBeNull();
    });
    it("getAndRemoveOAuthState returns null for unknown id", () => {
      expect(getAndRemoveOAuthState("unknown")).toBeNull();
    });
  });
});
