import type Transport from "@ledgerhq/hw-transport";
import { DeviceError } from "../../errors/deviceError";
import { DeviceResponse, RETURN_CODE } from "../../types/internal";
import { INS } from "./ins";

const MAX_DATA_LENGTH = 255;
const MIN_RESPONSE_LENGTH = 2;

export default class Device {
  private _transport: Transport;
  private _cla: number;

  public get Transport(): Transport {
    return this._transport;
  }

  constructor(transport: Transport, cla: number) {
    this._transport = transport;
    this._cla = cla;
  }

  public async send(ins: INS, p1: number, p2: number, data: Buffer): Promise<DeviceResponse> {
    if (data.length <= MAX_DATA_LENGTH) {
      return this.sendChunck(ins, p1, p2, data);
    }

    let responses: Buffer[] = [];
    let returnCode = RETURN_CODE.OK;
    for (let i = 0; i < Math.ceil(data.length / MAX_DATA_LENGTH); i++) {
      const chunk = data.slice(
        i * MAX_DATA_LENGTH,
        Math.min((i + 1) * MAX_DATA_LENGTH, data.length)
      );

      const response = await this.sendChunck(ins, p1, p2, chunk);
      returnCode = response.returnCode;
      responses.push(response.data);
    }

    return { returnCode, data: Buffer.concat(responses) };
  }

  private async sendChunck(
    ins: INS,
    p1: number,
    p2: number,
    data: Buffer
  ): Promise<DeviceResponse> {
    if (data.length > MAX_DATA_LENGTH) {
      throw new DeviceError(RETURN_CODE.TOO_MUCH_DATA);
    }

    const apdu = this.mountApdu(this._cla, ins, p1, p2, data);
    const response = await this.Transport.exchange(apdu);

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

  private mountApdu(cla: number, ins: INS, p1: number, p2: number, data: Buffer): Buffer {
    const header = Buffer.alloc(5);
    header.writeUInt8(cla, 0);
    header.writeUInt8(ins, 1);
    header.writeUInt8(p1, 2);
    header.writeUInt8(p2, 3);
    header.writeUInt8(data.length, 4);

    return Buffer.concat([header, data]);
  }
}
