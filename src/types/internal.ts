import { RETURN_CODE } from "../errors";
import AttestedBox from "@/models/attestedBox";
import { BoxCandidate, ChangeMap } from "./public";

export type DeviceResponse = {
  data: Buffer;
  returnCode: RETURN_CODE;
};

export type AttestedTx = {
  inputs: AttestedBox[];
  dataInputs: string[];
  outputs: BoxCandidate[];
  distinctTokenIds: Uint8Array[];
  changeMap: ChangeMap;
};

export type SignTxResponse = {
  [path: string]: Uint8Array;
};
