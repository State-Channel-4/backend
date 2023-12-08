import express from "express";
import { authenticate } from "../middleware/auth";
import { userControl } from "../controllers";

const router = express.Router();

/**
 * @swagger
 * /api/user:
 *   post:
 *     summary: Create a new user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               address:
 *                 type: string
 *     responses:
 *       201:
 *         description: The user was created successfully
 *       400:
 *         description: Error in creating user
 */
// create user
router.post("/user", userControl.createUser);

// get users
router.get("/users", authenticate, userControl.getAllUsers);

// get specific user
router.get("/users/:id", authenticate, userControl.getUser);

export default router;