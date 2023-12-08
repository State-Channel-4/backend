import express from "express";
import { authControl } from "../controllers";

const router = express.Router();

/**
 * @swagger
 * /api/login:
 *   post:
 *     summary: Login a user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               signedMessage:
 *                 type: string
 *     responses:
 *       200:
 *         description: The user was logged in successfully
 *       500:
 *         description: Server error
 */
router.post("/login", authControl.login);

/**
 * @swagger
 * /api/recover-account:
 *   post:
 *     summary: Recover account using mnemonic phrase
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               mnemonic:
 *                 type: string
 *     responses:
 *       200:
 *         description: The account was recovered successfully
 *       400:
 *         description: Error in recovering account
 */
// recover key
router.post("/recover-account", authControl.recoverAccount);

export default router;