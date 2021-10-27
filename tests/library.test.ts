import sampleLibrary from "../src/index";

describe("Base tests", () => {
  it("should create Library", () => {
    expect(sampleLibrary()).toBe("Hello World!");
  });
});
