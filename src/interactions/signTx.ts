import AttestedBox from "../models/attestedBox";
import Deserialize from "../serialization/deserialize";
import Serialize from "../serialization/serialize";
import { ChangeMap, BoxCandidate, SignTxResponse, Token, AttestedTx } from "../types/public";
import Device, { COMMAND } from "./common/device";
import { Address } from "@coinbarn/ergo-ts";

const MINER_FEE_TREE =
  "1005040004000e36100204a00b08cd0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798ea02d192a39a8cc7a701730073011001020402d19683030193a38cc7b2a57300000193c2b2a57301007473027303830108cdeeac93b1a57304";

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

export async function signTx(
  device: Device,
  tx: AttestedTx,
  authToken?: number
): Promise<SignTxResponse[]> {
  const uniqueTokenIds = getUniqueTokenIds(tx.inputs);

  const sessionId = await sendHeader(device, tx, uniqueTokenIds.length, authToken);
  if (uniqueTokenIds.length > 0) {
    await sendTokensIds(device, sessionId, uniqueTokenIds);
  }
  await sendInputs(device, sessionId, tx.inputs);
  await sendDataInputs(device, sessionId, tx.dataInputs);
  await sendOutputs(device, sessionId, tx.outputs, tx.changeMap, uniqueTokenIds);
  await sendConfirm(device, sessionId);

  const signs = [] as SignTxResponse[];
  for (const path of tx.signPaths) {
    signs.push({
      path,
      signature: Deserialize.hex(await sendP2PKSign(device, sessionId, path)),
    });
  }

  return signs;
}

async function sendHeader(
  device: Device,
  tx: AttestedTx,
  uniqueTokenIdsCount: number,
  authToken?: number
): Promise<number> {
  const header = Buffer.concat([
    Serialize.uint16(tx.inputs.length),
    Serialize.uint16(tx.dataInputs.length),
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

async function sendTokensIds(device: Device, sessionId: number, ids: string[]): Promise<void> {
  const MAX_PACKET_SIZE = 10;
  const packets = Serialize.arrayAndChunk(ids, MAX_PACKET_SIZE, (id) => Serialize.hex(id));

  for (let p of packets) {
    await device.send(COMMAND.SIGN_TX, P1.ADD_TOKEN_IDS, sessionId, p);
  }
}

async function sendInputs(device: Device, sessionId: number, inputBoxes: AttestedBox[]) {
  for (let box of inputBoxes) {
    for (let frame of box.frames) {
      await device.send(COMMAND.SIGN_TX, P1.ADD_INPUT_BOX_FRAME, sessionId, frame.buffer);
    }

    if (box.extension !== undefined && box.extension.length > 0) {
      await sendBoxContextExtension(device, sessionId, box.extension);
    }
  }
}

async function sendBoxContextExtension(device: Device, sessionId: number, extension: Buffer) {
  device.sendData(COMMAND.SIGN_TX, P1.ADD_INPUT_BOX_CONTEXT_EXTENSION_CHUNK, sessionId, extension);
}

async function sendDataInputs(device: Device, sessionId: number, boxIds: string[]) {
  const MAX_PACKET_SIZE = 7;
  const packets = Serialize.arrayAndChunk(boxIds, MAX_PACKET_SIZE, (id) => Serialize.hex(id));

  for (let p of packets) {
    await device.send(COMMAND.SIGN_TX, P1.ADD_DATA_INPUTS, sessionId, p);
  }
}

async function sendOutputs(
  device: Device,
  sessionId: number,
  boxes: BoxCandidate[],
  changeMap: ChangeMap,
  tokenIds: string[]
) {
  for (let box of boxes) {
    await device.send(
      COMMAND.SIGN_TX,
      P1.ADD_OUTPUT_BOX_START,
      sessionId,
      Buffer.concat([
        Serialize.uint64(box.value),
        Serialize.uint32(box.ergoTree.length),
        Serialize.uint32(box.creationHeight),
        Serialize.uint8(box.tokens.length),
        Serialize.uint32(box.registers.length),
      ])
    );

    const tree = Deserialize.hex(box.ergoTree);
    if (tree === MINER_FEE_TREE) {
      await addOutputBoxMinersFeeTree(device, sessionId);
      console.debug("Add miner box");
    } else if (Address.fromErgoTree(tree).address === changeMap.address) {
      await addOutputBoxChangeTree(device, sessionId, changeMap.path);
      console.debug("Add change box");
    } else {
      await addOutputBoxErgoTree(device, sessionId, box.ergoTree);
      console.debug("Add custom box");
    }

    if (box.tokens && box.tokens.length > 0) {
      await addOutputBoxTokens(device, sessionId, box.tokens, tokenIds);
    }

    if (box.registers.length > 0) {
      await addOutputBoxRegisters(device, sessionId, box.registers);
    }
  }
}

async function addOutputBoxErgoTree(device: Device, sessionId: number, ergoTree: Buffer) {
  await device.sendData(COMMAND.SIGN_TX, P1.ADD_OUTPUT_BOX_ERGO_TREE_CHUNK, sessionId, ergoTree);
}

async function addOutputBoxMinersFeeTree(device: Device, sessionId: number) {
  await device.send(COMMAND.SIGN_TX, P1.ADD_OUTPUT_BOX_MINERS_FEE_TREE, sessionId, Buffer.from([]));
}

async function addOutputBoxChangeTree(device: Device, sessionId: number, path?: string) {
  if (!path) {
    throw new Error("change path is not present");
  }

  await device.send(
    COMMAND.SIGN_TX,
    P1.ADD_OUTPUT_BOX_CHANGE_TREE,
    sessionId,
    Serialize.bip32Path(path)
  );
}

async function addOutputBoxTokens(
  device: Device,
  sessionId: number,
  tokens: Token[],
  tokenIds: string[]
) {
  await device.send(
    COMMAND.SIGN_TX,
    P1.ADD_OUTPUT_BOX_TOKENS,
    sessionId,
    Serialize.array(tokens, (t) =>
      Buffer.concat([Serialize.uint32(tokenIds.indexOf(t.id)), Serialize.uint64(t.amount)])
    )
  );
}

async function addOutputBoxRegisters(device: Device, sessionId: number, registers: Buffer) {
  await device.sendData(COMMAND.SIGN_TX, P1.ADD_OUTPUT_BOX_REGISTERS_CHUNK, sessionId, registers);
}

async function sendConfirm(device: Device, sessionId: number) {
  await device.send(COMMAND.SIGN_TX, P1.CONFIRM, sessionId, Buffer.from([]));
}

async function sendP2PKSign(device: Device, sessionId: number, path: string): Promise<Buffer> {
  const response = await device.send(
    COMMAND.SIGN_TX,
    P1.P2PK_SIGN,
    sessionId,
    Serialize.bip32Path(path)
  );
  return response.data;
}

function getUniqueTokenIds(boxes: AttestedBox[]): string[] {
  return boxes
    .map((b) => b.box.tokens.map((t) => t.id))
    .flat()
    .filter((v, i, a) => a.indexOf(v) === i);
}
