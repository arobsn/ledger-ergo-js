import Device, { COMMAND } from "./common/device";
import { DerivedAddress } from "@/types/public";
import { DeviceResponse } from "@/types/internal";
import { RETURN_CODE } from "@/errors";
import Serialize from "@/serialization/serialize";
import Deserialize from "@/serialization/deserialize";

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

const enum Network {
  Mainnet = 0 << 4,
  Testnet = 1 << 4
}

function sendDeriveAddress(
  device: Device,
  path: number[],
  returnType: ReturnType,
  authToken?: number
): Promise<DeviceResponse> {
  const data = Buffer.concat([Buffer.alloc(1, Network.Mainnet), Serialize.bip32Path(path)]);
  return device.send(
    COMMAND.DERIVE_ADDRESS,
    returnType == ReturnType.Return ? P1.RETURN : P1.DISPLAY,
    authToken ? P2.WITH_TOKEN : P2.WITHOUT_TOKEN,
    authToken ? Buffer.concat([data, Serialize.uint32(authToken)]) : data
  );
}

export async function deriveAddress(
  device: Device,
  path: number[],
  authToken?: number
): Promise<DerivedAddress> {
  const response = await sendDeriveAddress(device, path, ReturnType.Return, authToken);
  return { addressHex: Deserialize.hex(response.data) };
}

export async function showAddress(
  device: Device,
  path: number[],
  authToken?: number
): Promise<boolean> {
  const response = await sendDeriveAddress(device, path, ReturnType.Display, authToken);
  return response.returnCode === RETURN_CODE.OK;
}
