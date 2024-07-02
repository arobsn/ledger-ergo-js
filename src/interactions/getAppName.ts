import { COMMAND, type Device } from "../device";
import type { AppName } from "../types/public";
import { EMPTY_BYTES } from "../serialization/utils";

const enum P1 {
  UNUSED = 0x00
}

const enum P2 {
  UNUSED = 0x00
}

export async function getAppName(device: Device): Promise<AppName> {
  const response = await device.send(
    COMMAND.GET_APP_NAME,
    P1.UNUSED,
    P2.UNUSED,
    EMPTY_BYTES
  );
  return { name: String.fromCharCode(...response.data) };
}
