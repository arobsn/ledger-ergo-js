import bip32Path from "bip32-path";
import { assert } from "../../validations/assert";
import { isValidBip32Path } from "../../validations/parse";

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
