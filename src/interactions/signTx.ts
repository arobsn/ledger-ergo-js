import AttestedBox from "../models/attestedBox";
import Serialize from "../serialization/serialize";
import { UnsignedTx } from "../types/public";
import Device, { COMMAND } from "./common/device";

const enum P1 {
  START_SIGNING = 0x01,
  ADD_TOKEN_IDS = 0x02,
  ADD_INPUT_BOX_FRAME = 0x03,
  ADD_INPUT_BOX_CONTEXT_EXTENSION_CHUNK = 0x04,
  ADD_DATA_INPUTS = 0x05,
  ADD_OUTPUT_BOX_START = 0x06,
  ADD_OUTPUT_BOX_ERGO_TREE_CHUNK = 0x07,
  ADD_OUTPUT_BOX_MINERS_FEE_TREE = 0x08,
  ADD_OUTPUT_BOX_CHANGE_TREE = 0x09,
  ADD_OUTPUT_BOX_TOKENS = 0x0a,
  ADD_OUTPUT_BOX_REGISTERS_CHUNK = 0x0b,
  CONFIRM = 0x0c,
  P2PK_SIGN = 0x0d,
}

const enum P2 {
  WITHOUT_TOKEN = 0x01,
  WITH_TOKEN = 0x02,
}

export async function signTx(device: Device, tx: UnsignedTx, authToken?: number) {
  const uniqueTokenIds = getUniqueTokenIds(tx.inputs);
  const sessionId = await sendHeader(device, tx, uniqueTokenIds.length, authToken);
  if (uniqueTokenIds.length > 0) {
    await sendTokensIds(device, uniqueTokenIds, sessionId);
  }
  await sendInputs(device, tx.inputs, sessionId);
}

async function sendHeader(
  device: Device,
  tx: UnsignedTx,
  uniqueTokenIdsCount: number,
  authToken?: number
): Promise<number> {
  const header = Buffer.concat([
    Serialize.uint16(tx.inputs.length),
    Serialize.uint16(tx.dataInputBoxIds.length),
    Serialize.uint8(uniqueTokenIdsCount),
    Serialize.uint16(tx.outputs.length),
    authToken ? Serialize.uint32(authToken) : Buffer.alloc(0),
  ]);

  const response = await device.send(
    COMMAND.SIGN_TX,
    P1.START_SIGNING,
    authToken ? P2.WITH_TOKEN : P2.WITHOUT_TOKEN,
    header
  );
  return response.data[0];
}

async function sendTokensIds(device: Device, ids: string[], sessionId: number): Promise<void> {
  const MAX_PACKET_SIZE = 10;
  const packets = Serialize.array(ids, MAX_PACKET_SIZE, (id) => Serialize.hex(id));

  for (let p of packets) {
    await device.send(COMMAND.SIGN_TX, P1.ADD_TOKEN_IDS, sessionId, p);
  }
}

async function sendInputs(device: Device, inputBoxes: AttestedBox[], sessionId: number) {
  for (let box of inputBoxes) {
    for (let frame of box.frames) {
      await device.send(COMMAND.SIGN_TX, P1.ADD_INPUT_BOX_FRAME, sessionId, frame.raw);
    }

    if (box.extension !== undefined && box.extension.length > 0) {
      sendBoxContextExtension(device, box.extension, sessionId);
    }
  }
}

async function sendBoxContextExtension(device: Device, extension: Buffer, sessionId: number) {
  device.sendData(COMMAND.SIGN_TX, P1.ADD_INPUT_BOX_CONTEXT_EXTENSION_CHUNK, sessionId, extension);
}

async function sendDataInputs(device: Device, boxIds: string[], sessionId: number) {
  const MAX_PACKET_SIZE = 7;
  const packets = Serialize.array(boxIds, MAX_PACKET_SIZE, (id) => Serialize.hex(id));

  for (let p of packets) {
    await device.send(COMMAND.SIGN_TX, P1.ADD_DATA_INPUTS, sessionId, p);
  }
}

function getUniqueTokenIds(boxes: AttestedBox[]): string[] {
  return boxes
    .map((b) => b.frames.map((f) => f.tokens.map((t) => t.id)))
    .flat(2)
    .filter((v, i, a) => a.indexOf(v) === i);
}
