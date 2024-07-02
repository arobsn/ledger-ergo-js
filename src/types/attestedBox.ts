import { assert } from "../assertions";
import type { UnsignedBox, AttestedBoxFrame } from "./public";

export class AttestedBox {
  private _box: UnsignedBox;
  private _frames: AttestedBoxFrame[];
  private _extension?: Buffer;

  constructor(box: UnsignedBox, frames: AttestedBoxFrame[]) {
    this._box = box;
    this._frames = frames;
  }

  public get box(): UnsignedBox {
    return this._box;
  }

  public get frames(): AttestedBoxFrame[] {
    return this._frames;
  }

  public get extension(): Buffer | undefined {
    return this._extension;
  }

  public setExtension(extension: Buffer): AttestedBox {
    assert(!this._extension, "extension already present");

    const lengthBuffer = Buffer.alloc(4);
    const firstFrame = this._frames[0];
    if (extension.length === 1 && extension[0] === 0) {
      lengthBuffer.writeUInt32BE(0, 0);
    } else {
      this._extension = extension;
      firstFrame.extensionLength = extension.length;
      lengthBuffer.writeUInt32BE(extension.length, 0);
    }

    firstFrame.buffer = Buffer.concat([firstFrame.buffer, lengthBuffer]);

    return this;
  }
}
