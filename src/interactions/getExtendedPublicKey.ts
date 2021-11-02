import { serializeBip32Path, serializeAuthToken } from "./common/serialization";
import Device, { COMMAND } from "./common/device";
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
  path: string,
  authToken?: number
): Promise<ExtendedPublicKey> {
  const data = serializeBip32Path(path);
  const response = await device.send(
    COMMAND.GET_EXTENTED_PUB_KEY,
    authToken ? P1.WITH_TOKEN : P1.WITHOUT_TOKEN,
    P2.UNUSED,
    authToken ? Buffer.concat([data, serializeAuthToken(authToken)]) : data
  );
  const [publicKey, chainCode] = chunkBy(response.data, [33, 32]);

  return {
    publicKeyHex: publicKey.toString("hex"),
    chainCodeHex: chainCode.toString("hex"),
  };
}
