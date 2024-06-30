import { describe, expect, it } from "vitest";
import { chunkBy, uniq } from "./utils";

describe("Utils test", () => {
  it("should chunk buffers", () => {
    const buffer = Buffer.alloc(11);
    const [first, last] = chunkBy(buffer, [5, 6]);

    expect(first.length).toEqual(5);
    expect(last.length).toEqual(6);
  });

  it("should return a duplicate free array", () => {
    const array = ["a", "b", "a", "c", "c", "a", "d", "a"];
    expect(uniq(array)).toEqual(["a", "b", "c", "d"]);
  });
});
