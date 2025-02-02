import { COMMAND, type Device } from "../../device";
import { EMPTY_BYTES, NO_VALUE } from "../../serialization/utils";
import type { Version } from "../../types/public";

const IS_DEBUG_FLAG = 0x01;
const CLA = 0xe0;

export async function getAppVersion(device: Device): Promise<Version> {
  const response = await device.send(
    CLA,
    COMMAND.GET_APP_VERSION,
    NO_VALUE,
    NO_VALUE,
    EMPTY_BYTES
  );

  return {
    major: response.data[0],
    minor: response.data[1],
    patch: response.data[2],
    flags: { isDebug: response.data[3] === IS_DEBUG_FLAG }
  };
}
