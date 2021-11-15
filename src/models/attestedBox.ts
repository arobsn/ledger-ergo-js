import { AttestedBoxFrame, InputBox } from "../types/public";

export default class AttestedBox {
  private _box: InputBox;
  private _frames: AttestedBoxFrame[];

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

  public setExtensionLenght(length: number): AttestedBox {
    const firstFrame = this._frames[0];
    firstFrame.extensionLength = length;

    const lengthBuffer = Buffer.alloc(4);
    lengthBuffer.writeUInt32BE(length, 0);
    firstFrame.raw = Buffer.concat([firstFrame.raw, lengthBuffer]);

    return this;
  }
}
