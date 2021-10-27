/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
/* global Reflect, Promise */

var extendStatics = function(d, b) {
    extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
    return extendStatics(d, b);
};

function __extends(d, b) {
    if (typeof b !== "function" && b !== null)
        throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
    extendStatics(d, b);
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}

function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

function __generator(thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
}

var CLA = 0xE0;
var ERROR_CODES = {
    0x6985: "Operation denied by user",
    0x6A86: "Incorrect P1 or P2",
    0x6A87: "Bad APDU length",
    0x6D00: "Instruction isn't supported",
    0x6E00: "CLA is not supported",
    0xB000: "Device is busy",
    0xB001: "Wrong response length",
    0xB002: "Bad session id",
    0xB003: "Unknown subcommand",
    0xB0FF: "Bad state (check order of calls and errors)",
    0xE001: "Bad token ID",
    0xE002: "Bad token value",
    0xE003: "Bad context extension size",
    0xE004: "Bad data input ID",
    0xE005: "Bad box ID",
    0xE006: "Bad token index",
    0xE007: "Bad frame index",
    0xE008: "Bad input count",
    0xE009: "Bad output count",
    0xE00A: "Too many tokens",
    0xE00B: "Too many inputs",
    0xE00C: "Too many data inputs",
    0xE00D: "Too many input frames",
    0xE00E: "Too many outputs",
    0xE00F: "Hasher internal error",
    0xE010: "Buffer internal error",
    0xE011: "UInt64 overflow",
    0xE012: "Bad Bip32 path",
    0xE013: "Internal crypto engine error",
    0xE014: "Not enough data",
    0xE015: "Too much data",
    0xE016: "Address generation failed",
    0xE017: "Schnorr signing failed",
    0xE018: "Bad frame signature",
    0xE101: "Can't display Bip32 path",
    0xE102: "Can't display address",
    0xFFFF: "Stack overflow"
};
var COMMANDS = {
    app_version: 0x01,
    app_name: 0x02,
    extented_pub_key: 0x10,
    derive_address: 0x11,
    attest_input: 0x20,
    sign_tx: 0x21
};
var DeviceError = /** @class */ (function (_super) {
    __extends(DeviceError, _super);
    function DeviceError(code) {
        var _this = this;
        var message = ERROR_CODES[code] || "Unknown error";
        _this = _super.call(this, message) || this;
        _this._code = code;
        return _this;
    }
    return DeviceError;
}(Error));
var ErgoLedgerApp = /** @class */ (function () {
    function ErgoLedgerApp(transport) {
        this._transport = transport;
    }
    ErgoLedgerApp.prototype.command = function (code, p1, p2, data) {
        return __awaiter(this, void 0, void 0, function () {
            var header, response, returnCode;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (data.length > 255) {
                            throw new DeviceError(0xE015); // Too much data
                        }
                        header = Buffer.alloc(5);
                        header.writeUInt8(CLA, 0);
                        header.writeUInt8(code, 1);
                        header.writeUInt8(p1, 2);
                        header.writeUInt8(p2, 3);
                        header.writeUInt8(data.length, 4);
                        return [4 /*yield*/, this._transport.exchange(Buffer.concat([header, data]))];
                    case 1:
                        response = _a.sent();
                        if (response.length < 2) {
                            throw new DeviceError(0xB001); // Wrong response length
                        }
                        returnCode = response.readUInt16BE(response.length - 2);
                        if (returnCode != 0x9000) {
                            throw new DeviceError(returnCode); // Call error
                        }
                        return [2 /*return*/, response.slice(0, response.length - 2)];
                }
            });
        });
    };
    ErgoLedgerApp.prototype.data = function (code, p1, p2, data) {
        return __awaiter(this, void 0, void 0, function () {
            var responses, i, chunk, response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        responses = [];
                        i = 0;
                        _a.label = 1;
                    case 1:
                        if (!(i < Math.ceil(data.length / 255))) return [3 /*break*/, 4];
                        chunk = data.slice(i * 255, Math.min((i + 1) * 255, data.length));
                        return [4 /*yield*/, this.command(code, p1, p2, chunk)];
                    case 2:
                        response = _a.sent();
                        responses.push(response);
                        _a.label = 3;
                    case 3:
                        i++;
                        return [3 /*break*/, 1];
                    case 4: return [2 /*return*/, responses];
                }
            });
        });
    };
    ErgoLedgerApp.prototype.getAppVersion = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.command(COMMANDS.app_version, 0x00, 0x00, Buffer.from([]))];
            });
        });
    };
    ErgoLedgerApp.prototype.getAppName = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.command(COMMANDS.app_name, 0x00, 0x00, Buffer.from([]))
                        .then(function (buff) { return buff.toString('ascii'); })];
            });
        });
    };
    return ErgoLedgerApp;
}());
// exports.CLA = CLA;
// exports.Device = Device;
// exports.DeviceError = DeviceError;
// exports.COMMANDS = COMMANDS;
// exports.ERROR_CODES = ERROR_CODES;

export { ErgoLedgerApp as default };
//# sourceMappingURL=erg.es.js.map
