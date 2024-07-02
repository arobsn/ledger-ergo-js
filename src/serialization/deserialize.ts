import basex from "base-x";
import { assert } from "../assertions";

const bs10 = basex("0123456789");

export const deserialize = {
  hex(buffer: Buffer): string {
    return buffer.toString("hex");
  },

  ascii(buffer: Buffer): string {
    return buffer.toString("ascii");
  },

  uint8(data: Buffer): number {
    assert(data.length === 1, "invalid uint8 buffer");
    return data.readUIntBE(0, 1);
  },

  uint16(data: Buffer): number {
    assert(data.length === 2, "invalid uint16 buffer");
    return data.readUIntBE(0, 2);
  },

  uint32(data: Buffer): number {
    assert(data.length === 4, "invalid uint32 buffer");
    return data.readUIntBE(0, 4);
  },

  uint64(buffer: Buffer): string {
    assert(buffer.length === 8, "invalid uint64 buffer");
    return trimLeadingZeros(bs10.encode(buffer));
  }
};

function trimLeadingZeros(text: string): string {
  return text.replace(/^0+/, "");
}
