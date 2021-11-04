import Device, { COMMAND } from "./common/device";

const enum P1 {
  BOX_START = 0x01,
  ADD_ERGO_TREE_CHUNK = 0x02,
  ADD_TOKENS = 0x03,
  ADD_REGISTERS_CHUNK = 0x04,
  GET_ATTESTED_BOX_FRAME = 0x05,
}

const enum P2 {
  WITHOUT_TOKEN = 0x01,
  WITH_TOKEN = 0x02,
}
