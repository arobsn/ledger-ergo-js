import Device, { COMMAND } from "./common/device";
import { ExtendedPublicKey } from "../types/public";
import { chunkBy } from "../serialization/utils";
import Serialize from "../serialization/serialize";
import Deserialize from "../serialization/deserialize";

const enum P1 {
  WITHOUT_TOKEN = 0x01,
  WITH_TOKEN = 0x02,
}

const enum P2 {
  UNUSED = 0x00,
}

export async function getExtendedPublicKey(
  device: Device,
  path: number[],
  authToken?: number
): Promise<ExtendedPublicKey> {
  const data = Serialize.bip32Path(path);
  const response = await device.send(
    COMMAND.GET_EXTENTED_PUB_KEY,
    authToken ? P1.WITH_TOKEN : P1.WITHOUT_TOKEN,
    P2.UNUSED,
    authToken ? Buffer.concat([data, Serialize.uint32(authToken)]) : data
  );
  const [publicKey, chainCode] = chunkBy(response.data, [33, 32]);

  return {
    publicKey: Deserialize.hex(publicKey),
    chainCode: Deserialize.hex(chainCode),
  };
}
