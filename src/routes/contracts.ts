import express from 'express';
import { contractControl } from "../controllers/index";

const router = express.Router();

/**
 * @swagger
 * /api/sync:
 *   get:
 *     summary: sync data to smart contract
 *     tags: [contracts]
 *     responses:
 *       200:
 *         description: Data was synced successfully
 *       500:
 *         description: Server error
 */
// sync data to smart contract
router.get("/sync", contractControl.syncDataToSmartContract);

export default router;