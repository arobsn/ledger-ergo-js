import type { RETURN_CODE } from "../device";
import type { BoxCandidate, ChangeMap } from "./public";
import type { AttestedBox } from "./attestedBox";
import type { Buffer } from "buffer";

export type DeviceResponse = {
  data: Buffer;
  returnCode: RETURN_CODE;
};

export type AttestedTransaction = {
  inputs: AttestedBox[];
  dataInputs: string[];
  outputs: BoxCandidate[];
  distinctTokenIds: Uint8Array[];
  changeMap: ChangeMap;
};

export type SignTransactionResponse = {
  [path: string]: Uint8Array;
};
