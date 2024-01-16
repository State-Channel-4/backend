import express from "express";
import { urlControl } from "../controllers/index";
import { authenticate } from "../middleware/auth";
import { ExtendedRequest } from "../types/request";

const router = express.Router();


/**
 * @swagger
 * /api/url:
 *   post:
 *     summary: Submit a new url
 *     tags: [URL]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               url:
 *                 type: string
 *               submittedBy:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: The url was submitted successfully
 *       400:
 *         description: URL already exists
 *       500:
 *         description: Server error
 */
// submit url
router.post(
  "/url",
  authenticate,
  (req, res) => urlControl.createURL(req as ExtendedRequest, res)
);

/**
 * @swagger
 * /api/url:
 *   delete:
 *     summary: Delete a url
 *     tags: [URL]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *     responses:
 *       200:
 *         description: The url was deleted successfully
 *       500:
 *         description: Server error
 */
// delete url
router.delete(
  "/url",
  authenticate,
  urlControl.deleteURL
);


/**
 * @swagger
 * /api/mix:
 *   get:
 *     summary: Fetch mixed URLs from tags
 *     tags: [URL]
 *     parameters:
 *       - in: query
 *         name: tags
 *         required: true
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         style: form
 *         explode: true
 *         description: An array of tags to filter the URLs
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *     responses:
 *       200:
 *         description: The mixed URLs were fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 urls:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       url:
 *                         type: string
 *                       tags:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             _id:
 *                               type: string
 *                             name:
 *                               type: string
 *       400:
 *         description: Bad request. Missing or invalid parameters.
 *       500:
 *         description: Server error
 */
// fetch mixed urls from tags. take tags*, page (optional), and limit(optional) as query params
router.get("/mix", urlControl.getMixedURLs);

export default router;