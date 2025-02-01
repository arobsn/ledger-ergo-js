import type { Device } from "../device";
import { asciiCodec, EMPTY_BYTES, NO_VALUE } from "../serialization/utils";

const CLA = 0xb0;
const GET_CURRENT_APP_INFO = 0x01;

export type AppInfo = {
  name: string;
  version: string;
};

function reader(bytes: Uint8Array) {
  let offset = 0;
  return {
    readByte(): number {
      return bytes[offset++];
    },
    readBytes(number: number): Uint8Array {
      const result = bytes.subarray(offset, offset + number);
      offset += number;

      return result;
    },
    readLV(): Uint8Array {
      const length = this.readByte();
      return this.readBytes(length);
    }
  };
}

export async function getCurrentAppInfo(device: Device): Promise<AppInfo> {
  const { data } = await device.send(
    CLA,
    GET_CURRENT_APP_INFO,
    NO_VALUE,
    NO_VALUE,
    EMPTY_BYTES
  );

  const r = reader(data);
  if (r.readByte() !== 0x01) throw new Error("Response format is not recognized");

  return {
    name: asciiCodec.decode(r.readLV()),
    version: asciiCodec.decode(r.readLV())
  };
}
