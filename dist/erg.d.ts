/// <reference types="node" />
import type Transport from '@ledgerhq/hw-transport-node-hid';
export default class ErgoLedgerApp {
    private _transport;
    constructor(transport: Transport);
    command(code: number, p1: number, p2: number, data: any): Promise<Buffer>;
    data(code: number, p1: number, p2: number, data: any): Promise<Buffer[]>;
    getAppVersion(): Promise<Buffer>;
    getAppName(): Promise<string>;
}
