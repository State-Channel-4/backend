require("dotenv").config();
const ABI = require("../abi.json");
const { Wallet, JsonRpcProvider, Contract } = require("ethers");

// url of backend
const API_URL = "http://localhost:8000/api";

// rpc url used to connect to the smart contract
const PROVIDER = new JsonRpcProvider(process.env.RPC_URL);

// contract for metatransactions
const CONTRACT = new Contract(process.env.CONTRACT_ADDRESS, ABI, PROVIDER);

// anvil private key #0-2
const USERS = [
    "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
    "59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
    "5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a"
].map(pkey => new Wallet(pkey, PROVIDER));

// urls to use
const URLS = [
    {
        title: "Rick Astley - Never Gonna Give You Up",
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    },
    {
        title: "Funny Animal Videos 2023",
        url: "https://www.youtube.com/watch?v=j1TKkm1jZK4",
    },
    {
        title: "Reddit.com - r/dogs",
        url: "https://www.reddit.com/r/dogs/",
    },
];

// tags to use
const TAGS = ["videos", "funny", "animals"];

/**
 * Sign up in the channel4 backend
 * 
 * @param {string} address - address to register in the channel4 backend
 * @returns {string} token - session token for the user
 */
async function signup(address) {
    let res = await fetch(`${API_URL}/user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
    });

    if (!res.ok)
        throw new Error(`Add user "${address}" failed: ${res.statusText} (${res.status}))`);
    return await res.json().then(data => { return { uuid: data.user._id, token: data.token } });
}

/**
 * Add a tag to the channel4 backend
 * 
 * @param {string} name - the name of the tag to add
 * @param {ethers.Wallet} wallet - the wallet to sign the transaction with
 * @param {string} token - the session token for the user adding the tag
 * @param {string} userId - the uuid of the user adding the tag
 * @return {object} - the response object for adding a tag
 */
async function addTag(name, wallet, token, userId) {
    const functionName = "createTagIfNotExists";
    const signedMessage = await metatx(functionName, [name, wallet.address], wallet);

    let res = await fetch(`${API_URL}/tag`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
            signedMessage,
            address: wallet.address,
            functionName,
            params: [name, wallet.address],
            userId,
        }),
    });

    if (!res.ok)
        throw new Error(`Add tag "${tag}" failed: ${res.statusText} (${res.status}))`);
    return await res.json().then(data => data.tag._id);
}

/**
 * Add a url to the channel4 backend
 * 
 * @param {string} title - the title of the url to add
 * @param {string} url - the url to add
 * @param {string[]} tags - the tags to add to the url
 * @param {ethers.Wallet} wallet - the wallet to sign the transaction with
 * @param {string} token - the session token for the user adding the url
 * @param {string} userId - the uuid of the user adding the url
 * @returns {object} - the response object for adding a url
 */
async function addUrl(title, url, tags, wallet, token, userId) {
    const functionName = "createContentIfNotExists";
    // set likes (params[3]) to 0 for api verification
    const params = [title, url, wallet.address, 0, tags];
    const signedMessage = await metatx(functionName, params, wallet);

    let res = await fetch(`${API_URL}/url`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
            signedMessage,
            address: wallet.address,
            functionName,
            params,
            userId,
        }),
    });

    if (!res.ok)
        throw new Error(`Add url "${title}" failed: ${res.statusText} (${res.status}))`);
    return await res.json().then(data => data._id);
}

/**
 * Like a content item through the channel4 backend
 * 
 * @param oid - the oid of the content to like
 * @param content - the url of the content to like
 * @param like - true if the content should be liked, and false otherwise
 * @param wallet - the wallet to sign the transaction with
 * @param token - the session token for the user liking the content
 * @param userId - the uuid of the user liking the content
 */
async function likeContent(oid, content, like, wallet, token, userId) {
    const functionName = "toggleLike";
    // set nonce (params[2]) to 0 for api verification and allow backend to set nonce
    const params = [content, like, 0, wallet.address];
    const signedMessage = await metatx(functionName, params, wallet);

    let res = await fetch(`${API_URL}/like/${oid}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
            signedMessage,
            address: wallet.address,
            functionName,
            params,
            userId,
        }),
    });

    if (!res.ok)
        throw new Error(`Like content "${content}" failed: ${res.statusText} (${res.status})`);
    return await res.json();
}

/**
 * Syncs the database with the smart contract
 * 
 * @returns {void} - will return if success and throw otherwise
 */
async function sync() {
    let res = await fetch(`${API_URL}/sync`);
    if (!res.ok) throw new Error(`Sync (${res.status})`);
}

/**
 * Signs a raw transaction
 * 
 * @param {string} fxn - the string name of the function to sign 
 * @param {any[]} params - the parameters to pass to the function
 * @param {ethers.Wallet} - the wallet to sign the transaction with
 * @returns {string} - the signed raw transaction 
 */
async function metatx(fxn, params, wallet) {
    let raw = await CONTRACT[fxn].populateTransaction(...params);
    return await wallet.signTransaction(raw);
}

/**
 * Setup the environment with filler data
 *  - add 3 users
 *  - add 3 urls
 *  - add 3 tags
 *  - sync contract with database
 */
async function main() {
    console.log("Populating channel4 dev environment...");
    /// ADD USERS ///
    // will fail if users already exist in db, use mongosh to delete:
    // `db.tags.deleteMany({}) && db.urls.deleteMany({}) && db.likes.deleteMany({}) && db.users.deleteMany({})`
    let users = await Promise.all(USERS.map(wallet => signup(wallet.address)));
    console.log("Added users...");

    /// ADD TAGS ///
    let tags = await Promise.all([
        addTag(TAGS[0], USERS[0], users[0].token, users[0].uuid),
        addTag(TAGS[1], USERS[0], users[0].token, users[0].uuid),
        addTag(TAGS[2], USERS[1], users[1].token, users[1].uuid),
    ]);
    console.log("Added tags...");

    /// ADD URL BATCH ///
    let urls = await Promise.all([
        addUrl(
            URLS[0].title,
            URLS[0].url,
            [tags[0], tags[1]],
            USERS[0],
            users[0].token,
            users[0].uuid,
        ),
        addUrl(
            URLS[1].title,
            URLS[1].url,
            [tags[0], tags[1]],
            USERS[1],
            users[1].token,
            users[1].uuid
        ),
        addUrl(
            URLS[2].title,
            URLS[2].url,
            [tags[1], tags[2]],
            USERS[2],
            users[2].token,
            users[2].uuid
        ),
    ]);
    console.log("Added urls...");

    /// ADD LIKES ///
    await Promise.all([
        likeContent(urls[0], URLS[0].url, true, USERS[0], users[0].token, users[0].uuid),
        likeContent(urls[0], URLS[0].url, true, USERS[1], users[1].token, users[1].uuid),
        likeContent(urls[0], URLS[0].url, true, USERS[2], users[2].token, users[2].uuid),
        likeContent(urls[1], URLS[1].url, true, USERS[0], users[0].token, users[0].uuid),
        likeContent(urls[1], URLS[1].url, true, USERS[2], users[2].token, users[2].uuid),
        likeContent(urls[2], URLS[2].url, true, USERS[0], users[0].token, users[0].uuid),
        likeContent(urls[2], URLS[2].url, true, USERS[2], users[2].token, users[2].uuid),
    ]);
    // double like to test syncing
    await likeContent(urls[0], URLS[0].url, false, USERS[0], users[0].token, users[0].uuid);   
    console.log("Added likes...");

    /// SYNC CONTRACT TO URL CONTRACT ///
    console.log("Syncing with contract...");
    await sync();
    console.log("Synced with contract!");
}

main()
    .then(() => {
        console.log("Successfully populated channel4 dev environment!");
        process.exit(0);
    })
    .catch(error => {
        console.log("Failed to populate dev environment: ", error);
        process.exit(1);
    });