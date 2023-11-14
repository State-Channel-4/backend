import jwt from 'jsonwebtoken';
import { expressjwt } from 'express-jwt';
import dotenv from 'dotenv';
dotenv.config();


const jwt_secret = process.env.JWT_SECRET as string;

export const authenticate = expressjwt({ secret: jwt_secret, algorithms: ["HS256"] });

export const generateToken = (user: { _id: string }) => {
    const token = jwt.sign({ id: user._id }, jwt_secret, { expiresIn: "1d" });
    return token;
};
