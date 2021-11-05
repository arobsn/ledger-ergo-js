import bip32Path from "bip32-path";
import basex from "base-x";
import { assert } from "../../validations/assert";
import { isUint64String, isValidBip32Path } from "../../validations/parse";

const bs10 = basex("0123456789");

export function serializeBip32Path(path: number[]): Buffer {
  const buffer = Buffer.alloc(1 + path.length * 4);
  buffer[0] = path.length;
  path.forEach((element: any, index: number) => {
    buffer.writeUInt32BE(element, 1 + 4 * index);
  });

  return buffer;
}

export function serializeAuthToken(token: number): Buffer {
  const buffer = Buffer.alloc(4);
  buffer.writeUInt32BE(token, 0);

  return buffer;
}

export function pathStringToArray(path: string): number[] {
  assert(isValidBip32Path(path), "Invalid Bip32 path.");
  return bip32Path.fromString(path).toPathArray();
}

export function uint64StringToBuffer(value: string): Buffer {
  assert(isUint64String(value), "invalid uint64_str");
  const data = bs10.decode(value);
  assert(data.length <= 8, "excessive data");

  const padding = Buffer.alloc(8 - data.length);
  return Buffer.concat([padding, data]);
}
