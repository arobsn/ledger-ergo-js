import type { Version } from "../types/public";
import { COMMAND, type Device } from "../device";
import { EMPTY_BYTES } from "../serialization/utils";

const IS_DEBUG_FLAG = 0x01;

const enum P1 {
  UNUSED = 0x00
}

const enum P2 {
  UNUSED = 0x00
}

export async function getAppVersion(device: Device): Promise<Version> {
  const response = await device.send(
    COMMAND.GET_APP_VERSION,
    P1.UNUSED,
    P2.UNUSED,
    EMPTY_BYTES
  );

  return {
    major: response.data[0],
    minor: response.data[1],
    patch: response.data[2],
    flags: { isDebug: response.data[3] === IS_DEBUG_FLAG }
  };
}
