import {
  assert,
  isHexString,
  isUint16,
  isUint32,
  isUint64String,
  isUint8,
  isValidBip32Path
} from "../validations";
import basex from "base-x";
import bip32Path from "bip32-path";

const bs10 = basex("0123456789");

export default class Serialize {
  public static bip32Path(path: number[] | string): Buffer {
    var pathArray = typeof path === "string" ? this.bip32PathAsArray(path) : path;

    const buffer = Buffer.alloc(1 + pathArray.length * 4);
    buffer[0] = pathArray.length;
    pathArray.forEach((element: any, index: number) => {
      buffer.writeUInt32BE(element, 1 + 4 * index);
    });

    return buffer;
  }

  public static bip32PathAsArray(path: string): number[] {
    assert(isValidBip32Path(path), "Invalid Bip32 path.");
    return bip32Path.fromString(path).toPathArray();
  }

  public static uint8(value: number): Buffer {
    assert(isUint8(value), "invalid uint8 value");

    const data = Buffer.alloc(1);
    data.writeUInt8(value, 0);
    return data;
  }

  public static uint16(value: number): Buffer {
    assert(isUint16(value), "invalid uint16 value");

    const data = Buffer.alloc(2);
    data.writeUInt16BE(value, 0);
    return data;
  }

  public static uint32(value: number): Buffer {
    assert(isUint32(value), "invalid uint32 value");

    const buffer = Buffer.alloc(4);
    buffer.writeUInt32BE(value, 0);
    return buffer;
  }

  public static uint64(value: string): Buffer {
    assert(isUint64String(value), "invalid uint64 string");
    const data = bs10.decode(value);
    assert(data.length <= 8, "excessive data");

    const padding = Buffer.alloc(8 - data.length);
    return Buffer.concat([padding, Buffer.from(data)]);
  }

  public static hex(data: string): Buffer {
    assert(isHexString(data), "invalid hex string");
    return Buffer.from(data, "hex");
  }

  public static array<T>(data: T[], serializeCallback: (value: T) => Buffer): Buffer {
    const chucks: Buffer[] = [];
    for (let i = 0; i < data.length; i++) {
      chucks.push(serializeCallback(data[i]));
    }

    return Buffer.concat(chucks);
  }

  public static arrayAndChunk<T>(
    data: T[],
    maxPacketSize: number,
    serializeCallback: (value: T) => Buffer
  ): Buffer[] {
    const packets = [];
    for (let i = 0; i < Math.ceil(data.length / maxPacketSize); i++) {
      const chunks = [];
      for (let j = i * maxPacketSize; j < Math.min((i + 1) * maxPacketSize, data.length); j++) {
        chunks.push(serializeCallback(data[j]));
      }
      packets.push(Buffer.concat(chunks));
    }

    return packets;
  }
}
