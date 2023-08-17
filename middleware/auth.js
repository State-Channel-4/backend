"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
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
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifySignedFunctionMessage = exports.verifySignedMessage = exports.generateToken = exports.authenticate = void 0;
var ethers_1 = require("ethers");
var jsonwebtoken_1 = require("jsonwebtoken");
var express_jwt_1 = require("express-jwt");
var dotenv_1 = require("dotenv");
dotenv_1.default.config();
var jwt_secret = process.env.JWT_SECRET;
var authenticate = express_jwt_1.default.expressjwt({ secret: jwt_secret, algorithms: ["HS256"] });
exports.authenticate = authenticate;
console.log("authenticate", authenticate);
var generateToken = function (user) {
    var token = jsonwebtoken_1.default.sign({ id: user._id }, jwt_secret, { expiresIn: "1d" });
    return token;
};
exports.generateToken = generateToken;
var verifySignedMessage = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, address, signature, originalMessage, recoveredAddress;
    return __generator(this, function (_b) {
        try {
            _a = req.body, address = _a.address, signature = _a.signature, originalMessage = _a.originalMessage;
            recoveredAddress = ethers_1.ethers.verifyMessage(originalMessage, signature);
            // Compare the recovered address with the provided address
            if (recoveredAddress.toLowerCase() === address.toLowerCase()) {
                next();
            }
            else {
                res.status(401).json({ error: "Invalid signature" });
            }
        }
        catch (error) {
            res.status(500).json({ error: "Error verifying signature" });
        }
        return [2 /*return*/];
    });
}); };
exports.verifySignedMessage = verifySignedMessage;
var verifySignedFunctionMessage = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, signedMessage, address, functionName, params, tx, urlContract, metaTransaction, recoveredAddress, error_1;
    var _b;
    var _c, _d, _e;
    return __generator(this, function (_f) {
        switch (_f.label) {
            case 0:
                _f.trys.push([0, 2, , 3]);
                _a = req.body, signedMessage = _a.signedMessage, address = _a.address, functionName = _a.functionName, params = _a.params;
                tx = ethers_1.ethers.Transaction.from(signedMessage);
                urlContract = new ethers_1.ethers.Contract((_c = process.env.CONTRACT_ADDRESS) !== null && _c !== void 0 ? _c : "", (_d = process.env.ABI) !== null && _d !== void 0 ? _d : []);
                return [4 /*yield*/, (_b = urlContract[functionName]).populateTransaction.apply(_b, params)];
            case 1:
                metaTransaction = _f.sent();
                // Compare server-side tx with client-side tx
                if (metaTransaction.data !== tx.data) {
                    return [2 /*return*/, res
                            .status(401)
                            .json({
                            error: "The tx data is not equal to the function(params)",
                        })];
                }
                recoveredAddress = tx.signature != null ? ethers_1.ethers.recoverAddress(tx.unsignedHash, tx.signature) : null;
                if (recoveredAddress === null || recoveredAddress.toLowerCase() !== address.toLowerCase()) {
                    return [2 /*return*/, res
                            .status(401)
                            .json({
                            error: "Recovered address is not equal to sent address",
                        })];
                }
                // Check the tx is sent to the right contract address
                if (tx.to != null &&
                    tx.to.toLowerCase() !== ((_e = process.env.CONTRACT_ADDRESS) !== null && _e !== void 0 ? _e : "").toLowerCase()) {
                    return [2 /*return*/, res
                            .status(401)
                            .json({
                            error: "The tx is not sent to the right contract address",
                        })];
                }
                next();
                return [3 /*break*/, 3];
            case 2:
                error_1 = _f.sent();
                console.log(error_1);
                res.status(500).json({ error: "Error verifying signature" });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.verifySignedFunctionMessage = verifySignedFunctionMessage;
