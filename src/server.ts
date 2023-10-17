import * as dotenv from "dotenv";
dotenv.config();

import cors from 'cors';
import express from 'express';
import mongoose from 'mongoose';
import contractRoutes from './routes/contracts';


// swagger imports
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import swaggerOptions from './swaggerOptions';

// express app
const app = express();

// middleware
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
    console.log(req.path, req.method);
    next();
});

const specs = swaggerJsdoc(swaggerOptions);

// routes
app.use('/api', contractRoutes);
app.use('/docs', swaggerUi.serve, swaggerUi.setup(specs, { explorer: true }));

// connect to db
mongoose
    .connect(process.env.MONGO_URI as string, {
        dbName: process.env.DB_NAME as string,
    })
    .then(() => {
        console.log('connected to database');
        // listen to port
        app.listen(Number(process.env.PORT), () => {
            console.log(`listening for requests on port http://localhost:${process.env.PORT}`);
        });
    })
    .catch((err) => {
        console.log(err);
    });
