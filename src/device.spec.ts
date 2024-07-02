import { describe, expect, it } from "vitest";
import { DeviceError, RETURN_CODE } from "./device";

describe("DeviceError construction", () => {
  it("should create a new DeviceError instance from a know RETURN_CODE", () => {
    const error = new DeviceError(RETURN_CODE.TOO_MUCH_DATA);
    expect(error.code).toBe(RETURN_CODE.TOO_MUCH_DATA);
    expect(error.message).toBe("Too much data");
    expect(error.name).to.be.equal("DeviceError");
  });

  it("should create a new DeviceError instance from a unknown RETURN_CODE", () => {
    const error = new DeviceError(0 as RETURN_CODE);
    expect(error.code).toBe(0);
    expect(error.message).toBe("Unknown error");
  });
});
