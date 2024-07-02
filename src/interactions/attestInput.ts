import { COMMAND, type Device } from "../device";
import type { AttestedBoxFrame, UnsignedBox, Token } from "../types/public";
import type { DeviceResponse } from "../types/internal";
import { serialize } from "../serialization/serialize";
import { deserialize } from "../serialization/deserialize";
import { AttestedBox } from "../types/attestedBox";
import { Buffer } from "buffer";

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
  const header = Buffer.concat([
    serialize.hex(box.txId),
    serialize.uint16(box.index),
    serialize.uint64(box.value),
    serialize.uint32(box.ergoTree.length),
    serialize.uint32(box.creationHeight),
    serialize.uint8(box.tokens.length),
    serialize.uint32(box.additionalRegisters.length),
    authToken ? serialize.uint32(authToken) : Buffer.alloc(0)
  ]);

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
    Buffer.from(data)
  );

  return results.pop()?.data[0] || 0;
}

async function sendTokens(
  device: Device,
  tokens: Token[],
  sessionId: number
): Promise<number> {
  const MAX_PACKET_SIZE = 6;
  const packets = serialize.arrayAsMappedChunks(tokens, MAX_PACKET_SIZE, (t) =>
    Buffer.concat([serialize.hex(t.id), serialize.uint64(t.amount)])
  );

  const results: DeviceResponse[] = [];
  for (const p of packets) {
    results.push(await device.send(COMMAND.ATTEST_INPUT, P1.ADD_TOKENS, sessionId, p));
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
    Buffer.from(data)
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
      Buffer.from([i])
    );

    responses.push(decodeAttestedFrameResponse(response.data));
  }

  return responses;
}

export function decodeAttestedFrameResponse(bytes: Buffer): AttestedBoxFrame {
  let offset = 0;
  const boxId = deserialize.hex(bytes.slice(offset, (offset += 32)));
  const count = deserialize.uint8(bytes.slice(offset, (offset += 1)));
  const index = deserialize.uint8(bytes.slice(offset, (offset += 1)));
  const amount = deserialize.uint64(bytes.slice(offset, (offset += 8)));
  const tokenCount = deserialize.uint8(bytes.slice(offset, (offset += 1)));

  const tokens: Token[] = [];
  for (let i = 0; i < tokenCount; i++) {
    tokens.push({
      id: deserialize.hex(bytes.slice(offset, (offset += 32))),
      amount: deserialize.uint64(bytes.slice(offset, (offset += 8)))
    });
  }

  const attestation = deserialize.hex(bytes.slice(offset, (offset += 16)));

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
