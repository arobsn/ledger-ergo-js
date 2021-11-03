import bip32Path from "bip32-path";

export function isValidBip32Path(path: number[] | string): boolean {
  if (typeof path == "string") {
    return bip32Path.validateString(path, true);
  }

  return bip32Path.validatePathArray(path, true);
}

export function isValidErgoPath(path: number[]): boolean {
  if (path.length < 2) {
    return false;
  }

  const [pathPurpose, pathCoinType] = path;
  const [ergoPurpose, ergoCoinType] = bip32Path.fromString("m/44'/429'").toPathArray();
  return pathPurpose === ergoPurpose && pathCoinType === ergoCoinType;
}
