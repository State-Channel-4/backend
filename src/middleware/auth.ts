import { Request, Response, NextFunction } from 'express';
import ethers from 'ethers';
import ABI from '../abi/channel4.json';
import jwt from 'jsonwebtoken';
//import { expressjwt as express_jwt } from 'express-jwt';
import { expressjwt } from 'express-jwt';


const jwt_secret = process.env.JWT_SECRET as string;

export const authenticate = expressjwt({ secret: jwt_secret, algorithms: ["HS256"] });
console.log("authenticate", authenticate);

export const generateToken = (user: { _id: string }) => {
    const token = jwt.sign({ id: user._id }, jwt_secret, { expiresIn: "1d" });
    return token;
};

export const verifySignedMessage = async (req: Request, res: Response, next: NextFunction) => {
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

export const verifySignedFunctionMessage = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { signedMessage, address, functionName, params } = req.body;
        // signed transaction string to object
        const tx = ethers.Transaction.from(signedMessage);
        // Recreate the meta transaction
        const channel4Contract = new ethers.Contract(process.env.CONTRACT_ADDRESS as string, ABI);
        const metaTransaction = await channel4Contract[
            functionName as string
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
        const recoveredAddress = ethers.recoverAddress(
            tx.unsignedHash as string,
            tx.signature as unknown as string // note(jay) : not sure of conversion from unknown to str
        );
        if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
            return res
                .status(401)
                .json({
                    error: "Recovered address is not equal to sent address",
                });
        }
        // Check the tx is sent to the right contract address
        if (
            tx.to?.toLowerCase() !== (process.env.CONTRACT_ADDRESS as string).toLowerCase()
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
