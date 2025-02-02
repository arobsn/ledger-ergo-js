import { RecordStore, openTransportReplayer } from "@ledgerhq/hw-transport-mocker";
import { describe, expect, it, test } from "vitest";
import { Device, DeviceError, RETURN_CODE } from "./device";

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

describe("OS interactions", () => {
  test.each([
    {
      record: RecordStore.fromString(`
        => b001000000
        <= 01044572676f05302e302e3601029000
      `),
      name: "Ergo",
      version: "0.0.6"
    },
    {
      record: RecordStore.fromString(`
        => b001000000
        <= 0105424f4c4f5305312e312e319000
      `),
      name: "BOLOS",
      version: "1.1.1"
    }
  ])("should get current app name and version", async (tv) => {
    const transport = await openTransportReplayer(tv.record);
    const device = new Device(transport);

    const { name, version } = await device.getCurrentAppInfo();

    expect(name).to.be.equal(tv.name);
    expect(version).to.be.equal(tv.version);
  });

  it("should throw an error if the response format is not recognized", async () => {
    const transport = await openTransportReplayer(
      RecordStore.fromString(`
        => b001000000
        <= 02044572676f05302e302e3601029000
      `) //^^ -- should be 01
    );

    const device = new Device(transport);

    await expect(() => device.getCurrentAppInfo()).rejects.toThrow(
      "Response format is not recognized"
    );
  });

  it("should open ergo app", async () => {
    const transport = await openTransportReplayer(
      RecordStore.fromString(`
          => e0d80000044572676f
          <= 9000
        `)
    );

    const device = new Device(transport);
    const result = await device.openApp();

    expect(result).to.be.true;
  });

  it("should close current app", async () => {
    const transport = await openTransportReplayer(
      RecordStore.fromString(`
          => b0a7000000
          <= 9000
        `)
    );

    const device = new Device(transport);
    const result = await device.closeApp();

    expect(result).to.be.true;
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

    const device = new Device(transport);

    await expect(() =>
      device.send(0xe0, 0x1, 0x2, 0x3, Buffer.from([0x4]))
    ).rejects.toThrow("Wrong response length");
  });

  it("Should throw if data is too long", async () => {
    const transport = await openTransportReplayer(
      RecordStore.fromString(`
        => e00102030104
        <= 9000
      `)
    );

    const device = new Device(transport);

    await expect(() =>
      device.send(0xe0, 0x1, 0x2, 0x3, Buffer.alloc(260))
    ).rejects.toThrow("Too much data");
  });
});
