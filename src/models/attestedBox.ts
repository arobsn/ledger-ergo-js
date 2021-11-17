import { AttestedBoxFrame, InputBox } from "../types/public";
import { assert } from "../validations";

export default class AttestedBox {
  private _box: InputBox;
  private _frames: AttestedBoxFrame[];
  private _extension?: Buffer;

  constructor(box: InputBox, frames: AttestedBoxFrame[]) {
    this._box = box;
    this._frames = frames;
  }

  public get box(): InputBox {
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

    this._extension = extension;
    const firstFrame = this._frames[0];
    firstFrame.extensionLength = extension.length;
    const lengthBuffer = Buffer.alloc(4);
    lengthBuffer.writeUInt32BE(extension.length, 0);
    firstFrame.raw = Buffer.concat([firstFrame.raw, lengthBuffer]);

    return this;
  }
}
