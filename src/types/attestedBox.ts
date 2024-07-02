import { assert } from "@fleet-sdk/common";
import type { UnsignedBox, AttestedBoxFrame } from "./public";
import { ByteWriter } from "../serialization/byteWriter";

export class AttestedBox {
  #box: UnsignedBox;
  #frames: AttestedBoxFrame[];
  #extension?: Uint8Array;

  constructor(box: UnsignedBox, frames: AttestedBoxFrame[]) {
    this.#box = box;
    this.#frames = frames;
  }

  public get box(): UnsignedBox {
    return this.#box;
  }

  public get frames(): AttestedBoxFrame[] {
    return this.#frames;
  }

  public get extension(): Uint8Array | undefined {
    return this.#extension;
  }

  public setExtension(extension: Uint8Array): AttestedBox {
    assert(!this.#extension, "The extension is already inserted");

    const firstFrame = this.#frames[0];
    const length = firstFrame.bytes.length + 4;
    const newFrame = new ByteWriter(length).writeBytes(firstFrame.bytes);

    if (extension.length === 1 && extension[0] === 0) {
      newFrame.writeUInt32(0);
    } else {
      this.#extension = extension;
      firstFrame.extensionLength = extension.length;
      newFrame.writeUInt32(extension.length);
    }

    firstFrame.bytes = newFrame.toBytes();

    return this;
  }
}
