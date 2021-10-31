import { RETURN_CODE } from "../errors";

export type DeviceResponse = {
  data: Buffer;
  returnCode: RETURN_CODE;
};
