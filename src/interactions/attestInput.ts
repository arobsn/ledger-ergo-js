import { chunk, isEmpty } from "@fleet-sdk/common";
import { hex } from "@fleet-sdk/crypto";
import { COMMAND, type Device, MAX_DATA_LENGTH } from "../device";
import { ByteWriter } from "../serialization/byteWriter";
import { AttestedBox } from "../types/attestedBox";
import type { DeviceResponse } from "../types/internal";
import type { AttestedBoxFrame, Token, UnsignedBox } from "../types/public";

const enum P1 {
  BOX_START = 0x01,
  ADD_ERGO_TREE_CHUNK = 0x02,
  ADD_TOKENS = 0x03,
  ADD_REGISTERS_CHUNK = 0x04,
  GET_ATTESTED_BOX_FRAME = 0x05
}

const enum P2 {
  WITHOUT_TOKEN = 0x01,
  WITH_TOKEN = 0x02
}

const MAX_HEADER_SIZE = 59; // https://github.com/tesseract-one/ledger-app-ergo/blob/main/doc/INS-20-ATTEST-BOX.md#data
const TOKEN_ENTRY_SIZE = 40; // https://github.com/tesseract-one/ledger-app-ergo/blob/main/doc/INS-20-ATTEST-BOX.md#data-2

export async function attestInput(
  device: Device,
  box: UnsignedBox,
  authToken?: number
): Promise<AttestedBox> {
  const sessionId = await sendHeader(device, box, authToken);
  let frameCount = await sendErgoTree(device, box.ergoTree, sessionId);
  if (box.tokens.length > 0) {
    frameCount = await sendTokens(device, box.tokens, sessionId);
  }
  if (box.additionalRegisters.length > 0) {
    frameCount = await sendRegisters(device, box.additionalRegisters, sessionId);
  }

  return new AttestedBox(box, await getAttestedFrames(device, frameCount, sessionId));
}

async function sendHeader(
  device: Device,
  box: UnsignedBox,
  authToken?: number
): Promise<number> {
  const header = new ByteWriter(MAX_HEADER_SIZE)
    .writeHex(box.txId)
    .writeUInt16(box.index)
    .writeUInt64(box.value)
    .writeUInt32(box.ergoTree.length)
    .writeUInt32(box.creationHeight)
    .writeUInt8(box.tokens.length)
    .writeUInt32(box.additionalRegisters.length)
    .writeAuthToken(authToken)
    .toBytes();

  const response = await device.send(
    COMMAND.ATTEST_INPUT,
    P1.BOX_START,
    authToken ? P2.WITH_TOKEN : P2.WITHOUT_TOKEN,
    header
  );

  return response.data[0];
}

async function sendErgoTree(
  device: Device,
  data: Uint8Array,
  sessionId: number
): Promise<number> {
  const results = await device.sendData(
    COMMAND.ATTEST_INPUT,
    P1.ADD_ERGO_TREE_CHUNK,
    sessionId,
    data
  );

  return results.pop()?.data[0] || 0;
}

async function sendTokens(
  device: Device,
  tokens: Token[],
  sessionId: number
): Promise<number> {
  if (isEmpty(tokens)) return 0;

  const chunks = chunk(tokens, Math.floor(MAX_DATA_LENGTH / TOKEN_ENTRY_SIZE));
  const results: DeviceResponse[] = [];

  for (const chunk of chunks) {
    const data = new ByteWriter(chunk.length * TOKEN_ENTRY_SIZE);
    for (const token of chunk) data.writeHex(token.id).writeUInt64(token.amount);

    results.push(
      await device.send(COMMAND.ATTEST_INPUT, P1.ADD_TOKENS, sessionId, data.toBytes())
    );
  }

  /* v8 ignore next */
  return results.pop()?.data[0] || 0;
}

async function sendRegisters(
  device: Device,
  data: Uint8Array,
  sessionId: number
): Promise<number> {
  const results = await device.sendData(
    COMMAND.ATTEST_INPUT,
    P1.ADD_REGISTERS_CHUNK,
    sessionId,
    data
  );

  /* v8 ignore next */
  return results.pop()?.data[0] || 0;
}

async function getAttestedFrames(
  device: Device,
  count: number,
  sessionId: number
): Promise<AttestedBoxFrame[]> {
  const responses: AttestedBoxFrame[] = [];
  for (let i = 0; i < count; i++) {
    const response = await device.send(
      COMMAND.ATTEST_INPUT,
      P1.GET_ATTESTED_BOX_FRAME,
      sessionId,
      Uint8Array.from([i])
    );

    responses.push(decodeAttestedFrameResponse(response.data));
  }

  return responses;
}

export function decodeAttestedFrameResponse(bytes: Buffer): AttestedBoxFrame {
  let offset = 0;
  const boxId = hex.encode(bytes.subarray(0, (offset += 32)));
  const count = bytes.readUint8(offset++);
  const index = bytes.readUint8(offset++);
  const amount = bytes.readBigUInt64BE(offset).toString();
  offset += 8;
  const tokenCount = bytes.readUint8(offset++);
  const tokens: Token[] = [];
  for (let i = 0; i < tokenCount; i++) {
    tokens.push({
      id: hex.encode(bytes.subarray(offset, (offset += 32))),
      amount: bytes.readBigUInt64BE(offset).toString()
    });
    offset += 8;
  }

  const attestation = hex.encode(bytes.subarray(offset, offset + 16));

  return {
    boxId,
    count,
    index,
    amount,
    tokens,
    attestation,
    bytes
  };
}
