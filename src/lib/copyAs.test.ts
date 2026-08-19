import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import {
  formatListCopyAsText,
  listCopyFormatLabel,
  loadListCopyPref,
  saveListCopyPref,
  type QuoteStyle,
  type LayoutStyle,
} from "./copyAs";

const SAMPLE_ITEMS = ["1001", "1002", "1003"];

describe("formatListCopyAsText", () => {
  it("None + Each line", () => {
    expect(formatListCopyAsText(SAMPLE_ITEMS, "none", "each-line")).toBe("1001\n1002\n1003");
  });

  it("None + Same line", () => {
    expect(formatListCopyAsText(SAMPLE_ITEMS, "none", "same-line")).toBe("1001, 1002, 1003");
  });

  it("Single + Same line", () => {
    expect(formatListCopyAsText(SAMPLE_ITEMS, "single", "same-line")).toBe("'1001', '1002', '1003'");
  });

  it("Single + Each line", () => {
    expect(formatListCopyAsText(SAMPLE_ITEMS, "single", "each-line")).toBe("'1001'\n'1002'\n'1003'");
  });

  it("Double + Same line", () => {
    expect(formatListCopyAsText(SAMPLE_ITEMS, "double", "same-line")).toBe('"1001", "1002", "1003"');
  });

  it("Double + Each line", () => {
    expect(formatListCopyAsText(SAMPLE_ITEMS, "double", "each-line")).toBe('"1001"\n"1002"\n"1003"');
  });

  it("None + Each line with trailing comma suffix", () => {
    expect(formatListCopyAsText(SAMPLE_ITEMS, "none", "each-line", ",")).toBe("1001,\n1002,\n1003,");
  });

  it("Single + Each line with suffix", () => {
    expect(formatListCopyAsText(SAMPLE_ITEMS, "single", "each-line", ",")).toBe("'1001',\n'1002',\n'1003',");
  });

  it("escapes single quotes in values", () => {
    const items = ["it's", "he said \"hi\""];
    expect(formatListCopyAsText(items, "single", "each-line")).toBe("'it\\'s'\n'he said \"hi\"'");
  });

  it("escapes double quotes in values", () => {
    const items = ['say "hello"'];
    expect(formatListCopyAsText(items, "double", "same-line")).toBe('"say \\"hello\\""');
  });

  it("returns empty string for empty list", () => {
    expect(formatListCopyAsText([], "none", "each-line")).toBe("");
  });

  it("handles single item with suffix", () => {
    expect(formatListCopyAsText(["only"], "none", "each-line", ",")).toBe("only,");
  });
});

describe("listCopyFormatLabel", () => {
  it("returns compact label", () => {
    expect(listCopyFormatLabel("none", "each-line")).toContain("Each line");
    expect(listCopyFormatLabel("single", "same-line")).toContain("Single");
  });
});

describe("per-mode persistence", () => {
  const store: Record<string, string> = {};
  const mockStorage = {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => { store[k] = v; },
    removeItem: (k: string) => { delete store[k]; },
    clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
    get length() { return Object.keys(store).length; },
    key: (i: number) => Object.keys(store)[i] ?? null,
  };

  beforeAll(() => {
    Object.defineProperty(globalThis, "localStorage", { value: mockStorage, writable: true });
  });

  beforeEach(() => {
    mockStorage.clear();
  });

  it("defaults to as-seen when nothing stored", () => {
    const pref = loadListCopyPref("compare-list");
    expect(pref).toBe("as-seen");
  });

  it("saves and loads object preference", () => {
    saveListCopyPref("uuid", { quote: "double", layout: "same-line" });
    const loaded = loadListCopyPref("uuid");
    expect(loaded).not.toBe("as-seen");
    if (loaded !== "as-seen") {
      expect(loaded.quote).toBe("double");
      expect(loaded.layout).toBe("same-line");
    }
  });

  it("saves and loads as-seen preference", () => {
    saveListCopyPref("uuid", "as-seen");
    const loaded = loadListCopyPref("uuid");
    expect(loaded).toBe("as-seen");
  });

  it("different modes have independent preferences", () => {
    saveListCopyPref("uuid", { quote: "single", layout: "each-line" });
    saveListCopyPref("password", "as-seen");
    const uuidPref = loadListCopyPref("uuid");
    const pwPref = loadListCopyPref("password");
    expect(uuidPref).not.toBe("as-seen");
    expect(pwPref).toBe("as-seen");
  });

  it("preserves suffix in persistence", () => {
    saveListCopyPref("test", { quote: "none", layout: "each-line", suffix: "," });
    const loaded = loadListCopyPref("test");
    expect(loaded).not.toBe("as-seen");
    if (loaded !== "as-seen") {
      expect(loaded.suffix).toBe(",");
    }
  });
});
