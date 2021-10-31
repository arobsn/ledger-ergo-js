import { getReturnMessage } from "./returnCodes";

export class DeviceError extends Error {
  private _code;

  public get code() {
    return this._code;
  }

  constructor(code: number) {
    super(getReturnMessage(code));
    this._code = code;
    this.name = this.constructor.name;
  }
}
