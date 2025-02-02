import { COMMAND, type Device } from "../../device";
import { asciiCodec, EMPTY_BYTES, NO_VALUE } from "../../serialization/utils";
import type { AppName } from "../../types/public";

const CLA = 0xe0;

export async function getAppName(device: Device): Promise<AppName> {
  const response = await device.send(
    CLA,
    COMMAND.GET_APP_NAME,
    NO_VALUE,
    NO_VALUE,
    EMPTY_BYTES
  );
  return { name: asciiCodec.decode(response.data) };
}
