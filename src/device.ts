import type Transport from "@ledgerhq/hw-transport";
import type { DeviceResponse } from "./types/internal";
import type { Buffer } from "buffer";
import { ByteWriter } from "./serialization/byteWriter";

export const enum COMMAND {
  GET_APP_VERSION = 0x01,
  GET_APP_NAME = 0x02,

  GET_EXTENDED_PUB_KEY = 0x10,
  DERIVE_ADDRESS = 0x11,
  ATTEST_INPUT = 0x20,
  SIGN_TX = 0x21
}

export const MAX_DATA_LENGTH = 255;
const MIN_RESPONSE_LENGTH = 2;
const MIN_APDU_LENGTH = 5;

export class Device {
  #transport: Transport;
  #cla: number;

  get transport(): Transport {
    return this.#transport;
  }

  constructor(transport: Transport, cla: number) {
    this.#transport = transport;
    this.#cla = cla;
  }

  async sendData(
    ins: COMMAND,
    p1: number,
    p2: number,
    data: Uint8Array
  ): Promise<DeviceResponse[]> {
    const responses: DeviceResponse[] = [];
    for (let i = 0; i < Math.ceil(data.length / MAX_DATA_LENGTH); i++) {
      const chunk = data.slice(
        i * MAX_DATA_LENGTH,
        Math.min((i + 1) * MAX_DATA_LENGTH, data.length)
      );

      responses.push(await this.send(ins, p1, p2, chunk));
    }

    return responses;
  }

  async send(
    ins: COMMAND,
    p1: number,
    p2: number,
    data: Uint8Array
  ): Promise<DeviceResponse> {
    if (data.length > MAX_DATA_LENGTH) {
      throw new DeviceError(RETURN_CODE.TOO_MUCH_DATA);
    }

    const apdu = mountApdu(this.#cla, ins, p1, p2, data);
    const response = await this.transport.exchange(apdu);

    if (response.length < MIN_RESPONSE_LENGTH) {
      throw new DeviceError(RETURN_CODE.WRONG_RESPONSE_LENGTH);
    }
    const returnCode = response.readUInt16BE(response.length - 2);
    if (returnCode !== RETURN_CODE.OK) throw new DeviceError(returnCode);

    const responseData = response.subarray(0, response.length - 2);
    return { returnCode, data: responseData };
  }
}

function mountApdu(
  cla: number,
  ins: COMMAND,
  p1: number,
  p2: number,
  data: Uint8Array
): Buffer {
  return new ByteWriter(MIN_APDU_LENGTH + data.length)
    .write(cla)
    .write(ins)
    .write(p1)
    .write(p2)
    .write(data.length)
    .writeBytes(data)
    .toBuffer();
}

export class DeviceError extends Error {
  #code;

  get code() {
    return this.#code;
  }

  constructor(code: RETURN_CODE, options?: ErrorOptions) {
    super(RETURN_MESSAGES[code] || "Unknown error", options);
    this.#code = code;

    Object.setPrototypeOf(this, new.target.prototype);
    this.name = new.target.name;
  }
}

export enum RETURN_CODE {
  DENIED = 0x6985,
  WRONG_P1P2 = 0x6a86,
  WRONG_APDU_DATA_LENGTH = 0x6a87,
  INS_NOT_SUPPORTED = 0x6d00,
  CLA_NOT_SUPPORTED = 0x6e00,
  BUSY = 0xb000,
  WRONG_RESPONSE_LENGTH = 0xb001,
  BAD_SESSION_ID = 0xb002,
  WRONG_SUBCOMMAND = 0xb003,
  BAD_STATE = 0xb0ff,
  BAD_TOKEN_ID = 0xe001,
  BAD_TOKEN_VALUE = 0xe002,
  BAD_CONTEXT_EXTENSION_SIZE = 0xe003,
  BAD_DATA_INPUT = 0xe004,
  BAD_BOX_ID = 0xe005,
  BAD_TOKEN_INDEX = 0xe006,
  BAD_FRAME_INDEX = 0xe007,
  BAD_INPUT_COUNT = 0xe008,
  BAD_OUTPUT_COUNT = 0xe009,
  TOO_MANY_TOKENS = 0xe00a,
  TOO_MANY_INPUTS = 0xe00b,
  TOO_MANY_DATA_INPUTS = 0xe00c,
  TOO_MANY_INPUT_FRAMES = 0xe00d,
  TOO_MANY_OUTPUTS = 0xe00e,
  HASHER_ERROR = 0xe00f,
  BUFFER_ERROR = 0xe010,
  U64_OVERFLOW = 0xe011,
  BIP32_BAD_PATH = 0xe012,
  INTERNAL_CRYPTO_ERROR = 0xe013,
  NOT_ENOUGH_DATA = 0xe014,
  TOO_MUCH_DATA = 0xe015,
  ADDRESS_GENERATION_FAILED = 0xe016,
  SCHNORR_SIGNING_FAILED = 0xe017,
  BAD_FRAME_SIGNATURE = 0xe018,
  BAD_NET_TYPE_VALUE = 0xe019,
  SW_SMALL_CHUNK = 0xe01a,
  BIP32_FORMATTING_FAILED = 0xe101,
  ADDRESS_FORMATTING_FAILED = 0xe102,
  STACK_OVERFLOW = 0xffff,
  OK = 0x9000
}

export const RETURN_MESSAGES = {
  [RETURN_CODE.DENIED]: "Operation denied by user",
  [RETURN_CODE.WRONG_P1P2]: "Incorrect P1 or P2",
  [RETURN_CODE.WRONG_APDU_DATA_LENGTH]: "Bad APDU length",
  [RETURN_CODE.INS_NOT_SUPPORTED]: "Instruction isn't supported",
  [RETURN_CODE.CLA_NOT_SUPPORTED]: "CLA is not supported",
  [RETURN_CODE.BUSY]: "Device is busy",
  [RETURN_CODE.WRONG_RESPONSE_LENGTH]: "Wrong response length",
  [RETURN_CODE.BAD_SESSION_ID]: "Bad session id",
  [RETURN_CODE.WRONG_SUBCOMMAND]: "Unknown subcommand",
  [RETURN_CODE.BAD_STATE]: "Bad state (check order of calls and errors)",
  [RETURN_CODE.BAD_TOKEN_ID]: "Bad token ID",
  [RETURN_CODE.BAD_TOKEN_VALUE]: "Bad token value",
  [RETURN_CODE.BAD_CONTEXT_EXTENSION_SIZE]: "Bad context extension size",
  [RETURN_CODE.BAD_DATA_INPUT]: "Bad data input ID",
  [RETURN_CODE.BAD_BOX_ID]: "Bad box ID",
  [RETURN_CODE.BAD_TOKEN_INDEX]: "Bad token index",
  [RETURN_CODE.BAD_FRAME_INDEX]: "Bad frame index",
  [RETURN_CODE.BAD_INPUT_COUNT]: "Bad input count",
  [RETURN_CODE.BAD_OUTPUT_COUNT]: "Bad output count",
  [RETURN_CODE.TOO_MANY_TOKENS]: "Too many tokens",
  [RETURN_CODE.TOO_MANY_INPUTS]: "Too many inputs",
  [RETURN_CODE.TOO_MANY_DATA_INPUTS]: "Too many data inputs",
  [RETURN_CODE.TOO_MANY_INPUT_FRAMES]: "Too many input frames",
  [RETURN_CODE.TOO_MANY_OUTPUTS]: "Too many outputs",
  [RETURN_CODE.HASHER_ERROR]: "Hasher internal error",
  [RETURN_CODE.BUFFER_ERROR]: "Buffer internal error",
  [RETURN_CODE.U64_OVERFLOW]: "UInt64 overflow",
  [RETURN_CODE.BIP32_BAD_PATH]: "Bad Bip32 path",
  [RETURN_CODE.INTERNAL_CRYPTO_ERROR]: "Internal crypto engine error",
  [RETURN_CODE.NOT_ENOUGH_DATA]: "Not enough data",
  [RETURN_CODE.TOO_MUCH_DATA]: "Too much data",
  [RETURN_CODE.ADDRESS_GENERATION_FAILED]: "Address generation failed",
  [RETURN_CODE.SCHNORR_SIGNING_FAILED]: "Schnorr signing failed",
  [RETURN_CODE.BAD_FRAME_SIGNATURE]: "Bad frame signature",
  [RETURN_CODE.BAD_NET_TYPE_VALUE]: "Bad network type value",
  [RETURN_CODE.SW_SMALL_CHUNK]: "Bad chunk size",
  [RETURN_CODE.BIP32_FORMATTING_FAILED]: "Can't display Bip32 path",
  [RETURN_CODE.ADDRESS_FORMATTING_FAILED]: "Can't display address",
  [RETURN_CODE.STACK_OVERFLOW]: "Stack overflow",
  [RETURN_CODE.OK]: "Ok"
};
