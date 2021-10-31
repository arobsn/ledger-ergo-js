import { INS } from "./common/ins";
import { serializeBip32Path, serializeAuthToken } from "./common/serialization";
import Device from "./common/device";
import { DerivedAddress } from "../erg";
import { DeviceResponse } from "../types/internal";
import { RETURN_CODE } from "../errors";

const enum ReturnType {
  Return,
  Display,
}

const enum P1 {
  RETURN = 0x01,
  DISPLAY = 0x02,
}

const enum P2 {
  WITHOUT_TOKEN = 0x01,
  WITH_TOKEN = 0x02,
}

const enum Network {
  Mainnet = 0 << 4,
  Testnet = 1 << 4,
}

function sendDeriveAddress(
  device: Device,
  path: string,
  returnType: ReturnType,
  authToken?: number
): Promise<DeviceResponse> {
  const data = Buffer.concat([Buffer.alloc(1, Network.Mainnet), serializeBip32Path(path)]);
  return device.send(
    INS.DERIVE_ADDRESS,
    returnType == ReturnType.Return ? P1.RETURN : P1.DISPLAY,
    authToken ? P2.WITH_TOKEN : P2.WITHOUT_TOKEN,
    authToken ? Buffer.concat([data, serializeAuthToken(authToken)]) : data
  );
}

export async function deriveAddress(
  device: Device,
  path: string,
  authToken?: number
): Promise<DerivedAddress> {
  const response = await sendDeriveAddress(device, path, ReturnType.Return, authToken);
  return { addressHex: response.data.toString("hex") };
}

export async function showAddress(
  device: Device,
  path: string,
  authToken?: number
): Promise<boolean> {
  const response = await sendDeriveAddress(device, path, ReturnType.Display, authToken);
  return response.returnCode === RETURN_CODE.OK;
}
