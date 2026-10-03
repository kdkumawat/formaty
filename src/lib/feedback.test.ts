import { describe, expect, it } from "vitest";
import {
  adminErrorMessage,
  buildFeedbackQuery,
  buildFeedbackFilename,
  bulkDeleteFeedback,
  categoryLabel,
  countByStatus,
  deleteFeedbackItem,
  filterFeedbackItems,
  formatFeedbackBullets,
  formatFeedbackCsv,
  statusLabel,
  timeAgo,
  toAdminError,
  updateFeedbackStatus,
  type FeedbackItem,
} from "./feedback";

function item(overrides: Partial<FeedbackItem> = {}): FeedbackItem {
  return {
    id: "a",
    message: "hello world",
    category: "suggestion",
    status: "new",
    created_at: 1_700_000_000,
    updated_at: 1_700_000_000,
    ...overrides,
  };
}

describe("toAdminError", () => {
  it("maps null to network", () => {
    expect(toAdminError(null)).toBe("network");
  });
  it("maps 401/403 to unauthorized", () => {
    expect(toAdminError(401)).toBe("unauthorized");
    expect(toAdminError(403)).toBe("unauthorized");
  });
  it("maps other statuses to server", () => {
    expect(toAdminError(500)).toBe("server");
    expect(toAdminError(429)).toBe("server");
    expect(toAdminError(404)).toBe("server");
  });
});

describe("adminErrorMessage", () => {
  it("returns a distinct message per error kind", () => {
    const messages = new Set([
      adminErrorMessage("not-configured"),
      adminErrorMessage("unauthorized"),
      adminErrorMessage("network"),
      adminErrorMessage("server", 500),
    ]);
    expect(messages.size).toBe(4);
  });
  it("mentions the token for unauthorized", () => {
    expect(adminErrorMessage("unauthorized").toLowerCase()).toContain("token");
  });
});

describe("buildFeedbackQuery", () => {
  it("defaults to limit 500 and offset 0", () => {
    const q = new URLSearchParams(buildFeedbackQuery());
    expect(q.get("limit")).toBe("500");
    expect(q.get("offset")).toBe("0");
    expect(q.get("status")).toBeNull();
  });
  it("encodes status, limit and offset", () => {
    const q = new URLSearchParams(
      buildFeedbackQuery({ status: "in_progress", limit: 1, offset: 40 }),
    );
    expect(q.get("status")).toBe("in_progress");
    expect(q.get("limit")).toBe("1");
    expect(q.get("offset")).toBe("40");
  });
});

describe("categoryLabel / statusLabel", () => {
  it("labels known ids", () => {
    expect(categoryLabel("bug")).toBe("Bug");
    expect(statusLabel("in_progress")).toBe("In progress");
  });
  it("falls back for unknown ids", () => {
    expect(categoryLabel(undefined)).toBe("Other");
    expect(categoryLabel("nope" as never)).toBe("Other");
    expect(statusLabel("nope" as never)).toBe("nope");
  });
});

describe("timeAgo", () => {
  const now = 1_700_000_000_000;
  it("handles just-now, minutes, hours, days", () => {
    expect(timeAgo(1_700_000_000, now)).toBe("just now");
    expect(timeAgo(1_699_999_700, now)).toBe("5m ago");
    expect(timeAgo(1_699_992_800, now)).toBe("2h ago");
    expect(timeAgo(1_699_740_800, now)).toBe("3d ago");
  });
  it("clamps future timestamps to just now", () => {
    expect(timeAgo(1_700_000_100, now)).toBe("just now");
  });
});

describe("filterFeedbackItems", () => {
  const items = [
    item({ id: "1", status: "new", category: "bug", message: "Crash on paste", created_at: 100 }),
    item({ id: "2", status: "fixed", category: "suggestion", message: "Dark mode please", email: "a@x.com", created_at: 300 }),
    item({ id: "3", status: "new", category: "suggestion", message: "Export CSV support", page: "/playground", created_at: 200 }),
  ];
  const base = { status: "all" as const, query: "", category: "all" as const, sort: "newest" as const };

  it("sorts newest first by default", () => {
    expect(filterFeedbackItems(items, base).map((i) => i.id)).toEqual(["2", "3", "1"]);
  });
  it("sorts oldest first on request", () => {
    expect(filterFeedbackItems(items, { ...base, sort: "oldest" }).map((i) => i.id)).toEqual([
      "1",
      "3",
      "2",
    ]);
  });
  it("filters by status tab", () => {
    expect(filterFeedbackItems(items, { ...base, status: "new" }).map((i) => i.id)).toEqual([
      "3",
      "1",
    ]);
  });
  it("filters by category", () => {
    expect(filterFeedbackItems(items, { ...base, category: "bug" }).map((i) => i.id)).toEqual(["1"]);
  });
  it("searches message, email and page case-insensitively", () => {
    expect(filterFeedbackItems(items, { ...base, query: "dark" }).map((i) => i.id)).toEqual(["2"]);
    expect(filterFeedbackItems(items, { ...base, query: "A@X.COM" }).map((i) => i.id)).toEqual(["2"]);
    expect(filterFeedbackItems(items, { ...base, query: "playground" }).map((i) => i.id)).toEqual(["3"]);
  });
  it("requires every token to match (AND semantics)", () => {
    expect(filterFeedbackItems(items, { ...base, query: "export playground" }).map((i) => i.id)).toEqual(["3"]);
    expect(filterFeedbackItems(items, { ...base, query: "export dark" })).toEqual([]);
  });
  it("does not mutate the input array", () => {
    const ids = items.map((i) => i.id);
    filterFeedbackItems(items, base);
    expect(items.map((i) => i.id)).toEqual(ids);
  });
});

describe("countByStatus", () => {
  it("counts every status plus the total", () => {
    const counts = countByStatus([
      item({ status: "new" }),
      item({ status: "new" }),
      item({ status: "fixed" }),
    ]);
    expect(counts).toEqual({ all: 3, new: 2, in_progress: 0, fixed: 1, ignored: 0 });
  });
});

describe("formatFeedbackBullets", () => {
  it("renders compact bullets with lowercase category and meta", () => {
    const text = formatFeedbackBullets([
      item({ message: "Fix it", category: "bug", email: "a@x.com", page: "/json" }),
    ]);
    expect(text).toBe("- [bug] Fix it (page: /json, email: a@x.com, status: New)");
  });
  it("omits missing meta but keeps status", () => {
    expect(formatFeedbackBullets([item({ message: "Nice" })])).toBe(
      "- [suggestion] Nice (status: New)",
    );
  });
});

describe("formatFeedbackCsv", () => {
  it("emits a header plus one row per item", () => {
    const csv = formatFeedbackCsv([item({ id: "1", message: "hi" })]);
    const lines = csv.split("\n");
    expect(lines[0]).toBe("id,category,status,message,email,page,browser,created_at,updated_at");
    expect(lines).toHaveLength(2);
    expect(lines[1]).toContain("1,suggestion,new,hi");
  });
  it("escapes commas, quotes and newlines", () => {
    const csv = formatFeedbackCsv([
      item({ message: 'a "quoted", comma\nnewline' }),
    ]);
    expect(csv).toContain('"a ""quoted"", comma\nnewline"');
  });
});

describe("buildFeedbackFilename", () => {
  it("builds a dated filename", () => {
    expect(buildFeedbackFilename("new", "csv", new Date("2026-03-04T00:00:00Z"))).toBe(
      "feedback-new-2026-03-04.csv",
    );
    expect(buildFeedbackFilename("all", "json", new Date("2026-03-04T00:00:00Z"))).toBe(
      "feedback-all-2026-03-04.json",
    );
  });
});

describe("unconfigured API degrades without network", () => {
  // FORMATY_API_URL is unset in the test env, so every call must short-circuit.
  it("fetch/update/delete report not-configured", async () => {
    const { fetchFeedback } = await import("./feedback");
    expect(await fetchFeedback("tok")).toEqual({ ok: false, error: "not-configured" });
    expect(await updateFeedbackStatus("tok", "id", "fixed")).toEqual({
      ok: false,
      error: "not-configured",
    });
    expect(await deleteFeedbackItem("tok", "id")).toEqual({
      ok: false,
      error: "not-configured",
    });
  });
  it("bulk delete reports per-id failures without network", async () => {
    const res = await bulkDeleteFeedback("tok", ["a", "b"]);
    expect(res.succeeded).toEqual([]);
    expect(res.failed.map((f) => f.id).sort()).toEqual(["a", "b"]);
  });
});
