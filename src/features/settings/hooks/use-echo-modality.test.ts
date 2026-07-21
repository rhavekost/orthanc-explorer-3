import React from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { echoModalityAction } from "@/actions/echoModality";
import { loadConfig, __resetConfigForTests } from "@/config/runtime";
import { useEchoModality } from "./use-echo-modality";

vi.mock("@/actions/echoModality", () => ({
  echoModalityAction: vi.fn(),
}));

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return React.createElement(QueryClientProvider, { client: qc }, children);
};

describe("useEchoModality", () => {
  beforeEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).__OE3_CONFIG__ = {
      orthancUrl: "",
      authMode: "none",
      features: {},
    };
    loadConfig();
    vi.mocked(echoModalityAction).mockReset();
  });

  afterEach(() => {
    __resetConfigForTests();
    vi.restoreAllMocks();
  });

  it("calls echoModalityAction and exposes the resolved echo result", async () => {
    const echoResult = { RemoteAET: "PEER", RemoteHost: "dicom-peer" };
    vi.mocked(echoModalityAction).mockResolvedValue(echoResult);

    const { result } = renderHook(() => useEchoModality(), { wrapper });

    let mutationResult: Record<string, unknown> | undefined;
    await act(async () => {
      mutationResult = await result.current.mutateAsync("TEST");
    });

    expect(echoModalityAction).toHaveBeenCalledWith("TEST");
    expect(mutationResult).toEqual(echoResult);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(echoResult);
  });
});
