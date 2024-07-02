import { assert } from "@fleet-sdk/common";
import base from "base-x";

export const base10 = base("0123456789");

const sum = (arr: number[]) => arr.reduce((x, y) => x + y, 0);

export function chunkBy(data: Uint8Array, chunkLengths: number[]) {
  assert(data.length >= sum(chunkLengths), "data is too small");

  let offset = 0;
  const result = [];
  const restLength = data.length - sum(chunkLengths);

  for (const length of [...chunkLengths, restLength]) {
    assert(length >= 0, `bad chunk length: ${length}`);
    result.push(data.subarray(offset, offset + length));
    offset += length;
  }

  return result;
}
