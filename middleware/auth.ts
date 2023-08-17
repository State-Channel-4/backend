import { Request, Response, NextFunction } from "express";
import { ethers } from 'ethers';
import jwt from "jsonwebtoken";
import expressJwt from "express-jwt";
import dotenv from "dotenv";
dotenv.config();



const jwt_secret:string = process.env.JWT_SECRET as string;

const authenticate = expressJwt.expressjwt({ secret: jwt_secret, algorithms: ["HS256"] });
console.log("authenticate", authenticate);

const generateToken = (user: { _id: string }): string => {
    const token = jwt.sign({ id: user._id }, jwt_secret, { expiresIn: "1d" });
    return token;
};

const verifySignedMessage = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { address, signature, originalMessage } = req.body;

        // Recover the address from the signature
        const recoveredAddress = ethers.verifyMessage(
            originalMessage,
            signature
        );

        // Compare the recovered address with the provided address
        if (recoveredAddress.toLowerCase() === address.toLowerCase()) {
            next();
        } else {
            res.status(401).json({ error: "Invalid signature" });
        }
    } catch (error) {
        res.status(500).json({ error: "Error verifying signature" });
    }
};

const verifySignedFunctionMessage = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { signedMessage, address, functionName, params } = req.body;
        // signed transaction string to object
        const tx = ethers.Transaction.from(signedMessage);
        // Recreate the meta transaction
        const urlContract = new ethers.Contract(
            process.env.CONTRACT_ADDRESS ?? "",
            process.env.ABI ?? []
        );
        const metaTransaction = await urlContract[
            functionName
        ].populateTransaction(...params);
        // Compare server-side tx with client-side tx
        if (metaTransaction.data !== tx.data) {
            return res
                .status(401)
                .json({
                    error: "The tx data is not equal to the function(params)",
                });
        }
        // Compare the recovered address with the provided address
        const recoveredAddress = tx.signature != null ? ethers.recoverAddress(
            tx.unsignedHash,
            tx.signature
        ) : null;
        if (recoveredAddress === null || recoveredAddress.toLowerCase() !== address.toLowerCase()) {
            return res
                .status(401)
                .json({
                    error: "Recovered address is not equal to sent address",
                });
        }
        // Check the tx is sent to the right contract address
        if ( tx.to != null &&
            tx.to.toLowerCase() !== (process.env.CONTRACT_ADDRESS ?? "").toLowerCase()
        ) {
            return res
                .status(401)
                .json({
                    error: "The tx is not sent to the right contract address",
                });
        }
        next();
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Error verifying signature" });
    }
};

export {
    authenticate,
    generateToken,
    verifySignedMessage,
    verifySignedFunctionMessage,
};
