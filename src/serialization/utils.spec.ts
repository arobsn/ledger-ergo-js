import { describe, expect, it } from "vitest";
import { isErgoPath, pathToArray } from "./utils";

describe("assertions", () => {
  it("Ergo path", () => {
    expect(isErgoPath(pathToArray("m/44'/429'"))).to.be.true;
    expect(isErgoPath(pathToArray("m/44'/2'"))).to.be.false;
    expect(isErgoPath(pathToArray("m/44'"))).to.be.false;
  });
});
