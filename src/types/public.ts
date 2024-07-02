/**
 * Device app flags
 */
export type Flags = {
  isDebug: boolean;
};

/**
 * Device app version
 */
export type Version = {
  major: number;
  minor: number;
  patch: number;
  flags: Flags;
};

/**
 * Device app name
 */
export type AppName = {
  name: string;
};

/**
 * Extended public key in hex format
 */
export type ExtendedPublicKey = {
  publicKey: string;
  chainCode: string;
};

/**
 * Response to [[ErgoApp.deriveAddress]] call in hex format
 */
export type DerivedAddress = {
  addressHex: string;
};

export type Token = {
  id: string;
  amount: string;
};

export type UnsignedBox = {
  txId: string;
  index: number;
  value: string;
  ergoTree: Buffer;
  creationHeight: number;
  tokens: Token[];
  additionalRegisters: Buffer;
  extension: Buffer;
  signPath: string;
};

export type BoxCandidate = {
  value: string;
  ergoTree: Buffer;
  creationHeight: number;
  tokens: Token[];
  registers: Buffer;
};

export type AttestedBoxFrame = {
  boxId: string;
  count: number;
  index: number;
  amount: string;
  tokens: Token[];
  attestation: string;
  extensionLength?: number;
  bytes: Buffer;
};

export type UnsignedTransaction = {
  inputs: UnsignedBox[];
  dataInputs: string[];
  outputs: BoxCandidate[];
  distinctTokenIds: Uint8Array[];
  changeMap: ChangeMap;
};

export type ChangeMap = {
  address: string;
  path: string;
};
