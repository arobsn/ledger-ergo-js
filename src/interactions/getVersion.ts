import { Version } from "../types/public";
import { INS } from "./common/ins";
import Device from "./common/device";

const FLAG_IS_DEBUG = 0x01;

const enum P1 {
  UNUSED = 0x00,
}

const enum P2 {
  UNUSED = 0x00,
}

export async function getAppVersion(device: Device): Promise<Version> {
  const response = await device.send(INS.GET_APP_VERSION, P1.UNUSED, P2.UNUSED, Buffer.from([]));

  return {
    major: response.data[0],
    minor: response.data[1],
    patch: response.data[2],
    flags: { isDebug: response.data[3] == FLAG_IS_DEBUG },
  };
}
