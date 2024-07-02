import { isHex, assert } from "@fleet-sdk/common";
import { isUint16, isUint32, isUint64String, isUint8, isErgoPath } from "../assertions";
import bip32Path from "bip32-path";
import { base10 } from "./utils";

export const serialize = {
  path(path: number[] | string): Buffer {
    const pathArray = typeof path === "string" ? pathToArray(path) : path;
    assert(isErgoPath(pathArray), "Invalid Ergo path");

    const buffer = Buffer.alloc(1 + pathArray.length * 4);
    buffer[0] = pathArray.length;

    for (let i = 0; i < pathArray.length; i++) {
      buffer.writeUInt32BE(pathArray[i], 1 + 4 * i);
    }

    return buffer;
  },

  uint8(value: number): Buffer {
    assert(isUint8(value), "invalid uint8 value");

    const data = Buffer.alloc(1);
    data.writeUInt8(value, 0);
    return data;
  },

  uint16(value: number): Buffer {
    assert(isUint16(value), "invalid uint16 value");

    const data = Buffer.alloc(2);
    data.writeUInt16BE(value, 0);
    return data;
  },

  uint32(value: number): Buffer {
    assert(isUint32(value), "invalid uint32 value");

    const buffer = Buffer.alloc(4);
    buffer.writeUInt32BE(value, 0);
    return buffer;
  },

  uint64(value: string): Buffer {
    assert(isUint64String(value), "invalid uint64 string");
    const data = base10.decode(value);

    const padding = Buffer.alloc(8 - data.length);
    return Buffer.concat([padding, Buffer.from(data)]);
  },

  hex(data: string): Buffer {
    assert(isHex(data), "invalid hex string");
    return Buffer.from(data, "hex");
  },

  array<T>(data: T[], serializeCallback: (value: T) => Buffer): Buffer {
    const chucks: Buffer[] = [];
    for (let i = 0; i < data.length; i++) {
      chucks.push(serializeCallback(data[i]));
    }

    return Buffer.concat(chucks);
  },

  arrayAsMappedChunks<T>(
    data: T[],
    maxSize: number,
    encode: (value: T) => Buffer
  ): Buffer[] {
    const packets = [];
    for (let i = 0; i < Math.ceil(data.length / maxSize); i++) {
      const chunks = [];
      for (let j = i * maxSize; j < Math.min((i + 1) * maxSize, data.length); j++) {
        chunks.push(encode(data[j]));
      }

      packets.push(Buffer.concat(chunks));
    }

    return packets;
  }
};

export function pathToArray(path: string): number[] {
  return bip32Path.fromString(path).toPathArray();
}
