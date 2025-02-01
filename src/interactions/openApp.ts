import { COMMAND, RETURN_CODE, type Device } from "../device";
import { asciiCodec, NO_VALUE } from "../serialization/utils";

const enum RESPONSE_CODE {
  CONDITION_NOT_SATISFIED = 0x6985,
  DENIED = 0x6a82
}

const CLA = 0xe0;

export async function openApp(device: Device, appName: string): Promise<boolean> {
  // try {
  const response = await device.send(
    CLA,
    COMMAND.OPEN_APP,
    NO_VALUE,
    NO_VALUE,
    asciiCodec.encode(appName)
  );
  return response.returnCode === RETURN_CODE.OK;
  // } catch {
  //   return false;
  // }
}
