import express from "express";
import { authenticate } from "../middleware/auth";
import { likeControl } from "../controllers";

const router = express.Router();

/**
 * @swagger
 * /api/likes/:userId:
 *  get:
 *    summary: Get all content liked by a user
 *    tags: [Users]
 *    parameters:
 *     - in: path
 *       name: userId
 *       required: true
 *       schema:
 *        type: string
 *        format: uuid
 *       description: the uuid of the user
 *  responses:
 *    200:
 *      description: Returned likes for a given user
 *    404:
 *      description: User not found
 */
// get the likes of a user
// @todo: add pagination
router.get("/likes/:userId", likeControl.getLikesFromUser);

/**
 * @swagger
 * /api/like/{id}:
 *   put:
 *     summary: Toggle the like for a url by a user
 *     tags: [Users, URL]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
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
 *       200:
 *         description: User updated their like status for the content
 *       400:
 *         description: Tried to like when already liked/ dislike when already disliked or never liked
 *       404:
 *         description: User or content not found
 *       500:
 *         description: Server error
 */
// like or unlike a url
router.put(
    "/like/:id",
    authenticate,
    likeControl.handleLike
  );

export default router;