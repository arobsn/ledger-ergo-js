import { hex } from "@fleet-sdk/crypto";
import { COMMAND, type Device } from "../device";
import { ByteWriter } from "../serialization/byteWriter";
import type { ExtendedPublicKey } from "../types/public";
import { NO_VALUE } from "../serialization/utils";

const enum P1 {
  WITHOUT_TOKEN = 0x01,
  WITH_TOKEN = 0x02
}

const CLA = 0xe0;
const MAX_APDU_SIZE = 45; // https://github.com/tesseract-one/ledger-app-ergo/blob/main/doc/INS-10-EXT-PUB-KEY.md#data

export async function getExtendedPublicKey(
  device: Device,
  path: string,
  authToken?: number
): Promise<ExtendedPublicKey> {
  const response = await device.send(
    CLA,
    COMMAND.GET_EXTENDED_PUB_KEY,
    authToken ? P1.WITH_TOKEN : P1.WITHOUT_TOKEN,
    NO_VALUE,
    new ByteWriter(MAX_APDU_SIZE).writePath(path).writeAuthToken(authToken).toBytes()
  );

  return {
    publicKey: hex.encode(response.data.subarray(0, 33)),
    chainCode: hex.encode(response.data.subarray(33, 65))
  };
}
