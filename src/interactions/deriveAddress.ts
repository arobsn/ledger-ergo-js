import { INS } from "./common/ins";
import { bip32ToBuffer } from "./common/serialization";
import Device from "./common/device";
import { DerivedAddress } from "../erg";
import { DeviceResponse, RETURN_CODE } from "../types/internal";

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
  returnType: ReturnType
): Promise<DeviceResponse> {
  return device.send(
    INS.DERIVE_ADDRESS,
    returnType == ReturnType.Return ? P1.RETURN : P1.DISPLAY,
    P2.WITHOUT_TOKEN,
    Buffer.concat([Buffer.alloc(1, Network.Mainnet), bip32ToBuffer(path)])
  );
}

export async function deriveAddress(device: Device, path: string): Promise<DerivedAddress> {
  const response = await sendDeriveAddress(device, path, ReturnType.Return);
  return { addressHex: response.data.toString("hex") };
}

export async function showAddress(device: Device, path: string): Promise<boolean> {
  const response = await sendDeriveAddress(device, path, ReturnType.Display);
  return response.returnCode === RETURN_CODE.OK;
}
