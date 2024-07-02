import { COMMAND, type Device } from "../device";
import type { AppName } from "../types/public";
import { deserialize } from "../serialization/deserialize";

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
    Buffer.from([])
  );
  return { name: deserialize.ascii(response.data) };
}
