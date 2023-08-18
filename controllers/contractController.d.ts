export function create_user(req: Request, res: Response): Promise<Response>;
export function login(req: any, res: any): Promise<any>;
export function recover_account(req: any, res: any): Promise<void>;
/**
 *
 * @param {object} req
 * @param {object} res
 * @returns json
 * how to call
 * PUT localhost:4000/api/vote/id
 * expected json body in request
 {
 "address": "0x72....."
 }
 */
export function like(req: object, res: object): Promise<any>;
/**
 *
 * @param {object} req
 * @param {object} res
 * @returns json
 * how to call
 * POST localhost:4000/api/url
 * expected json body in request
 {
  "title": "",
  "url": "",
  "submittedBy" : "user_id not walletaddress",
  "tags": []
 }
 */
export function submit_url(req: object, res: object): Promise<any>;
export function get_all_users(req: any, res: any): Promise<void>;
/**
 *
 * @param {object} req request object
 * @param {object} res response object
 * how to call
 * {
 * localhost:4000/api/user/:id
 * localhost:4000/api/user:/123
 * }
 */
export function get_specific_user(req: object, res: object): Promise<void>;
export function create_tag(req: any, res: any): Promise<any>;
export function delete_url(req: any, res: any): Promise<any>;
export function getUrlsByTags(req: any, res: any): Promise<void>;
export function get_all_tags(req: any, res: any): Promise<any>;
export function mix(req: any, res: any): Promise<any>;
export function syncDataToSmartContract(): Promise<void>;
