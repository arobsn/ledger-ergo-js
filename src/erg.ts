import type Transport from "@ledgerhq/hw-transport";
import Device from "./interactions/common/device";
import {
  getAppName,
  getExtendedPublicKey,
  getAppVersion,
  deriveAddress,
  showAddress,
} from "./interactions";
import { AppName, DerivedAddress, ExtendedPublicKey, Version } from "./types/public";

export * from "./errors";
export * from "./types/public";
export const CLA = 0xe0;

/**
 * Ergo's Ledger hardware wallet API
 */
export default class ErgoApp {
  private _device: Device;
  private _authToken: number;

  constructor(transport: Transport, authToken = 0, scrambleKey = "ERG") {
    const methods = [
      "getAppVersion",
      "getSerial",
      "getAppName",
      "getExtendedPublicKey",
      "deriveAddress",
      "showAddress",
    ];
    transport.decorateAppAPIMethods(this, methods, scrambleKey);

    this._device = new Device(transport, CLA);
    this._authToken = authToken;
    if (this._authToken == 0) {
      this.newAuthToken();
    }
  }

  private newAuthToken(): void {
    let newToken = 0;
    do {
      newToken = Math.floor(Math.random() * 0xffffffff) + 1;
    } while (newToken === this._authToken);

    this._authToken = newToken;
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
   * @returns a Promise with the **chain code** and the **public key** for provided BIP32 path.
   */
  public async getExtendedPublicKey(
    path: string,
    useAuthToken: boolean = false
  ): Promise<ExtendedPublicKey> {
    return getExtendedPublicKey(this._device, path, useAuthToken ? this._authToken : undefined);
  }

  /**
   * Derive the address for a given Bip44 path.
   * @param path Bip44 path.
   * @returns a Promise with the derived address in hex format.
   */
  public async deriveAddress(path: string, useAuthToken: boolean = false): Promise<DerivedAddress> {
    return deriveAddress(this._device, path, useAuthToken ? this._authToken : undefined);
  }

  /**
   * Derive and show the address on device screen for a given Bip44 path.
   * @param path Bip44 path.
   * @returns a Promise with true if the user accepts or throws an exception if it get rejected.
   */
  public async showAddress(path: string, useAuthToken: boolean = false): Promise<boolean> {
    return showAddress(this._device, path, useAuthToken ? this._authToken : undefined);
  }

  /**
   * Close device transport.
   * @return a Promise that end when the transport is closed.
   */
  public closeTransport(): Promise<void> {
    return this._device.Transport.close();
  }
}
