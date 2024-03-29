import * as dotenv from "dotenv";
dotenv.config({ path: __dirname+'/.env' });

import cors from 'cors';
import express from 'express';
import mongoose from 'mongoose';
import authRoutes from './routes/auth';
import contractsRoutes from './routes/contracts';
import likesRoutes from './routes/likes';
import tagsRoutes from './routes/tags';
import urlsRoutes from './routes/urls';
import usersRoutes from './routes/users';

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
app.use('/api', authRoutes);
app.use('/api', contractsRoutes);
app.use('/api', likesRoutes);
app.use('/api', tagsRoutes);
app.use('/api', urlsRoutes);
app.use('/api', usersRoutes);
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
