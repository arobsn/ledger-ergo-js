import { AttestedBoxFrame, InputBox } from "../types/public";

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
    this._extension = extension;
    return this;
  }
}
