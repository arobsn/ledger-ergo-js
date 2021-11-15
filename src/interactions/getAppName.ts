import Device, { COMMAND } from "./common/device";
import { AppName } from "../types/public";
import Deserialize from "../serialization/deserialize";

const enum P1 {
  UNUSED = 0x00,
}

const enum P2 {
  UNUSED = 0x00,
}

export async function getAppName(device: Device): Promise<AppName> {
  const response = await device.send(COMMAND.GET_APP_NAME, P1.UNUSED, P2.UNUSED, Buffer.from([]));
  return { name: Deserialize.ascii(response.data) };
}
