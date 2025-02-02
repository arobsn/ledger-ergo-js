import bip32Path from "bip32-path";

export const EMPTY_BYTES = Uint8Array.from([]);
export const NO_VALUE = 0x00;
const [ERGO_PURPOSE, ERGO_COIN_TYPE] = bip32Path.fromString("m/44'/429'").toPathArray();

export function pathToArray(path: string): number[] {
  return bip32Path.fromString(path).toPathArray();
}

export function isErgoPath(path: number[]): boolean {
  if (path.length < 2) return false;
  const [pathPurpose, pathCoinType] = path;
  return pathPurpose === ERGO_PURPOSE && pathCoinType === ERGO_COIN_TYPE;
}

export const asciiCodec = {
  encode: (str: string): Uint8Array => {
    const bytes = new Uint8Array(str.length);
    for (let i = 0; i < str.length; i++) {
      bytes[i] = str.charCodeAt(i);
    }

    return bytes;
  },
  decode: (bytes: Uint8Array): string => String.fromCharCode(...bytes)
};
