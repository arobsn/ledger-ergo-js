import { Network, uniq } from "@fleet-sdk/common";
import type Transport from "@ledgerhq/hw-transport";
import { Device, DeviceError, RETURN_CODE } from "./device";
import {
  attestInput,
  deriveAddress,
  getAppName,
  getAppVersion,
  getExtendedPublicKey,
  showAddress,
  signTx
} from "./commands/app";
import type { AttestedBox } from "./types/attestedBox";
import type { AttestedTransaction, SignTransactionResponse } from "./types/internal";
import type {
  AppName,
  DerivedAddress,
  ExtendedPublicKey,
  UnsignedBox,
  UnsignedTransaction,
  Version
} from "./types/public";

export * from "./types/public";
export { DeviceError, Network, RETURN_CODE, Device };

/**
 * Ergo's Ledger hardware wallet API
 */
export class ErgoLedgerApp {
  #device: Device;
  #authToken: number;
  #useAuthToken: boolean;

  get authToken(): number | undefined {
    return this.#useAuthToken ? this.#authToken : undefined;
  }

  get device(): Device {
    return this.#device;
  }

  constructor(transport: Transport);
  constructor(transport: Transport, authToken: number);
  constructor(transport: Transport, authToken: number, scrambleKey: string);
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
        "openApp",
        "closeApp",
        "getCurrentAppInfo"
      ],
      scrambleKey
    );

    this.#device = new Device(transport);
    this.#authToken = !authToken ? this.#newAuthToken() : authToken;
    this.#useAuthToken = true;
  }

  /**
   * Use authorization token to keep session opened.
   * @param use
   * @returns
   */
  useAuthToken(use = true): ErgoLedgerApp {
    this.#useAuthToken = use;
    return this;
  }

  /**
   * Enable or disable logging.
   * @param enable
   * @returns
   */
  useLogging(enable = true): ErgoLedgerApp {
    this.#device.enableLogging(enable);
    return this;
  }

  #newAuthToken(): number {
    let newToken = 0;
    do {
      newToken = Math.floor(Math.random() * 0xffffffff) + 1;
    } while (newToken === this.#authToken);

    return newToken;
  }

  /**
   * Get application version.
   * @returns Promise with the Ledger Application version.
   */
  async getAppVersion(): Promise<Version> {
    return getAppVersion(this.#device);
  }

  /**
   * Get application name.
   * @returns Promise with the Ledger Application name.
   */
  async getAppName(): Promise<AppName> {
    return getAppName(this.#device);
  }

  /**
   * Get the extended public key.
   * @param path BIP32 path.
   * @returns a Promise with the **chain code** and the **public key** for provided BIP32 path.
   */
  async getExtendedPublicKey(path: string): Promise<ExtendedPublicKey> {
    return getExtendedPublicKey(this.#device, path, this.authToken);
  }

  /**
   * Derive the address for a given Bip44 path.
   * @param path Bip44 path.
   * @returns a Promise with the derived address in hex format.
   */
  async deriveAddress(path: string, network = Network.Mainnet): Promise<DerivedAddress> {
    return deriveAddress(this.#device, network, path, this.authToken);
  }

  /**
   * Derive and show the address on device screen for a given Bip44 path.
   * @param path Bip44 path.
   * @returns a Promise with true if the user accepts or throws an exception if it get rejected.
   */
  async showAddress(path: string, network = Network.Mainnet): Promise<boolean> {
    return showAddress(this.#device, network, path, this.authToken);
  }

  async attestInput(box: UnsignedBox): Promise<AttestedBox> {
    return this.#attestInput(box);
  }

  async #attestInput(box: UnsignedBox): Promise<AttestedBox> {
    return attestInput(this.#device, box, this.authToken);
  }

  async signTx(
    tx: UnsignedTransaction,
    network = Network.Mainnet
  ): Promise<Uint8Array[]> {
    if (!tx.inputs || tx.inputs.length === 0) {
      throw new DeviceError(RETURN_CODE.BAD_INPUT_COUNT);
    }

    const attestedInputs = await this.#attestInputs(tx.inputs);
    const signPaths = uniq(tx.inputs.map((i) => i.signPath));
    const attestedTx: AttestedTransaction = {
      inputs: attestedInputs,
      dataInputs: tx.dataInputs,
      outputs: tx.outputs,
      distinctTokenIds: tx.distinctTokenIds,
      changeMap: tx.changeMap
    };

    const signatures: SignTransactionResponse = {};
    for (const path of signPaths) {
      signatures[path] = await signTx(
        this.#device,
        attestedTx,
        path,
        network,
        this.authToken
      );
    }

    const signBytes: Uint8Array[] = [];
    for (const input of tx.inputs) signBytes.push(signatures[input.signPath]);

    return signBytes;
  }

  async #attestInputs(inputs: UnsignedBox[]): Promise<AttestedBox[]> {
    const attestedBoxes: AttestedBox[] = [];
    for (const box of inputs) {
      const attestedBox = await this.#attestInput(box);
      attestedBox.setExtension(box.extension);
      attestedBoxes.push(attestedBox);
    }

    return attestedBoxes;
  }
}
