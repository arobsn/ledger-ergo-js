import { INS } from "./common/ins";
import Device from "./common/device";
import { AppName } from "../types/public";

const enum P1 {
  UNUSED = 0x00,
}

const enum P2 {
  UNUSED = 0x00,
}

export async function getAppName(device: Device): Promise<AppName> {
  const response = await device.send(INS.GET_APP_NAME, P1.UNUSED, P2.UNUSED, Buffer.from([]));
  return { name: response.data.toString("ascii") };
}
