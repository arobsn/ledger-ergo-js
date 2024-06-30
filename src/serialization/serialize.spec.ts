import { describe, expect, it } from "vitest";
import Serialize from "./serialize";

describe("serializations", () => {
  describe("serialize class", () => {
    it("should serialize and split", () => {
      const MAX_CHUNK_LENGTH = 3;
      const arr = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
      const chunks = Serialize.arrayAndChunk(arr, MAX_CHUNK_LENGTH, (n) =>
        Serialize.uint8(n)
      );

      expect(chunks).toHaveLength(4);
      expect(chunks[0]).toHaveLength(MAX_CHUNK_LENGTH);
      expect(chunks[1]).toHaveLength(MAX_CHUNK_LENGTH);
      expect(chunks[2]).toHaveLength(MAX_CHUNK_LENGTH);
      expect(chunks[3]).toHaveLength(1);

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        for (let j = 0; j < chunk.length; j++) {
          expect(chunk[j]).toBe(arr[j + i * 3]);
        }
      }
    });
  });
});
