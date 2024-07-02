import { describe, expect, it } from "vitest";
import { chunkBy } from "./utils";

describe("Utils test", () => {
  it("should chunk buffers", () => {
    const buffer = Buffer.alloc(11);
    const [first, last] = chunkBy(buffer, [5, 6]);

    expect(first.length).toEqual(5);
    expect(last.length).toEqual(6);
  });
});
