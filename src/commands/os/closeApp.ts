import { RETURN_CODE, type Device } from "../../device";
import { EMPTY_BYTES, NO_VALUE } from "../../serialization/utils";

const CLA = 0xb0;
const CLOSE_APP = 0xa7;

export async function closeApp(device: Device): Promise<boolean> {
  const response = await device.send(CLA, CLOSE_APP, NO_VALUE, NO_VALUE, EMPTY_BYTES);

  return response.returnCode === RETURN_CODE.OK;
}
