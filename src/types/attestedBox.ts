import { assert } from "@fleet-sdk/common";
import type { UnsignedBox, AttestedBoxFrame } from "./public";

export class AttestedBox {
  #box: UnsignedBox;
  #frames: AttestedBoxFrame[];
  #extension?: Buffer;

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

  public get extension(): Buffer | undefined {
    return this.#extension;
  }

  public setExtension(extension: Buffer): AttestedBox {
    assert(!this.#extension, "The extension is already inserted");

    const lengthBuffer = Buffer.alloc(4);
    const firstFrame = this.#frames[0];
    if (extension.length === 1 && extension[0] === 0) {
      lengthBuffer.writeUInt32BE(0, 0);
    } else {
      this.#extension = extension;
      firstFrame.extensionLength = extension.length;
      lengthBuffer.writeUInt32BE(extension.length, 0);
    }

    firstFrame.bytes = Buffer.concat([firstFrame.bytes, lengthBuffer]);

    return this;
  }
}
