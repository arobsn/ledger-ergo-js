import { getErrorMessage } from "./errorCodes";

export class DeviceError extends Error {
  private _code;

  public get code() {
    return this._code;
  }

  constructor(code: number) {
    super(getErrorMessage(code));
    this._code = code;
    this.name = this.constructor.name;
  }
}
