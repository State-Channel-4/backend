import { Request } from 'express';
import { Types } from 'mongoose';

export interface ExtendedRequest extends Request {
    auth: {
        id: Types.ObjectId;
        iat: number;
        exp: number;
    };
}