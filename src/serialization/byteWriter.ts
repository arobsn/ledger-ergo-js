import { assert, ensureBigInt } from "@fleet-sdk/common";
import { hex } from "@fleet-sdk/crypto";
import { isErgoPath, pathToArray } from "./utils";

export class ByteWriter {
  readonly #buffer: Buffer;
  #offset: number;

  constructor(length: number) {
    this.#buffer = Buffer.alloc(length);
    this.#offset = 0;
  }

  write(byte: number): ByteWriter {
    this.#buffer[this.#offset++] = byte;
    return this;
  }

  writeUInt32(value: number): ByteWriter {
    this.#offset = this.#buffer.writeUInt32BE(value, this.#offset);
    return this;
  }

  writeUInt8(value: number): ByteWriter {
    this.#offset = this.#buffer.writeUInt8(value, this.#offset);
    return this;
  }

  writeUInt16(value: number): ByteWriter {
    this.#offset = this.#buffer.writeUInt16BE(value, this.#offset);
    return this;
  }

  writeUInt64(value: string | bigint): ByteWriter {
    const data = ensureBigInt(value);
    this.#offset = this.#buffer.writeBigUInt64BE(data, this.#offset);
    return this;
  }

  writeBytes(bytes: ArrayLike<number>): ByteWriter {
    this.#buffer.set(bytes, this.#offset);
    this.#offset += bytes.length;
    return this;
  }

  writeHex(bytesHex: string): ByteWriter {
    return this.writeBytes(hex.decode(bytesHex));
  }

  writePath(path: string): ByteWriter {
    const pathArray = pathToArray(path);
    assert(isErgoPath(pathArray), "Invalid Ergo path");

    this.write(pathArray.length);
    for (const index of pathArray) this.writeUInt32(index);
    return this;
  }

  writeAuthToken(authToken?: number): ByteWriter {
    if (!authToken) return this;
    return this.writeUInt32(authToken);
  }

  toBytes(): Uint8Array {
    return this.#buffer.subarray(0, this.#offset);
  }

  toBuffer(): Buffer {
    return this.#buffer.slice(0, this.#offset);
  }
}
