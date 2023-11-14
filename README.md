# channel-4-backend
Backend code to synchronize users actions in the app to the state of the smart contract.

## To start
Download the repository and move to the project folder. Remember to have Node v16.20.0 or higher installed.

```bash
# 1 - Create a .env file like the .env.example file
cp .env.example .env

# 2 - Install dependencies
npm install

# 3 - Generate the contract types
npm run typechain:create

# 3 - Run the server in dev mode
npm run dev

# 4 - Run the server in production mode
npm run start
```

