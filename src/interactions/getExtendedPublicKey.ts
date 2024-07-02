import { COMMAND, type Device } from "../device";
import type { ExtendedPublicKey } from "../types/public";
import { chunkBy } from "../serialization/utils";
import { serialize } from "../serialization/serialize";
import { deserialize } from "../serialization/deserialize";

const enum P1 {
  WITHOUT_TOKEN = 0x01,
  WITH_TOKEN = 0x02
}

const enum P2 {
  UNUSED = 0x00
}

export async function getExtendedPublicKey(
  device: Device,
  path: string,
  authToken?: number
): Promise<ExtendedPublicKey> {
  const data = serialize.path(path);
  const response = await device.send(
    COMMAND.GET_EXTENDED_PUB_KEY,
    authToken ? P1.WITH_TOKEN : P1.WITHOUT_TOKEN,
    P2.UNUSED,
    authToken ? Buffer.concat([data, serialize.uint32(authToken)]) : data
  );
  const [publicKey, chainCode] = chunkBy(response.data, [33, 32]);

  return {
    publicKey: deserialize.hex(publicKey),
    chainCode: deserialize.hex(chainCode)
  };
}
