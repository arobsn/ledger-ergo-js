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

export type InputBox = {
  txId: string;
  index: number;
  value: string;
  ergoTree: Buffer;
  creationHeight: number;
  tokens: Token[];
  additionalRegisters: Buffer;
};

export type OutputBox = {
  value: string;
  ergoTree: Buffer;
  changePath?: string;
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
};

export type UnsignedTx = {
  inputs: AttestedBox[];
  dataInputBoxIds: string[];
  outputs: OutputBox[];
};

export type SignTxResponse = {
  signature: string;
};
