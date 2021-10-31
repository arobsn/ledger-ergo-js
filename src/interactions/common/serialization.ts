import bip32Path from "bip32-path";

export function serializeBip32Path(path: string): Buffer {
  const paths = !path ? [] : bip32Path.fromString(path).toPathArray();
  const buffer = Buffer.alloc(1 + paths.length * 4);
  buffer[0] = paths.length;
  paths.forEach((element: any, index: number) => {
    buffer.writeUInt32BE(element, 1 + 4 * index);
  });

  return buffer;
}

export function serializeAuthToken(token: number): Buffer {
  const buffer = Buffer.alloc(4);
  buffer.writeUInt32BE(token, 0);

  return buffer;
}
