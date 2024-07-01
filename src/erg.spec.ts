import { describe, it, expect } from "vitest";
import { ErgoLedgerApp } from "./erg";
import {
  openTransportReplayer,
  RecordStore
} from "@ledgerhq/hw-transport-mocker";

describe("Get app name and version", () => {
  it("should get app version", async () => {
    const transport = await openTransportReplayer(
      RecordStore.fromString(`
        => e001000000
        <= 000004019000
      `)
    );

    const app = new ErgoLedgerApp(transport);
    const version = await app.getAppVersion();

    expect(version).toEqual({
      flags: { isDebug: true },
      major: 0,
      minor: 0,
      patch: 4
    });
  });

  it("should get app name", async () => {
    const transport = await openTransportReplayer(
      RecordStore.fromString(`
        => e002000000
        <= 4572676f9000
      `)
    );

    const app = new ErgoLedgerApp(transport);
    const appName = await app.getAppName();

    expect(appName).toEqual({ name: "Ergo" });
  });
});

describe("public key management with auth token", () => {
  it("should get extended public key", async () => {
    const transport = await openTransportReplayer(
      RecordStore.fromString(`
        => e010020011038000002c800001ad800000007ee523ef
        <= 025381e95e132a4b7a6fc66844a81657a07da1ef5041eaefb7fce03f71c06a11a99cc4eb9abc8d3f55afeff7bcb8fe2d0a8d100fa35f6fcbac74deded867633eba9000
      `)
    );

    const authToken = Number("0x7ee523ef");
    const app = new ErgoLedgerApp(transport, authToken);
    const extendedPublicKey = await app.getExtendedPublicKey("m/44'/429'/0'");

    expect(extendedPublicKey).toEqual({
      publicKey:
        "025381e95e132a4b7a6fc66844a81657a07da1ef5041eaefb7fce03f71c06a11a9",
      chainCode:
        "9cc4eb9abc8d3f55afeff7bcb8fe2d0a8d100fa35f6fcbac74deded867633eba"
    });
  });

  it("should show address", async () => {
    const transport = await openTransportReplayer(
      RecordStore.fromString(`
        => e01102021a00058000002c800001ad8000000000000000000000007ee523ef
        <= 9000
      `)
    );

    const authToken = Number("0x7ee523ef");
    const app = new ErgoLedgerApp(transport, authToken);
    const accepted = await app.showAddress("m/44'/429'/0'/0/0");

    expect(accepted).to.be.true;
  });

  it("should derive address", async () => {
    const transport = await openTransportReplayer(
      RecordStore.fromString(`
        => e01101021a00058000002c800001ad8000000000000000000000007de17fdd
        <= 0102a51a0c5e6b456c2c8e71f238dc02f5345aad9a7c5b8c655dd24bc5e419c4212d731952549000
      `)
    );

    const authToken = Number("0x7de17fdd");
    const app = new ErgoLedgerApp(transport, authToken);
    const accepted = await app.deriveAddress("m/44'/429'/0'/0/0");

    expect(accepted).to.be.deep.equal({
      addressHex:
        "0102a51a0c5e6b456c2c8e71f238dc02f5345aad9a7c5b8c655dd24bc5e419c4212d73195254"
    });
  });
});

describe("public key management without auth token", () => {
  it("should get extended public key", async () => {
    const transport = await openTransportReplayer(
      RecordStore.fromString(`
        => e01001000d038000002c800001ad80000000
        <= 025381e95e132a4b7a6fc66844a81657a07da1ef5041eaefb7fce03f71c06a11a99cc4eb9abc8d3f55afeff7bcb8fe2d0a8d100fa35f6fcbac74deded867633eba9000
      `)
    );

    const app = new ErgoLedgerApp(transport).useAuthToken(false);
    const extendedPublicKey = await app.getExtendedPublicKey("m/44'/429'/0'");

    expect(extendedPublicKey).toEqual({
      publicKey:
        "025381e95e132a4b7a6fc66844a81657a07da1ef5041eaefb7fce03f71c06a11a9",
      chainCode:
        "9cc4eb9abc8d3f55afeff7bcb8fe2d0a8d100fa35f6fcbac74deded867633eba"
    });
  });

  it("should handle user rejection on extended public key fetching", async () => {
    const transport = await openTransportReplayer(
      RecordStore.fromString(`
        => e01001000d038000002c800001ad80000000
        <= 6985
      `)
    );

    const app = new ErgoLedgerApp(transport).useAuthToken(false);
    await expect(() =>
      app.getExtendedPublicKey("m/44'/429'/0'")
    ).rejects.toThrow("Operation denied by user");
  });

  it("should show address", async () => {
    const transport = await openTransportReplayer(
      RecordStore.fromString(`
        => e01102011600058000002c800001ad800000000000000000000000
        <= 9000
      `)
    );

    const app = new ErgoLedgerApp(transport).useAuthToken(false);
    const accepted = await app.showAddress("m/44'/429'/0'/0/0");

    expect(accepted).to.be.true;
  });

  it("should handle user rejection on address displaying", async () => {
    const transport = await openTransportReplayer(
      RecordStore.fromString(`
        => e01102011600058000002c800001ad800000000000000000000000
        <= 6985
      `)
    );

    const app = new ErgoLedgerApp(transport).useAuthToken(false);
    await expect(() => app.showAddress("m/44'/429'/0'/0/0")).rejects.toThrow(
      "Operation denied by user"
    );
  });
});
