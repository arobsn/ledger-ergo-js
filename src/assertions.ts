import bip32Path from "bip32-path";

const MIN_UINT_64_STR = "0";
const MAX_UINT_64_STR = "18446744073709551615";
const MIN_UINT_VALUE = 0;
const MAX_UINT32_VALUE = 4294967295;
const MAX_UINT16_VALUE = 65535;
const MAX_UNIT8_VALUE = 255;

const [ERGO_PURPOSE, ERGO_COIN_TYPE] = bip32Path.fromString("m/44'/429'").toPathArray();

export function assert(cond: boolean, errMsg: string): asserts cond {
  if (!cond) {
    throw new Error(`Assertion failed${errMsg ? `: ${errMsg}` : "."}`);
  }
}

export function isValidBip32Path(path: number[] | string): boolean {
  if (typeof path === "string") {
    return bip32Path.validateString(path, true);
  }

  return bip32Path.validatePathArray(path, true);
}

export function isValidErgoPath(path: number[]): boolean {
  if (path.length < 2) return false;
  const [pathPurpose, pathCoinType] = path;
  return pathPurpose === ERGO_PURPOSE && pathCoinType === ERGO_COIN_TYPE;
}

export function isInteger(data: unknown): boolean {
  return Number.isInteger(data);
}

export function isArray(data: unknown): boolean {
  return Array.isArray(data);
}

export function isBuffer(data: unknown): boolean {
  return Buffer.isBuffer(data);
}

export function isUint32(data: unknown): boolean {
  return (
    typeof data === "number" &&
    isInteger(data) &&
    data >= MIN_UINT_VALUE &&
    data <= MAX_UINT32_VALUE
  );
}

export function isUint16(data: number): boolean {
  return (
    typeof data === "number" &&
    isInteger(data) &&
    data >= MIN_UINT_VALUE &&
    data <= MAX_UINT16_VALUE
  );
}

export function isUint8(data: unknown): boolean {
  return (
    typeof data === "number" &&
    isInteger(data) &&
    data >= MIN_UINT_VALUE &&
    data <= MAX_UNIT8_VALUE
  );
}

export function isUint64String(data: string): boolean {
  return (
    typeof data === "string" &&
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
