import mongoose from 'mongoose';
import request from 'supertest';
import express from 'express';

import * as dotenv from "dotenv";
dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

import router  from "../src/routes/contracts"
// express app
const app = express();

// middleware
// app.use(cors());
app.use(express.json());

// routes
app.use('/api', router);

/* Connecting to the database before each test. */
beforeEach(async () => {
    console.log('connecting to database : ', process.env.DB_NAME);
    await mongoose.connect(process.env.MONGO_URI ?? "", {
        dbName: process.env.DB_NAME
    });
});

/* Closing database connection after each test. */
afterEach(async () => {
    await mongoose.connection.close();
});

/* clear database after all tests are done */
afterAll(async () => {
    await mongoose.connect(process.env.MONGO_URI ?? "", {
        dbName: process.env.DB_NAME
    });
    const collections = await mongoose.connection.db.collections();
    for (const collection of collections) {
        await collection.deleteMany({});
    }
    await mongoose.connection.close();
});

describe('POST /api/user', () => {
    it('should create a new user', async () => {
        const res = await request(app)
            .post('/api/user')
            .send({
                address: '0xb985d345c4bb8121cE2d18583b2a28e98D56d04b',
            });
        console.log('created user : ', res.body);
        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty('token');
        expect(res.body).toHaveProperty('user');
    });
});

describe('GET /api/tag', () => {
    it('should return all tags', async () => {
        const res = await request(app).get('/api/tag');
        console.log('api tag : ', res.body);
        expect(res.statusCode).toBe(200);
    });
});
