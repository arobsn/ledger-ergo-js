export enum RETURN_CODE {
  TOO_MUCH_DATA = 0xe015,
  WRONG_RESPONSE_LENGTH = 0xb001,
  OK = 0x9000,
}

export type DeviceResponse = {
  data: Buffer;
  returnCode: RETURN_CODE;
};
