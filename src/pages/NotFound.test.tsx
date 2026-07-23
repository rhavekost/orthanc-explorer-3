import { render, screen, fireEvent as userEvent } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import NotFound from "./NotFound";

describe("NotFound", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows the 404 heading and a clickable Return to Home link", () => {
    render(
      <MemoryRouter initialEntries={["/missing-page"]}>
        <NotFound />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: /404/i })).toBeInTheDocument();

    const homeLink = screen.getByRole("link", { name: /return to home/i });
    expect(homeLink).toHaveAttribute("href", "/");
    expect(userEvent.click(homeLink)).toBe(true);
  });
});
