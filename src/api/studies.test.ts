import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { studiesApi } from "./studies";
import { loadConfig, __resetConfigForTests } from "@/config/runtime";

describe("studiesApi", () => {
  beforeEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).__OE3_CONFIG__ = { orthancUrl: "", authMode: "none", features: {} };
    loadConfig();
  });
  afterEach(() => { __resetConfigForTests(); vi.restoreAllMocks(); });

  it("find() POSTs /tools/find (PHI not in URL)", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("[]", { status: 200 }),
    );
    await studiesApi.find({ Level: "Study", Query: { PatientName: "Doe^Jane" } });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/tools/find");
    expect((init as RequestInit).method).toBe("POST");
    expect(url).not.toContain("Doe");  // PHI must not be in URL
    expect(JSON.parse((init as RequestInit).body as string).Query.PatientName).toBe("Doe^Jane");
    expect((init as RequestInit & { headers: Headers }).headers.get("Content-Type")).toBe("application/json");
  });

  it("get() hits /studies/:id", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("{}", { status: 200 }),
    );
    await studiesApi.get("abc-123");
    expect(fetchMock.mock.calls[0][0]).toBe("/studies/abc-123");
  });

  it("getSeries() hits /studies/:id/series", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("[]", { status: 200 }),
    );
    await studiesApi.getSeries("abc-123");
    expect(fetchMock.mock.calls[0][0]).toBe("/studies/abc-123/series");
  });

  it("delete() uses DELETE method", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(null, { status: 204 }),
    );
    await studiesApi.delete("abc-123");
    expect((fetchMock.mock.calls[0][1] as RequestInit).method).toBe("DELETE");
  });

  it("anonymize() POSTs /studies/:id/anonymize", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response('{"ID":"new-id","Path":"/studies/new-id"}', { status: 200 }),
    );
    await studiesApi.anonymize("abc-123", { Keep: ["PatientName"] });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/studies/abc-123/anonymize");
    expect((init as RequestInit).method).toBe("POST");
  });

  it("modify() POSTs /studies/:id/modify", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response('{"ID":"mod-id","Path":"/studies/mod-id"}', { status: 200 }),
    );
    await studiesApi.modify("abc-123", { Replace: { PatientName: "Anonymous" } });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/studies/abc-123/modify");
    expect((init as RequestInit).method).toBe("POST");
  });

  it("archive() hits /studies/:id/archive as blob", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(new Blob(["ZIP"]), { status: 200, headers: { "Content-Type": "application/zip" } }),
    );
    const result = await studiesApi.archive("abc-123");
    expect(fetchMock.mock.calls[0][0]).toBe("/studies/abc-123/archive");
    // Verify it returns a blob-like object
    expect(result).toBeDefined();
  });

  it("addLabel() PUTs /studies/:id/labels/:label (label encoded)", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(null, { status: 200 }),
    );
    await studiesApi.addLabel("abc-123", "high priority");
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/studies/abc-123/labels/high%20priority");
    expect((init as RequestInit).method).toBe("PUT");
  });

  it("removeLabel() DELETEs /studies/:id/labels/:label (label encoded)", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(null, { status: 200 }),
    );
    await studiesApi.removeLabel("abc-123", "high priority");
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/studies/abc-123/labels/high%20priority");
    expect((init as RequestInit).method).toBe("DELETE");
  });
});
