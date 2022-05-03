import AttestedBox from "../models/attestedBox";

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
  framesCount: number;
  frameIndex: number;
  amount: string;
  tokens: Token[];
  attestation: string;
  extensionLength?: number;
  buffer: Buffer;
};

export type UnsignedTx = {
  inputs: UnsignedBox[];
  dataInputs: string[];
  outputs: BoxCandidate[];
  changeMap: ChangeMap;
  signPaths: string[];
};

export type AttestedTx = {
  inputs: AttestedBox[];
  dataInputs: string[];
  outputs: BoxCandidate[];
  changeMap: ChangeMap;
  signPaths: string[];
};

export type ChangeMap = {
  address: string;
  path: string;
};

export type SignTxResponse = {
  path: string;
  signature: string;
};

export enum Network {
  Mainnet = 0x01,
  Testnet = 0x02,
}
