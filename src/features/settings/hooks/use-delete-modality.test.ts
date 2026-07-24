import React from "react";
import { act, renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { deleteModalityAction } from "@/actions/deleteModality";
import { useDeleteModality } from "./use-delete-modality";

vi.mock("@/actions/deleteModality", () => ({
  deleteModalityAction: vi.fn(),
}));

let queryClient: QueryClient;

const wrapper = ({ children }: { children: React.ReactNode }) => {
  return React.createElement(QueryClientProvider, { client: queryClient }, children);
};

describe("useDeleteModality", () => {
  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    vi.mocked(deleteModalityAction).mockReset();
  });

  afterEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  it("calls deleteModalityAction and cleans up modality queries on success", async () => {
    vi.mocked(deleteModalityAction).mockResolvedValue(undefined);
    const invalidateQueriesSpy = vi.spyOn(queryClient, "invalidateQueries");
    const removeQueriesSpy = vi.spyOn(queryClient, "removeQueries");

    const { result } = renderHook(() => useDeleteModality(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync("TEST");
    });

    expect(deleteModalityAction).toHaveBeenCalledWith("TEST");
    // TanStack Query v5 uses object query filters for these cache calls.
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ["modalities"] });
    expect(removeQueriesSpy).toHaveBeenCalledWith({ queryKey: ["modality", "TEST"] });
  });
});
