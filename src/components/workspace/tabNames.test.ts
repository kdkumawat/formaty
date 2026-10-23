import { describe, expect, it } from "vitest";
import { numberDuplicates } from "./tabNames";

describe("numberDuplicates", () => {
  it("numbers by tab order by default", () => {
    expect(numberDuplicates(["A", "A", "B"])).toEqual(["A", "A 2", "B"]);
  });
  it("numbers by creation order so moving a tab keeps its name", () => {
    // tab with seq 2 dragged in front of seq 1
    expect(numberDuplicates(["A", "A"], [2, 1])).toEqual(["A 2", "A"]);
  });
});
