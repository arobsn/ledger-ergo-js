import type Transport from "@ledgerhq/hw-transport";
import { DeviceError } from "../../errors/deviceError";
import { RETURN_CODE } from "../../errors";
import { DeviceResponse } from "../../types/internal";
import Serialize from "../../serialization/serialize";

export const enum COMMAND {
  GET_APP_VERSION = 0x01,
  GET_APP_NAME = 0x02,

  GET_EXTENTED_PUB_KEY = 0x10,
  DERIVE_ADDRESS = 0x11,
  ATTEST_INPUT = 0x20,
  SIGN_TX = 0x21
}

const MAX_DATA_LENGTH = 255;
const MIN_RESPONSE_LENGTH = 2;

export default class Device {
  private _transport: Transport;
  private _cla: number;

  public get transport(): Transport {
    return this._transport;
  }

  constructor(transport: Transport, cla: number) {
    this._transport = transport;
    this._cla = cla;
  }

  public async sendData(
    ins: COMMAND,
    p1: number,
    p2: number,
    data: Buffer
  ): Promise<DeviceResponse[]> {
    let responses: DeviceResponse[] = [];
    for (let i = 0; i < Math.ceil(data.length / MAX_DATA_LENGTH); i++) {
      const chunk = data.slice(
        i * MAX_DATA_LENGTH,
        Math.min((i + 1) * MAX_DATA_LENGTH, data.length)
      );

      responses.push(await this.send(ins, p1, p2, chunk));
    }

    return responses;
  }

  public async send(ins: COMMAND, p1: number, p2: number, data: Buffer): Promise<DeviceResponse> {
    if (data.length > MAX_DATA_LENGTH) {
      throw new DeviceError(RETURN_CODE.TOO_MUCH_DATA);
    }

    const apdu = this.mountApdu(this._cla, ins, p1, p2, data);
    const response = await this.transport.exchange(apdu);

    if (response.length < MIN_RESPONSE_LENGTH) {
      throw new DeviceError(RETURN_CODE.WRONG_RESPONSE_LENGTH);
    }
    const returnCode = response.readUInt16BE(response.length - 2);
    if (returnCode != RETURN_CODE.OK) {
      throw new DeviceError(returnCode);
    }

    const responseData = response.slice(0, response.length - 2);
    return { returnCode, data: responseData };
  }

  private mountApdu(cla: number, ins: COMMAND, p1: number, p2: number, data: Buffer): Buffer {
    return Buffer.concat([
      Serialize.uint8(cla),
      Serialize.uint8(ins),
      Serialize.uint8(p1),
      Serialize.uint8(p2),
      Serialize.uint8(data.length),
      data
    ]);
  }
}
