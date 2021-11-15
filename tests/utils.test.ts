import { chunkBy } from "../src/serialization/utils";

describe("Utils test", () => {
  it("should chunk buffers", () => {
    const buffer = Buffer.alloc(11);
    const [first, last] = chunkBy(buffer, [5, 6]);

    expect(first.length).toBe(5);
    expect(last.length).toBe(6);
  });
});
