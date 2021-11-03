export function assert(cond: boolean, errMsg: string): asserts cond {
  if (!cond) {
    throw new Error(`Assertion failed${errMsg ? `: ${errMsg}` : "."}`);
  }
}
