import bip32Path from "bip32-path";

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
  return bip32Path.fromString(path).toPathArray();
}
