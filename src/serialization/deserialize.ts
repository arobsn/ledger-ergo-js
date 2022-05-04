import basex from "base-x";
import { assert } from "@/validations";

const bs10 = basex("0123456789");

export default class Deserialize {
  public static hex(buffer: Buffer): string {
    return buffer.toString("hex");
  }

  public static ascii(buffer: Buffer): string {
    return buffer.toString("ascii");
  }

  public static uint8(data: Buffer): number {
    assert(data.length === 1, "invalid uint8 buffer");
    return data.readUIntBE(0, 1);
  }

  public static uint16(data: Buffer): number {
    assert(data.length === 2, "invalid uint16 buffer");
    return data.readUIntBE(0, 2);
  }

  public static uint32(data: Buffer): number {
    assert(data.length === 4, "invalid uint32 buffer");
    return data.readUIntBE(0, 4);
  }

  public static uint64(buffer: Buffer): string {
    assert(buffer.length === 8, "invalid uint64 buffer");
    return this.trimLeadingZeros(bs10.encode(buffer));
  }

  private static trimLeadingZeros(text: string): string {
    return text.replace(/^0+/, "");
  }
}
