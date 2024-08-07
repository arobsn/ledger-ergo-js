import bip32Path from "bip32-path";

export const EMPTY_BYTES = Uint8Array.from([]);
const [ERGO_PURPOSE, ERGO_COIN_TYPE] = bip32Path.fromString("m/44'/429'").toPathArray();

export function pathToArray(path: string): number[] {
  return bip32Path.fromString(path).toPathArray();
}

export function isErgoPath(path: number[]): boolean {
  if (path.length < 2) return false;
  const [pathPurpose, pathCoinType] = path;
  return pathPurpose === ERGO_PURPOSE && pathCoinType === ERGO_COIN_TYPE;
}
