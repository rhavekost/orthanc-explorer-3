import { describe, it, expect, beforeEach } from "vitest";
import { useActivityUIStore } from "./activity-ui-store";

describe("activity-ui-store", () => {
  beforeEach(() => {
    useActivityUIStore.setState({ pendingSelectId: null });
  });

  it("defaults pendingSelectId to null", () => {
    expect(useActivityUIStore.getState().pendingSelectId).toBeNull();
  });

  it("sets pendingSelectId to a job id", () => {
    useActivityUIStore.getState().setPendingSelectId("job-123");
    expect(useActivityUIStore.getState().pendingSelectId).toBe("job-123");
  });

  it("clears pendingSelectId back to null", () => {
    useActivityUIStore.getState().setPendingSelectId("job-123");
    useActivityUIStore.getState().setPendingSelectId(null);
    expect(useActivityUIStore.getState().pendingSelectId).toBeNull();
  });
});
