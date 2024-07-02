import { describe, expect, it } from "vitest";
import { Device, DeviceError, RETURN_CODE } from "./device";
import { RecordStore, openTransportReplayer } from "@ledgerhq/hw-transport-mocker";
import { CLA } from "./erg";

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

describe("Negative tests", () => {
  it("Should throw an error if the response length is less than the minimum", async () => {
    const transport = await openTransportReplayer(
      RecordStore.fromString(`
        => e00102030104
        <= 69
      `)
    );

    const device = new Device(transport, CLA);

    await expect(() => device.send(0x1, 0x2, 0x3, Buffer.from([0x4]))).rejects.toThrow(
      "Wrong response length"
    );
  });

  it("Should throw if data is too long", async () => {
    const transport = await openTransportReplayer(
      RecordStore.fromString(`
        => e00102030104
        <= 9000
      `)
    );

    const device = new Device(transport, CLA);

    await expect(() => device.send(0x1, 0x2, 0x3, Buffer.alloc(260))).rejects.toThrow(
      "Too much data"
    );
  });
});
