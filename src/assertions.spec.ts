import { describe, it, expect } from "vitest";
import { isErgoPath, isUint64String } from "./assertions";
import { pathToArray } from "./serialization/serialize";

describe("assertions", () => {
  it("Ergo path", () => {
    expect(isErgoPath(pathToArray("m/44'/429'"))).to.be.true;
    expect(isErgoPath(pathToArray("m/44'/2'"))).to.be.false;
    expect(isErgoPath(pathToArray("m/44'"))).to.be.false;
  });

  it("UInt64", () => {
    expect(isUint64String("0")).to.be.true;
    expect(isUint64String("18446744073709551615")).to.be.true;

    expect(isUint64String("18446744073709551616")).to.be.false;
    expect(isUint64String("1.2")).to.be.false;
    expect(isUint64String("11a")).to.be.false;
  });
});
