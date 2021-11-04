import bip32Path from "bip32-path";

export const MIN_UINT_64_STR = "0";
export const MAX_UINT_64_STR = "18446744073709551615";

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

export const isString = (data: unknown) => typeof data === "string";

export const isInteger = (data: unknown) => Number.isInteger(data);

export const isArray = (data: unknown) => Array.isArray(data);

export const isBuffer = (data: unknown) => Buffer.isBuffer(data);

export function isUint64String(data: string): boolean {
  return (
    isString(data) &&
    /^[0-9]*$/.test(data) &&
    // Length checks
    data.length > 0 &&
    data.length <= MAX_UINT_64_STR.length &&
    // Leading zeros
    (data.length === 1 || data[0] !== "0") &&
    // less or equal than max value
    // Note: this is string comparison!
    (data.length < MAX_UINT_64_STR.length || data <= MAX_UINT_64_STR) &&
    // Note: this is string comparison!
    (data.length > MIN_UINT_64_STR.length || data >= MIN_UINT_64_STR)
  );
}
