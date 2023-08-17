import { Request, Response, NextFunction } from "express";
declare const authenticate: any;
declare const generateToken: (user: {
    _id: string;
}) => string;
declare const verifySignedMessage: (req: Request, res: Response, next: NextFunction) => Promise<void>;
declare const verifySignedFunctionMessage: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>>>;
export { authenticate, generateToken, verifySignedMessage, verifySignedFunctionMessage, };
