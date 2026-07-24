import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useIsMobile } from "./use-mobile";

describe("useIsMobile", () => {
  let registeredListener: (() => void) | undefined;
  let addEventListener: ReturnType<typeof vi.fn>;
  let removeEventListener: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.restoreAllMocks();
    registeredListener = undefined;
    addEventListener = vi.fn((event: string, listener: () => void) => {
      if (event === "change") {
        registeredListener = listener;
      }
    });
    removeEventListener = vi.fn();

    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      writable: true,
      value: 1024,
    });

    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      writable: true,
      value: vi.fn((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener,
        removeEventListener,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  it("updates when crossing the 768px breakpoint and removes its listener on cleanup", () => {
    const { result, unmount } = renderHook(() => useIsMobile());

    expect(window.matchMedia).toHaveBeenCalledWith("(max-width: 767px)");
    expect(addEventListener).toHaveBeenCalledWith("change", expect.any(Function));
    expect(result.current).toBe(false);
    expect(registeredListener).toEqual(expect.any(Function));

    act(() => {
      window.innerWidth = 767;
      registeredListener?.();
    });

    expect(result.current).toBe(true);

    act(() => {
      window.innerWidth = 768;
      registeredListener?.();
    });

    expect(result.current).toBe(false);

    unmount();

    expect(removeEventListener).toHaveBeenCalledWith("change", registeredListener);
  });
});
