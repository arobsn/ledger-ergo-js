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
  ergoTree: Uint8Array;
  creationHeight: number;
  tokens: Token[];
  additionalRegisters: Uint8Array;
  extension: Uint8Array;
  signPath: string;
};

export type BoxCandidate = {
  value: string;
  ergoTree: Uint8Array;
  creationHeight: number;
  tokens: Token[];
  registers: Uint8Array;
};

export type AttestedBoxFrame = {
  boxId: string;
  count: number;
  index: number;
  amount: string;
  tokens: Token[];
  attestation: string;
  extensionLength?: number;
  bytes: Uint8Array;
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
