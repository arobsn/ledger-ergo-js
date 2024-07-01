import { describe, it, expect } from "vitest";
import { ErgoLedgerApp } from "./erg";
import {
  openTransportReplayer,
  RecordStore
} from "@ledgerhq/hw-transport-mocker";
import { Network } from "@fleet-sdk/core";

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

describe("transaction signing", () => {
  it("should sign a simple p2p transaction", async () => {
    const transport = await openTransportReplayer(
      RecordStore.fromString(`
        => e02001023b27c4d6a5a5e883282a5a1246975a1b42df78aa270638c8d843d63c14fae7a31f000b0000000000009ee8000000240013d08c010000000168771637
        <= aa9000

        => e02002aa240008cd02a51a0c5e6b456c2c8e71f238dc02f5345aad9a7c5b8c655dd24bc5e419c4212d
        <= 9000

        => e02003aa2800b1e236b60b95c2c6f8007a9d89bc460fc9e78f98b09faec9449007b40bccf30000000000002710
        <= 9000

        => e02004aa0100
        <= 019000

        => e02005aa0100
        <= 8038d412c4a62b7bb868ea5b1736a942613cb054f7ab5486885d157585c84ea001000000000000009ee80100b1e236b60b95c2c6f8007a9d89bc460fc9e78f98b09faec9449007b40bccf300000000000027100d7c4914d25595506ca5c2721d78350c9000

        => e02001023b27c4d6a5a5e883282a5a1246975a1b42df78aa270638c8d843d63c14fae7a31f00010000000006a01dc8000000240013d08c000000000168771637
        <= 179000

        => e0200217240008cd02a51a0c5e6b456c2c8e71f238dc02f5345aad9a7c5b8c655dd24bc5e419c4212d
        <= 9000

        => e02004170100
        <= 019000

        => e02005170100
        <= a377165e1cee26898a9baf470fc523ebf150f1936ab1a6033578a750ad5d6b8d01000000000006a01dc800fafe902998c7baee95696bffb6f3e5439000

        => e02101021a00058000002c800001ad80000000000000000000000068771637
        <= f19000

        => e02110f10700020000010003
        <= 9000

        => e02111f12000b1e236b60b95c2c6f8007a9d89bc460fc9e78f98b09faec9449007b40bccf3
        <= 9000

        => e02112f1678038d412c4a62b7bb868ea5b1736a942613cb054f7ab5486885d157585c84ea001000000000000009ee80100b1e236b60b95c2c6f8007a9d89bc460fc9e78f98b09faec9449007b40bccf300000000000027100d7c4914d25595506ca5c2721d78350c00000000
        <= 9000

        => e02112f13fa377165e1cee26898a9baf470fc523ebf150f1936ab1a6033578a750ad5d6b8d01000000000006a01dc800fafe902998c7baee95696bffb6f3e54300000000
        <= 9000

        => e02115f11500000000000f4240000000240013d0920100000001
        <= 9000

        => e02116f1240008cd0353daf95a91956229972514e2f491fdf1f9e2ed4793f916829ee427d023b51b01
        <= 9000

        => e02119f10c000000000000000000002710
        <= 9000

        => e0211af10100
        <= 9000

        => e02115f115000000000010c8e0000000690013d0920000000001
        <= 9000

        => e02117f100
        <= 9000

        => e0211af10100
        <= 9000

        => e02115f115000000000680b190000000240013d0920000000001
        <= 9000

        => e02118f115058000002c800001ad800000000000000000000000
        <= 9000

        => e0211af10100
        <= 9000

        => e02120f100
        <= b34353bca479fe5aed04025ebd47deb3d2fc252b166f701207416420fb1a8800056615910b1cac1b56eaa70b6f3721a55b8f9c9d6d6a5ab09000
      `)
    );

    const tx = {
      inputs: [
        {
          txId: "27c4d6a5a5e883282a5a1246975a1b42df78aa270638c8d843d63c14fae7a31f",
          index: 11,
          value: "40680",
          ergoTree: Buffer.from([
            0, 8, 205, 2, 165, 26, 12, 94, 107, 69, 108, 44, 142, 113, 242, 56,
            220, 2, 245, 52, 90, 173, 154, 124, 91, 140, 101, 93, 210, 75, 197,
            228, 25, 196, 33, 45
          ]),
          creationHeight: 1298572,
          tokens: [
            {
              id: "00b1e236b60b95c2c6f8007a9d89bc460fc9e78f98b09faec9449007b40bccf3",
              amount: "10000"
            }
          ],
          additionalRegisters: Buffer.from([0]),
          extension: Buffer.from([0]),
          signPath: "m/44'/429'/0'/0/0"
        },
        {
          txId: "27c4d6a5a5e883282a5a1246975a1b42df78aa270638c8d843d63c14fae7a31f",
          index: 1,
          value: "111156680",
          ergoTree: Buffer.from([
            0, 8, 205, 2, 165, 26, 12, 94, 107, 69, 108, 44, 142, 113, 242, 56,
            220, 2, 245, 52, 90, 173, 154, 124, 91, 140, 101, 93, 210, 75, 197,
            228, 25, 196, 33, 45
          ]),
          creationHeight: 1298572,
          tokens: [],
          additionalRegisters: Buffer.from([0]),
          extension: Buffer.from([0]),
          signPath: "m/44'/429'/0'/0/0"
        }
      ],
      dataInputs: [],
      outputs: [
        {
          value: "1000000",
          ergoTree: Buffer.from([
            0, 8, 205, 3, 83, 218, 249, 90, 145, 149, 98, 41, 151, 37, 20, 226,
            244, 145, 253, 241, 249, 226, 237, 71, 147, 249, 22, 130, 158, 228,
            39, 208, 35, 181, 27, 1
          ]),
          creationHeight: 1298578,
          tokens: [
            {
              id: "00b1e236b60b95c2c6f8007a9d89bc460fc9e78f98b09faec9449007b40bccf3",
              amount: "10000"
            }
          ],
          registers: Buffer.from([0])
        },
        {
          value: "1100000",
          ergoTree: Buffer.from([
            16, 5, 4, 0, 4, 0, 14, 54, 16, 2, 4, 160, 11, 8, 205, 2, 121, 190,
            102, 126, 249, 220, 187, 172, 85, 160, 98, 149, 206, 135, 11, 7, 2,
            155, 252, 219, 45, 206, 40, 217, 89, 242, 129, 91, 22, 248, 23, 152,
            234, 2, 209, 146, 163, 154, 140, 199, 167, 1, 115, 0, 115, 1, 16, 1,
            2, 4, 2, 209, 150, 131, 3, 1, 147, 163, 140, 199, 178, 165, 115, 0,
            0, 1, 147, 194, 178, 165, 115, 1, 0, 116, 115, 2, 115, 3, 131, 1, 8,
            205, 238, 172, 147, 177, 165, 115, 4
          ]),
          creationHeight: 1298578,
          tokens: [],
          registers: Buffer.from([0])
        },
        {
          value: "109097360",
          ergoTree: Buffer.from([
            0, 8, 205, 2, 165, 26, 12, 94, 107, 69, 108, 44, 142, 113, 242, 56,
            220, 2, 245, 52, 90, 173, 154, 124, 91, 140, 101, 93, 210, 75, 197,
            228, 25, 196, 33, 45
          ]),
          creationHeight: 1298578,
          tokens: [],
          registers: Buffer.from([0])
        }
      ],
      distinctTokenIds: [
        Uint8Array.from([
          0, 177, 226, 54, 182, 11, 149, 194, 198, 248, 0, 122, 157, 137, 188,
          70, 15, 201, 231, 143, 152, 176, 159, 174, 201, 68, 144, 7, 180, 11,
          204, 243
        ])
      ],
      changeMap: {
        address: "9fmmpNtxpYe5rFB5MAb4v86FFvTXby5jykoLM6XtGyqwEmFK4io",
        path: "m/44'/429'/0'/0/0"
      }
    };

    const authToken = Number("0x68771637");
    const app = new ErgoLedgerApp(transport, authToken);
    const proofs = await app.signTx(tx);

    const expectedProofs = [
      Uint8Array.from([
        179, 67, 83, 188, 164, 121, 254, 90, 237, 4, 2, 94, 189, 71, 222, 179,
        210, 252, 37, 43, 22, 111, 112, 18, 7, 65, 100, 32, 251, 26, 136, 0, 5,
        102, 21, 145, 11, 28, 172, 27, 86, 234, 167, 11, 111, 55, 33, 165, 91,
        143, 156, 157, 109, 106, 90, 176
      ]),
      Uint8Array.from([
        179, 67, 83, 188, 164, 121, 254, 90, 237, 4, 2, 94, 189, 71, 222, 179,
        210, 252, 37, 43, 22, 111, 112, 18, 7, 65, 100, 32, 251, 26, 136, 0, 5,
        102, 21, 145, 11, 28, 172, 27, 86, 234, 167, 11, 111, 55, 33, 165, 91,
        143, 156, 157, 109, 106, 90, 176
      ])
    ];

    expect(proofs).to.be.deep.equal(expectedProofs);
  });
});
