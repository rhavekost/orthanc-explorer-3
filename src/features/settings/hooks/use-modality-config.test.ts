import React from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";
import { modalitiesApi, type ModalityConfig } from "@/api/modalities";
import { useModalityConfig } from "./use-modality-config";

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return React.createElement(QueryClientProvider, { client: qc }, children);
};

describe("useModalityConfig", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches a modality configuration via modalitiesApi.get", async () => {
    const config: ModalityConfig = {
      AET: "TEST_AET",
      Host: "dicom-peer",
      Port: 4242,
      Manufacturer: "Generic",
    };
    const spy = vi.spyOn(modalitiesApi, "get").mockResolvedValue(config);

    const { result } = renderHook(() => useModalityConfig("TEST"), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(spy).toHaveBeenCalledWith("TEST");
    expect(result.current.data).toEqual(config);
  });

  it("does not fetch when modality name is empty", () => {
    const spy = vi.spyOn(modalitiesApi, "get").mockResolvedValue({
      AET: "TEST_AET",
      Host: "dicom-peer",
      Port: 4242,
    });

    renderHook(() => useModalityConfig(""), { wrapper });

    expect(spy).not.toHaveBeenCalled();
  });
});
