import bip32Path from "bip32-path";

const MIN_UINT_64 = 0n;
const MAX_UINT_64 = 18446744073709551615n;
const MIN_UINT_VALUE = 0;
const MAX_UINT32_VALUE = 4294967295;
const MAX_UINT16_VALUE = 65535;
const MAX_UNIT8_VALUE = 255;

const [ERGO_PURPOSE, ERGO_COIN_TYPE] = bip32Path.fromString("m/44'/429'").toPathArray();

export function isErgoPath(path: number[]): boolean {
  if (path.length < 2) return false;
  const [pathPurpose, pathCoinType] = path;
  return pathPurpose === ERGO_PURPOSE && pathCoinType === ERGO_COIN_TYPE;
}

export function isUint32(data: number): boolean {
  return Number.isInteger(data) && data >= MIN_UINT_VALUE && data <= MAX_UINT32_VALUE;
}

export function isUint16(data: number): boolean {
  return Number.isInteger(data) && data >= MIN_UINT_VALUE && data <= MAX_UINT16_VALUE;
}

export function isUint8(data: number): boolean {
  return Number.isInteger(data) && data >= MIN_UINT_VALUE && data <= MAX_UNIT8_VALUE;
}

export function isUint64String(value: string): boolean {
  if (!/^[0-9]*$/.test(value)) return false;
  const parsed = BigInt(value);
  return parsed >= MIN_UINT_64 && parsed <= MAX_UINT_64;
}
