import { INS } from "./common/ins";
import { bip32ToBuffer } from "./common/serialization";
import Device from "./common/device";
import { ExtendedPublicKey } from "../types/public";
import { chunkBy } from "./common/utils";

const enum P1 {
  WITHOUT_TOKEN = 0x01,
  WITH_TOKEN = 0x02,
}

const enum P2 {
  UNUSED = 0x00,
}

export async function getExtendedPublicKey(
  device: Device,
  path: string
): Promise<ExtendedPublicKey> {
  const data = bip32ToBuffer(path);
  const response = await device.send(INS.GET_EXTENTED_PUB_KEY, P1.WITHOUT_TOKEN, P2.UNUSED, data);
  const [publicKey, chainCode] = chunkBy(response.data, [33, 32]);

  return {
    publicKeyHex: publicKey.toString("hex"),
    chainCodeHex: chainCode.toString("hex"),
  };
}
