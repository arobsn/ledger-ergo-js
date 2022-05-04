import Device, { COMMAND } from "./common/device";
import { AttestedBoxFrame, UnsignedBox, Token } from "../types/public";
import type { DeviceResponse } from "../types/internal";
import AttestedBox from "../models/attestedBox";
import Serialize from "../serialization/serialize";
import Deserialize from "../serialization/deserialize";

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

async function sendHeader(device: Device, box: UnsignedBox, authToken?: number): Promise<number> {
  const header = Buffer.concat([
    Serialize.hex(box.txId),
    Serialize.uint16(box.index),
    Serialize.uint64(box.value),
    Serialize.uint32(box.ergoTree.length),
    Serialize.uint32(box.creationHeight),
    Serialize.uint8(box.tokens.length),
    Serialize.uint32(box.additionalRegisters.length),
    authToken ? Serialize.uint32(authToken) : Buffer.alloc(0)
  ]);

  const response = await device.send(
    COMMAND.ATTEST_INPUT,
    P1.BOX_START,
    authToken ? P2.WITH_TOKEN : P2.WITHOUT_TOKEN,
    header
  );
  return response.data[0];
}

async function sendErgoTree(device: Device, data: Buffer, sessionId: number): Promise<number> {
  const results = await device.sendData(
    COMMAND.ATTEST_INPUT,
    P1.ADD_ERGO_TREE_CHUNK,
    sessionId,
    data
  );

  return results.pop()?.data[0] || 0;
}

async function sendTokens(device: Device, tokens: Token[], sessionId: number): Promise<number> {
  const MAX_PACKET_SIZE = 6;
  const packets = Serialize.arrayAndChunk(tokens, MAX_PACKET_SIZE, (t) =>
    Buffer.concat([Serialize.hex(t.id), Serialize.uint64(t.amount)])
  );

  const results: DeviceResponse[] = [];
  for (let p of packets) {
    results.push(await device.send(COMMAND.ATTEST_INPUT, P1.ADD_TOKENS, sessionId, p));
  }

  return results.pop()?.data[0] || 0;
}

async function sendRegisters(device: Device, data: Buffer, sessionId: number): Promise<number> {
  const results = await device.sendData(
    COMMAND.ATTEST_INPUT,
    P1.ADD_REGISTERS_CHUNK,
    sessionId,
    data
  );

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

    responses.push(parseAttestedFrameResponse(response.data));
  }

  return responses;
}

export function parseAttestedFrameResponse(frameBuff: Buffer): AttestedBoxFrame {
  let offset = 0;
  const boxId = Deserialize.hex(frameBuff.slice(offset, (offset += 32)));
  const count = Deserialize.uint8(frameBuff.slice(offset, (offset += 1)));
  const index = Deserialize.uint8(frameBuff.slice(offset, (offset += 1)));
  const amount = Deserialize.uint64(frameBuff.slice(offset, (offset += 8)));
  const tokenCount = Deserialize.uint8(frameBuff.slice(offset, (offset += 1)));

  const tokens: Token[] = [];
  for (let i = 0; i < tokenCount; i++) {
    tokens.push({
      id: Deserialize.hex(frameBuff.slice(offset, (offset += 32))),
      amount: Deserialize.uint64(frameBuff.slice(offset, (offset += 8)))
    });
  }

  const attestation = Deserialize.hex(frameBuff.slice(offset, (offset += 16)));

  return {
    boxId,
    framesCount: count,
    frameIndex: index,
    amount,
    tokens,
    attestation,
    buffer: frameBuff
  };
}
