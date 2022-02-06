import type Transport from "@ledgerhq/hw-transport";
import Device from "./interactions/common/device";
import {
  AppName,
  UnsignedBox,
  DerivedAddress,
  ExtendedPublicKey,
  Version,
  UnsignedTx,
} from "./types/public";
import { assert, isValidErgoPath } from "./validations";
import AttestedBox from "./models/attestedBox";
import {
  getAppName,
  getExtendedPublicKey,
  getAppVersion,
  deriveAddress,
  showAddress,
  attestInput,
  signTx,
} from "./interactions";
import Serialize from "./serialization/serialize";

export * from "./errors";
export * from "./types/public";
export const CLA = 0xe0;

const CHANGE_PATH_INDEX = 3;

/**
 * Ergo's Ledger hardware wallet API
 */
export class ErgoApp {
  private _device: Device;
  private _authToken: number;

  public get authToken(): number {
    return this._authToken;
  }

  public get transport(): Transport {
    return this._device.transport;
  }

  constructor(transaport: Transport);
  constructor(transport: Transport, authToken: number);
  constructor(transport: Transport, authToken?: number, scrambleKey = "ERG") {
    transport.decorateAppAPIMethods(
      this,
      [
        "getAppVersion",
        "getAppName",
        "getExtendedPublicKey",
        "deriveAddress",
        "showAddress",
        "attestInput",
        "signTx",
      ],
      scrambleKey
    );

    this._device = new Device(transport, CLA);
    this._authToken = !authToken ? this.newAuthToken() : authToken;
  }

  private newAuthToken(): number {
    let newToken = 0;
    do {
      newToken = Math.floor(Math.random() * 0xffffffff) + 1;
    } while (newToken === this._authToken);

    return newToken;
  }

  /**
   * Get application version.
   * @returns a Promise with the Ledger Application version.
   */
  public async getAppVersion(): Promise<Version> {
    return getAppVersion(this._device);
  }

  /**
   * Get application name.
   * @returns a Promise with the Ledger Application name.
   */
  public async getAppName(): Promise<AppName> {
    return getAppName(this._device);
  }

  /**
   * Get the extended public key.
   * @param path BIP32 path.
   * @param useAuthToken use an authorization token to keep session opened.
   * @returns a Promise with the **chain code** and the **public key** for provided BIP32 path.
   */
  public async getExtendedPublicKey(
    path: string,
    useAuthToken: boolean = false
  ): Promise<ExtendedPublicKey> {
    const pathArray = Serialize.bip32PathAsArray(path);
    assert(isValidErgoPath(pathArray), "Invalid Ergo path.");

    return getExtendedPublicKey(this._device, pathArray, this.getAuthToken(useAuthToken));
  }

  /**
   * Derive the address for a given Bip44 path.
   * @param path Bip44 path.
   * @param useAuthToken use an authorization token to keep session opened.
   * @returns a Promise with the derived address in hex format.
   */
  public async deriveAddress(path: string, useAuthToken = false): Promise<DerivedAddress> {
    const pathArray = this.getDerivationPathArray(path);
    return deriveAddress(this._device, pathArray, this.getAuthToken(useAuthToken));
  }

  /**
   * Derive and show the address on device screen for a given Bip44 path.
   * @param path Bip44 path.
   * @param useAuthToken use an authorization token to keep session opened.
   * @returns a Promise with true if the user accepts or throws an exception if it get rejected.
   */
  public async showAddress(path: string, useAuthToken = false): Promise<boolean> {
    const pathArray = this.getDerivationPathArray(path);
    return showAddress(this._device, pathArray, this.getAuthToken(useAuthToken));
  }

  private getDerivationPathArray(path: string) {
    const pathArray = Serialize.bip32PathAsArray(path);
    assert(isValidErgoPath(pathArray), "Invalid Ergo path.");
    assert(pathArray.length >= 5, "Invalid path lenght.");
    assert(pathArray[CHANGE_PATH_INDEX] in [0, 1], "Invalid change path value.");

    return pathArray;
  }

  public async attestInput(box: UnsignedBox, useAuthToken = false): Promise<AttestedBox> {
    return attestInput(this._device, box, this.getAuthToken(useAuthToken));
  }

  public async signTx(tx: UnsignedTx, useAuthToken = false) {
    return signTx(this._device, tx, this.getAuthToken(useAuthToken));
  }

  private getAuthToken(useAuthToken: boolean): number | undefined {
    return useAuthToken ? this._authToken : undefined;
  }
}
