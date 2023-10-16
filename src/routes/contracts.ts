import express from 'express';
import {
  authControl,
  contractControl,
  tagControl,
  urlControl,
  userControl,
  likeControl
} from "../controllers/index";
import { createMatch } from '../controllers/matchmaking';

import {
  authenticate,
  verifySignedMessage,
  verifySignedFunctionMessage,
} from "../middleware/auth";

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
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.post("/login", authControl.login);

// get users
router.get("/users", authenticate, userControl.getAllUsers);

// get specific user
router.get("/users/:id", authenticate, userControl.getUser);

/**
 * @swagger
 * /api/users/:userId/likes:
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
router.get("/users/:userId/likes", likeControl.handleGetLikes);

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
  verifySignedFunctionMessage,
  likeControl.handleLike
);

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
  verifySignedFunctionMessage,
  urlControl.createURL
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
  verifySignedMessage,
  urlControl.deleteURL
);

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
  verifySignedFunctionMessage,
  tagControl.createTag
);

/**
 * @swagger
 * /api/url/tag:
 *   get:
 *     summary: Fetch URLs by their tags
 *     tags: [URL, Tag]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: The urls were fetched successfully
 *       500:
 *         description: Server error
 */
// fetch url by tags
// TODO:Not sure where we use this route @hackertron
// router.get("/url/tag", mainControl.getUrlsByTags);

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

router.get("/match", createMatch);

export default router;