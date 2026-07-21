// src/store/activity-ui-store.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { useActivityUIStore } from "./activity-ui-store";

describe("activity-ui-store (live)", () => {
  beforeEach(() => {
    useActivityUIStore.setState({ pendingSelectId: null });
  });

  it("defaults pendingSelectId to null", () => {
    expect(useActivityUIStore.getState().pendingSelectId).toBeNull();
  });

  it("setPendingSelectId stores the id", () => {
    useActivityUIStore.getState().setPendingSelectId("job-123");
    expect(useActivityUIStore.getState().pendingSelectId).toBe("job-123");
  });

  it("setPendingSelectId(null) clears a previously set id", () => {
    useActivityUIStore.getState().setPendingSelectId("job-123");
    useActivityUIStore.getState().setPendingSelectId(null);
    expect(useActivityUIStore.getState().pendingSelectId).toBeNull();
  });
});
