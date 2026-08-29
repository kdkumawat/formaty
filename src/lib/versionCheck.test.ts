import { describe, expect, it } from "vitest";
import { shouldShowUpdate } from "./versionCheck";

describe("shouldShowUpdate", () => {
  it("hides when baked id is empty (dev)", () => {
    expect(shouldShowUpdate("", "remote-1", null)).toEqual({ show: false, remote: "remote-1" });
  });

  it("hides when remote fetch failed", () => {
    expect(shouldShowUpdate("baked", null, null)).toEqual({ show: false, remote: null });
  });

  it("hides when remote matches baked", () => {
    expect(shouldShowUpdate("baked", "baked", null)).toEqual({ show: false, remote: "baked" });
  });

  it("shows when remote differs and nothing dismissed", () => {
    expect(shouldShowUpdate("baked", "remote-2", null)).toEqual({ show: true, remote: "remote-2" });
  });

  it("hides when the user already dismissed this exact remote", () => {
    expect(shouldShowUpdate("baked", "remote-2", "remote-2")).toEqual({
      show: false,
      remote: "remote-2",
    });
  });

  it("shows when remote is newer than the dismissed id", () => {
    expect(shouldShowUpdate("baked", "remote-3", "remote-2")).toEqual({
      show: true,
      remote: "remote-3",
    });
  });
});
