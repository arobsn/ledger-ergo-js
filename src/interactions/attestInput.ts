import { Box, Token } from "../erg";
import Device, { COMMAND } from "./common/device";
import { serializeAuthToken, uint64StringToBuffer } from "./common/serialization";
import type { DeviceResponse } from "../types/internal";

const enum P1 {
  BOX_START = 0x01,
  ADD_ERGO_TREE_CHUNK = 0x02,
  ADD_TOKENS = 0x03,
  ADD_REGISTERS_CHUNK = 0x04,
  GET_ATTESTED_BOX_FRAME = 0x05,
}

const enum P2 {
  WITHOUT_TOKEN = 0x01,
  WITH_TOKEN = 0x02,
}

export async function attestInput(device: Device, box: Box, authToken?: number): Promise<Buffer[]> {
  const sessionId = await sendHeader(device, box, authToken);
  let frameCount = await sendErgoTree(device, box.ergoTree, sessionId);
  if (box.tokens.length > 0) {
    frameCount = await sendTokens(device, box.tokens, sessionId);
  }
  if (box.additionalRegisters.length > 0) {
    frameCount = await sendRegisters(device, box.additionalRegisters, sessionId);
  }

  const frames = await getAttestedFrames(device, frameCount, sessionId);
  return frames;
}

async function sendHeader(device: Device, box: Box, authToken?: number): Promise<number> {
  let header = Buffer.alloc(0x37);
  let offset = 0;
  Buffer.from(box.txId, "hex").copy(header, offset);
  header.writeUInt16BE(box.index, (offset += 32));
  uint64StringToBuffer(box.value).copy(header, (offset += 2));
  header.writeUInt32BE(box.ergoTree.length, (offset += 8));
  header.writeUInt32BE(box.creationHeight, (offset += 4));
  header.writeUInt8(box.tokens.length, (offset += 4));
  header.writeUInt32BE(box.additionalRegisters.length, (offset += 1));

  const response = await device.send(
    COMMAND.ATTEST_INPUT,
    P1.BOX_START,
    authToken ? P2.WITH_TOKEN : P2.WITHOUT_TOKEN,
    authToken ? Buffer.concat([header, serializeAuthToken(authToken)]) : header
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
  const packets = [];
  for (let i = 0; i < Math.ceil(tokens.length / 6); i++) {
    const chunks = [];
    for (let j = i * 6; j < Math.min((i + 1) * 6, tokens.length); j++) {
      const token = tokens[j];
      const id = Buffer.from(token.id, "hex");
      const value = uint64StringToBuffer(token.amount);
      chunks.push(Buffer.concat([id, value]));
    }
    packets.push(Buffer.concat(chunks));
  }

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
): Promise<Buffer[]> {
  const responses = [];
  for (let i = 0; i < count; i++) {
    const response = await device.send(
      COMMAND.ATTEST_INPUT,
      P1.GET_ATTESTED_BOX_FRAME,
      sessionId,
      Buffer.from([i])
    );

    responses.push(response.data);
  }

  return responses;
}
