import { assert, isArray, isBuffer, isInteger } from "../assertions";

const sum = (arr: Array<number>) => arr.reduce((x, y) => x + y, 0);

export function uniq<T>(array: T[]): T[] {
  return [...new Set(array)];
}

export function chunkBy(data: Buffer, chunkLengths: Array<number>) {
  assert(isBuffer(data), "invalid buffer");
  assert(isArray(chunkLengths), "invalid chunks");
  for (const len of chunkLengths) {
    assert(isInteger(len), "bad chunk length");
    assert(len > 0, "bad chunk length");
  }
  assert(data.length <= sum(chunkLengths), "data too short");

  let offset = 0;
  const result = [];
  const restLength = data.length - sum(chunkLengths);

  for (let c of [...chunkLengths, restLength]) {
    result.push(data.slice(offset, offset + c));

    offset += c;
  }

  return result;
}
