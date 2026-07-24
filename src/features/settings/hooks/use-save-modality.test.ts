import React from "react";
import { act, renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { saveModalityAction } from "@/actions/saveModality";
import { useSaveModality } from "./use-save-modality";

vi.mock("@/actions/saveModality", () => ({
  saveModalityAction: vi.fn(),
}));

const CONFIG = { AET: "TEST", Host: "dicom-peer", Port: 4242 };

let queryClient: QueryClient;

const wrapper = ({ children }: { children: React.ReactNode }) => {
  return React.createElement(QueryClientProvider, { client: queryClient }, children);
};

describe("useSaveModality", () => {
  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    vi.mocked(saveModalityAction).mockReset();
  });

  afterEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  it("calls saveModalityAction with the supplied name and config", async () => {
    vi.mocked(saveModalityAction).mockResolvedValue(undefined);

    const { result } = renderHook(() => useSaveModality(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ name: "TEST", config: CONFIG });
    });

    expect(saveModalityAction).toHaveBeenCalledWith("TEST", CONFIG);
  });

  it("invalidates the modality list and saved modality detail on success", async () => {
    vi.mocked(saveModalityAction).mockResolvedValue(undefined);
    const invalidateQueriesSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useSaveModality(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ name: "TEST", config: CONFIG });
    });

    expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ["modalities"] });
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: ["modality", "TEST"],
    });
  });
});
