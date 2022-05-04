import { parseAttestedFrameResponse } from "../src/interactions/attestInput";

describe("attestInput test", () => {
  const frameHex =
    "7cbe85a5f2d2154538eb883bbbee10dd414ec24b6e52b43495da906bce2c5e8a010000000000ab6a1fde032d554219a80c011cc51509e34fa4950965bb8e01de4d012536e766c9ca08bc2c000000174876e7febcd5db3a2872f279ef89edaa51a9344a6095ea1f03396874b695b5ba95ff602e00000017483412969f90c012e03bf99397e363fb1571b7999941e0862a217307e3467ee80cf53af700000000000000012f5151af1796a5827de6df5339ddca7a";

  it("should parse frame response", () => {
    const parsedFrame = parseAttestedFrameResponse(Buffer.from(frameHex, "hex"));

    expect(parsedFrame).toMatchObject({
      boxId: "7cbe85a5f2d2154538eb883bbbee10dd414ec24b6e52b43495da906bce2c5e8a",
      framesCount: 1,
      frameIndex: 0,
      amount: "2875858910",
      tokens: [
        {
          id: "2d554219a80c011cc51509e34fa4950965bb8e01de4d012536e766c9ca08bc2c",
          amount: "99999999998"
        },
        {
          id: "bcd5db3a2872f279ef89edaa51a9344a6095ea1f03396874b695b5ba95ff602e",
          amount: "99995619990"
        },
        {
          id: "9f90c012e03bf99397e363fb1571b7999941e0862a217307e3467ee80cf53af7",
          amount: "1"
        }
      ],
      attestation: "2f5151af1796a5827de6df5339ddca7a"
    });
  });
});
