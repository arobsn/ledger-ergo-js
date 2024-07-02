import { COMMAND, RETURN_CODE, type Device } from "../device";
import type { DerivedAddress, Network } from "../types/public";
import type { DeviceResponse } from "../types/internal";
import { serialize } from "../serialization/serialize";
import { deserialize } from "../serialization/deserialize";

const enum ReturnType {
  Return,
  Display
}

const enum P1 {
  RETURN = 0x01,
  DISPLAY = 0x02
}

const enum P2 {
  WITHOUT_TOKEN = 0x01,
  WITH_TOKEN = 0x02
}

function sendDeriveAddress(
  device: Device,
  network: Network,
  path: number[],
  returnType: ReturnType,
  authToken?: number
): Promise<DeviceResponse> {
  const data = Buffer.concat([
    Buffer.alloc(1, network),
    serialize.bip32Path(path)
  ]);
  return device.send(
    COMMAND.DERIVE_ADDRESS,
    returnType == ReturnType.Return ? P1.RETURN : P1.DISPLAY,
    authToken ? P2.WITH_TOKEN : P2.WITHOUT_TOKEN,
    authToken ? Buffer.concat([data, serialize.uint32(authToken)]) : data
  );
}

export async function deriveAddress(
  device: Device,
  network: Network,
  path: number[],
  authToken?: number
): Promise<DerivedAddress> {
  const response = await sendDeriveAddress(
    device,
    network,
    path,
    ReturnType.Return,
    authToken
  );
  return { addressHex: deserialize.hex(response.data) };
}

export async function showAddress(
  device: Device,
  network: Network,
  path: number[],
  authToken?: number
): Promise<boolean> {
  const response = await sendDeriveAddress(
    device,
    network,
    path,
    ReturnType.Display,
    authToken
  );
  return response.returnCode === RETURN_CODE.OK;
}
