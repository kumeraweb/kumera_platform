import { describe, expect, it } from "vitest";
import {
  calculateNextPaymentDate,
  hasReachedGraceLimit,
  isOverdue,
  isTokenExpired,
} from "./billing";

describe("billing rules", () => {
  it("keeps same day for dates 1-27", () => {
    const date = new Date(Date.UTC(2026, 0, 13, 12, 0, 0));
    const next = calculateNextPaymentDate(date);
    expect(next.toISOString()).toBe("2026-02-13T12:00:00.000Z");
  });

  it("rounds to day 1 for dates >= 28", () => {
    const date = new Date(Date.UTC(2026, 0, 30, 12, 0, 0));
    const next = calculateNextPaymentDate(date);
    expect(next.toISOString()).toBe("2026-03-01T12:00:00.000Z");
  });

  it("marks overdue and grace correctly", () => {
    const dueDate = new Date(Date.UTC(2026, 0, 1, 12, 0, 0));
    const now = new Date(Date.UTC(2026, 0, 9, 12, 0, 0));

    expect(isOverdue(now, dueDate)).toBe(true);
    expect(hasReachedGraceLimit(now, dueDate, 7)).toBe(true);
  });

  it("token expiration uses strict greater-than", () => {
    const now = new Date(Date.UTC(2026, 0, 10, 12, 0, 0));
    expect(isTokenExpired(new Date(Date.UTC(2026, 0, 10, 12, 0, 0)), now)).toBe(false);
    expect(isTokenExpired(new Date(Date.UTC(2026, 0, 10, 11, 59, 59)), now)).toBe(true);
  });
});
