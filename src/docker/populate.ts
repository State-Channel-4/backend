import dotenv from 'dotenv';

import ethers, { Wallet, JsonRpcProvider, Contract } from 'ethers';

dotenv.config();

// ABI for the smart contract
import ABI from '../abi.json';

// URL of the backend
const API_URL = 'http://localhost:8000/api';

// RPC URL used to connect to the smart contract
const PROVIDER = new JsonRpcProvider(process.env.RPC_URL);

// Contract for metatransactions
const CONTRACT = new Contract(process.env.CONTRACT_ADDRESS ?? "", ABI, PROVIDER);

// Anvil private keys #0-2
const USERS = [
    'ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
    '59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d',
    '5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a',
].map((pkey) => new Wallet(pkey, PROVIDER));

// URLs to use
const URLS = [
    {
        title: 'Rick Astley - Never Gonna Give You Up',
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    },
    {
        title: 'Funny Animal Videos 2023',
        url: 'https://www.youtube.com/watch?v=j1TKkm1jZK4',
    },
    {
        title: 'Reddit.com - r/dogs',
        url: 'https://www.reddit.com/r/dogs/',
    },
];

// Tags to use
const TAGS = ['videos', 'funny', 'animals'];

// Sign up in the channel4 backend
async function signup(address: string): Promise<{ uuid: string; token: string }> {
    const res = await fetch(`${API_URL}/user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
    });

    if (!res.ok) {
        throw new Error(`Add user "${address}" failed: ${res.statusText} (${res.status})`);
    }

    const data = await res.json();
    return { uuid: data.user._id, token: data.token };
}

// Add a tag to the channel4 backend
async function addTag(
    name: string,
    wallet: Wallet,
    token: string,
    userId: string
): Promise<string> {
    const functionName = 'createTagIfNotExists';
    const signedMessage = await metatx(functionName, [name, wallet.address], wallet);

    const res = await fetch(`${API_URL}/tag`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
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

    if (!res.ok) {
        throw new Error(`Add tag "${name}" failed: ${res.statusText} (${res.status})`);
    }

    const data = await res.json();
    return data.tag._id;
}

// Add a URL to the channel4 backend
async function addUrl(
    title: string,
    url: string,
    tags: string[],
    wallet: Wallet,
    token: string,
    userId: string
): Promise<string> {
    const functionName = 'createContentIfNotExists';
    // Set likes (params[3]) to 0 for API verification
    const params = [title, url, wallet.address, 0, tags];
    const signedMessage = await metatx(functionName, params, wallet);

    const res = await fetch(`${API_URL}/url`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
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

    if (!res.ok) {
        throw new Error(`Add URL "${title}" failed: ${res.statusText} (${res.status})`);
    }

    const data = await res.json();
    return data._id;
}

// Like a content item through the channel4 backend
async function likeContent(
    oid: string,
    content: string,
    like: boolean,
    wallet: Wallet,
    token: string,
    userId: string
): Promise<void> {
    const functionName = 'toggleLike';
    // Set nonce (params[2]) to 0 for API verification and allow the backend to set the nonce
    const params = [content, like, 0, wallet.address];
    const signedMessage = await metatx(functionName, params, wallet);

    const res = await fetch(`${API_URL}/like/${oid}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
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

    if (!res.ok) {
        throw new Error(`Like content "${content}" failed: ${res.statusText} (${res.status})`);
    }
}

// Get all likes for a given user
async function getLikes(userId: string): Promise<any> {
    const res = await fetch(`${API_URL}/users/${userId}/likes`);
    if (!res.ok) {
        throw new Error(`Get likes failed: ${res.statusText} (${res.status})`);
    }

    return res.json();
}

// Sync the database with the smart contract
async function sync(): Promise<void> {
    const res = await fetch(`${API_URL}/sync`);
    if (!res.ok) {
        throw new Error(`Sync (${res.status})`);
    }
}

// Signs a raw transaction
async function metatx(fxn: string, params: any[], wallet: Wallet): Promise<string> {
    const raw = await CONTRACT[fxn].populateTransaction(...params);
    return wallet.signTransaction(raw);
}

// Setup the environment with filler data
async function main() {
    console.log('Populating channel4 dev environment...');

    // Add Users
    const users = await Promise.all(USERS.map((wallet) => signup(wallet.address)));
    console.log('Added users...');

    // Add Tags
    const tags = await Promise.all([
        addTag(TAGS[0], USERS[0], users[0].token, users[0].uuid),
        addTag(TAGS[1], USERS[0], users[0].token, users[0].uuid),
        addTag(TAGS[2], USERS[1], users[1].token, users[1].uuid),
    ]);
    console.log('Added tags...');

    // Add URL Batch
    const urls = await Promise.all([
        addUrl(
            URLS[0].title,
            URLS[0].url,
            [tags[0], tags[1]],
            USERS[0],
            users[0].token,
            users[0].uuid
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
    console.log('Added URLs...');

    // Add Likes
    await Promise.all([
        likeContent(urls[0], URLS[0].url, true, USERS[0], users[0].token, users[0].uuid),
        likeContent(urls[0], URLS[0].url, true, USERS[1], users[1].token, users[1].uuid),
        likeContent(urls[0], URLS[0].url, true, USERS[2], users[2].token, users[2].uuid),
        likeContent(urls[1], URLS[1].url, true, USERS[0], users[0].token, users[0].uuid),
        likeContent(urls[1], URLS[1].url, true, USERS[2], users[2].token, users[2].uuid),
        likeContent(urls[2], URLS[2].url, true, USERS[0], users[0].token, users[0].uuid),
        likeContent(urls[2], URLS[2].url, true, USERS[2], users[2].token, users[2].uuid),
    ]);

    // Double and triple like to test syncing
    await likeContent(urls[0], URLS[0].url, false, USERS[0], users[0].token, users[0].uuid);
    await likeContent(urls[2], URLS[2].url, false, USERS[2], users[2].token, users[2].uuid);
    await likeContent(urls[2], URLS[2].url, true, USERS[2], users[2].token, users[2].uuid);
    console.log('Added likes...');

    // Sync Contract to URL Contract
    console.log('Syncing with contract...');
    await sync();
    console.log('Synced with contract!');

    // Get Likes
    const likes = await Promise.all(users.map((user) => getLikes(user.uuid)));
    for (let i = 0; i < likes.length; i++) {
        console.log(`User ${i} likes: `, likes[i]);
    }
}

main()
    .then(() => {
        console.log('Successfully populated channel4 dev environment!');
        process.exit(0);
    })
    .catch((error) => {
        console.log('Failed to populate dev environment: ', error);
        process.exit(1);
    });
