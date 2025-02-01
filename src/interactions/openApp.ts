import { COMMAND, RETURN_CODE, type Device } from "../device";
import { asciiCodec } from "../serialization/utils";

const UNUSED = 0x00;

export async function openApp(device: Device, appName: string): Promise<boolean> {
  try {
    const response = await device.send(
      COMMAND.OPEN_APP,
      UNUSED,
      UNUSED,
      asciiCodec.encode(appName)
    );
    return response.returnCode === RETURN_CODE.OK;
  } catch {
    return false;
  }
}
