import express from "express";
import { authenticate } from "../middleware/auth";
import { tagControl } from "../controllers";
import { ExtendedRequest } from "../types/request";

const router = express.Router();


/**
 * @swagger
 * /api/tag:
 *   post:
 *     summary: Create a new tag
 *     tags: [Tag]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               createdBy:
 *                 type: string
 *     responses:
 *       201:
 *         description: The tag was created successfully
 *       500:
 *         description: Server error
 */
// creating tags
router.post(
    "/tag",
    authenticate,
    (req, res) => tagControl.createTag(req as ExtendedRequest, res)
  );

  /**
   * @swagger
   * /api/tag:
   *   get:
   *     summary: Retrieve a list of all tags
   *     tags: [Tag]
   *     responses:
   *       200:
   *         description: A list of tags.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 tags:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       name:
   *                         type: string
   *                       createdBy:
   *                         type: string
   *       500:
   *         description: Server error
   */
  // get all tags
  router.get("/tag", tagControl.getAllTags);

export default router;