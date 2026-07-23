import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { orthancFetch } from "@/lib/client";
import { loadConfig, __resetConfigForTests } from "@/config/runtime";
import { healthTracker } from "./health";
import { OrthancError } from "./errors";
import { __resetLoggerSinkForTests, __setLoggerSinkForTests } from "./logger";

const setCfg = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).__OE3_CONFIG__ = {
    orthancUrl: "http://localhost:8042", authMode: "none", features: {},
  };
  loadConfig();
};

describe("orthancFetch", () => {
  beforeEach(() => { setCfg(); healthTracker.reset(); });
  afterEach(() => { __resetConfigForTests(); __resetLoggerSinkForTests(); vi.restoreAllMocks(); });

  it("prepends orthancUrl and attaches correlation id", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    );
    await orthancFetch("/system");
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("http://localhost:8042/system");
    const headers = new Headers((init as RequestInit).headers);
    expect(headers.get("X-Request-Id")).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("parses JSON response bodies", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ name: "OE3" }), { status: 200 }),
    );
    const data = await orthancFetch<{ name: string }>("/system");
    expect(data.name).toBe("OE3");
  });

  it("returns undefined on 204 No Content", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 204 }));
    const data = await orthancFetch<void>("/studies/abc", { method: "DELETE" });
    expect(data).toBeUndefined();
  });

  it("throws OrthancError on non-2xx", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("boom", { status: 500 }));
    await expect(orthancFetch("/system")).rejects.toBeInstanceOf(OrthancError);
  });

  it("throws OrthancError and logs status for 404 responses", async () => {
    const sink = vi.fn();
    __setLoggerSinkForTests(sink);
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("not found", { status: 404 }));

    await expect(orthancFetch("/some-path")).rejects.toMatchObject({
      status: 404,
      message: "The requested resource was not found.",
    });
    expect(sink).toHaveBeenCalledWith(expect.objectContaining({
      level: "error",
      event: "orthanc.fetch.failed",
      fields: expect.objectContaining({ path: "/some-path", status: 404 }),
    }));
  });

  it("throws OrthancError and logs status for 500 responses", async () => {
    const sink = vi.fn();
    __setLoggerSinkForTests(sink);
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("server error", { status: 500 }));

    await expect(orthancFetch("/some-path")).rejects.toMatchObject({
      status: 500,
      message: "The server encountered an error.",
    });
    expect(sink).toHaveBeenCalledWith(expect.objectContaining({
      level: "error",
      event: "orthanc.fetch.failed",
      fields: expect.objectContaining({ path: "/some-path", status: 500 }),
    }));
  });

  it("records health on success and failure", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response("{}", { status: 200 }))
      .mockResolvedValueOnce(new Response("", { status: 500 }))
      .mockResolvedValueOnce(new Response("", { status: 500 }))
      .mockResolvedValueOnce(new Response("", { status: 500 }));
    await orthancFetch("/system");
    await orthancFetch("/system").catch(() => {});
    await orthancFetch("/system").catch(() => {});
    await orthancFetch("/system").catch(() => {});
    expect(healthTracker.getState().status).toBe("degraded");
  });

  it("records failure and rethrows on network error", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new TypeError("Failed to fetch"));
    await expect(orthancFetch("/system")).rejects.toBeInstanceOf(TypeError);
    expect(healthTracker.getState().consecutiveFailures).toBeGreaterThan(0);
  });

  it("returns Blob when responseType is blob", async () => {
    const blobData = new Blob(["PNG"], { type: "image/png" });
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(blobData, { status: 200, headers: { "Content-Type": "image/png" } }),
    );
    const result = await orthancFetch<Blob>("/instances/x/preview", {
      headers: { Accept: "image/png" },
      responseType: "blob",
    });
    expect(result).toMatchObject({ type: "image/png" });
    expect(typeof (result as Blob).arrayBuffer).toBe("function");
  });

  it("uses empty base for same-origin plugin mode", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).__OE3_CONFIG__ = { orthancUrl: "", authMode: "none", features: {} };
    loadConfig();
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("{}", { status: 200 }),
    );
    await orthancFetch("/system");
    expect(fetchMock.mock.calls[0][0]).toBe("/system");
  });
});
