import { chunk } from "@fleet-sdk/common";
import { ErgoAddress, type Network } from "@fleet-sdk/core";
import { hex } from "@fleet-sdk/crypto";
import { COMMAND, type Device, MAX_DATA_LENGTH } from "../device";
import { ByteWriter } from "../serialization/byteWriter";
import { EMPTY_BYTES } from "../serialization/utils";
import type { AttestedBox } from "../types/attestedBox";
import type { AttestedTransaction } from "../types/internal";
import type { BoxCandidate, ChangeMap, Token } from "../types/public";

const MINER_FEE_TREE =
  "1005040004000e36100204a00b08cd0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798ea02d192a39a8cc7a701730073011001020402d19683030193a38cc7b2a57300000193c2b2a57301007473027303830108cdeeac93b1a57304";

const enum P1 {
  START_SIGNING = 0x01,
  START_TRANSACTION = 0x10,
  ADD_TOKEN_IDS = 0x11,
  ADD_INPUT_BOX_FRAME = 0x12,
  ADD_INPUT_BOX_CONTEXT_EXTENSION_CHUNK = 0x13,
  ADD_DATA_INPUTS = 0x14,
  ADD_OUTPUT_BOX_START = 0x15,
  ADD_OUTPUT_BOX_ERGO_TREE_CHUNK = 0x16,
  ADD_OUTPUT_BOX_MINERS_FEE_TREE = 0x17,
  ADD_OUTPUT_BOX_CHANGE_TREE = 0x18,
  ADD_OUTPUT_BOX_TOKENS = 0x19,
  ADD_OUTPUT_BOX_REGISTERS_CHUNK = 0x1a,
  CONFIRM_AND_SIGN = 0x20
}

const enum P2 {
  WITHOUT_TOKEN = 0x01,
  WITH_TOKEN = 0x02
}

const CLA = 0xe0;
const HASH_SIZE = 32;
const HEADER_SIZE = 46; // https://github.com/ergoplatform/ledger-app-ergo/blob/main/doc/INS-21-SIGN-TRANSACTION.md#data
const START_TX_SIZE = 7; // https://github.com/ergoplatform/ledger-app-ergo/blob/main/doc/INS-21-SIGN-TRANSACTION.md#0x10---start-transaction-data
const ADD_OUTPUT_HEADER_SIZE = 21; // https://github.com/ergoplatform/ledger-app-ergo/blob/main/doc/INS-21-SIGN-TRANSACTION.md#data-5
const ADD_OUTPUT_CHANGE_PATH_SIZE = 51; // https://github.com/ergoplatform/ledger-app-ergo/blob/main/doc/INS-21-SIGN-TRANSACTION.md#data-6
const ADD_OUTPUT_TOKEN_SIZE = 12; // https://github.com/ergoplatform/ledger-app-ergo/blob/main/doc/INS-21-SIGN-TRANSACTION.md#0x19---add-output-box-tokens

export async function signTx(
  device: Device,
  tx: AttestedTransaction,
  signPath: string,
  network: Network,
  authToken?: number
): Promise<Uint8Array> {
  const sessionId = await sendHeader(device, network, signPath, authToken);
  await sendStartTx(device, sessionId, tx, tx.distinctTokenIds.length);
  await sendDistinctTokensIds(device, sessionId, tx.distinctTokenIds);
  await sendInputs(device, sessionId, tx.inputs);
  await sendDataInputs(device, sessionId, tx.dataInputs);
  await sendOutputs(device, sessionId, tx.outputs, tx.changeMap, tx.distinctTokenIds);
  const proof = await sendConfirmAndSign(device, sessionId);

  return proof;
}

async function sendHeader(
  device: Device,
  network: Network,
  path: string,
  authToken?: number
): Promise<number> {
  const response = await device.send(
    CLA,
    COMMAND.SIGN_TX,
    P1.START_SIGNING,
    authToken ? P2.WITH_TOKEN : P2.WITHOUT_TOKEN,
    new ByteWriter(HEADER_SIZE)
      .writeUInt8(network)
      .writePath(path)
      .writeAuthToken(authToken)
      .toBytes()
  );

  return response.data[0];
}

async function sendStartTx(
  device: Device,
  sessionId: number,
  tx: AttestedTransaction,
  uniqueTokenIdsCount: number
): Promise<number> {
  const response = await device.send(
    CLA,
    COMMAND.SIGN_TX,
    P1.START_TRANSACTION,
    sessionId,
    new ByteWriter(START_TX_SIZE)
      .writeUInt16(tx.inputs.length)
      .writeUInt16(tx.dataInputs.length)
      .writeUInt8(uniqueTokenIdsCount)
      .writeUInt16(tx.outputs.length)
      .toBytes()
  );

  return response.data[0];
}

async function sendDistinctTokensIds(
  device: Device,
  sessionId: number,
  tokenIds: Uint8Array[]
) {
  const chunks = chunk(tokenIds, Math.floor(MAX_DATA_LENGTH / HASH_SIZE));
  for (const chunk of chunks) {
    const data = new ByteWriter(chunk.length * HASH_SIZE);
    for (const id of chunk) data.writeBytes(id);

    await device.send(CLA, COMMAND.SIGN_TX, P1.ADD_TOKEN_IDS, sessionId, data.toBytes());
  }
}

async function sendInputs(device: Device, sessionId: number, inputs: AttestedBox[]) {
  for (const input of inputs) {
    for (const frame of input.frames) {
      await device.send(
        CLA,
        COMMAND.SIGN_TX,
        P1.ADD_INPUT_BOX_FRAME,
        sessionId,
        frame.bytes
      );
    }

    if (input.extension !== undefined && input.extension.length > 0) {
      await sendBoxContextExtension(device, sessionId, input.extension);
    }
  }
}

async function sendBoxContextExtension(
  device: Device,
  sessionId: number,
  extension: Uint8Array
) {
  await device.sendData(
    CLA,
    COMMAND.SIGN_TX,
    P1.ADD_INPUT_BOX_CONTEXT_EXTENSION_CHUNK,
    sessionId,
    extension
  );
}

async function sendDataInputs(device: Device, sessionId: number, boxIds: string[]) {
  const chunks = chunk(boxIds, Math.floor(MAX_DATA_LENGTH / HASH_SIZE));
  for (const chunk of chunks) {
    const data = new ByteWriter(chunk.length * HASH_SIZE);
    for (const id of chunk) data.writeHex(id);

    await device.send(
      CLA,
      COMMAND.SIGN_TX,
      P1.ADD_DATA_INPUTS,
      sessionId,
      data.toBytes()
    );
  }
}

async function sendOutputs(
  device: Device,
  sessionId: number,
  boxes: BoxCandidate[],
  changeMap: ChangeMap,
  distinctTokenIds: Uint8Array[]
) {
  const distinctTokenIdsStr = distinctTokenIds.map((t) => Buffer.from(t).toString("hex"));

  for (const box of boxes) {
    await device.send(
      CLA,
      COMMAND.SIGN_TX,
      P1.ADD_OUTPUT_BOX_START,
      sessionId,
      new ByteWriter(ADD_OUTPUT_HEADER_SIZE)
        .writeUInt64(box.value)
        .writeUInt32(box.ergoTree.length)
        .writeUInt32(box.creationHeight)
        .writeUInt8(box.tokens.length)
        .writeUInt32(box.registers.length)
        .toBytes()
    );

    const tree = hex.encode(box.ergoTree);
    if (tree === MINER_FEE_TREE) {
      await addOutputBoxMinersFeeTree(device, sessionId);
    } else if (ErgoAddress.fromErgoTree(tree).toString() === changeMap.address) {
      await addOutputBoxChangePath(device, sessionId, changeMap.path);
    } else {
      await addOutputBoxErgoTree(device, sessionId, box.ergoTree);
    }

    if (box.tokens && box.tokens.length > 0) {
      await addOutputBoxTokens(device, sessionId, box.tokens, distinctTokenIdsStr);
    }

    if (box.registers.length > 0) {
      await addOutputBoxRegisters(device, sessionId, box.registers);
    }
  }
}

async function addOutputBoxErgoTree(
  device: Device,
  sessionId: number,
  ergoTree: Uint8Array
) {
  await device.sendData(
    CLA,
    COMMAND.SIGN_TX,
    P1.ADD_OUTPUT_BOX_ERGO_TREE_CHUNK,
    sessionId,
    ergoTree
  );
}

async function addOutputBoxMinersFeeTree(device: Device, sessionId: number) {
  await device.send(
    CLA,
    COMMAND.SIGN_TX,
    P1.ADD_OUTPUT_BOX_MINERS_FEE_TREE,
    sessionId,
    EMPTY_BYTES
  );
}

async function addOutputBoxChangePath(device: Device, sessionId: number, path: string) {
  await device.send(
    CLA,
    COMMAND.SIGN_TX,
    P1.ADD_OUTPUT_BOX_CHANGE_TREE,
    sessionId,
    new ByteWriter(ADD_OUTPUT_CHANGE_PATH_SIZE).writePath(path).toBytes()
  );
}

async function addOutputBoxTokens(
  device: Device,
  sessionId: number,
  tokens: Token[],
  distinctTokenIds: string[]
) {
  const chunks = chunk(tokens, Math.floor(MAX_DATA_LENGTH / ADD_OUTPUT_TOKEN_SIZE));
  for (const chunk of chunks) {
    const data = new ByteWriter(chunk.length * ADD_OUTPUT_TOKEN_SIZE);
    for (const token of chunk) {
      data.writeUInt32(distinctTokenIds.indexOf(token.id)).writeUInt64(token.amount);
    }

    await device.send(
      CLA,
      COMMAND.SIGN_TX,
      P1.ADD_OUTPUT_BOX_TOKENS,
      sessionId,
      data.toBytes()
    );
  }
}

async function addOutputBoxRegisters(
  device: Device,
  sessionId: number,
  registers: Uint8Array
) {
  await device.sendData(
    CLA,
    COMMAND.SIGN_TX,
    P1.ADD_OUTPUT_BOX_REGISTERS_CHUNK,
    sessionId,
    registers
  );
}

async function sendConfirmAndSign(
  device: Device,
  sessionId: number
): Promise<Uint8Array> {
  const response = await device.send(
    CLA,
    COMMAND.SIGN_TX,
    P1.CONFIRM_AND_SIGN,
    sessionId,
    EMPTY_BYTES
  );

  return response.data;
}
