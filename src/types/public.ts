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
  publicKeyHex: string;
  chainCodeHex: string;
};

/**
 * Response to [[Ada.deriveAddress]] call in hex format
 */
export type DerivedAddress = {
  addressHex: string;
};
