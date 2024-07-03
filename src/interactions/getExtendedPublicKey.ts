import { hex } from "@fleet-sdk/crypto";
import { COMMAND, type Device } from "../device";
import { ByteWriter } from "../serialization/byteWriter";
import type { ExtendedPublicKey } from "../types/public";

const enum P1 {
  WITHOUT_TOKEN = 0x01,
  WITH_TOKEN = 0x02
}

const enum P2 {
  UNUSED = 0x00
}

const MAX_APDU_SIZE = 45; // https://github.com/tesseract-one/ledger-app-ergo/blob/main/doc/INS-10-EXT-PUB-KEY.md#data

export async function getExtendedPublicKey(
  device: Device,
  path: string,
  authToken?: number
): Promise<ExtendedPublicKey> {
  const data = new ByteWriter(MAX_APDU_SIZE)
    .writePath(path)
    .writeAuthToken(authToken)
    .toBytes();

  const response = await device.send(
    COMMAND.GET_EXTENDED_PUB_KEY,
    authToken ? P1.WITH_TOKEN : P1.WITHOUT_TOKEN,
    P2.UNUSED,
    data
  );

  const publicKey = hex.encode(response.data.subarray(0, 33));
  const chainCode = hex.encode(response.data.subarray(33, 65));
  return {
    publicKey,
    chainCode
  };
}
