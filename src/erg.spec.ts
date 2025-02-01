import { RecordStore, openTransportReplayer } from "@ledgerhq/hw-transport-mocker";
import { describe, expect, it, test, vi } from "vitest";
import { ErgoLedgerApp } from "./erg";

describe("construction", () => {
  it("should construct app with transport", async () => {
    const transport = await openTransportReplayer(
      RecordStore.fromString(`
        => e001000000
        <= 000004019000
      `)
    );

    const app = new ErgoLedgerApp(transport);

    expect(app.transport).to.be.equal(transport);
    expect(app.authToken).to.be.greaterThan(0);
  });

  it("should enable debug mode", async () => {
    const consoleMock = vi.spyOn(console, "debug").mockImplementation(() => {
      return;
    });

    const transport = await openTransportReplayer(
      RecordStore.fromString(`
        => e001000000
        <= 000004019000

        => e010020011038000002c800001ad800000007ee523ef
        <= 025381e95e132a4b7a6fc66844a81657a07da1ef5041eaefb7fce03f71c06a11a99cc4eb9abc8d3f55afeff7bcb8fe2d0a8d100fa35f6fcbac74deded867633eba9000
      `)
    );

    const authToken = Number("0x7ee523ef");
    const app = new ErgoLedgerApp(transport, authToken).enableDebugMode();

    await app.getAppVersion(); // without arguments call
    await app.getExtendedPublicKey("m/44'/429'/0'"); // with arguments call

    expect(consoleMock).to.be.toHaveBeenCalledTimes(2);
  });
});

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

    expect(app.transport).to.be.equal(transport);
    expect(version).to.be.deep.equal({
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

describe("Open embedded application", () => {
  it("should get app name", async () => {
    const transport = await openTransportReplayer(
      RecordStore.fromString(`
        => e0d80000044572676f
        <= 9000
      `)
    );

    const app = new ErgoLedgerApp(transport);
    const result = await app.openEmbeddedApp();

    expect(result).to.be.true;
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

    expect(app.authToken).toEqual(authToken);
    expect(extendedPublicKey).toEqual({
      publicKey: "025381e95e132a4b7a6fc66844a81657a07da1ef5041eaefb7fce03f71c06a11a9",
      chainCode: "9cc4eb9abc8d3f55afeff7bcb8fe2d0a8d100fa35f6fcbac74deded867633eba"
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
      publicKey: "025381e95e132a4b7a6fc66844a81657a07da1ef5041eaefb7fce03f71c06a11a9",
      chainCode: "9cc4eb9abc8d3f55afeff7bcb8fe2d0a8d100fa35f6fcbac74deded867633eba"
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
    await expect(() => app.getExtendedPublicKey("m/44'/429'/0'")).rejects.toThrow(
      "Operation denied by user"
    );
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

  it("should fail when deriving address with invalid path", async () => {
    const transport = await openTransportReplayer(
      RecordStore.fromString(`
        => e01102011600058000002c800001ad800000000000000000000000
        <= 6985
      `)
    );

    const app = new ErgoLedgerApp(transport).useAuthToken(false);
    await expect(() => app.showAddress("m/44'/429'/0'/3/0")).rejects.toThrow(
      "Invalid change path: 3"
    );
    await expect(() => app.showAddress("m/44'/429'")).rejects.toThrow(
      "Invalid path length. 2"
    );

    await expect(() => app.deriveAddress("m/44'/429'/0'/10/0")).rejects.toThrow(
      "Invalid change path: 10"
    );
    await expect(() => app.deriveAddress("m/44'/429'/0'/1")).rejects.toThrow(
      "Invalid path length. 4"
    );
  });
});

describe("transaction signing", () => {
  test.each(txTestVectors)(
    "should sign $name",
    async ({ apduQueue, authToken, proofs, tx }) => {
      const transport = await openTransportReplayer(RecordStore.fromString(apduQueue));

      const app = new ErgoLedgerApp(transport, authToken).useAuthToken(!!authToken);

      const result = await app.signTx(tx);
      expect(result).to.deep.equal(proofs);
    }
  );

  it("Should throw with empty inputs", async () => {
    const { apduQueue, tx } = txTestVectors[0];
    const transport = await openTransportReplayer(RecordStore.fromString(apduQueue));

    const app = new ErgoLedgerApp(transport);
    await expect(() => app.signTx({ ...tx, inputs: [] })).rejects.toThrow(
      "Bad input count"
    );
  });

  it("Should attest input", async () => {
    const transport = await openTransportReplayer(
      RecordStore.fromString(`
        => e02001023b7eb901e0e7a3b2c2a4795851fc40c58b71a31ba114dedacf467eda3d3902f09e00000000000005f5e100000000240013d0e80000000001670dc113
        <= e09000

        => e02002e0240008cd02a51a0c5e6b456c2c8e71f238dc02f5345aad9a7c5b8c655dd24bc5e419c4212d
        <= 9000

        => e02004e00100
        <= 019000

        => e02005e00100
        <= 2bb2f3111e33ad9d9ab1fa3ae184fc1f06a6ac5a71d40a825997f6637b44784f01000000000005f5e100008c2d9e1dcd467155df32bf1ded8007109000
      `)
    );

    const authToken = Number("0x670dc113");
    const app = new ErgoLedgerApp(transport, authToken).useAuthToken();

    const box = {
      txId: "7eb901e0e7a3b2c2a4795851fc40c58b71a31ba114dedacf467eda3d3902f09e",
      index: 0,
      value: "100000000",
      ergoTree: Buffer.from([
        0, 8, 205, 2, 165, 26, 12, 94, 107, 69, 108, 44, 142, 113, 242, 56, 220, 2, 245,
        52, 90, 173, 154, 124, 91, 140, 101, 93, 210, 75, 197, 228, 25, 196, 33, 45
      ]),
      creationHeight: 1298664,
      tokens: [],
      additionalRegisters: Buffer.from([0]),
      extension: Buffer.from([0]),
      signPath: "m/44'/429'/0'/0/0"
    };

    const attestedBox = await app.attestInput(box);

    expect(attestedBox.box).to.be.equal(box);
    expect(attestedBox.frames).to.deep.equal([
      {
        amount: "100000000",
        attestation: "8c2d9e1dcd467155df32bf1ded800710",
        boxId: "2bb2f3111e33ad9d9ab1fa3ae184fc1f06a6ac5a71d40a825997f6637b44784f",
        bytes: Buffer.from([
          43, 178, 243, 17, 30, 51, 173, 157, 154, 177, 250, 58, 225, 132, 252, 31, 6,
          166, 172, 90, 113, 212, 10, 130, 89, 151, 246, 99, 123, 68, 120, 79, 1, 0, 0, 0,
          0, 0, 5, 245, 225, 0, 0, 140, 45, 158, 29, 205, 70, 113, 85, 223, 50, 191, 29,
          237, 128, 7, 16
        ]),
        index: 0,
        count: 1,
        tokens: []
      }
    ]);
  });
});

const txTestVectors = [
  {
    name: "simple erg-only p2p transaction",
    authToken: 0,
    apduQueue: `
      => e0200101378e73d69748e76867f9e71351481137bc6d5e671979d050f61eabfdccee28a513000100000000067f2af0000000240013d0a10000000001
      <= 469000

      => e0200246240008cd02a51a0c5e6b456c2c8e71f238dc02f5345aad9a7c5b8c655dd24bc5e419c4212d
      <= 9000

      => e02004460100
      <= 019000

      => e02005460100
      <= 6ce8899226740d75f585f2f9523e72b8ea15ac74ff1ae0cc27285a1c9441671c010000000000067f2af0002bed1821ecfbb415788b74a5e36587199000

      => e02101011600058000002c800001ad800000000000000000000000
      <= 879000

      => e02110870700010000000003
      <= 9000

      => e02112873f6ce8899226740d75f585f2f9523e72b8ea15ac74ff1ae0cc27285a1c9441671c010000000000067f2af0002bed1821ecfbb415788b74a5e365871900000000
      <= 9000

      => e0211587150000000005f5e100000000240013d0e80000000001
      <= 9000

      => e021188715058000002c800001ad800000000000000000000000
      <= 9000

      => e0211a870100
      <= 9000

      => e021158715000000000010c8e0000000690013d0e80000000001
      <= 9000

      => e021178700
      <= 9000

      => e0211a870100
      <= 9000

      => e0211587150000000000788110000000240013d0e80000000001
      <= 9000

      => e021188715058000002c800001ad800000000000000000000000
      <= 9000

      => e0211a870100
      <= 9000

      => e021208700
      <= 445a29676b4d463b9a4266ae42d5d046e6610e936347d6ae0a22c8f539f6ed6077777e9478f501e657eabc6b8cefd406c00a50b80840a5fe9000
      `,
    tx: {
      inputs: [
        {
          txId: "8e73d69748e76867f9e71351481137bc6d5e671979d050f61eabfdccee28a513",
          index: 1,
          value: "108997360",
          ergoTree: Buffer.from([
            0, 8, 205, 2, 165, 26, 12, 94, 107, 69, 108, 44, 142, 113, 242, 56, 220, 2,
            245, 52, 90, 173, 154, 124, 91, 140, 101, 93, 210, 75, 197, 228, 25, 196, 33,
            45
          ]),
          creationHeight: 1298593,
          tokens: [],
          additionalRegisters: Buffer.from([0]),
          extension: Buffer.from([0]),
          signPath: "m/44'/429'/0'/0/0"
        }
      ],
      dataInputs: [],
      outputs: [
        {
          value: "100000000",
          ergoTree: Buffer.from([
            0, 8, 205, 2, 165, 26, 12, 94, 107, 69, 108, 44, 142, 113, 242, 56, 220, 2,
            245, 52, 90, 173, 154, 124, 91, 140, 101, 93, 210, 75, 197, 228, 25, 196, 33,
            45
          ]),
          creationHeight: 1298664,
          tokens: [],
          registers: Buffer.from([0])
        },
        {
          value: "1100000",
          ergoTree: Buffer.from([
            16, 5, 4, 0, 4, 0, 14, 54, 16, 2, 4, 160, 11, 8, 205, 2, 121, 190, 102, 126,
            249, 220, 187, 172, 85, 160, 98, 149, 206, 135, 11, 7, 2, 155, 252, 219, 45,
            206, 40, 217, 89, 242, 129, 91, 22, 248, 23, 152, 234, 2, 209, 146, 163, 154,
            140, 199, 167, 1, 115, 0, 115, 1, 16, 1, 2, 4, 2, 209, 150, 131, 3, 1, 147,
            163, 140, 199, 178, 165, 115, 0, 0, 1, 147, 194, 178, 165, 115, 1, 0, 116,
            115, 2, 115, 3, 131, 1, 8, 205, 238, 172, 147, 177, 165, 115, 4
          ]),
          creationHeight: 1298664,
          tokens: [],
          registers: Buffer.from([0])
        },
        {
          value: "7897360",
          ergoTree: Buffer.from([
            0, 8, 205, 2, 165, 26, 12, 94, 107, 69, 108, 44, 142, 113, 242, 56, 220, 2,
            245, 52, 90, 173, 154, 124, 91, 140, 101, 93, 210, 75, 197, 228, 25, 196, 33,
            45
          ]),
          creationHeight: 1298664,
          tokens: [],
          registers: Buffer.from([0])
        }
      ],
      distinctTokenIds: [],
      changeMap: {
        address: "9fmmpNtxpYe5rFB5MAb4v86FFvTXby5jykoLM6XtGyqwEmFK4io",
        path: "m/44'/429'/0'/0/0"
      }
    },
    proofs: [
      Uint8Array.from([
        68, 90, 41, 103, 107, 77, 70, 59, 154, 66, 102, 174, 66, 213, 208, 70, 230, 97,
        14, 147, 99, 71, 214, 174, 10, 34, 200, 245, 57, 246, 237, 96, 119, 119, 126, 148,
        120, 245, 1, 230, 87, 234, 188, 107, 140, 239, 212, 6, 192, 10, 80, 184, 8, 64,
        165, 254
      ])
    ]
  },
  {
    name: "simple p2p transaction with tokens",
    authToken: Number("0x68771637"),
    apduQueue: `
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
    `,
    tx: {
      inputs: [
        {
          txId: "27c4d6a5a5e883282a5a1246975a1b42df78aa270638c8d843d63c14fae7a31f",
          index: 11,
          value: "40680",
          ergoTree: Buffer.from([
            0, 8, 205, 2, 165, 26, 12, 94, 107, 69, 108, 44, 142, 113, 242, 56, 220, 2,
            245, 52, 90, 173, 154, 124, 91, 140, 101, 93, 210, 75, 197, 228, 25, 196, 33,
            45
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
            0, 8, 205, 2, 165, 26, 12, 94, 107, 69, 108, 44, 142, 113, 242, 56, 220, 2,
            245, 52, 90, 173, 154, 124, 91, 140, 101, 93, 210, 75, 197, 228, 25, 196, 33,
            45
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
            0, 8, 205, 3, 83, 218, 249, 90, 145, 149, 98, 41, 151, 37, 20, 226, 244, 145,
            253, 241, 249, 226, 237, 71, 147, 249, 22, 130, 158, 228, 39, 208, 35, 181,
            27, 1
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
            16, 5, 4, 0, 4, 0, 14, 54, 16, 2, 4, 160, 11, 8, 205, 2, 121, 190, 102, 126,
            249, 220, 187, 172, 85, 160, 98, 149, 206, 135, 11, 7, 2, 155, 252, 219, 45,
            206, 40, 217, 89, 242, 129, 91, 22, 248, 23, 152, 234, 2, 209, 146, 163, 154,
            140, 199, 167, 1, 115, 0, 115, 1, 16, 1, 2, 4, 2, 209, 150, 131, 3, 1, 147,
            163, 140, 199, 178, 165, 115, 0, 0, 1, 147, 194, 178, 165, 115, 1, 0, 116,
            115, 2, 115, 3, 131, 1, 8, 205, 238, 172, 147, 177, 165, 115, 4
          ]),
          creationHeight: 1298578,
          tokens: [],
          registers: Buffer.from([0])
        },
        {
          value: "109097360",
          ergoTree: Buffer.from([
            0, 8, 205, 2, 165, 26, 12, 94, 107, 69, 108, 44, 142, 113, 242, 56, 220, 2,
            245, 52, 90, 173, 154, 124, 91, 140, 101, 93, 210, 75, 197, 228, 25, 196, 33,
            45
          ]),
          creationHeight: 1298578,
          tokens: [],
          registers: Buffer.from([0])
        }
      ],
      distinctTokenIds: [
        Uint8Array.from([
          0, 177, 226, 54, 182, 11, 149, 194, 198, 248, 0, 122, 157, 137, 188, 70, 15,
          201, 231, 143, 152, 176, 159, 174, 201, 68, 144, 7, 180, 11, 204, 243
        ])
      ],
      changeMap: {
        address: "9fmmpNtxpYe5rFB5MAb4v86FFvTXby5jykoLM6XtGyqwEmFK4io",
        path: "m/44'/429'/0'/0/0"
      }
    },
    proofs: [
      Uint8Array.from([
        179, 67, 83, 188, 164, 121, 254, 90, 237, 4, 2, 94, 189, 71, 222, 179, 210, 252,
        37, 43, 22, 111, 112, 18, 7, 65, 100, 32, 251, 26, 136, 0, 5, 102, 21, 145, 11,
        28, 172, 27, 86, 234, 167, 11, 111, 55, 33, 165, 91, 143, 156, 157, 109, 106, 90,
        176
      ]),
      Uint8Array.from([
        179, 67, 83, 188, 164, 121, 254, 90, 237, 4, 2, 94, 189, 71, 222, 179, 210, 252,
        37, 43, 22, 111, 112, 18, 7, 65, 100, 32, 251, 26, 136, 0, 5, 102, 21, 145, 11,
        28, 172, 27, 86, 234, 167, 11, 111, 55, 33, 165, 91, 143, 156, 157, 109, 106, 90,
        176
      ])
    ]
  },
  {
    name: "transaction with input extension and data inputs",
    authToken: 0,
    apduQueue: `
      => e0200101375f083bdf25ef9b915205e569c3c0623c5b7ae743a6d26112704cfd8ae1261555000100000001c235c8c0000000c200128d98010000004a
      <= f09000

      => e02002f0c2100604000e20d71693c49a84fbbecd4908c94813b46514b18b67a99952dc1e6e4791556de4130400040005000500d803d601e30004d602e4c6a70408d603e4c6a7050595e67201d804d604b2a5e4720100d605b2db63087204730000d606db6308a7d60799c1a7c17204d1968302019683050193c27204c2a7938c720501730193e4c672040408720293e4c672040505720393e4c67204060ec5a796830201929c998c7205029591b1720673028cb272067303000273047203720792720773057202
      <= 9000

      => e02003f028d71693c49a84fbbecd4908c94813b46514b18b67a99952dc1e6e4791556de41300000000000004e8
      <= 9000

      => e02004f04a0308cd020f45695a0b93a631884a2cd0716a72522323678528522b315c54d6cf9c604cd705e0d1040e20dbaafd3269dd0d332c990da519a48a75024e0c8bc881a019b1c13ffa5708e61f
      <= 019000

      => e02005f00100
      <= 8864306054980d41709f4cedd886f06c9edd2d0f59a14afa91e2656077d803f2010000000001c235c8c001d71693c49a84fbbecd4908c94813b46514b18b67a99952dc1e6e4791556de41300000000000004e89b12099035cea03108ef10fc55b6dd3d9000

      => e0200101378e73d69748e76867f9e71351481137bc6d5e671979d050f61eabfdccee28a5130012000000000000a320000000240013d0a10100000001
      <= dd9000

      => e02002dd240008cd02a51a0c5e6b456c2c8e71f238dc02f5345aad9a7c5b8c655dd24bc5e419c4212d
      <= 9000

      => e02003dd28ef802b475c06189fdbf844153cdc1d449a5ba87cce13d11bb47b5a539f27f12b000000003b9aca00
      <= 9000

      => e02004dd0100
      <= 019000

      => e02005dd0100
      <= 3032130427fbf960d8a656fe390812cd1892b2822c4908f85df2216ec0ca15a70100000000000000a32001ef802b475c06189fdbf844153cdc1d449a5ba87cce13d11bb47b5a539f27f12b000000003b9aca004e74bdc55599b11c10adbecf07f28bb49000

      => e0200101378e73d69748e76867f9e71351481137bc6d5e671979d050f61eabfdccee28a51300050000000000009d80000000240013d0a10100000001
      <= 979000

      => e0200297240008cd02a51a0c5e6b456c2c8e71f238dc02f5345aad9a7c5b8c655dd24bc5e419c4212d
      <= 9000

      => e020039728d71693c49a84fbbecd4908c94813b46514b18b67a99952dc1e6e4791556de4130000000000000064
      <= 9000

      => e02004970100
      <= 019000

      => e02005970100
      <= 6196ae3283e0939b97b11bcd3c4900902d476b2c244b9fbb79f27765dc2a803b01000000000000009d8001d71693c49a84fbbecd4908c94813b46514b18b67a99952dc1e6e4791556de41300000000000000642ff3a8da556b580c45216f09c0a823869000

      => e0200101377eb901e0e7a3b2c2a4795851fc40c58b71a31ba114dedacf467eda3d3902f09e00000000000005f5e100000000240013d0e80000000001
      <= b09000

      => e02002b0240008cd02a51a0c5e6b456c2c8e71f238dc02f5345aad9a7c5b8c655dd24bc5e419c4212d
      <= 9000

      => e02004b00100
      <= 019000

      => e02005b00100
      <= 2bb2f3111e33ad9d9ab1fa3ae184fc1f06a6ac5a71d40a825997f6637b44784f01000000000005f5e1000073b3067b4874e9c13f2c72135ab3c43a9000

      => e02101011600058000002c800001ad800000000000000000000000
      <= bf9000

      => e02110bf0700040004020005
      <= 9000

      => e02111bf40ef802b475c06189fdbf844153cdc1d449a5ba87cce13d11bb47b5a539f27f12bd71693c49a84fbbecd4908c94813b46514b18b67a99952dc1e6e4791556de413
      <= 9000

      => e02112bf678864306054980d41709f4cedd886f06c9edd2d0f59a14afa91e2656077d803f2010000000001c235c8c001d71693c49a84fbbecd4908c94813b46514b18b67a99952dc1e6e4791556de41300000000000004e89b12099035cea03108ef10fc55b6dd3d00000004
      <= 9000

      => e02113bf0401000402
      <= 9000

      => e02112bf673032130427fbf960d8a656fe390812cd1892b2822c4908f85df2216ec0ca15a70100000000000000a32001ef802b475c06189fdbf844153cdc1d449a5ba87cce13d11bb47b5a539f27f12b000000003b9aca004e74bdc55599b11c10adbecf07f28bb400000000
      <= 9000

      => e02112bf676196ae3283e0939b97b11bcd3c4900902d476b2c244b9fbb79f27765dc2a803b01000000000000009d8001d71693c49a84fbbecd4908c94813b46514b18b67a99952dc1e6e4791556de41300000000000000642ff3a8da556b580c45216f09c0a8238600000000
      <= 9000

      => e02112bf3f2bb2f3111e33ad9d9ab1fa3ae184fc1f06a6ac5a71d40a825997f6637b44784f01000000000005f5e1000073b3067b4874e9c13f2c72135ab3c43a00000000
      <= 9000

      => e02114bf808864306054980d41709f4cedd886f06c9edd2d0f59a14afa91e2656077d803f23032130427fbf960d8a656fe390812cd1892b2822c4908f85df2216ec0ca15a76196ae3283e0939b97b11bcd3c4900902d476b2c244b9fbb79f27765dc2a803b2bb2f3111e33ad9d9ab1fa3ae184fc1f06a6ac5a71d40a825997f6637b44784f
      <= 9000

      => e02115bf150000000000989680000000240013d0f70100000001
      <= 9000

      => e02118bf15058000002c800001ad800000000000000000000000
      <= 9000

      => e02119bf0c00000000000000003b9aca00
      <= 9000

      => e0211abf0100
      <= 9000

      => e02115bf1500000001c2142760000000c20013d0f7010000004a
      <= 9000

      => e02116bfc2100604000e20d71693c49a84fbbecd4908c94813b46514b18b67a99952dc1e6e4791556de4130400040005000500d803d601e30004d602e4c6a70408d603e4c6a7050595e67201d804d604b2a5e4720100d605b2db63087204730000d606db6308a7d60799c1a7c17204d1968302019683050193c27204c2a7938c720501730193e4c672040408720293e4c672040505720393e4c67204060ec5a796830201929c998c7205029591b1720673028cb272067303000273047203720792720773057202
      <= 9000

      => e02119bf0c000000010000000000000522
      <= 9000

      => e0211abf4a0308cd020f45695a0b93a631884a2cd0716a72522323678528522b315c54d6cf9c604cd705e0d1040e208864306054980d41709f4cedd886f06c9edd2d0f59a14afa91e2656077d803f2
      <= 9000

      => e02115bf15000000000021a160000000690013d0f70000000001
      <= 9000

      => e02117bf00
      <= 9000

      => e0211abf0100
      <= 9000

      => e02115bf1500000000055deda0000000240013d0f70000000001
      <= 9000

      => e02118bf15058000002c800001ad800000000000000000000000
      <= 9000

      => e0211abf0100
      <= 9000

      => e02115bf150000000000009d80000000240013d0f70100000001
      <= 9000

      => e02118bf15058000002c800001ad800000000000000000000000
      <= 9000

      => e02119bf0c00000001000000000000002a
      <= 9000

      => e0211abf0100
      <= 9000

      => e02120bf00
      <= e400970489548477054e2d9dacaeccb2c145f9e319ebca3e5abbb4be73fa0402c5868d7dfa68adffe9b4c0863d4ace3c3ca1f790815aed339000
      `,
    tx: {
      inputs: [
        {
          txId: "5f083bdf25ef9b915205e569c3c0623c5b7ae743a6d26112704cfd8ae1261555",
          index: 1,
          value: "7553272000",
          ergoTree: Buffer.from([
            16, 6, 4, 0, 14, 32, 215, 22, 147, 196, 154, 132, 251, 190, 205, 73, 8, 201,
            72, 19, 180, 101, 20, 177, 139, 103, 169, 153, 82, 220, 30, 110, 71, 145, 85,
            109, 228, 19, 4, 0, 4, 0, 5, 0, 5, 0, 216, 3, 214, 1, 227, 0, 4, 214, 2, 228,
            198, 167, 4, 8, 214, 3, 228, 198, 167, 5, 5, 149, 230, 114, 1, 216, 4, 214, 4,
            178, 165, 228, 114, 1, 0, 214, 5, 178, 219, 99, 8, 114, 4, 115, 0, 0, 214, 6,
            219, 99, 8, 167, 214, 7, 153, 193, 167, 193, 114, 4, 209, 150, 131, 2, 1, 150,
            131, 5, 1, 147, 194, 114, 4, 194, 167, 147, 140, 114, 5, 1, 115, 1, 147, 228,
            198, 114, 4, 4, 8, 114, 2, 147, 228, 198, 114, 4, 5, 5, 114, 3, 147, 228, 198,
            114, 4, 6, 14, 197, 167, 150, 131, 2, 1, 146, 156, 153, 140, 114, 5, 2, 149,
            145, 177, 114, 6, 115, 2, 140, 178, 114, 6, 115, 3, 0, 2, 115, 4, 114, 3, 114,
            7, 146, 114, 7, 115, 5, 114, 2
          ]),
          creationHeight: 1215896,
          tokens: [
            {
              id: "d71693c49a84fbbecd4908c94813b46514b18b67a99952dc1e6e4791556de413",
              amount: "1256"
            }
          ],
          additionalRegisters: Buffer.from([
            3, 8, 205, 2, 15, 69, 105, 90, 11, 147, 166, 49, 136, 74, 44, 208, 113, 106,
            114, 82, 35, 35, 103, 133, 40, 82, 43, 49, 92, 84, 214, 207, 156, 96, 76, 215,
            5, 224, 209, 4, 14, 32, 219, 170, 253, 50, 105, 221, 13, 51, 44, 153, 13, 165,
            25, 164, 138, 117, 2, 78, 12, 139, 200, 129, 160, 25, 177, 193, 63, 250, 87,
            8, 230, 31
          ]),
          extension: Buffer.from([1, 0, 4, 2]),
          signPath: "m/44'/429'/0'/0/0"
        },
        {
          txId: "8e73d69748e76867f9e71351481137bc6d5e671979d050f61eabfdccee28a513",
          index: 18,
          value: "41760",
          ergoTree: Buffer.from([
            0, 8, 205, 2, 165, 26, 12, 94, 107, 69, 108, 44, 142, 113, 242, 56, 220, 2,
            245, 52, 90, 173, 154, 124, 91, 140, 101, 93, 210, 75, 197, 228, 25, 196, 33,
            45
          ]),
          creationHeight: 1298593,
          tokens: [
            {
              id: "ef802b475c06189fdbf844153cdc1d449a5ba87cce13d11bb47b5a539f27f12b",
              amount: "1000000000"
            }
          ],
          additionalRegisters: Buffer.from([0]),
          extension: Buffer.from([0]),
          signPath: "m/44'/429'/0'/0/0"
        },
        {
          txId: "8e73d69748e76867f9e71351481137bc6d5e671979d050f61eabfdccee28a513",
          index: 5,
          value: "40320",
          ergoTree: Buffer.from([
            0, 8, 205, 2, 165, 26, 12, 94, 107, 69, 108, 44, 142, 113, 242, 56, 220, 2,
            245, 52, 90, 173, 154, 124, 91, 140, 101, 93, 210, 75, 197, 228, 25, 196, 33,
            45
          ]),
          creationHeight: 1298593,
          tokens: [
            {
              id: "d71693c49a84fbbecd4908c94813b46514b18b67a99952dc1e6e4791556de413",
              amount: "100"
            }
          ],
          additionalRegisters: Buffer.from([0]),
          extension: Buffer.from([0]),
          signPath: "m/44'/429'/0'/0/0"
        },
        {
          txId: "7eb901e0e7a3b2c2a4795851fc40c58b71a31ba114dedacf467eda3d3902f09e",
          index: 0,
          value: "100000000",
          ergoTree: Buffer.from([
            0, 8, 205, 2, 165, 26, 12, 94, 107, 69, 108, 44, 142, 113, 242, 56, 220, 2,
            245, 52, 90, 173, 154, 124, 91, 140, 101, 93, 210, 75, 197, 228, 25, 196, 33,
            45
          ]),
          creationHeight: 1298664,
          tokens: [],
          additionalRegisters: Buffer.from([0]),
          extension: Buffer.from([0]),
          signPath: "m/44'/429'/0'/0/0"
        }
      ],
      dataInputs: [
        "8864306054980d41709f4cedd886f06c9edd2d0f59a14afa91e2656077d803f2",
        "3032130427fbf960d8a656fe390812cd1892b2822c4908f85df2216ec0ca15a7",
        "6196ae3283e0939b97b11bcd3c4900902d476b2c244b9fbb79f27765dc2a803b",
        "2bb2f3111e33ad9d9ab1fa3ae184fc1f06a6ac5a71d40a825997f6637b44784f"
      ],
      outputs: [
        {
          value: "10000000",
          ergoTree: Buffer.from([
            0, 8, 205, 2, 165, 26, 12, 94, 107, 69, 108, 44, 142, 113, 242, 56, 220, 2,
            245, 52, 90, 173, 154, 124, 91, 140, 101, 93, 210, 75, 197, 228, 25, 196, 33,
            45
          ]),
          creationHeight: 1298679,
          tokens: [
            {
              id: "ef802b475c06189fdbf844153cdc1d449a5ba87cce13d11bb47b5a539f27f12b",
              amount: "1000000000"
            }
          ],
          registers: Buffer.from([0])
        },
        {
          value: "7551068000",
          ergoTree: Buffer.from([
            16, 6, 4, 0, 14, 32, 215, 22, 147, 196, 154, 132, 251, 190, 205, 73, 8, 201,
            72, 19, 180, 101, 20, 177, 139, 103, 169, 153, 82, 220, 30, 110, 71, 145, 85,
            109, 228, 19, 4, 0, 4, 0, 5, 0, 5, 0, 216, 3, 214, 1, 227, 0, 4, 214, 2, 228,
            198, 167, 4, 8, 214, 3, 228, 198, 167, 5, 5, 149, 230, 114, 1, 216, 4, 214, 4,
            178, 165, 228, 114, 1, 0, 214, 5, 178, 219, 99, 8, 114, 4, 115, 0, 0, 214, 6,
            219, 99, 8, 167, 214, 7, 153, 193, 167, 193, 114, 4, 209, 150, 131, 2, 1, 150,
            131, 5, 1, 147, 194, 114, 4, 194, 167, 147, 140, 114, 5, 1, 115, 1, 147, 228,
            198, 114, 4, 4, 8, 114, 2, 147, 228, 198, 114, 4, 5, 5, 114, 3, 147, 228, 198,
            114, 4, 6, 14, 197, 167, 150, 131, 2, 1, 146, 156, 153, 140, 114, 5, 2, 149,
            145, 177, 114, 6, 115, 2, 140, 178, 114, 6, 115, 3, 0, 2, 115, 4, 114, 3, 114,
            7, 146, 114, 7, 115, 5, 114, 2
          ]),
          creationHeight: 1298679,
          tokens: [
            {
              id: "d71693c49a84fbbecd4908c94813b46514b18b67a99952dc1e6e4791556de413",
              amount: "1314"
            }
          ],
          registers: Buffer.from([
            3, 8, 205, 2, 15, 69, 105, 90, 11, 147, 166, 49, 136, 74, 44, 208, 113, 106,
            114, 82, 35, 35, 103, 133, 40, 82, 43, 49, 92, 84, 214, 207, 156, 96, 76, 215,
            5, 224, 209, 4, 14, 32, 136, 100, 48, 96, 84, 152, 13, 65, 112, 159, 76, 237,
            216, 134, 240, 108, 158, 221, 45, 15, 89, 161, 74, 250, 145, 226, 101, 96,
            119, 216, 3, 242
          ])
        },
        {
          value: "2204000",
          ergoTree: Buffer.from([
            16, 5, 4, 0, 4, 0, 14, 54, 16, 2, 4, 160, 11, 8, 205, 2, 121, 190, 102, 126,
            249, 220, 187, 172, 85, 160, 98, 149, 206, 135, 11, 7, 2, 155, 252, 219, 45,
            206, 40, 217, 89, 242, 129, 91, 22, 248, 23, 152, 234, 2, 209, 146, 163, 154,
            140, 199, 167, 1, 115, 0, 115, 1, 16, 1, 2, 4, 2, 209, 150, 131, 3, 1, 147,
            163, 140, 199, 178, 165, 115, 0, 0, 1, 147, 194, 178, 165, 115, 1, 0, 116,
            115, 2, 115, 3, 131, 1, 8, 205, 238, 172, 147, 177, 165, 115, 4
          ]),
          creationHeight: 1298679,
          tokens: [],
          registers: Buffer.from([0])
        },
        {
          value: "90041760",
          ergoTree: Buffer.from([
            0, 8, 205, 2, 165, 26, 12, 94, 107, 69, 108, 44, 142, 113, 242, 56, 220, 2,
            245, 52, 90, 173, 154, 124, 91, 140, 101, 93, 210, 75, 197, 228, 25, 196, 33,
            45
          ]),
          creationHeight: 1298679,
          tokens: [],
          registers: Buffer.from([0])
        },
        {
          value: "40320",
          ergoTree: Buffer.from([
            0, 8, 205, 2, 165, 26, 12, 94, 107, 69, 108, 44, 142, 113, 242, 56, 220, 2,
            245, 52, 90, 173, 154, 124, 91, 140, 101, 93, 210, 75, 197, 228, 25, 196, 33,
            45
          ]),
          creationHeight: 1298679,
          tokens: [
            {
              id: "d71693c49a84fbbecd4908c94813b46514b18b67a99952dc1e6e4791556de413",
              amount: "42"
            }
          ],
          registers: Buffer.from([0])
        }
      ],
      distinctTokenIds: [
        Uint8Array.from([
          239, 128, 43, 71, 92, 6, 24, 159, 219, 248, 68, 21, 60, 220, 29, 68, 154, 91,
          168, 124, 206, 19, 209, 27, 180, 123, 90, 83, 159, 39, 241, 43
        ]),
        Uint8Array.from([
          215, 22, 147, 196, 154, 132, 251, 190, 205, 73, 8, 201, 72, 19, 180, 101, 20,
          177, 139, 103, 169, 153, 82, 220, 30, 110, 71, 145, 85, 109, 228, 19
        ])
      ],
      changeMap: {
        address: "9fmmpNtxpYe5rFB5MAb4v86FFvTXby5jykoLM6XtGyqwEmFK4io",
        path: "m/44'/429'/0'/0/0"
      }
    },
    proofs: [
      Uint8Array.from([
        228, 0, 151, 4, 137, 84, 132, 119, 5, 78, 45, 157, 172, 174, 204, 178, 193, 69,
        249, 227, 25, 235, 202, 62, 90, 187, 180, 190, 115, 250, 4, 2, 197, 134, 141, 125,
        250, 104, 173, 255, 233, 180, 192, 134, 61, 74, 206, 60, 60, 161, 247, 144, 129,
        90, 237, 51
      ]),
      Uint8Array.from([
        228, 0, 151, 4, 137, 84, 132, 119, 5, 78, 45, 157, 172, 174, 204, 178, 193, 69,
        249, 227, 25, 235, 202, 62, 90, 187, 180, 190, 115, 250, 4, 2, 197, 134, 141, 125,
        250, 104, 173, 255, 233, 180, 192, 134, 61, 74, 206, 60, 60, 161, 247, 144, 129,
        90, 237, 51
      ]),
      Uint8Array.from([
        228, 0, 151, 4, 137, 84, 132, 119, 5, 78, 45, 157, 172, 174, 204, 178, 193, 69,
        249, 227, 25, 235, 202, 62, 90, 187, 180, 190, 115, 250, 4, 2, 197, 134, 141, 125,
        250, 104, 173, 255, 233, 180, 192, 134, 61, 74, 206, 60, 60, 161, 247, 144, 129,
        90, 237, 51
      ]),
      Uint8Array.from([
        228, 0, 151, 4, 137, 84, 132, 119, 5, 78, 45, 157, 172, 174, 204, 178, 193, 69,
        249, 227, 25, 235, 202, 62, 90, 187, 180, 190, 115, 250, 4, 2, 197, 134, 141, 125,
        250, 104, 173, 255, 233, 180, 192, 134, 61, 74, 206, 60, 60, 161, 247, 144, 129,
        90, 237, 51
      ])
    ]
  }
];
