import type Transport from "@ledgerhq/hw-transport";
import Device from "./interactions/common/device";
import {
  AppName,
  UnsignedBox,
  DerivedAddress,
  ExtendedPublicKey,
  Version,
  UnsignedTx,
  Network
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
  signTx
} from "./interactions";
import Serialize from "./serialization/serialize";
import { AttestedTx, SignTxResponse } from "./types/internal";
import { uniq } from "./serialization/utils";

export * from "./errors";
export * from "./types/public";
export const CLA = 0xe0;

const CHANGE_PATH_INDEX = 3;

/**
 * Ergo's Ledger hardware wallet API
 */
export class ErgoLedgerApp {
  private _device: Device;
  private _authToken: number;
  private _useAuthToken: boolean;
  private _logging: boolean;

  public get authToken(): number | undefined {
    return this._useAuthToken ? this._authToken : undefined;
  }

  public get transport(): Transport {
    return this._device.transport;
  }

  constructor(transport: Transport);
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
        "signTx"
      ],
      scrambleKey
    );

    this._device = new Device(transport, CLA);
    this._authToken = !authToken ? this.newAuthToken() : authToken;
    this._useAuthToken = true;
    this._logging = false;
  }

  /**
   * Use authorization token to keep session opened.
   * @param use
   * @returns
   */
  public useAuthToken(use = true): ErgoLedgerApp {
    this._useAuthToken = use;
    return this;
  }

  /**
   * Enable or disable logging.
   * @param enable
   * @returns
   */
  public enableDebugMode(enable = true): ErgoLedgerApp {
    this._logging = enable;
    return this;
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
    this._debug("getAppVersion");
    return getAppVersion(this._device);
  }

  /**
   * Get application name.
   * @returns a Promise with the Ledger Application name.
   */
  public async getAppName(): Promise<AppName> {
    this._debug("getAppName");
    return getAppName(this._device);
  }

  /**
   * Get the extended public key.
   * @param path BIP32 path.
   * @returns a Promise with the **chain code** and the **public key** for provided BIP32 path.
   */
  public async getExtendedPublicKey(path: string): Promise<ExtendedPublicKey> {
    this._debug("getExtendedPublicKey", path);

    const pathArray = Serialize.bip32PathAsArray(path);
    assert(isValidErgoPath(pathArray), "Invalid Ergo path.");
    return getExtendedPublicKey(this._device, pathArray, this.authToken);
  }

  /**
   * Derive the address for a given Bip44 path.
   * @param path Bip44 path.
   * @returns a Promise with the derived address in hex format.
   */
  public async deriveAddress(path: string, network = Network.Mainnet): Promise<DerivedAddress> {
    this._debug("deriveAddress", path);

    const pathArray = this.getDerivationPathArray(path);
    return deriveAddress(this._device, network, pathArray, this.authToken);
  }

  /**
   * Derive and show the address on device screen for a given Bip44 path.
   * @param path Bip44 path.
   * @returns a Promise with true if the user accepts or throws an exception if it get rejected.
   */
  public async showAddress(path: string, network = Network.Mainnet): Promise<boolean> {
    this._debug("showAddress", path);

    const pathArray = this.getDerivationPathArray(path);
    return showAddress(this._device, network, pathArray, this.authToken);
  }

  private getDerivationPathArray(path: string) {
    const pathArray = Serialize.bip32PathAsArray(path);
    assert(isValidErgoPath(pathArray), "Invalid Ergo path.");
    assert(pathArray.length >= 5, "Invalid path length.");
    assert(pathArray[CHANGE_PATH_INDEX] in [0, 1], "Invalid change path value.");

    return pathArray;
  }

  public async attestInput(box: UnsignedBox): Promise<AttestedBox> {
    this._debug("attestInput", box);
    return this._attestInput(box);
  }

  private async _attestInput(box: UnsignedBox): Promise<AttestedBox> {
    return attestInput(this._device, box, this.authToken);
  }

  public async signTx(tx: UnsignedTx, network = Network.Mainnet): Promise<Uint8Array[]> {
    this._debug("signTx", { tx, network });

    const attestedInputs = await this._attestInputs(tx.inputs);
    const signPaths = uniq(tx.inputs.map((i) => i.signPath));
    const attestedTx: AttestedTx = {
      inputs: attestedInputs,
      dataInputs: tx.dataInputs,
      outputs: tx.outputs,
      distinctTokenIds: tx.distinctTokenIds,
      changeMap: tx.changeMap
    };

    const signatures: SignTxResponse = {};
    for (let path of signPaths) {
      signatures[path] = await signTx(this._device, attestedTx, path, network, this.authToken);
    }

    const signBytes: Uint8Array[] = [];
    for (let input of tx.inputs) {
      signBytes.push(signatures[input.signPath]);
    }

    return signBytes;
  }

  private async _attestInputs(inputs: UnsignedBox[]): Promise<AttestedBox[]> {
    const attestedBoxes: AttestedBox[] = [];
    for (const box of inputs) {
      const attestedBox = await this._attestInput(box);
      attestedBox.setExtension(box.extension);
      attestedBoxes.push(attestedBox);
    }

    return attestedBoxes;
  }

  private _debug(caller: string, message: any = "") {
    if (!this._logging) {
      return;
    }

    console.debug(
      `[ledger-ergo-js][${caller}]${message ? ": " : ""}${message ? JSON.stringify(message) : ""}`
    );
  }
}
